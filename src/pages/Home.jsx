import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Leaf,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const logo = "/sri-rama-home-foods-logo.jpeg";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);

        const [productsResponse, categoriesResponse] =
          await Promise.all([
            fetch(`${API_BASE}/api/products`),
            fetch(`${API_BASE}/api/categories`),
          ]);

        const productsData = await productsResponse.json();
        const categoriesData = await categoriesResponse.json();

        if (productsData.success) {
          setProducts(productsData.products || []);
        } else {
          console.error(
            "Products API error:",
            productsData.message
          );
        }

        if (categoriesData.success) {
          setCategories(categoriesData.categories || []);
        } else {
          console.error(
            "Categories API error:",
            categoriesData.message
          );
        }
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  const parentCategories = categories.filter(
    (category) => !category.parent_id
  );

  const productsToShow = products.slice(0, 4);

  return (
    <main className="overflow-hidden bg-brand-cream">

      {/* ================= HERO ================= */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8 lg:py-20">

          {/* LEFT */}
          <div>
            <img
              src={logo}
              alt="Sri Rama Home Foods"
              className="h-auto w-full max-w-md object-contain"
            />

            <p className="mt-6 max-w-xl text-base leading-7 text-black/55 sm:text-lg">
              Traditional homemade food prepared with care and made
              available for you to enjoy at home.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-brand-green px-7 py-3.5 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
              >
                SHOP PRODUCTS
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-white px-7 py-3.5 text-sm font-extrabold text-brand-green transition hover:bg-brand-green/5"
              >
                ABOUT US
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-black/55">
              <span className="flex items-center gap-2">
                <CheckCircle2
                  size={16}
                  className="text-brand-green"
                />
                Homemade
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2
                  size={16}
                  className="text-brand-green"
                />
                Traditional flavours
              </span>

              <span className="flex items-center gap-2">
                <Truck
                  size={16}
                  className="text-brand-green"
                />
                Free delivery
              </span>
            </div>
          </div>

          {/* RIGHT — FOOD / BRAND VISUAL */}
          <div className="flex justify-center">
            <div className="flex aspect-square w-full max-w-xl items-center justify-center overflow-hidden rounded-[2rem] bg-brand-cream shadow-sm ring-1 ring-black/5">
              <div className="text-center px-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-brand-gold">
                  Homemade • Traditional • Authentic
                </p>

                <h2 className="mt-4 text-3xl font-black text-brand-green sm:text-4xl">
                  Taste the goodness of home.
                </h2>

                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/50">
                  Carefully prepared homemade food made with
                  traditional flavours.
                </p>

                <Link
                  to="/shop"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-3 text-xs font-black text-white"
                >
                  EXPLORE PRODUCTS
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="border-y border-black/5 bg-brand-cream py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
                Collection
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Shop by category
              </h2>
            </div>

            <Link
              to="/shop"
              className="hidden items-center gap-1 text-sm font-extrabold text-brand-green sm:flex"
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="aspect-square animate-pulse rounded-3xl bg-white"
                />
              ))}
            </div>
          ) : parentCategories.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {parentCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/shop/${category.slug}`}
                  className="group overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="aspect-square overflow-hidden bg-brand-cream">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-black/30">
                        {category.name}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-extrabold">
                      {category.name}
                    </h3>

                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-brand-green">
                      SHOP NOW
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm text-black/50">
              Categories will appear here as they are added from Admin.
            </p>
          )}

        </div>
      </section>

      {/* ================= PICKLE COLLECTION ================= */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
              Pickles
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Our pickle collection
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">

            {/* VEG */}
            <Link
              to="/shop/pickles/veg-pickles"
              className="group rounded-[1.75rem] border border-black/5 bg-brand-cream p-7 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white">
                  <Leaf
                    size={20}
                    className="text-brand-green"
                  />
                </span>

                <span className="text-xs font-extrabold tracking-wider text-brand-green">
                  VEG
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-black">
                Veg Pickles
              </h3>

              <p className="mt-2 text-sm leading-6 text-black/50">
                Traditional vegetarian pickles prepared with homemade
                flavours.
              </p>

              <span className="mt-5 inline-flex items-center gap-1 text-sm font-extrabold text-brand-green">
                VIEW PRODUCTS
                <ArrowRight size={15} />
              </span>
            </Link>

            {/* NON VEG */}
            <Link
              to="/shop/pickles/non-veg-pickles"
              className="group rounded-[1.75rem] border border-black/5 bg-brand-cream p-7 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white">
                  <span className="h-3 w-3 rounded-full bg-red-600" />
                </span>

                <span className="text-xs font-extrabold tracking-wider text-red-600">
                  NON-VEG
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-black">
                Non-Veg Pickles
              </h3>

              <p className="mt-2 text-sm leading-6 text-black/50">
                Traditional non-vegetarian pickles prepared with
                authentic flavours.
              </p>

              <span className="mt-5 inline-flex items-center gap-1 text-sm font-extrabold text-brand-green">
                VIEW PRODUCTS
                <ArrowRight size={15} />
              </span>
            </Link>

          </div>
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section className="bg-brand-cream py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
                Products
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Available products
              </h2>
            </div>

            <Link
              to="/shop"
              className="hidden items-center gap-1 text-sm font-extrabold text-brand-green sm:flex"
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          {productsToShow.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {productsToShow.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm text-black/50">
              Products will appear here once they are added from Admin.
            </p>
          )}

        </div>
      </section>

      {/* ================= FREE DELIVERY ================= */}
      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-center">
            <Truck
              size={21}
              className="text-brand-green"
            />

            <p className="text-sm font-extrabold">
              Free delivery on every order
            </p>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="bg-brand-cream py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

          <div className="rounded-[2rem] bg-brand-green px-6 py-12 text-center text-white sm:px-10">

            <h2 className="text-3xl font-black sm:text-4xl">
              Taste the goodness of homemade food.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/75">
              Browse our products and place your order through WhatsApp.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-extrabold text-brand-green transition hover:-translate-y-0.5"
            >
              SHOP PRODUCTS
              <ArrowRight size={16} />
            </Link>

          </div>

        </div>
      </section>

    </main>
  );
}