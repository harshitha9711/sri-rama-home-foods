import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import VegBadge from "../components/VegBadge";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const API_SERVER =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const API_BASE = API_SERVER
  .replace(/\/+$/, "")
  .endsWith("/api")
  ? API_SERVER.replace(/\/+$/, "")
  : `${API_SERVER.replace(
      /\/+$/,
      ""
    )}/api`;

/*
=========================================================
API RESPONSE HELPER
=========================================================
*/

async function parseResponse(response) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  throw new Error(
    response.ok
      ? "Server returned an invalid response."
      : `Server error (${response.status}). Please check the backend.`
  );
}

/*
=========================================================
PRODUCT DETAILS
=========================================================
*/

export default function ProductDetails() {
  const { slug } = useParams();

  const {
    addToCart,
  } = useCart();

  const {
    isAuthenticated,
  } = useAuth();

  const navigate =
    useNavigate();

  const [product, setProduct] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] = useState(null);

  const [wishlist, setWishlist] =
    useState(false);

  const [added, setAdded] =
    useState(false);

  const [adding, setAdding] =
    useState(false);

  const [
    wishlistLoading,
    setWishlistLoading,
  ] = useState(false);

  /*
  =========================================================
  LOAD PRODUCT
  =========================================================
  */

  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setSelectedVariantId(null);
      setQuantity(1);
      setAdded(false);

      try {
        const response =
          await fetch(
            `${API_BASE}/products/${encodeURIComponent(
              slug
            )}`
          );

        const data =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !data.success ||
          !data.product
        ) {
          throw new Error(
            data.message ||
              "Product not found"
          );
        }

        if (!cancelled) {
          const loadedProduct =
            data.product;

          setProduct(
            loadedProduct
          );

          const variants =
            loadedProduct.variants ||
            [];

          const firstAvailable =
            variants.find(
              (variant) =>
                Number(
                  variant.stock_quantity ||
                    0
                ) > 0
            );

          setSelectedVariantId(
            firstAvailable?.id ??
              variants[0]?.id ??
              null
          );
        }
      } catch (err) {
        console.error(
          "Product fetch error:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              "Failed to load product. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      fetchProduct();
    } else {
      setLoading(false);
      setError(
        "Product slug is missing."
      );
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /*
  =========================================================
  LOAD WISHLIST STATE
  =========================================================
  */

  useEffect(() => {
    if (
      !product?.id ||
      !isAuthenticated
    ) {
      setWishlist(false);
      return;
    }

    let cancelled = false;

    async function loadWishlistState() {
      try {
        const token =
          localStorage.getItem(
            "token"
          ) ||
          localStorage.getItem(
            "accessToken"
          ) ||
          "";

        if (!token) {
          setWishlist(false);
          return;
        }

        const response =
          await fetch(
            `${API_BASE}/wishlist`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        const data =
          await parseResponse(
            response
          );

        if (
          !cancelled &&
          response.ok &&
          data.success
        ) {
          setWishlist(
            (
              data.wishlist ||
              []
            ).some(
              (item) =>
                Number(
                  item.product_id
                ) ===
                Number(
                  product.id
                )
            )
          );
        }
      } catch (error) {
        console.error(
          "Load wishlist state error:",
          error
        );
      }
    }

    loadWishlistState();

    return () => {
      cancelled = true;
    };
  }, [
    product?.id,
    isAuthenticated,
  ]);

  /*
  =========================================================
  WISHLIST TOGGLE
  =========================================================
  */

  async function toggleWishlist() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (
      !product?.id ||
      wishlistLoading
    ) {
      return;
    }

    const token =
      localStorage.getItem(
        "token"
      ) ||
      localStorage.getItem(
        "accessToken"
      ) ||
      "";

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setWishlistLoading(true);

      const response =
        await fetch(
          `${API_BASE}/wishlist/${product.id}`,
          {
            method: wishlist
              ? "DELETE"
              : "POST",

            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data =
        await parseResponse(
          response
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Wishlist update failed"
        );
      }

      setWishlist(
        (value) => !value
      );
    } catch (error) {
      console.error(
        "Wishlist update error:",
        error
      );

      alert(
        error.message ||
          "Unable to update wishlist"
      );
    } finally {
      setWishlistLoading(false);
    }
  }

  /*
  =========================================================
  VARIANTS
  =========================================================
  */

  const variants =
    product?.variants || [];

  const currentVariant =
    useMemo(
      () =>
        variants.find(
          (variant) =>
            Number(
              variant.id
            ) ===
            Number(
              selectedVariantId
            )
        ) ||
        variants[0] ||
        null,
      [
        variants,
        selectedVariantId,
      ]
    );

  const currentPrice =
    Number(
      currentVariant?.price || 0
    );

  const stock =
    Number(
      currentVariant?.stock_quantity ||
        0
    );

  const totalPrice =
    currentPrice *
    quantity;

  const isOutOfStock =
    !currentVariant ||
    stock <= 0;

  /*
  =========================================================
  ADD TO CART
  =========================================================
  */

  const handleAddToCart =
    async () => {
      if (
        !product ||
        !currentVariant ||
        isOutOfStock ||
        adding
      ) {
        return;
      }

      try {
        setAdding(true);

        await addToCart(
          product,
          currentVariant,
          quantity
        );

        setAdded(true);

        setTimeout(() => {
          setAdded(false);
        }, 1800);
      } catch (err) {
        console.error(
          "Add to cart error:",
          err
        );

        alert(
          err.message ||
            "Unable to add product to cart"
        );
      } finally {
        setAdding(false);
      }
    };

  /*
  =========================================================
  QUANTITY
  =========================================================
  */

  const increaseQuantity =
    () => {
      setQuantity(
        (value) =>
          Math.min(
            value + 1,
            Math.max(
              stock,
              1
            )
          )
      );
    };

  const decreaseQuantity =
    () => {
      setQuantity(
        (value) =>
          Math.max(
            1,
            value - 1
          )
      );
    };

  /*
  =========================================================
  LOADING
  =========================================================
  */

  if (loading) {
    return <ProductLoading />;
  }

  /*
  =========================================================
  ERROR
  =========================================================
  */

  if (
    error ||
    !product
  ) {
    return (
      <main className="min-h-screen bg-brand-cream px-4 py-20">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="text-5xl">
            🔎
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Product not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-black/50">
            {error ||
              "The product you're looking for does not exist."}
          </p>

          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-full bg-brand-green px-6 py-3 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
          >
            BACK TO SHOP
          </Link>
        </div>
      </main>
    );
  }

  /*
  =========================================================
  PRODUCT DATA
  =========================================================
  */

  const foodType =
    String(
      product.food_type ||
        "veg"
    ).toLowerCase();

  const imageUrl =
    product.main_image_url ||
    product.images?.[0]
      ?.image_url;

  const categoryName =
    product.category?.name ||
    "Homemade Foods";

  /*
  =========================================================
  MAIN PAGE
  =========================================================
  */

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* BACK TO SHOP */}

      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm font-bold text-black/50 transition hover:text-brand-green"
        >
          <ArrowLeft size={16} />

          Back to shop
        </Link>
      </div>

      {/* PRODUCT SECTION */}

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          {/* LEFT - IMAGE */}

          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-[#eee4cf] sm:rounded-[2.5rem]">
              {/* BADGE */}

              <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
                <VegBadge
                  type={foodType}
                />
              </div>

              {/* WISHLIST */}

              <button
                type="button"
                onClick={
                  toggleWishlist
                }
                disabled={
                  wishlistLoading
                }
                className={`absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white shadow-md transition sm:right-5 sm:top-5 sm:h-12 sm:w-12 ${
                  wishlist
                    ? "text-red-500"
                    : "text-black/60 hover:text-red-500"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                aria-label="Add to wishlist"
              >
                <Heart
                  size={20}
                  fill={
                    wishlist
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>

              {/* IMAGE */}

              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={
                    product.name
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6">
                  <p className="rounded-full bg-white/70 px-4 py-2 text-center text-xs font-bold text-black/40">
                    Product image
                    coming soon
                  </p>
                </div>
              )}
            </div>

            {/* FEATURES */}

            <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
              <MiniFeature
                icon="🏠"
                title="Homemade"
              />

              <MiniFeature
                icon="🌿"
                title="Quality"
              />

              <MiniFeature
                icon="✨"
                title="Traditional"
              />
            </div>
          </div>

          {/* RIGHT - INFORMATION */}

          <div className="flex flex-col justify-center">
            {/* CATEGORY */}

            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
              {categoryName}
            </p>

            {/* NAME */}

            <h1 className="mt-2 text-3xl font-black leading-tight sm:mt-3 sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            {/* PRICE */}

            <div className="mt-5 sm:mt-7">
              <p className="text-3xl font-black text-brand-green">
                ₹
                {currentPrice.toFixed(
                  0
                )}
              </p>

              <p className="mt-1 text-xs text-black/40">
                Price for{" "}
                {currentVariant?.label ||
                  "selected variant"}
              </p>
            </div>

            <div className="my-5 h-px bg-black/10 sm:my-7" />

            {/* VARIANTS */}

            {variants.length >
              0 && (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-black">
                    Choose weight
                  </h2>

                  <span className="text-xs font-semibold text-black/40">
                    {
                      variants.length
                    }{" "}
                    options
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2.5">
                  {variants.map(
                    (
                      variant
                    ) => {
                      const available =
                        Number(
                          variant.stock_quantity ||
                            0
                        ) > 0;

                      const selected =
                        Number(
                          variant.id
                        ) ===
                        Number(
                          selectedVariantId
                        );

                      return (
                        <button
                          key={
                            variant.id
                          }
                          type="button"
                          disabled={
                            !available
                          }
                          onClick={() => {
                            setSelectedVariantId(
                              variant.id
                            );

                            setQuantity(
                              1
                            );

                            setAdded(
                              false
                            );
                          }}
                          className={`rounded-full border px-4 py-2.5 text-sm font-bold transition sm:px-5 ${
                            selected
                              ? "border-brand-green bg-brand-green text-white"
                              : available
                              ? "border-black/15 bg-white text-black/65 hover:border-brand-green hover:text-brand-green"
                              : "cursor-not-allowed border-black/10 bg-black/5 text-black/25"
                          }`}
                        >
                          {
                            variant.label
                          }

                          {!available &&
                            " · Out of stock"}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* QUANTITY */}

            <div className="mt-6 sm:mt-7">
              <h2 className="text-sm font-black">
                Quantity
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-full border border-black/15 bg-white">
                  <button
                    type="button"
                    onClick={
                      decreaseQuantity
                    }
                    disabled={
                      quantity <=
                      1
                    }
                    className="grid h-11 w-11 place-items-center text-black/60 transition hover:text-brand-green disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <Minus
                      size={16}
                    />
                  </button>

                  <span className="w-8 text-center text-sm font-black">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={
                      increaseQuantity
                    }
                    disabled={
                      isOutOfStock ||
                      quantity >=
                        stock
                    }
                    className="grid h-11 w-11 place-items-center text-black/60 transition hover:text-brand-green disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <Plus
                      size={16}
                    />
                  </button>
                </div>

                <span className="text-xs text-black/40">
                  {isOutOfStock ? (
                    <strong className="text-red-500">
                      Out of
                      stock
                    </strong>
                  ) : (
                    <>
                      {
                        stock
                      }{" "}
                      available ·
                      Total:{" "}
                      <strong className="text-black">
                        ₹
                        {totalPrice.toFixed(
                          0
                        )}
                      </strong>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* CART + WISHLIST */}

            <div className="mt-6 flex gap-2.5 sm:mt-7 sm:gap-3">
              <button
                type="button"
                onClick={
                  handleAddToCart
                }
                disabled={
                  adding ||
                  isOutOfStock
                }
                className={`flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-extrabold text-white transition sm:text-sm ${
                  added
                    ? "bg-brand-green-dark"
                    : "bg-brand-green hover:bg-brand-green-dark"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <ShoppingBag
                  size={18}
                />

                {adding
                  ? "ADDING..."
                  : added
                  ? "ADDED TO CART ✓"
                  : isOutOfStock
                  ? "OUT OF STOCK"
                  : "ADD TO CART"}
              </button>

              <button
                type="button"
                onClick={
                  toggleWishlist
                }
                disabled={
                  wishlistLoading
                }
                className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border bg-white transition ${
                  wishlist
                    ? "border-red-200 text-red-500"
                    : "border-black/10 text-black/60 hover:text-brand-green"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                aria-label="Wishlist"
              >
                <Heart
                  size={20}
                  fill={
                    wishlist
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            </div>

            {/* DESCRIPTION */}

            <div className="mt-7 border-t border-black/10 pt-6 sm:mt-8 sm:pt-7">
              <h2 className="text-base font-black">
                Description
              </h2>

              <p className="mt-3 text-sm leading-7 text-black/55">
                {product.description ||
                  product.short_description ||
                  "A delicious homemade product prepared with traditional recipes and carefully selected ingredients."}
              </p>
            </div>

            {/* INGREDIENTS */}

            {product.ingredients && (
              <div className="mt-5 sm:mt-6">
                <h2 className="text-base font-black">
                  Ingredients
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/55">
                  {
                    product.ingredients
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* INFORMATION STRIP */}

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-black/5 px-4 py-4 sm:px-6 sm:py-5 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          <InfoItem
            icon="🏠"
            title="Homemade with care"
            text="Prepared with traditional recipes."
          />

          <InfoItem
            icon="📦"
            title="Packed carefully"
            text="Your order is packed for safe delivery."
          />

          <InfoItem
            icon="🌿"
            title="Quality ingredients"
            text="Carefully selected ingredients."
          />
        </div>
      </section>
    </main>
  );
}

/*
=========================================================
LOADING SKELETON
=========================================================
*/

function ProductLoading() {
  return (
    <main className="min-h-screen bg-brand-cream px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="aspect-square animate-pulse rounded-[2rem] bg-black/5 sm:rounded-[2.5rem]" />

        <div className="flex flex-col justify-center gap-5">
          <div className="h-4 w-28 animate-pulse rounded bg-black/5" />

          <div className="h-12 w-3/4 animate-pulse rounded bg-black/5" />

          <div className="h-8 w-32 animate-pulse rounded bg-black/5" />

          <div className="h-20 w-full animate-pulse rounded bg-black/5" />

          <div className="h-14 w-full animate-pulse rounded-full bg-black/5" />
        </div>
      </div>
    </main>
  );
}

/*
=========================================================
MINI FEATURE
=========================================================
*/

function MiniFeature({
  icon,
  title,
}) {
  return (
    <div className="rounded-2xl bg-white px-2 py-3 text-center shadow-sm sm:px-3">
      <div className="text-xl">
        {icon}
      </div>

      <p className="mt-1 text-[9px] font-extrabold uppercase tracking-wide text-black/55 sm:text-[10px]">
        {title}
      </p>
    </div>
  );
}

/*
=========================================================
INFORMATION ITEM
=========================================================
*/

function InfoItem({
  icon,
  title,
  text,
}) {
  return (
    <div className="flex items-center gap-4 px-2 py-4 sm:px-5 md:py-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-green/10 text-xl">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-black">
          {title}
        </h3>

        <p className="mt-1 text-xs text-black/45">
          {text}
        </p>
      </div>
    </div>
  );
}