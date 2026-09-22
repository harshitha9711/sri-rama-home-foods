import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useCart } from "../context/CartContext";

function getProductImage(product) {
  return (
    product?.main_image_url ||
    product?.image ||
    product?.images?.find((image) => image?.is_primary)?.image_url ||
    product?.images?.[0]?.image_url ||
    ""
  );
}

function getFoodType(product) {
  const type = String(
    product?.food_type || product?.type || ""
  ).toLowerCase();

  if (
    type === "non_veg" ||
    type === "non-veg" ||
    type === "nonveg"
  ) {
    return "NON-VEG";
  }

  if (type === "veg") {
    return "VEG";
  }

  return "";
}

function getCategoryName(category) {
  if (category && typeof category === "object") {
    return (
      category.name ||
      category.slug ||
      "Homemade Foods"
    );
  }

  const names = {
    pickles: "Pickles",
    sweets: "Sweets",
    laddus: "Laddus",
    appalu: "Appalu",
    "veg-pickles": "Veg Pickles",
    "non-veg-pickles": "Non-Veg Pickles",
  };

  return (
    names[String(category || "").toLowerCase()] ||
    "Homemade Foods"
  );
}

export default function Cart() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    cartTotal,
  } = useCart();

  const items = cart || [];

  /*
   * =========================================================
   * EMPTY CART
   * =========================================================
   */

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-brand-cream">
        <section className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-[2rem] bg-white px-6 py-14 text-center shadow-sm sm:px-10">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-green/10">
              <ShoppingBag
                size={34}
                className="text-brand-green"
              />
            </div>

            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
              Your basket
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Your cart is empty
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">
              Looks like you haven't added any homemade
              favorites yet.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-green px-7 py-3.5 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
            >
              EXPLORE PRODUCTS
              <ArrowLeft
                size={16}
                className="rotate-180"
              />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * CART
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* HEADER */}
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
            Your basket
          </p>

          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Shopping cart
              </h1>

              <p className="mt-2 text-sm text-black/50">
                Review your homemade favorites before checkout.
              </p>
            </div>

            <p className="text-sm font-bold text-black/50">
              {items.length}{" "}
              {items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      </section>

      {/* CART CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ITEMS */}
          <div className="space-y-4">
            {items.map((item) => {
              const product = item.product || item;

              const variant =
                item.variant ||
                product.variants?.[0];

              const quantity = Number(item.qty || 1);

              const price = Number(
                variant?.price ??
                  product.price ??
                  0
              );

              const itemTotal = price * quantity;

              const imageUrl = getProductImage(product);

              const foodType = getFoodType(product);

              return (
                <div
                  key={item.key}
                  className="rounded-3xl border border-black/5 bg-white p-4 sm:p-5"
                >
                  <div className="flex gap-4 sm:gap-5">
                    {/* IMAGE */}
                    <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#eee4cf] sm:h-36 sm:w-36">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-3 text-center">
                          <span className="rounded-full bg-white/70 px-3 py-2 text-[10px] font-bold leading-4 text-black/40">
                            Product image coming soon
                          </span>
                        </div>
                      )}
                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-gold sm:text-xs">
                            {getCategoryName(product.category)}
                          </p>

                          <h2 className="mt-1 truncate text-lg font-black sm:text-xl">
                            {product.name}
                          </h2>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              product.id,
                              variant
                            )
                          }
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-black/35 transition hover:bg-red-50 hover:text-red-500"
                          aria-label={`Remove ${product.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      {/* FOOD TYPE + VARIANT */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-black/50">
                        {foodType && (
                          <span
                            className={
                              foodType === "NON-VEG"
                                ? "font-bold text-red-500"
                                : "font-bold text-brand-green"
                            }
                          >
                            ● {foodType}
                          </span>
                        )}

                        {variant?.label && (
                          <>
                            {foodType && <span>•</span>}

                            <span>
                              {variant.label}
                            </span>
                          </>
                        )}
                      </div>

                      {/* BOTTOM */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                        {/* QUANTITY */}
                        <div className="flex items-center rounded-full border border-black/10">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                product.id,
                                variant,
                                Math.max(
                                  1,
                                  quantity - 1
                                )
                              )
                            }
                            className="grid h-9 w-9 place-items-center text-black/55 transition hover:text-brand-green"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="w-8 text-center text-sm font-black">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                product.id,
                                variant,
                                quantity + 1
                              )
                            }
                            className="grid h-9 w-9 place-items-center text-black/55 transition hover:text-brand-green"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* PRICE */}
                        <div className="text-right">
                          <p className="text-lg font-black text-brand-green">
                            ₹{itemTotal}
                          </p>

                          <p className="text-xs text-black/40">
                            ₹{price} × {quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* CONTINUE SHOPPING */}
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 pt-2 text-sm font-bold text-brand-green hover:underline"
            >
              <ArrowLeft size={16} />
              Continue shopping
            </Link>
          </div>

          {/* SUMMARY */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black">
                Order summary
              </h2>

              <div className="mt-6 space-y-4">
                <SummaryRow
                  label="Subtotal"
                  value={`₹${cartTotal}`}
                />

               <SummaryRow
  label="Delivery"
  value="FREE"
/>
              </div>

              <div className="my-6 h-px bg-black/10" />

              <div className="flex items-center justify-between">
                <span className="text-base font-bold">
                  Total
                </span>

                <span className="text-2xl font-black text-brand-green">
                  ₹{cartTotal}
                </span>
              </div>

              <Link
                to="/checkout"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-green py-4 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
              >
                PROCEED TO CHECKOUT
                <ArrowLeft
                  size={17}
                  className="rotate-180"
                />
              </Link>

              {/* TRUST */}
              <div className="mt-6 rounded-2xl bg-brand-cream p-4">
                <div className="flex gap-3">
                  <span className="text-xl">
                    🔒
                  </span>

                  <div>
                    <p className="text-xs font-black">
                      Secure checkout
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-black/45">
                      Your order and payment details
                      are handled securely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-black/50">
        {label}
      </span>

      <span className="text-right font-bold">
        {value}
      </span>
    </div>
  );
}