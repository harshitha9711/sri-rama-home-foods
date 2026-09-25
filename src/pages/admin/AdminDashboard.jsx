import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  Package,
  ShoppingBag,
  Users,
  ArrowRight,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  FolderTree,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const API_BASE = `${(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "")}/api`;

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function StatCard({ icon, title, value, text, to }) {
  const content = (
    <>
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-green/10 text-brand-green">
        {icon}
      </div>

      <p className="mt-5 text-sm font-semibold text-black/50">
        {title}
      </p>

      <p className="mt-1 text-2xl font-black">
        {value}
      </p>

      <p className="mt-1 text-xs text-black/40">
        {text}
      </p>

      {to && (
        <div className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-brand-green">
          Manage
          <ArrowRight size={13} />
        </div>
      )}
    </>
  );

  if (!to) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {content}
    </Link>
  );
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusIcon(status) {
  switch (status) {
    case "confirmed":
      return <CheckCircle2 size={15} />;

    case "processing":
      return <Clock3 size={15} />;

    case "shipped":
      return <Truck size={15} />;

    case "delivered":
      return <CheckCircle2 size={15} />;

    case "cancelled":
      return <XCircle size={15} />;

    default:
      return <Clock3 size={15} />;
  }
}

function getStatusClass(status) {
  switch (status) {
    case "confirmed":
      return "bg-blue-50 text-blue-700";

    case "processing":
      return "bg-yellow-50 text-yellow-700";

    case "shipped":
      return "bg-purple-50 text-purple-700";

    case "delivered":
      return "bg-green-50 text-green-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [productCount, setProductCount] = useState("—");
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const token = getToken();

    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      /*
      ========================================================
      PRODUCT COUNT
      ========================================================
      */

      const productResponse = await fetch(
        `${API_BASE}/products/admin/all`,
        {
          headers,
        }
      );

      const productData = await productResponse.json();

      if (productResponse.ok && productData.success) {
        setProductCount(Number(productData.count || 0));
      }

      /*
      ========================================================
      ORDER STATS
      ========================================================
      */

      const statsResponse = await fetch(
        `${API_BASE}/orders/admin/stats`,
        {
          headers,
        }
      );

      const statsData = await statsResponse.json();

      if (statsResponse.ok && statsData.success) {
        const stats = statsData.stats || {};

        setOrderStats({
          total: Number(
            stats.total ??
              stats.total_orders ??
              0
          ),

          pending: Number(
            stats.pending ??
              stats.pending_orders ??
              0
          ),

          confirmed: Number(
            stats.confirmed ??
              stats.confirmed_orders ??
              0
          ),

          processing: Number(
            stats.processing ??
              stats.processing_orders ??
              0
          ),

          shipped: Number(
            stats.shipped ??
              stats.shipped_orders ??
              0
          ),

          delivered: Number(
            stats.delivered ??
              stats.delivered_orders ??
              0
          ),

          cancelled: Number(
            stats.cancelled ??
              stats.cancelled_orders ??
              0
          ),

          revenue: Number(
            stats.revenue ??
              stats.total_revenue ??
              0
          ),
        });
      }

      /*
      ========================================================
      RECENT ORDERS
      ========================================================
      */

      const ordersResponse = await fetch(
        `${API_BASE}/orders/admin/all`,
        {
          headers,
        }
      );

      const ordersData = await ordersResponse.json();

      if (ordersResponse.ok && ordersData.success) {
        const orders = Array.isArray(ordersData.orders)
          ? ordersData.orders
          : [];

        setRecentOrders(orders.slice(0, 5));
      }
    } catch (error) {
      console.error(
        "Admin dashboard loading error:",
        error
      );
    } finally {
      setLoadingOrders(false);
    }
  }

  function handleLogout() {
    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }

  return (
    <main className="min-h-screen bg-brand-cream">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-gold">
              Sri Rama Home Foods
            </p>

            <h1 className="text-xl font-black sm:text-2xl">
              Admin Dashboard
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} />

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Welcome */}

        <section className="rounded-[2rem] bg-brand-green p-6 text-white sm:p-8">
          <p className="text-sm text-white/70">
            Welcome, Admin
          </p>

          <h2 className="mt-1 text-3xl font-black">
            {user?.name || "Administrator"}
          </h2>

          <p className="mt-2 text-sm text-white/70">
            Manage your Sri Rama Home Foods store
            from one place.
          </p>
        </section>

        {/* ===================================================
            MAIN STATS
        =================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon={<Package size={21} />}
            title="Products"
            value={productCount}
            text="Manage products and variants"
            to="/admin/products"
          />
<StatCard
  icon={<FolderTree size={21} />}
  title="Categories"
  value="5"
  text="Manage category images"
  to="/admin/categories"
/>
 <StatCard
  icon={<ShoppingBag size={21} />}
  title="Orders"
  value={orderStats.total}
  text="View and manage customer orders"
  to="/admin/orders"
/>


          <StatCard
            icon={<ShoppingBag size={21} />}
            title="Revenue"
            value={formatMoney(orderStats.revenue)}
            text="Total order revenue"
          />

        </section>

        {/* ===================================================
            ORDER STATUS
        =================================================== */}

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-gold">
                Orders
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Order Overview
              </h2>
            </div>

            <Link
              to="/admin/orders"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
            >
              Manage Orders
              <ArrowRight size={16} />
            </Link>

          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-2xl bg-black/[0.03] p-4">
              <p className="text-xs font-bold text-black/45">
                Pending
              </p>

              <p className="mt-1 text-2xl font-black">
                {orderStats.pending}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-600">
                Confirmed
              </p>

              <p className="mt-1 text-2xl font-black text-blue-800">
                {orderStats.confirmed}
              </p>
            </div>

            <div className="rounded-2xl bg-yellow-50 p-4">
              <p className="text-xs font-bold text-yellow-700">
                Processing
              </p>

              <p className="mt-1 text-2xl font-black text-yellow-800">
                {orderStats.processing}
              </p>
            </div>

            <div className="rounded-2xl bg-purple-50 p-4">
              <p className="text-xs font-bold text-purple-600">
                Shipped
              </p>

              <p className="mt-1 text-2xl font-black text-purple-800">
                {orderStats.shipped}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-xs font-bold text-green-600">
                Delivered
              </p>

              <p className="mt-1 text-2xl font-black text-green-800">
                {orderStats.delivered}
              </p>
            </div>

          </div>
        </section>

        {/* ===================================================
            RECENT ORDERS
        =================================================== */}

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">

          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-gold">
                Latest
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Recent Orders
              </h2>
            </div>

            <Link
              to="/admin/orders"
              className="hidden items-center gap-1 text-sm font-extrabold text-brand-green sm:inline-flex"
            >
              View all
              <ArrowRight size={15} />
            </Link>

          </div>

          {loadingOrders ? (
            <div className="mt-6 space-y-3">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-black/5"
                />
              ))}

            </div>
          ) : recentOrders.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-brand-cream px-5 py-10 text-center">

              <ShoppingBag
                size={32}
                className="mx-auto text-black/25"
              />

              <p className="mt-3 font-bold">
                No orders yet
              </p>

              <p className="mt-1 text-sm text-black/50">
                Customer orders will appear here.
              </p>

            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">

              <table className="w-full min-w-[650px]">

                <thead>
                  <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wider text-black/40">
                    <th className="px-3 py-3">
                      Order
                    </th>

                    <th className="px-3 py-3">
                      Customer
                    </th>

                    <th className="px-3 py-3">
                      Date
                    </th>

                    <th className="px-3 py-3">
                      Total
                    </th>

                    <th className="px-3 py-3">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-black/5 last:border-0"
                    >

                      <td className="px-3 py-4">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-extrabold text-brand-green hover:underline"
                        >
                          #{order.id}
                        </Link>
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold">
                        {order.full_name ||
                          order.customer_name ||
                          "Customer"}
                      </td>

                      <td className="px-3 py-4 text-sm text-black/50">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="px-3 py-4 text-sm font-black">
                        {formatMoney(order.total_amount)}
                      </td>

                      <td className="px-3 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                            order.order_status
                          )}`}
                        >
                          {getStatusIcon(
                            order.order_status
                          )}

                          {order.order_status ||
                            "pending"}
                        </span>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ===================================================
            MANAGEMENT
        =================================================== */}

        <section className="mt-6 grid gap-4 md:grid-cols-3">

          <Link
            to="/admin/products"
            className="group rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
          >
            <Package
              size={25}
              className="text-brand-green"
            />

            <h3 className="mt-5 text-lg font-black">
              Product Management
            </h3>

            <p className="mt-2 text-sm leading-6 text-black/50">
              Add products, variants, prices,
              stock and product information.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-brand-green">
              Open
              <ArrowRight size={15} />
            </span>
          </Link>

          <Link
            to="/admin/orders"
            className="group rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
          >
            <ShoppingBag
              size={25}
              className="text-brand-green"
            />

            <h3 className="mt-5 text-lg font-black">
              Order Management
            </h3>

            <p className="mt-2 text-sm leading-6 text-black/50">
              View orders, update order status,
              payment status and delivery progress.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-brand-green">
              Open
              <ArrowRight size={15} />
            </span>
          </Link>



        </section>

        {/* ===================================================
            CANCELLED
        =================================================== */}

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5">

          <div className="flex items-center gap-3">

            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600">
              <XCircle size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-black/50">
                Cancelled Orders
              </p>

              <p className="text-2xl font-black">
                {orderStats.cancelled}
              </p>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}