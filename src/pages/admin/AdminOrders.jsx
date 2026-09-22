import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
  IndianRupee,
  User,
  MapPin,
  Phone,
  CreditCard,
  Loader2,
  ShoppingBag,
} from "lucide-react";

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

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-purple-50 text-purple-700 border-purple-200",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const icons = {
    pending: <Clock3 size={13} />,
    confirmed: <CheckCircle2 size={13} />,
    processing: <Package size={13} />,
    shipped: <Truck size={13} />,
    delivered: <CheckCircle2 size={13} />,
    cancelled: <XCircle size={13} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
        styles[status] ||
        "bg-gray-50 text-gray-600 border-gray-200"
      }`}
    >
      {icons[status]}
      {STATUS_LABELS[status] || status || "Unknown"}
    </span>
  );
}

function PaymentBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    paid: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-700",
    refunded: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status || "pending"}
    </span>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [updatingOrderId, setUpdatingOrderId] =
    useState(null);

  async function loadOrders(showRefresh = false) {
    const token = getToken();

    if (!token) {
      setError("Admin authentication is missing.");
      setLoading(false);
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE}/orders/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load orders"
        );
      }

      setOrders(
        Array.isArray(data.orders)
          ? data.orders
          : []
      );
    } catch (err) {
      console.error("Admin orders error:", err);

      setError(
        err.message || "Failed to load orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function openOrder(orderId) {
    const token = getToken();

    try {
      setDetailLoading(true);
      setSelectedOrder(null);

      const response = await fetch(
        `${API_BASE}/orders/admin/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load order"
        );
      }

      setSelectedOrder(data.order);
    } catch (err) {
      console.error("Order details error:", err);
      alert(
        err.message || "Failed to load order details"
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateOrderStatus(
    orderId,
    newStatus
  ) {
    const token = getToken();

    try {
      setUpdatingOrderId(orderId);

      const response = await fetch(
        `${API_BASE}/orders/admin/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderStatus: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update order status"
        );
      }

      // Refresh order list
      await loadOrders(true);

      // Refresh currently opened order
      if (
        selectedOrder &&
        Number(selectedOrder.id) === Number(orderId)
      ) {
        await openOrder(orderId);
      }
    } catch (err) {
      console.error(
        "Update order status error:",
        err
      );

      alert(
        err.message ||
          "Failed to update order status"
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" ||
        String(order.order_status)
          .toLowerCase() === statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      return [
        order.id,
        order.full_name,
        order.phone,
        order.city,
        order.pincode,
        order.payment_method,
        order.order_status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [orders, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const status = String(
        order.order_status || ""
      ).toLowerCase();

      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  }, [orders]);

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <Link
              to="/admin"
              className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-brand-green"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-gold">
              Sri Rama Home Foods
            </p>

            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Order Management
            </h1>
          </div>

          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-bold transition hover:bg-black/[0.03] disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Status summary */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat
            label="All Orders"
            value={statusCounts.all}
          />

          <MiniStat
            label="Pending"
            value={statusCounts.pending}
          />

          <MiniStat
            label="Processing"
            value={statusCounts.processing}
          />

          <MiniStat
            label="Delivered"
            value={statusCounts.delivered}
          />
        </section>

        {/* Search + filters */}
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search order, customer, phone..."
                className="w-full rounded-xl border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-green"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setStatusFilter(status)
                  }
                  className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold transition ${
                    statusFilter === status
                      ? "bg-brand-green text-white"
                      : "bg-black/[0.04] text-black/60 hover:bg-black/[0.08]"
                  }`}
                >
                  {status === "all"
                    ? `All (${statusCounts.all})`
                    : `${STATUS_LABELS[status]} (${
                        statusCounts[status]
                      })`}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p className="font-bold">
              Unable to load orders
            </p>

            <p className="mt-1">{error}</p>

            <button
              onClick={() => loadOrders()}
              className="mt-3 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white"
            >
              Try Again
            </button>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <section className="mt-6 flex min-h-[300px] items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="text-center">
              <Loader2
                size={30}
                className="mx-auto animate-spin text-brand-green"
              />

              <p className="mt-3 text-sm font-semibold text-black/50">
                Loading orders...
              </p>
            </div>
          </section>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredOrders.length === 0 && (
            <section className="mt-6 rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-black/5">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-green/10 text-brand-green">
                <ShoppingBag size={25} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                No orders found
              </h2>

              <p className="mt-2 text-sm text-black/50">
                {orders.length === 0
                  ? "There are no customer orders yet."
                  : "Try changing your search or status filter."}
              </p>
            </section>
          )}

        {/* Orders */}
        {!loading &&
          filteredOrders.length > 0 && (
            <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="border-b border-black/5 px-5 py-4">
                <h2 className="font-black">
                  Orders
                </h2>

                <p className="mt-1 text-xs text-black/45">
                  Showing {filteredOrders.length} of{" "}
                  {orders.length} orders
                </p>
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead className="bg-black/[0.025]">
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-black/45">
                      <th className="px-5 py-4">
                        Order
                      </th>

                      <th className="px-5 py-4">
                        Customer
                      </th>

                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4">
                        Payment
                      </th>

                      <th className="px-5 py-4">
                        Total
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="border-t border-black/5"
                        >
                          <td className="px-5 py-4">
                            <p className="font-black">
                              #{order.id}
                            </p>

                            <p className="mt-1 text-xs text-black/40">
                              {order.item_count || 0}{" "}
                              item
                              {Number(
                                order.item_count || 0
                              ) === 1
                                ? ""
                                : "s"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-bold">
                              {order.full_name ||
                                order.customer_name ||
                                "Customer"}
                            </p>

                            <p className="mt-1 text-xs text-black/45">
                              {order.phone || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-black/60">
                            {formatDate(
                              order.created_at
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold uppercase">
                              {order.payment_method ||
                                "COD"}
                            </p>

                            <div className="mt-1">
                              <PaymentBadge
                                status={
                                  order.payment_status
                                }
                              />
                            </div>
                          </td>

                          <td className="px-5 py-4 font-black">
                            {formatCurrency(
                              order.total_amount
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={
                                order.order_status
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() =>
                                openOrder(order.id)
                              }
                              className="inline-flex items-center gap-2 rounded-full bg-brand-green px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-green-dark"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile/tablet cards */}
              <div className="divide-y divide-black/5 lg:hidden">
                {filteredOrders.map(
                  (order) => (
                    <div
                      key={order.id}
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">
                            Order #{order.id}
                          </p>

                          <p className="mt-1 text-xs text-black/45">
                            {formatDate(
                              order.created_at
                            )}
                          </p>
                        </div>

                        <StatusBadge
                          status={
                            order.order_status
                          }
                        />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <InfoLine
                          icon={<User size={15} />}
                          label="Customer"
                          value={
                            order.full_name ||
                            order.customer_name ||
                            "Customer"
                          }
                        />

                        <InfoLine
                          icon={<Phone size={15} />}
                          label="Phone"
                          value={
                            order.phone || "—"
                          }
                        />

                        <InfoLine
                          icon={
                            <CreditCard
                              size={15}
                            />
                          }
                          label="Payment"
                          value={`${String(
                            order.payment_method ||
                              "COD"
                          ).toUpperCase()} • ${
                            order.payment_status ||
                            "pending"
                          }`}
                        />

                        <InfoLine
                          icon={
                            <IndianRupee
                              size={15}
                            />
                          }
                          label="Total"
                          value={formatCurrency(
                            order.total_amount
                          )}
                        />
                      </div>

                      <button
                        onClick={() =>
                          openOrder(order.id)
                        }
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white"
                      >
                        <Eye size={16} />
                        View Order
                      </button>
                    </div>
                  )
                )}
              </div>
            </section>
          )}
      </div>

      {/* Order detail modal */}
      {(selectedOrder || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {detailLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <Loader2
                    size={30}
                    className="mx-auto animate-spin text-brand-green"
                  />

                  <p className="mt-3 text-sm font-semibold text-black/50">
                    Loading order...
                  </p>
                </div>
              </div>
            ) : (
              <OrderDetails
                order={selectedOrder}
                updatingOrderId={
                  updatingOrderId
                }
                onStatusUpdate={
                  updateOrderStatus
                }
                onClose={() =>
                  setSelectedOrder(null)
                }
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-bold uppercase tracking-wide text-black/40">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">
        {value}
      </p>
    </div>
  );
}

function InfoLine({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-black/[0.025] p-3">
      <div className="flex items-center gap-2 text-xs font-bold text-black/40">
        {icon}
        {label}
      </div>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function OrderDetails({
  order,
  updatingOrderId,
  onStatusUpdate,
  onClose,
}) {
  if (!order) return null;

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  return (
    <>
      {/* Modal header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-gold">
            Order Details
          </p>

          <h2 className="mt-1 text-xl font-black">
            Order #{order.id}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.05] text-lg font-bold transition hover:bg-black/10"
        >
          ×
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {/* Status section */}
        <section className="rounded-2xl bg-brand-cream p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-black/40">
                Current Status
              </p>

              <div className="mt-2">
                <StatusBadge
                  status={order.order_status}
                />
              </div>
            </div>

            <div className="w-full sm:w-56">
              <label className="mb-1.5 block text-xs font-bold text-black/50">
                Update Order Status
              </label>

              <select
                value={
                  order.order_status || "pending"
                }
                disabled={
                  updatingOrderId === order.id
                }
                onChange={(e) =>
                  onStatusUpdate(
                    order.id,
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand-green disabled:opacity-60"
              >
                {STATUS_OPTIONS.filter(
                  (status) => status !== "all"
                ).map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>

              {updatingOrderId ===
                order.id && (
                <p className="mt-2 text-xs font-semibold text-brand-green">
                  Updating...
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Customer + address */}
        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-black/5 p-5">
            <div className="flex items-center gap-2">
              <User
                size={18}
                className="text-brand-green"
              />

              <h3 className="font-black">
                Customer
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <DetailRow
                label="Name"
                value={order.full_name}
              />

              <DetailRow
                label="Phone"
                value={order.phone}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 p-5">
            <div className="flex items-center gap-2">
              <MapPin
                size={18}
                className="text-brand-green"
              />

              <h3 className="font-black">
                Delivery Address
              </h3>
            </div>

            <p className="mt-4 text-sm leading-6 text-black/65">
              {order.house_flat}
              <br />

              {order.area_street}
              <br />

              {order.city}, {order.state} -{" "}
              {order.pincode}

              {order.landmark && (
                <>
                  <br />
                  Landmark: {order.landmark}
                </>
              )}
            </p>
          </div>
        </section>

        {/* Items */}
        <section className="mt-5 rounded-2xl border border-black/5">
          <div className="border-b border-black/5 px-5 py-4">
            <h3 className="font-black">
              Order Items
            </h3>
          </div>

          <div className="divide-y divide-black/5">
            {items.length === 0 ? (
              <p className="p-5 text-sm text-black/50">
                No order items found.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-bold">
                      {item.product_name}
                    </p>

                    <p className="mt-1 text-xs text-black/45">
                      {item.variant_label ||
                        "Default"}{" "}
                      × {item.quantity}
                    </p>
                  </div>

                  <p className="font-black">
                    {formatCurrency(
                      item.item_total
                    )}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Payment + totals */}
        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-black/5 p-5">
            <div className="flex items-center gap-2">
              <CreditCard
                size={18}
                className="text-brand-green"
              />

              <h3 className="font-black">
                Payment
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <DetailRow
                label="Method"
                value={String(
                  order.payment_method ||
                    "cod"
                ).toUpperCase()}
              />

              <div className="flex items-center justify-between gap-4">
                <span className="text-black/50">
                  Status
                </span>

                <PaymentBadge
                  status={
                    order.payment_status
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-brand-green p-5 text-white">
            <h3 className="font-black">
              Order Summary
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(
                  order.subtotal
                )}
              />

              <SummaryRow
                label="Delivery"
                value={
                  Number(
                    order.delivery_fee || 0
                  ) === 0
                    ? "FREE"
                    : formatCurrency(
                        order.delivery_fee
                      )
                }
              />

              <SummaryRow
                label="Discount"
                value={formatCurrency(
                  order.discount_amount
                )}
              />

              <div className="border-t border-white/20 pt-3">
                <SummaryRow
                  label="Total"
                  value={formatCurrency(
                    order.total_amount
                  )}
                  strong
                />
              </div>
            </div>
          </div>
        </section>

        {/* Order date */}
        <p className="mt-5 text-xs text-black/40">
          Order placed:{" "}
          {formatDate(order.created_at)}
        </p>
      </div>
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-black/45">
        {label}
      </span>

      <span className="text-right font-semibold">
        {value || "—"}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        strong ? "text-base font-black" : ""
      }`}
    >
      <span className="text-white/70">
        {label}
      </span>

      <span>{value}</span>
    </div>
  );
}