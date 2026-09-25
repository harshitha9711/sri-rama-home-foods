import { useState } from "react";
import {
  Menu,
  X,
  Search,
  Heart,
  ShoppingBag,
  UserRound,
  LogOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-brand-cream/95 backdrop-blur">
      {/* ================= MAIN NAVBAR ================= */}
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link
          to="/"
          className="flex items-center"
          onClick={() => setOpen(false)}
          aria-label="Sri Rama Home Foods"
        >
          <img
            src="/sri-rama-home-foods-logo.jpeg"
            alt="Sri Rama Home Foods"
            className="h-12 w-auto max-w-[190px] object-contain sm:h-14"
          />
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="text-sm font-semibold transition hover:text-brand-green"
          >
            Home
          </Link>

          <Link
            to="/shop"
            className="text-sm font-semibold transition hover:text-brand-green"
          >
            Shop
          </Link>

          <Link
            to="/categories"
            className="text-sm font-semibold transition hover:text-brand-green"
          >
            Categories
          </Link>

          <Link
            to="/about"
            className="text-sm font-semibold transition hover:text-brand-green"
          >
            About
          </Link>

          <Link
            to="/contact"
            className="text-sm font-semibold transition hover:text-brand-green"
          >
            Contact
          </Link>
        </nav>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-1">
          {/* SEARCH */}
          <button
            type="button"
            className="hidden rounded-full p-2.5 transition hover:bg-black/5 sm:block"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          {/* WISHLIST */}
          <Link
            to="/wishlist"
            className="hidden rounded-full p-2.5 transition hover:bg-black/5 sm:block"
            aria-label="Wishlist"
          >
            <Heart size={19} />
          </Link>

          {/* ACCOUNT */}
          <Link
            to={isAuthenticated ? "/account" : "/login"}
            className="hidden items-center gap-2 rounded-full px-3 py-2 transition hover:bg-black/5 sm:flex"
            aria-label={isAuthenticated ? "My Account" : "Login"}
          >
            <UserRound size={19} />

            {isAuthenticated && user?.name ? (
              <span className="max-w-28 truncate text-sm font-semibold text-brand-green">
                {user.name}
              </span>
            ) : (
              <span className="text-sm font-semibold">Login</span>
            )}
          </Link>

          {/* CART */}
          <Link
            to="/cart"
            className="relative rounded-full p-2.5 transition hover:bg-black/5"
            aria-label="Cart"
          >
            <ShoppingBag size={20} />

            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-green px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* MOBILE MENU */}
          <button
            type="button"
            className="rounded-full p-2.5 transition hover:bg-black/5 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {open && (
        <nav className="border-t border-black/5 px-5 py-4 md:hidden">
          {/* MOBILE USER SECTION */}
          <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
            {isAuthenticated ? (
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="flex min-w-0 items-center gap-3"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-green text-white">
                    <UserRound size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-black/50">Welcome</p>

                    <p className="truncate font-bold text-brand-green">
                      {user?.name || "My Account"}
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full p-2 text-red-600 transition hover:bg-red-50"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-green text-white">
                  <UserRound size={19} />
                </div>

                <div>
                  <p className="text-xs text-black/50">Welcome to</p>

                  <p className="font-bold text-brand-green">
                    Login / Create Account
                  </p>
                </div>
              </Link>
            )}
          </div>

          {/* MOBILE NAV LINKS */}
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="block border-b border-black/5 py-3 text-sm font-semibold"
          >
            Home
          </Link>

          <Link
            to="/shop"
            onClick={() => setOpen(false)}
            className="block border-b border-black/5 py-3 text-sm font-semibold"
          >
            Shop
          </Link>

          <Link
            to="/shop/pickles"
            onClick={() => setOpen(false)}
            className="block border-b border-black/5 py-3 text-sm font-semibold"
          >
            Categories
          </Link>

          <Link
            to="/wishlist"
            onClick={() => setOpen(false)}
            className="block border-b border-black/5 py-3 text-sm font-semibold"
          >
            Wishlist
          </Link>

          <Link
            to="/cart"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-b border-black/5 py-3 text-sm font-semibold"
          >
            <span>Cart</span>

            {cartCount > 0 && (
              <span className="rounded-full bg-brand-green px-2 py-0.5 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            to="/about"
            onClick={() => setOpen(false)}
            className="block border-b border-black/5 py-3 text-sm font-semibold"
          >
            About
          </Link>

          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            className="block border-b border-black/5 py-3 text-sm font-semibold"
          >
            Contact
          </Link>

          {/* MOBILE LOGOUT */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600"
            >
              <LogOut size={17} />
              Logout
            </button>
          )}
        </nav>
      )}
    </header>
  );
}