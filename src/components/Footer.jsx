import { Link } from "react-router-dom";
import { Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1f3023] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        {/* BRAND */}
        <div>
          <Link to="/" className="inline-block">
            <img
              src="/sri-rama-home-foods-logo.jpeg"
              alt="Sri Rama Home Foods"
              className="h-16 w-auto max-w-[220px] object-contain"
            />
          </Link>

          <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
            Traditional homemade foods prepared with care and authentic
            flavours.
          </p>

          <div className="mt-6 space-y-3">
            <a
              href="tel:+919502911062"
              className="flex items-center gap-3 text-sm text-white/70 transition hover:text-white"
            >
              <Phone size={17} />
              <span>9502911062</span>
            </a>

            <a
              href="tel:+919948584971"
              className="flex items-center gap-3 text-sm text-white/70 transition hover:text-white"
            >
              <Phone size={17} />
              <span>9948584971</span>
            </a>

            <div className="flex items-start gap-3 text-sm text-white/70">
              <MapPin
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>
                Near More Mart, Mahabubad, Telangana - 506101
              </span>
            </div>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h4 className="font-bold">
            Quick Links
          </h4>

          <div className="mt-4 grid gap-3 text-sm text-white/60">
            <Link
              to="/"
              className="transition hover:text-white"
            >
              Home
            </Link>

            <Link
              to="/shop"
              className="transition hover:text-white"
            >
              Shop
            </Link>

            <Link
              to="/about"
              className="transition hover:text-white"
            >
              About Us
            </Link>

            <Link
              to="/contact"
              className="transition hover:text-white"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* CATEGORIES */}
        <div>
          <h4 className="font-bold">
            Categories
          </h4>

          <div className="mt-4 grid gap-3 text-sm text-white/60">
            <Link
              to="/shop/pickles/veg-pickles"
              className="transition hover:text-white"
            >
              Veg Pickles
            </Link>

            <Link
              to="/shop/pickles/non-veg-pickles"
              className="transition hover:text-white"
            >
              Non-Veg Pickles
            </Link>

            <Link
              to="/shop/sweets"
              className="transition hover:text-white"
            >
              Sweets
            </Link>

            <Link
              to="/shop/laddus"
              className="transition hover:text-white"
            >
              Laddus
            </Link>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="mx-auto max-w-7xl border-t border-white/10 px-4 py-6 text-xs text-white/40 sm:px-6 lg:px-8">
        © 2026 Sri Rama Home Foods. All rights reserved.
      </div>
    </footer>
  );
}