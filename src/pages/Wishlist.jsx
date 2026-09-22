import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Trash2,
  ArrowLeft,
  Loader2,
  ShoppingBag,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  async function loadWishlist() {
    const token = getToken();

    if (!token) {
      setError("Please login to view your wishlist.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/wishlist`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load wishlist"
        );
      }

      setWishlist(
        Array.isArray(data.wishlist)
          ? data.wishlist
          : []
      );
    } catch (err) {
      console.error("Wishlist error:", err);

      setError(
        err.message || "Failed to load wishlist"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  async function removeFromWishlist(productId) {
    const token = getToken();

    if (!token) return;

    try {
      setRemovingId(productId);

      const response = await fetch(
        `${API_URL}/api/wishlist/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to remove product"
        );
      }

      setWishlist((prev) =>
        prev.filter(
          (item) =>
            Number(item.product_id) !==
            Number(productId)
        )
      );
    } catch (err) {
      console.error(
        "Remove wishlist error:",
        err
      );

      setError(
        err.message ||
          "Failed to remove product"
      );
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[75vh] bg-brand-cream px-4 py-16">
        <div className="mx-auto flex max-w-5xl items-center justify-center">
          <Loader2
            size={28}
            className="animate-spin text-brand-green"
          />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[75vh] bg-brand-cream px-4 py-16">
        <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <Heart
            size={42}
            className="mx-auto text-brand-green"
          />

          <h1 className="mt-5 text-2xl font-black">
            Wishlist
          </h1>

          <p className="mt-3 text-sm text-red-500">
            {error}
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-brand-green px-7 py-3 text-sm font-extrabold text-white"
          >
            LOGIN
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-cream">
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/account"
            className="inline-flex items-center gap-2 text-sm font-bold text-black/50 hover:text-brand-green"
          >
            <ArrowLeft size={16} />
            Back to account
          </Link>

          <div className="mt-7 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-green/10">
              <Heart
                size={22}
                className="text-brand-green"
              />
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
                Saved products
              </p>

              <h1 className="text-3xl font-black">
                My Wishlist
              </h1>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {wishlist.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-12 text-center shadow-sm">
            <Heart
              size={48}
              className="mx-auto text-black/20"
            />

            <h2 className="mt-5 text-2xl font-black">
              Your wishlist is empty
            </h2>

            <p className="mt-2 text-sm text-black/50">
              Save products you love and find them here later.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-green px-7 py-3.5 text-sm font-extrabold text-white"
            >
              <ShoppingBag size={17} />
              SHOP PRODUCTS
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-bold text-black/50">
                {wishlist.length}{" "}
                {wishlist.length === 1
                  ? "product"
                  : "products"}{" "}
                saved
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {wishlist.map((item) => (
                <article
                  key={item.wishlist_item_id}
                  className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-black/5"
                >
                  <Link
                    to={`/product/${item.slug}`}
                    className="block"
                  >
                    <div className="aspect-square bg-brand-cream">
                      {item.main_image_url ? (
                        <img
                          src={item.main_image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Heart
                            size={42}
                            className="text-brand-green/20"
                          />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-green">
                      {item.category_name}
                    </p>

                    <Link
                      to={`/product/${item.slug}`}
                      className="mt-2 block text-lg font-black hover:text-brand-green"
                    >
                      {item.name}
                    </Link>

                    {item.short_description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/45">
                        {item.short_description}
                      </p>
                    )}

                    <div className="mt-5 flex gap-2">
                      <Link
                        to={`/product/${item.slug}`}
                        className="flex-1 rounded-xl bg-brand-green px-3 py-3 text-center text-xs font-extrabold text-white"
                      >
                        VIEW PRODUCT
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromWishlist(
                            item.product_id
                          )
                        }
                        disabled={
                          removingId ===
                          item.product_id
                        }
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-200 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Remove ${item.name} from wishlist`}
                      >
                        {removingId ===
                        item.product_id ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}