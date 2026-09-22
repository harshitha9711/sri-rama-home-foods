import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Package,
  Truck,
  XCircle,
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

function formatAmount(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status) {
  if (!status) return "Pending";

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
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

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getItems(order) {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.order_items)) return order.order_items;
  return [];
}

function getItemName(item) {
  return (
    item?.product_name ||
    item?.name ||
    item?.product?.name ||
    "Product"
  );
}

function getItemVariant(item) {
  return (
    item?.variant_label ||
    item?.variant_name ||
    item?.variant?.label ||
    ""
  );
}

function getItemTotal(item) {
  return (
    item?.item_total ??
    item?.total ??
    Number(item?.unit_price || 0) * Number(item?.quantity || 1)
  );
}

const trackingSteps = [
  {
    key: "pending",
    label: "Order Placed",
    icon: Clock3,
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: CheckCircle2,
  },
  {
    key: "processing",
    label: "Processing",
    icon: Package,
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: CheckCircle2,
  },
];

const statusOrder = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to load order."
        );
      }

      setOrder(data.order || data.data || null);
    } catch (err) {
      console.error("Order details error:", err);
      setError(err.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <main className="min-h-[75vh] bg-brand-cream px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <Package
              size={32}
              className="mx-auto animate-pulse text-brand-green"
            />

            <p className="mt-4 font-semibold text-black/60">
              Loading order...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-[75vh] bg-brand-cream px-4 py-12">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">

          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500">
            <XCircle size={30} />
          </div>

          <h1 className="mt-5 text-xl font-extrabold">
            Order Not Found
          </h1>

          <p className="mt-2 text-sm text-black/50">
            {error || "We couldn't find this order."}
          </p>

          <Link
            to="/account/orders"
            className="mt-6 inline-flex rounded-xl bg-brand-green px-6 py-3 font-bold text-white"
          >
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  const items = getItems(order);

  const status = String(
    order?.order_status || order?.status || "pending"
  ).toLowerCase();

  const currentStep =
    statusOrder[status] !== undefined
      ? statusOrder[status]
      : 0;

  const isCancelled = status === "cancelled";

  const subtotal = Number(order?.subtotal || 0);
  const deliveryFee = Number(order?.delivery_fee || 0);
  const discount = Number(order?.discount_amount || 0);
  const total = Number(
    order?.total_amount ??
      order?.total ??
      subtotal + deliveryFee - discount
  );

  return (
    <main className="min-h-[75vh] bg-brand-cream px-4 py-10 sm:py-12">
      <div className="mx-auto max-w-4xl">

        {/* BACK */}
        <Link
          to="/account/orders"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-green"
        >
          <ArrowLeft size={17} />
          Back to My Orders
        </Link>

        {/* HEADER */}
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">
                Order Details
              </p>

              <h1 className="mt-1 text-2xl font-extrabold text-brand-green">
                #{order.id}
              </h1>

              <p className="mt-1 text-sm text-black/45">
                Placed on {formatDateTime(order.created_at)}
              </p>
            </div>

            <span
              className={`self-start rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                status
              )}`}
            >
              {formatStatus(status)}
            </span>

          </div>

          {/* TRACKING */}
          <div className="mt-8 border-t border-black/5 pt-8">

            <h2 className="text-lg font-extrabold">
              Order Tracking
            </h2>

            {isCancelled ? (
              <div className="mt-5 rounded-2xl bg-red-50 p-5">
                <div className="flex items-center gap-3 text-red-600">
                  <XCircle size={23} />
                  <p className="font-bold">
                    This order has been cancelled.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-7">

                {/* DESKTOP */}
                <div className="hidden sm:flex">
                  {trackingSteps.map((step, index) => {
                    const Icon = step.icon;
                    const completed = index <= currentStep;

                    return (
                      <div
                        key={step.key}
                        className="relative flex-1 text-center"
                      >
                        {index > 0 && (
                          <div
                            className={`absolute left-0 right-1/2 top-5 h-0.5 ${
                              index <= currentStep
                                ? "bg-brand-green"
                                : "bg-black/10"
                            }`}
                          />
                        )}

                        {index <
                          trackingSteps.length - 1 && (
                          <div
                            className={`absolute left-1/2 right-0 top-5 h-0.5 ${
                              index < currentStep
                                ? "bg-brand-green"
                                : "bg-black/10"
                            }`}
                          />
                        )}

                        <div className="relative z-10 mx-auto grid h-10 w-10 place-items-center rounded-full bg-white">
                          <div
                            className={`grid h-10 w-10 place-items-center rounded-full ${
                              completed
                                ? "bg-brand-green text-white"
                                : "bg-black/5 text-black/30"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                        </div>

                        <p
                          className={`mt-3 text-xs font-bold ${
                            completed
                              ? "text-brand-green"
                              : "text-black/35"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* MOBILE */}
                <div className="space-y-4 sm:hidden">
                  {trackingSteps.map((step, index) => {
                    const Icon = step.icon;
                    const completed = index <= currentStep;

                    return (
                      <div
                        key={step.key}
                        className="flex items-center gap-4"
                      >
                        <div
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                            completed
                              ? "bg-brand-green text-white"
                              : "bg-black/5 text-black/30"
                          }`}
                        >
                          <Icon size={18} />
                        </div>

                        <div>
                          <p
                            className={`text-sm font-bold ${
                              completed
                                ? "text-brand-green"
                                : "text-black/35"
                            }`}
                          >
                            {step.label}
                          </p>

                          {index === currentStep && (
                            <p className="mt-0.5 text-xs text-black/45">
                              Current status
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* ITEMS */}
        <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-lg font-extrabold">
            Ordered Items
          </h2>

          <div className="mt-5 space-y-3">

            {items.length > 0 ? (
              items.map((item, index) => (
                <div
                  key={
                    item?.id ||
                    item?.order_item_id ||
                    index
                  }
                  className="flex items-center justify-between gap-4 rounded-2xl bg-brand-cream/50 p-4"
                >
                  <div className="min-w-0">

                    <p className="font-bold">
                      {getItemName(item)}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-black/45">
                      {getItemVariant(item) && (
                        <span>
                          {getItemVariant(item)}
                        </span>
                      )}

                      <span>
                        Qty: {item?.quantity || 1}
                      </span>
                    </div>

                  </div>

                  <p className="shrink-0 font-bold text-brand-green">
                    {formatAmount(getItemTotal(item))}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-black/50">
                No item details available.
              </p>
            )}

          </div>
        </div>

        {/* DELIVERY ADDRESS + PAYMENT */}
        <div className="mt-5 grid gap-5 md:grid-cols-2">

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold">
              Delivery Address
            </h2>

            <div className="mt-4 space-y-1 text-sm leading-6 text-black/65">

              <p className="font-bold text-black">
                {order.full_name || "-"}
              </p>

              {order.phone && <p>{order.phone}</p>}

              {order.house_flat && (
                <p>{order.house_flat}</p>
              )}

              {order.area_street && (
                <p>{order.area_street}</p>
              )}

              <p>
                {[order.city, order.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              {order.pincode && (
                <p>{order.pincode}</p>
              )}

              {order.landmark && (
                <p>Landmark: {order.landmark}</p>
              )}

            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <h2 className="text-lg font-extrabold">
              Payment
            </h2>

            <div className="mt-4 space-y-3 text-sm">

              <div className="flex justify-between">
                <span className="text-black/50">
                  Method
                </span>

                <span className="font-semibold capitalize">
                  {order.payment_method || "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-black/50">
                  Payment Status
                </span>

                <span className="font-semibold capitalize">
                  {formatStatus(
                    order.payment_status || "pending"
                  )}
                </span>
              </div>

            </div>

          </div>
        </div>

        {/* PRICE SUMMARY */}
        <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-lg font-extrabold">
            Price Summary
          </h2>

          <div className="mt-5 space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-black/50">
                Subtotal
              </span>

              <span className="font-semibold">
                {formatAmount(subtotal)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-black/50">
                Delivery
              </span>

              <span className="font-semibold">
                {deliveryFee === 0
                  ? "FREE"
                  : formatAmount(deliveryFee)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>

                <span className="font-semibold">
                  -{formatAmount(discount)}
                </span>
              </div>
            )}

            <div className="border-t border-black/5 pt-4">
              <div className="flex justify-between">
                <span className="text-base font-bold">
                  Total
                </span>

                <span className="text-xl font-extrabold text-brand-green">
                  {formatAmount(total)}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}