import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

export default function Shop() {
  const { category, subCategory } = useParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [foodType, setFoodType] = useState("");
  const [sort, setSort] = useState("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const activeCategory =
    subCategory || category || "";

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        if (activeCategory) {
          params.set(
            "category",
            activeCategory
          );
        }

        if (foodType) {
          params.set(
            "food_type",
            foodType
          );
        }

        if (sort) {
          params.set("sort", sort);
        }

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        const query =
          params.toString();

        const url = query
          ? `${API_BASE_URL}/api/products?${query}`
          : `${API_BASE_URL}/api/products`;

        const response =
          await fetch(url);

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to load products"
          );
        }

        if (!cancelled) {
          setProducts(
            data.products || []
          );
        }
      } catch (err) {
        console.error(
          "Shop products error:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load products"
          );

          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [
    activeCategory,
    foodType,
    sort,
    search,
  ]);

  /*
  =========================================================
  PAGE TITLE
  =========================================================
  */

  const pageTitle =
    useMemo(() => {
      if (
        activeCategory ===
        "veg-pickles"
      ) {
        return "Veg Pickles";
      }

      if (
        activeCategory ===
        "non-veg-pickles"
      ) {
        return "Non-Veg Pickles";
      }

      if (
        activeCategory ===
        "pickles"
      ) {
        return "Pickles";
      }

      if (
        activeCategory ===
        "sweets"
      ) {
        return "Sweets";
      }

      if (
        activeCategory ===
        "laddus"
      ) {
        return "Laddus";
      }

      if (
        activeCategory ===
        "appalu"
      ) {
        return "Appalu";
      }

      return "Shop";
    }, [activeCategory]);

  /*
  =========================================================
  RENDER
  =========================================================
  */

  return (
    <main className="min-h-screen bg-[#faf7ef]">
      {/* HEADER */}

      <section className="border-b border-black/5 bg-[#f5efe2]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-green">
              Sri Ram Home Food
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-ink sm:text-4xl lg:text-5xl">
              {pageTitle}
            </h1>

            <p className="mt-3 text-sm leading-6 text-black/55 sm:text-base">
              Homemade food prepared with
              traditional ingredients and
              authentic flavours.
            </p>
          </div>
        </div>
      </section>

      {/* SHOP */}

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* SEARCH */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search homemade food..."
              className="h-12 w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
            />
          </div>

          {/* MOBILE FILTER BUTTON */}

          <button
            type="button"
            onClick={() =>
              setMobileFiltersOpen(
                true
              )
            }
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-bold text-brand-ink sm:hidden"
          >
            <SlidersHorizontal
              size={17}
            />

            Filters
          </button>
        </div>

        {/* DESKTOP FILTERS */}

        <div className="mt-6 hidden items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:flex">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-black uppercase tracking-wider text-black/45">
              Food Type
            </span>

            <FilterButton
              active={
                foodType === ""
              }
              onClick={() =>
                setFoodType("")
              }
            >
              All
            </FilterButton>

            <FilterButton
              active={
                foodType === "veg"
              }
              onClick={() =>
                setFoodType("veg")
              }
            >
              Veg
            </FilterButton>

            <FilterButton
              active={
                foodType === "non_veg"
              }
              onClick={() =>
                setFoodType(
                  "non_veg"
                )
              }
            >
              Non-Veg
            </FilterButton>
          </div>

          <SortSelect
            value={sort}
            onChange={setSort}
          />
        </div>

        {/* MOBILE FILTER DRAWER */}

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <button
              type="button"
              aria-label="Close filters"
              onClick={() =>
                setMobileFiltersOpen(
                  false
                )
              }
              className="absolute inset-0 bg-black/40"
            />

            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-brand-ink">
                  Filters
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setMobileFiltersOpen(
                      false
                    )
                  }
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/5"
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6">
                <p className="text-xs font-black uppercase tracking-wider text-black/45">
                  Food Type
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <FilterButton
                    active={
                      foodType === ""
                    }
                    onClick={() =>
                      setFoodType("")
                    }
                  >
                    All
                  </FilterButton>

                  <FilterButton
                    active={
                      foodType ===
                      "veg"
                    }
                    onClick={() =>
                      setFoodType(
                        "veg"
                      )
                    }
                  >
                    Veg
                  </FilterButton>

                  <FilterButton
                    active={
                      foodType ===
                      "non_veg"
                    }
                    onClick={() =>
                      setFoodType(
                        "non_veg"
                      )
                    }
                  >
                    Non-Veg
                  </FilterButton>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-black uppercase tracking-wider text-black/45">
                  Sort By
                </p>

                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(
                      event.target.value
                    )
                  }
                  className="mt-3 h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none focus:border-brand-green"
                >
                  <option value="newest">
                    Newest
                  </option>

                  <option value="price_asc">
                    Price: Low to High
                  </option>

                  <option value="price_desc">
                    Price: High to Low
                  </option>

                  <option value="name_asc">
                    Name: A-Z
                  </option>

                  <option value="name_desc">
                    Name: Z-A
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(
                    false
                  )
                }
                className="mt-7 h-12 w-full rounded-full bg-brand-green text-sm font-black text-white"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* RESULT COUNT */}

        {!loading && !error && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm font-semibold text-black/50">
              {products.length}{" "}
              {products.length === 1
                ? "product"
                : "products"}{" "}
              found
            </p>

            <div className="hidden text-xs font-semibold text-black/40 sm:block">
              Fresh • Homemade • Authentic
            </div>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {Array.from({
              length: 8,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-white"
                >
                  <div className="aspect-square animate-pulse bg-black/5" />

                  <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-black/5" />

                    <div className="h-3 w-1/2 animate-pulse rounded bg-black/5" />

                    <div className="h-9 w-full animate-pulse rounded-full bg-black/5" />
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-bold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-4 rounded-full bg-brand-green px-5 py-2.5 text-xs font-black text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* PRODUCTS */}

        {!loading &&
          !error &&
          products.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}
            </div>
          )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          products.length === 0 && (
            <div className="mt-10 rounded-[2rem] border border-black/5 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f5efe2]">
                <Search
                  size={24}
                  className="text-brand-green"
                />
              </div>

              <h2 className="mt-5 text-xl font-black text-brand-ink">
                No products found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">
                Try another search or
                change your filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFoodType("");
                  setSort("newest");
                }}
                className="mt-5 rounded-full bg-brand-green px-6 py-3 text-xs font-black text-white"
              >
                Clear Filters
              </button>
            </div>
          )}
      </section>
    </main>
  );
}

/*
=========================================================
FILTER BUTTON
=========================================================
*/

function FilterButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-black transition ${
        active
          ? "bg-brand-green text-white"
          : "bg-black/5 text-black/60 hover:bg-brand-green/10 hover:text-brand-green"
      }`}
    >
      {children}
    </button>
  );
}

/*
=========================================================
SORT SELECT
=========================================================
*/

function SortSelect({
  value,
  onChange,
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-black uppercase tracking-wider text-black/40">
        Sort
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-10 rounded-full border border-black/10 bg-white px-4 text-xs font-bold text-brand-ink outline-none focus:border-brand-green"
      >
        <option value="newest">
          Newest
        </option>

        <option value="price_asc">
          Price: Low to High
        </option>

        <option value="price_desc">
          Price: High to Low
        </option>

        <option value="name_asc">
          Name: A-Z
        </option>

        <option value="name_desc">
          Name: Z-A
        </option>
      </select>
    </div>
  );
}