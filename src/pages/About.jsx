import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const logo = "/sri-rama-home-foods-logo.jpeg";

function ValueCard({ title, text }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-black/5">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-green/10">
        <CheckCircle2 size={20} className="text-brand-green" />
      </div>

      <h3 className="mt-5 text-lg font-black">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-black/55">{text}</p>
    </div>
  );
}

export default function About() {
  return (
    <main className="min-h-screen bg-brand-cream">
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
                About Us
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Sri Rama
                <span className="block text-brand-green">
                  Home Foods
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-black/55">
                Sri Rama Home Foods brings homemade food products inspired by
                traditional flavours and familiar recipes. Our focus is on
                simple, authentic food prepared with care.
              </p>

              <Link
                to="/shop"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
              >
                EXPLORE PRODUCTS
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="flex justify-center">
              <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5">
                <img
                  src={logo}
                  alt="Sri Rama Home Foods"
                  className="h-auto w-full max-w-lg object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
            Our Approach
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Simple food. Traditional taste.
          </h2>

          <p className="mt-4 text-sm leading-7 text-black/55">
            We believe good homemade food should be simple, familiar and made
            with care. Sri Rama Home Foods offers traditional food products
            for customers who enjoy the taste of homemade preparation.
          </p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          <ValueCard
            title="Homemade"
            text="Food inspired by the warmth and familiarity of homemade cooking."
          />

          <ValueCard
            title="Traditional Flavours"
            text="Familiar recipes and flavours that bring a traditional touch."
          />

          <ValueCard
            title="Careful Preparation"
            text="Products are prepared and packed with attention to quality."
          />
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black sm:text-3xl">
            Explore Sri Rama Home Foods
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/50">
            Browse our available products and place your order through
            WhatsApp.
          </p>

          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
          >
            SHOP PRODUCTS
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}