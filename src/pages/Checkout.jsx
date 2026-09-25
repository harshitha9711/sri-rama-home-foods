import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
} from "lucide-react";
import { useCart } from "../context/CartContext";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const WHATSAPP_NUMBER = "919441488444";

export default function Checkout() {
  const navigate = useNavigate();

  const {
    items,
    subtotal,
    clearCart,
  } = useCart();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    houseFlat: "",
    areaStreet: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    addressType: "home",
  });

  const [errors, setErrors] = useState({});
  const [placingOrder, setPlacingOrder] =
    useState(false);
  const [orderPlaced, setOrderPlaced] =
    useState(false);
  const [createdOrder, setCreatedOrder] =
    useState(null);

  const deliveryFee = 0;
  const total = Number(subtotal);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
      general: "",
    }));
  }

  function validate() {
    const next = {};

    if (!form.fullName.trim()) {
      next.fullName = "Name is required";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      next.phone =
        "Enter a valid 10-digit mobile number";
    }

    if (!form.houseFlat.trim()) {
      next.houseFlat =
        "House / Flat is required";
    }

    if (!form.areaStreet.trim()) {
      next.areaStreet =
        "Area / Street is required";
    }

    if (!form.city.trim()) {
      next.city = "City is required";
    }

    if (!form.state.trim()) {
      next.state = "State is required";
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      next.pincode =
        "Enter a valid 6-digit pincode";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  }

  async function placeOrder() {
    if (items.length === 0) {
      setErrors({
        general: "Your cart is empty.",
      });

      return;
    }

    if (!validate()) return;

    try {
      setPlacingOrder(true);

      const response = await fetch(
        `${API_URL}/api/guest-orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: {
              fullName: form.fullName.trim(),
              phone: form.phone.trim(),
            },

            address: {
              houseFlat:
                form.houseFlat.trim(),
              areaStreet:
                form.areaStreet.trim(),
              city: form.city.trim(),
              state: form.state.trim(),
              pincode: form.pincode.trim(),
              landmark:
                form.landmark.trim(),
              addressType:
                form.addressType,
            },

            items: items.map((item) => ({
              productId:
                Number(item.product.id),
              variantId:
                Number(item.variant.id),
              quantity:
                Number(item.qty),
            })),

            notes: null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to place order"
        );
      }

      setCreatedOrder(data.order);
      setOrderPlaced(true);

      const order = data.order;

      const itemLines = items
        .map(
          (item) =>
            `• ${item.product.name} - ${
              item.variant.label
            } x ${item.qty} = ₹${(
              Number(item.variant.price) *
              Number(item.qty)
            ).toFixed(0)}`
        )
        .join("\n");

      const addressText = [
        form.houseFlat,
        form.areaStreet,
        form.city,
        form.state,
        form.pincode,
        form.landmark
          ? `Landmark: ${form.landmark}`
          : "",
      ]
        .filter(Boolean)
        .join(", ");

      const message = `*NEW ORDER - SRI RAMA HOME FOODS*

Order ID: #${order.id}

*Customer*
Name: ${form.fullName}
Phone: ${form.phone}

*Items*
${itemLines}

*Delivery Address*
${addressText}

Delivery: FREE
Total: ₹${Number(order.total_amount).toFixed(
        0
      )}

Payment: UPI
Payment Status: Pending

Customer will pay using UPI/QR.`;

      const whatsappUrl =
        `https://wa.me/${WHATSAPP_NUMBER}` +
        `?text=${encodeURIComponent(message)}`;

      await clearCart();

      window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

      setErrors({
        general:
          error.message ||
          "Unable to place order. Please try again.",
      });
    } finally {
      setPlacingOrder(false);
    }
  }

  if (orderPlaced) {
    return (
      <main className="min-h-screen bg-[#fafaf7] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50">
            <CheckCircle2
              size={42}
              className="text-green-600"
            />
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Order Placed
          </h1>

          <p className="mt-3 text-black/60">
            Your order #{createdOrder?.id} has
            been received successfully.
          </p>

          <div className="mt-7 rounded-2xl bg-[#fafaf7] p-5 text-left">
            <div className="flex justify-between">
              <span className="text-black/50">
                Total
              </span>

              <strong>
                ₹
                {Number(
                  createdOrder?.total_amount || 0
                ).toFixed(0)}
              </strong>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-black/50">
                Delivery
              </span>

              <strong className="text-green-600">
                FREE
              </strong>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-black/50">
                Payment
              </span>

              <strong>UPI</strong>
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-black/55">
            WhatsApp has been opened with your
            order details. Please complete the
            payment using the QR/UPI details
            provided by Sri Rama Home Foods.
          </p>

          <Link
            to="/shop"
            className="mt-7 inline-flex rounded-full bg-brand-green px-7 py-3 font-bold text-white hover:bg-brand-green-dark"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafaf7] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-semibold text-black/60 hover:text-black"
        >
          <ArrowLeft size={17} />
          Back to Cart
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <MapPin
                size={22}
                className="text-brand-green"
              />

              <div>
                <h1 className="text-2xl font-black">
                  Delivery Address
                </h1>

                <p className="mt-1 text-sm text-black/50">
                  No login required
                </p>
              </div>
            </div>

            {errors.general && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {errors.general}
              </div>
            )}

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Field
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                error={errors.fullName}
                required
              />

              <Field
                label="Mobile Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                error={errors.phone}
                required
                type="tel"
              />

              <Field
                label="House / Flat"
                name="houseFlat"
                value={form.houseFlat}
                onChange={handleChange}
                error={errors.houseFlat}
                required
              />

              <Field
                label="Area / Street"
                name="areaStreet"
                value={form.areaStreet}
                onChange={handleChange}
                error={errors.areaStreet}
                required
              />

              <Field
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                error={errors.city}
                required
              />

              <Field
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                error={errors.state}
                required
              />

              <Field
                label="Pincode"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                error={errors.pincode}
                required
                type="tel"
              />

              <Field
                label="Landmark"
                name="landmark"
                value={form.landmark}
                onChange={handleChange}
              />
            </div>

            <div className="mt-6">
              <label className="text-sm font-bold">
                Address Type
              </label>

              <div className="mt-3 flex gap-3">
                {["home", "work", "other"].map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          addressType: type,
                        }))
                      }
                      className={`rounded-full border px-5 py-2 text-sm font-semibold capitalize ${
                        form.addressType === type
                          ? "border-brand-green bg-brand-green text-white"
                          : "border-black/10 bg-white text-black/60"
                      }`}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-bold">
                      {item.product.name}
                    </p>

                    <p className="mt-1 text-black/45">
                      {item.variant.label} ×{" "}
                      {item.qty}
                    </p>
                  </div>

                  <strong>
                    ₹
                    {(
                      Number(
                        item.variant.price
                      ) *
                      Number(item.qty)
                    ).toFixed(0)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="my-6 border-t border-black/10" />

            <div className="flex justify-between text-sm">
              <span className="text-black/55">
                Subtotal
              </span>

              <strong>
                ₹{Number(subtotal).toFixed(0)}
              </strong>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span className="text-black/55">
                Delivery
              </span>

              <strong className="text-green-600">
                FREE
              </strong>
            </div>

            <div className="my-6 border-t border-black/10" />

            <div className="flex justify-between text-lg">
              <strong>Total</strong>

              <strong>
                ₹{total.toFixed(0)}
              </strong>
            </div>

            <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm leading-6 text-green-800">
              After placing the order, you will
              receive the payment instructions
              through WhatsApp.
            </div>

            <button
              type="button"
              onClick={placeOrder}
              disabled={
                placingOrder ||
                items.length === 0
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-green py-4 text-sm font-black text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placingOrder ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  PLACING ORDER...
                </>
              ) : (
                "PLACE ORDER"
              )}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  type = "text",
}) {
  return (
    <div>
      <label className="text-sm font-bold">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green ${
          error
            ? "border-red-400"
            : "border-black/10"
        }`}
      />

      {error && (
        <p className="mt-1 text-xs font-semibold text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}