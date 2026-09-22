import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ShoppingBag,
  Heart,
  MapPin,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function AccountCard({ to, title, text, icon }) {
  return (
    <Link
      to={to}
      className="group rounded-[1.75rem] bg-white p-6 ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-green/10 text-brand-green">
          {icon}
        </div>

        <ChevronRight
          size={19}
          className="text-black/25 transition group-hover:translate-x-1 group-hover:text-brand-green"
        />
      </div>

      <h2 className="mt-6 text-lg font-black">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-black/45">{text}</p>
    </Link>
  );
}

export default function Account() {
  const navigate = useNavigate();

  const {
    user,
    logout,
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <main className="min-h-[75vh] bg-brand-cream px-4 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-black/60">Loading account...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-[75vh] bg-brand-cream px-4 py-12">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-green text-2xl text-white">
            👤
          </div>

          <h1 className="text-2xl font-extrabold text-brand-green">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-black/60">
            Login to manage your account, orders and addresses.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex rounded-xl bg-brand-green px-6 py-3 font-bold text-white"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-[75vh] bg-brand-cream px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* ACCOUNT HEADER */}
        <div className="mb-8 rounded-3xl bg-brand-green p-6 text-white sm:p-8">
          <p className="text-sm text-white/70">
            Welcome back
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            {user?.name || "Customer"}
          </h1>

          <div className="mt-4 space-y-1 text-sm text-white/80">
            {user?.email && <p>{user.email}</p>}
            {user?.phone && <p>{user.phone}</p>}
          </div>
        </div>

        {/* ACCOUNT OPTIONS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AccountCard
            to="/account/orders"
            title="My Orders"
            text="View your orders and order status."
            icon={<ShoppingBag size={21} />}
          />

          <AccountCard
            to="/wishlist"
            title="Wishlist"
            text="View your saved products."
            icon={<Heart size={21} />}
          />

          <AccountCard
            to="/addresses"
            title="Addresses"
            text="Manage your delivery addresses."
            icon={<MapPin size={21} />}
          />
        </div>

        {/* ACCOUNT DETAILS */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-green">
            Account Details
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-black/40">
                Name
              </p>

              <p className="mt-1 font-semibold">
                {user?.name || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-black/40">
                Email
              </p>

              <p className="mt-1 font-semibold">
                {user?.email || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-black/40">
                Phone
              </p>

              <p className="mt-1 font-semibold">
                {user?.phone || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-black/40">
                Account Type
              </p>

              <p className="mt-1 font-semibold capitalize">
                {user?.role || "customer"}
              </p>
            </div>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-xl border border-red-200 bg-white px-6 py-3 font-bold text-red-600 transition hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </main>
  );
}