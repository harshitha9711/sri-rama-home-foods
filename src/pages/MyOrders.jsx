import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Package,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getStatusStyle(status) {
  switch (String(status || "").toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "shipped":
      return "bg-blue-100 text-blue-700";

    case "processing":
      return "bg-purple-100 text-purple-700";

    case "confirmed":
      return "bg-emerald-100 text-emerald-700";

    case "pending":
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function formatStatus(status) {
  if (!status) return "Pending";

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPaymentStyle(status) {
  switch (String(status || "").toLowerCase()) {
    case "paid":
      return "text-green-600";

    case "failed":
      return "text-red-600";

    case "refunded":
      return "text-purple-600";

    default:
      return "text-amber-600";
  }
}

function getItems(order) {
  if (Array.isArray(order?.items)) {
    return order.items;
  }

  if (Array.isArray(order?.order_items)) {
    return order.order_items;
  }

  return [];
}

function getOrderId(order) {
  return order?.id || order?.order_id;
}

function getOrderDate(order) {
  return (
    order?.created_at ||
    order?.order_date ||
    order?.createdAt ||
    order?.date
  );
}

function getOrderTotal(order) {
  return (
    order?.total_amount ??
    order?.total ??
    order?.grand_total ??
    0
  );
}

function getProductName(item) {
  return (
    item?.product_name ||
    item?.name ||
    item?.product?.name ||
    "Product"
  );
}

function getVariantLabel(item) {
  return (
    item?.variant_label ||
    item?.variant_name ||
    item?.variant?.label ||
    ""
  );
}

function getQuantity(item) {
  return item?.quantity || 1;
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = getToken();

      if (!token) {
        throw new Error("Please login to view your orders.");
      }

      const response = await fetch(`${API_BASE}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to load your orders."
        );
      }

      const receivedOrders =
        Array.isArray(data.orders)
          ? data.orders
          : Array.isArray(data.data)
          ? data.data
          : [];

      setOrders(receivedOrders);
    } catch (err) {
      console.error("My Orders error:", err);
      setError(err.message || "Failed to load your orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <main className="min-h-[75vh] bg-brand-cream px-4 py-12">
        <div className="mx-auto max-w-5xl">

          <Link
            to="/account"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-green"
          >
            <ArrowLeft size={17} />
            Back to Account
          </Link>

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-brand-green/10 text-brand-green">
              <ShoppingBag size={24} />
            </div>

            <p className="font-semibold text-black/60">
              Loading your orders...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[75vh] bg-brand-cream px-4 py-10 sm:py-12">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <Link
              to="/account"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-green"
            >
              <ArrowLeft size={17} />
              Back to Account
            </Link>

            <h1 className="text-3xl font-extrabold text-brand-green">
              My Orders
            </h1>

            <p className="mt-1 text-sm text-black/50">
              View and track your Home Foods orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-brand-green shadow-sm transition hover:bg-brand-green/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">

            <p className="font-semibold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => fetchOrders()}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* NO ORDERS */}
        {!error && orders.length === 0 && (
          <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm">

            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-green/10 text-brand-green">
              <Package size={30} />
            </div>

            <h2 className="mt-5 text-xl font-extrabold">
              No Orders Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">
              You haven't placed any orders yet. Once you place an
              order, it will appear here.
            </p>

            <Link
              to="/shop"
              className="mt-6 inline-flex rounded-xl bg-brand-green px-6 py-3 font-bold text-white transition hover:opacity-90"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* ORDERS */}
        {orders.length > 0 && (
          <div className="space-y-4">

            {orders.map((order) => {
              const orderId = getOrderId(order);
              const items = getItems(order);
              const status = order?.order_status || order?.status;
              const paymentStatus =
                order?.payment_status || "pending";

              return (
                <div
                  key={orderId}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5"
                >

                  {/* ORDER HEADER */}
                  <div className="border-b border-black/5 px-5 py-5 sm:px-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-black/40">
                          Order
                        </p>

                        <h2 className="mt-1 text-lg font-extrabold">
                          #{orderId}
                        </h2>

                        <p className="mt-1 text-sm text-black/45">
                          {formatDate(getOrderDate(order))}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                            status
                          )}`}
                        >
                          {formatStatus(status)}
                        </span>

                        <span
                          className={`rounded-full bg-black/5 px-3 py-1.5 text-xs font-bold ${getPaymentStyle(
                            paymentStatus
                          )}`}
                        >
                          Payment: {formatStatus(paymentStatus)}
                        </span>

                      </div>
                    </div>
                  </div>

                  {/* ORDER CONTENT */}
                  <div className="px-5 py-5 sm:px-6">

                    <div className="space-y-3">

                      {items.length > 0 ? (
                        items.slice(0, 3).map((item, index) => (
                          <div
                            key={
                              item?.id ||
                              item?.order_item_id ||
                              `${orderId}-${index}`
                            }
                            className="flex items-center justify-between gap-4 rounded-2xl bg-brand-cream/50 px-4 py-3"
                          >

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">
                                {getProductName(item)}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-black/45">
                                {getVariantLabel(item) && (
                                  <span>
                                    {getVariantLabel(item)}
                                  </span>
                                )}

                                <span>
                                  Qty: {getQuantity(item)}
                                </span>
                              </div>
                            </div>

                            <p className="shrink-0 text-sm font-bold text-brand-green">
                              {formatAmount(
                                item?.item_total ??
                                  item?.total ??
                                  Number(item?.unit_price || 0) *
                                    Number(item?.quantity || 1)
                              )}
                            </p>

                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-brand-cream/50 px-4 py-4 text-sm text-black/50">
                          Order items are available in order details.
                        </div>
                      )}

                    </div>

                    {items.length > 3 && (
                      <p className="mt-3 text-xs font-semibold text-black/40">
                        + {items.length - 3} more item
                        {items.length - 3 > 1 ? "s" : ""}
                      </p>
                    )}

                    {/* TOTAL + VIEW */}
                    <div className="mt-5 flex flex-col gap-4 border-t border-black/5 pt-5 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-black/40">
                          Total Amount
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-brand-green">
                          {formatAmount(getOrderTotal(order))}
                        </p>
                      </div>

                      <Link
                        to={`/account/orders/${orderId}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                      >
                        View Order
                        <ChevronRight size={17} />
                      </Link>

                    </div>

                  </div>
                </div>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}