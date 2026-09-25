import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const GUEST_CART_KEY = "sri_rama_guest_cart";

function getItemKey(
  productId,
  variantId,
  variantLabel = "Default"
) {
  return `${productId}-${variantId ?? variantLabel}`;
}

function normalizeItem(
  product,
  variant,
  qty = 1
) {
  return {
    key: getItemKey(
      product.id,
      variant.id,
      variant.label
    ),

    cartItemId: null,

    product: {
      ...product,
      id: Number(product.id),
    },

    variant: {
      ...variant,
      id: Number(variant.id),
      price: Number(variant.price || 0),
      stock_quantity: Number(
        variant.stock_quantity || 0
      ),
    },

    qty: Number(qty),
  };
}

function loadCart() {
  try {
    const saved =
      localStorage.getItem(GUEST_CART_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Load cart error:",
      error
    );

    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(
    GUEST_CART_KEY,
    JSON.stringify(items)
  );

  window.dispatchEvent(
    new Event("homefoods-cart-changed")
  );
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(
    loadCart
  );

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const handleCartChanged = () => {
      setItems(loadCart());
    };

    const handleStorage = (event) => {
      if (
        event.key === GUEST_CART_KEY
      ) {
        setItems(loadCart());
      }
    };

    window.addEventListener(
      "homefoods-cart-changed",
      handleCartChanged
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "homefoods-cart-changed",
        handleCartChanged
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  const addToCart = useCallback(
    async (
      product,
      variant,
      quantity = 1
    ) => {
      if (
        !product?.id ||
        !variant?.id
      ) {
        throw new Error(
          "Product or variant information is missing."
        );
      }

      const safeQuantity =
        Number(quantity);

      if (
        !Number.isInteger(
          safeQuantity
        ) ||
        safeQuantity < 1
      ) {
        throw new Error(
          "Quantity must be at least 1."
        );
      }

      setItems((current) => {
        const key = getItemKey(
          product.id,
          variant.id,
          variant.label
        );

        const existing =
          current.find(
            (item) =>
              item.key === key
          );

        let next;

        if (existing) {
          const nextQty =
            existing.qty +
            safeQuantity;

          const stock =
            Number(
              existing.variant
                ?.stock_quantity || 0
            );

          if (
            stock > 0 &&
            nextQty > stock
          ) {
            throw new Error(
              "Requested quantity exceeds available stock."
            );
          }

          next = current.map(
            (item) =>
              item.key === key
                ? {
                    ...item,
                    qty: nextQty,
                  }
                : item
          );
        } else {
          const stock =
            Number(
              variant.stock_quantity || 0
            );

          if (
            stock > 0 &&
            safeQuantity > stock
          ) {
            throw new Error(
              "Requested quantity exceeds available stock."
            );
          }

          next = [
            ...current,
            normalizeItem(
              product,
              variant,
              safeQuantity
            ),
          ];
        }

        saveCart(next);

        return next;
      });

      return {
        success: true,
        guest: true,
      };
    },
    []
  );

  const removeFromCart =
    useCallback(
      async (
        productId,
        variant
      ) => {
        const key = getItemKey(
          productId,
          variant?.id,
          variant?.label
        );

        setItems((current) => {
          const next =
            current.filter(
              (item) =>
                item.key !== key
            );

          saveCart(next);

          return next;
        });
      },
      []
    );

  const updateQuantity =
    useCallback(
      async (
        productId,
        variant,
        quantity
      ) => {
        const safeQuantity =
          Number(quantity);

        const key = getItemKey(
          productId,
          variant?.id,
          variant?.label
        );

        if (
          !Number.isInteger(
            safeQuantity
          )
        ) {
          throw new Error(
            "Quantity must be a whole number."
          );
        }

        if (safeQuantity <= 0) {
          await removeFromCart(
            productId,
            variant
          );

          return;
        }

        const stock =
          Number(
            variant?.stock_quantity || 0
          );

        if (
          stock > 0 &&
          safeQuantity > stock
        ) {
          throw new Error(
            "Requested quantity exceeds available stock."
          );
        }

        setItems((current) => {
          const next =
            current.map((item) =>
              item.key === key
                ? {
                    ...item,
                    qty: safeQuantity,
                  }
                : item
            );

          saveCart(next);

          return next;
        });
      },
      [removeFromCart]
    );

  const clearCart =
    useCallback(async () => {
      setItems([]);

      localStorage.removeItem(
        GUEST_CART_KEY
      );

      window.dispatchEvent(
        new Event(
          "homefoods-cart-changed"
        )
      );
    }, []);

  const cartTotal = useMemo(() => {
    return items.reduce(
      (total, item) => {
        const price =
          Number(
            item.variant?.price ||
              item.product?.price ||
              0
          );

        return (
          total +
          price *
            Number(item.qty || 0)
        );
      },
      0
    );
  }, [items]);

  const cartCount = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.qty || 0),
      0
    );
  }, [items]);

  const subtotal = cartTotal;

  const cart = items;

  const value = useMemo(
    () => ({
      cart,
      items,
      subtotal,
      cartTotal,
      cartCount,

      itemCount: cartCount,

      loading,

      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [
      cart,
      items,
      subtotal,
      cartTotal,
      cartCount,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}