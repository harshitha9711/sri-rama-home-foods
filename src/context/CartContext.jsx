import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function getItemKey(productId, variantId, variantLabel = "Default") {
  return `${productId}-${variantId ?? variantLabel}`;
}

/**
 * Convert backend cart response into the format
 * already expected by Cart.jsx and Checkout.jsx.
 */
function mapBackendCart(cartResponse) {
  return (cartResponse?.items || []).map((item) => {
    const product = item.product || {};
    const variant = item.variant || {};

    return {
      key: getItemKey(product.id, variant.id, variant.label),

      cartItemId: Number(item.cart_item_id),

      product: {
        ...product,
        id: Number(product.id),
      },

      variant: {
        ...variant,
        id: Number(variant.id),
        price: Number(variant.price || 0),
        stock_quantity: Number(variant.stock_quantity || 0),
      },

      // Backend calls this "quantity".
      // Frontend components use "qty".
      qty: Number(item.quantity || 0),
    };
  });
}

async function parseResponse(response) {
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      success: false,
      message: text || "Server returned an invalid response.",
    };
  }

  return data;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  /*
   * ============================================================
   * LOAD CART
   * ============================================================
   */

  const loadBackendCart = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            `Unable to load cart. Server returned ${response.status}.`
        );
      }

      setItems(mapBackendCart(data.cart));
    } catch (error) {
      console.error("Load cart error:", error);

      // Keep existing UI cart state if backend temporarily fails.
      setItems((current) => current);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * ============================================================
   * AUTH CHANGE LISTENER
   * ============================================================
   */

  useEffect(() => {
    loadBackendCart();

    const handleAuthChanged = () => {
      loadBackendCart();
    };

    window.addEventListener(
      "homefoods-auth-changed",
      handleAuthChanged
    );

    window.addEventListener("storage", handleAuthChanged);

    return () => {
      window.removeEventListener(
        "homefoods-auth-changed",
        handleAuthChanged
      );

      window.removeEventListener("storage", handleAuthChanged);
    };
  }, [loadBackendCart]);

  /*
   * ============================================================
   * ADD TO CART
   * ============================================================
   */

  const addToCart = useCallback(
    async (product, variant, quantity = 1) => {
      const token = getToken();

      if (!token) {
        throw new Error("Please login to add products to cart.");
      }

      if (!product?.id || !variant?.id) {
        throw new Error("Product or variant information is missing.");
      }

      const safeQuantity = Number(quantity);

      if (!Number.isInteger(safeQuantity) || safeQuantity < 1) {
        throw new Error("Quantity must be at least 1.");
      }

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: Number(product.id),
          variantId: Number(variant.id),
          quantity: safeQuantity,
        }),
      });

      const data = await parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            `Failed to add product to cart. Server returned ${response.status}.`
        );
      }

      // Backend is the source of truth.
      await loadBackendCart();

      return data;
    },
    [loadBackendCart]
  );

  /*
   * ============================================================
   * REMOVE FROM CART
   * ============================================================
   */

  const removeFromCart = useCallback(
    async (productId, variant) => {
      const token = getToken();

      if (!token) {
        throw new Error("Please login to remove cart items.");
      }

      const key = getItemKey(
        productId,
        variant?.id,
        variant?.label
      );

      const currentItem = items.find(
        (item) => item.key === key
      );

      if (!currentItem?.cartItemId) {
        throw new Error("Cart item was not found.");
      }

      const response = await fetch(
        `${API_BASE}/api/cart/${currentItem.cartItemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to remove item from cart."
        );
      }

      await loadBackendCart();

      return data;
    },
    [items, loadBackendCart]
  );

  /*
   * ============================================================
   * UPDATE QUANTITY
   * ============================================================
   */

  const updateQuantity = useCallback(
    async (productId, variant, quantity) => {
      const token = getToken();

      if (!token) {
        throw new Error("Please login to update your cart.");
      }

      const safeQuantity = Number(quantity);

      const key = getItemKey(
        productId,
        variant?.id,
        variant?.label
      );

      const currentItem = items.find(
        (item) => item.key === key
      );

      if (!currentItem?.cartItemId) {
        throw new Error("Cart item was not found.");
      }

      /*
       * Quantity 0 means remove item.
       */
      if (safeQuantity <= 0) {
        return removeFromCart(productId, variant);
      }

      if (!Number.isInteger(safeQuantity)) {
        throw new Error("Quantity must be a whole number.");
      }

      const response = await fetch(
        `${API_BASE}/api/cart/${currentItem.cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: safeQuantity,
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update cart quantity."
        );
      }

      await loadBackendCart();

      return data;
    },
    [items, loadBackendCart, removeFromCart]
  );

  /*
   * ============================================================
   * CLEAR CART
   * ============================================================
   */

  const clearCart = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setItems([]);
      return;
    }

    const response = await fetch(`${API_BASE}/api/cart`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await parseResponse(response);

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to clear cart."
      );
    }

    setItems([]);
  }, []);

  /*
   * ============================================================
   * CART TOTALS
   * ============================================================
   */

  const cartCount = items.reduce(
    (total, item) => total + Number(item.qty || 0),
    0
  );

  const cartTotal = items.reduce((total, item) => {
    const price = Number(item.variant?.price || 0);
    const quantity = Number(item.qty || 0);

    return total + price * quantity;
  }, 0);

  /*
   * ============================================================
   * UPDATE BY CART KEY
   * ============================================================
   */

  const updateQty = useCallback(
    async (key, quantity) => {
      const item = items.find(
        (entry) => entry.key === key
      );

      if (!item) {
        return;
      }

      return updateQuantity(
        item.product.id,
        item.variant,
        quantity
      );
    },
    [items, updateQuantity]
  );

  /*
   * ============================================================
   * REMOVE BY CART KEY
   * ============================================================
   */

  const removeItem = useCallback(
    async (key) => {
      const item = items.find(
        (entry) => entry.key === key
      );

      if (!item) {
        return;
      }

      return removeFromCart(
        item.product.id,
        item.variant
      );
    },
    [items, removeFromCart]
  );

  /*
   * ============================================================
   * CONTEXT VALUE
   * ============================================================
   */

  const value = useMemo(
    () => ({
      items,

      // Backward compatibility for existing components.
      cart: items,

      loading,

      addToCart,

      updateQuantity,

      removeFromCart,

      clearCart,

      loadBackendCart,

      cartCount,

      cartTotal,

      subtotal: cartTotal,

      updateQty,

      removeItem,
    }),
    [
      items,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      loadBackendCart,
      cartCount,
      cartTotal,
      updateQty,
      removeItem,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}