import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Package } from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function getCategoryImage(category) {
  return (
    category?.image_url ||
    category?.image ||
    category?.imageUrl ||
    ""
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/categories`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load categories."
          );
        }

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (!cancelled) {
          setCategories(list);
        }
      } catch (err) {
        console.error("Categories loading error:", err);

        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load categories. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-brand-cream">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">

          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand-gold">
            Sri Rama Home Foods
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Explore Our Categories
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-black/55 sm:text-lg">
            Discover homemade pickles, sweets, laddus, appalu,
            masalas and more — prepared with traditional flavours
            and care.
          </p>

        </div>
      </section>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-semibold text-black/50">
              <Loader2
                size={22}
                className="animate-spin text-brand-green"
              />
              Loading categories...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">

            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-500">
              <Package size={25} />
            </div>

            <h2 className="mt-5 text-xl font-black">
              Categories couldn't be loaded
            </h2>

            <p className="mt-2 text-sm leading-6 text-black/50">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-brand-green px-6 py-3 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
            >
              TRY AGAIN
            </button>

          </div>
        )}

        {!loading &&
          !error &&
          categories.length === 0 && (
            <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm">

              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-green/10">
                <Package
                  size={28}
                  className="text-brand-green"
                />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                No categories available
              </h2>

              <p className="mt-2 text-sm leading-6 text-black/50">
                Categories added from the admin panel will appear
                here automatically.
              </p>

            </div>
          )}

        {!loading &&
          !error &&
          categories.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {categories.map((category) => {
                const imageUrl = getCategoryImage(category);

                return (
                  <Link
                    key={category.id || category.slug}
                    to={`/shop/${category.slug}`}
                    className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >

                    {/* IMAGE */}

                    <div className="relative aspect-[4/3] overflow-hidden bg-[#eee4cf]">

                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={category.name || "Category"}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center">

                          <div className="grid h-20 w-20 place-items-center rounded-full bg-white/70">
                            <Package
                              size={32}
                              className="text-brand-green"
                            />
                          </div>

                        </div>
                      )}

                    </div>

                    {/* CONTENT */}

                    <div className="p-6">

                      <h2 className="text-2xl font-black">
                        {category.name}
                      </h2>

                      {category.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/50">
                          {category.description}
                        </p>
                      )}

                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-brand-green">
                        SHOP NOW
                        <ArrowRight
                          size={16}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </span>

                    </div>

                  </Link>
                );
              })}

            </div>
          )}

      </section>
    </main>
  );
}