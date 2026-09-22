import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Plus,
  Loader2,
} from "lucide-react";
import { useCart } from "../context/CartContext";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

export default function Checkout() {
  const {
    items,
    subtotal,
    loadBackendCart,
  } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  const [loadingAddresses, setLoadingAddresses] =
    useState(true);

  const [showAddressForm, setShowAddressForm] =
    useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    house: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    addressType: "home",
  });

  const [errors, setErrors] = useState({});
  const [placingOrder, setPlacingOrder] =
    useState(false);
  const [savingAddress, setSavingAddress] =
    useState(false);

  const [orderPlaced, setOrderPlaced] =
    useState(false);

  const [createdOrder, setCreatedOrder] =
    useState(null);

  const deliveryFee = 0;
  const estimatedTotal = Number(subtotal);

  /*
   * =========================================================
   * LOAD ADDRESSES
   * =========================================================
   */

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      setLoadingAddresses(true);

      const token = getToken();

      if (!token) {
        setLoadingAddresses(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load addresses"
        );
      }

      const list = data.addresses || [];

      setAddresses(list);

      const defaultAddress = list.find(
        (address) => address.is_default
      );

      if (defaultAddress) {
        setSelectedAddressId(
          String(defaultAddress.id)
        );
      } else if (list.length > 0) {
        setSelectedAddressId(
          String(list[0].id)
        );
      }
    } catch (error) {
      console.error(
        "Load addresses error:",
        error
      );

      setErrors({
        general:
          "Unable to load your saved addresses.",
      });
    } finally {
      setLoadingAddresses(false);
    }
  }

  /*
   * =========================================================
   * INPUT CHANGE
   * =========================================================
   */

  function handleChange(event) {
    const { name, value } = event.target;

    let nextValue = value;

    if (
      name === "phone" ||
      name === "pincode"
    ) {
      nextValue = value.replace(/\D/g, "");
    }

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  }

  /*
   * =========================================================
   * VALIDATE ADDRESS
   * =========================================================
   */

  function validateAddress() {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName =
        "Full name is required";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      newErrors.phone =
        "Enter a valid 10-digit phone number";
    }

    if (!form.house.trim()) {
      newErrors.house =
        "House / Flat is required";
    }

    if (!form.street.trim()) {
      newErrors.street =
        "Area / Street is required";
    }

    if (!form.city.trim()) {
      newErrors.city =
        "City is required";
    }

    if (!form.state.trim()) {
      newErrors.state =
        "State is required";
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      newErrors.pincode =
        "Enter a valid 6-digit pincode";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  }

  /*
   * =========================================================
   * SAVE NEW ADDRESS
   * =========================================================
   */

  async function handleSaveAddress() {
    if (!validateAddress()) {
      return;
    }

    const token = getToken();

    if (!token) {
      setErrors({
        general:
          "Please login before saving an address.",
      });

      return;
    }

    try {
      setSavingAddress(true);

      const response = await fetch(
        `${API_URL}/api/addresses`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            fullName:
              form.fullName.trim(),

            phone:
              form.phone.trim(),

            houseFlat:
              form.house.trim(),

            areaStreet:
              form.street.trim(),

            city:
              form.city.trim(),

            state:
              form.state.trim(),

            pincode:
              form.pincode.trim(),

            landmark:
              form.landmark.trim() || null,

            addressType:
              form.addressType,

            isDefault:
              addresses.length === 0,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.duplicate) {
          setErrors({
            general:
              "This address already exists in your account. Please select the existing address.",
          });
        } else {
          setErrors({
            general:
              data.message ||
              "Failed to save address",
          });
        }

        return;
      }

      await loadAddresses();

      const newAddressId =
        data.address?.id ||
        data.addressId;

      if (newAddressId) {
        setSelectedAddressId(
          String(newAddressId)
        );
      }

      setShowAddressForm(false);

      setForm({
        fullName: "",
        phone: "",
        house: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        addressType: "home",
      });

      setErrors({});
    } catch (error) {
      console.error(
        "Save address error:",
        error
      );

      setErrors({
        general:
          "Unable to save address. Please try again.",
      });
    } finally {
      setSavingAddress(false);
    }
  }

  /*
   * =========================================================
   * PLACE ORDER
   * =========================================================
   */

  async function handlePlaceOrder() {
    if (!items.length) return;

    const newErrors = {};
    if (!selectedAddressId) newErrors.address = "Please select a delivery address";

    if (Object.keys(newErrors).length) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      window.scrollTo({ top: 180, behavior: "smooth" });
      return;
    }

    const token = getToken();
    if (!token) {
      setErrors({ general: "Please login before placing an order." });
      return;
    }

    try {
      setPlacingOrder(true);
      setErrors({});

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addressId: Number(selectedAddressId), notes: null }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrors({ general: data.message || "Failed to create order" });
        return;
      }

      setCreatedOrder(data.order);
      await loadBackendCart();

      const address = addresses.find((a) => String(a.id) === String(selectedAddressId));
      const addressText = address
        ? [address.full_name, address.phone, address.house_flat, address.area_street, address.city, address.state, address.pincode, address.landmark].filter(Boolean).join(", ")
        : "Address selected at checkout";

      const productLines = items.map((item) => {
        const price = Number(item.variant?.price ?? item.product?.price ?? 0);
        return `• ${item.product.name} - ${item.variant?.label || "Standard"} × ${item.qty} = ₹${price * item.qty}`;
      }).join("\n");

      const message = [
        "Hello Sri Rama Home Foods! 👋",
        "I would like to place this order:",
        `Order ID: #${data.order.id}`,
        "",
        productLines,
        "",
        `Subtotal: ₹${Number(data.order.subtotal)}`,
        "Delivery: FREE",
        `Total: ₹${Number(data.order.total_amount)}`,
        "",
        `Delivery Address: ${addressText}`,
        "",
        "I will complete the payment using the UPI/QR provided by Sri Rama Home Foods.",
      ].join("\n");

      const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(/\D/g, "");
      if (!whatsappNumber) {
        setErrors({ general: "WhatsApp number is not configured. Please add VITE_WHATSAPP_NUMBER to the frontend .env file." });
        return;
      }

      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      setOrderPlaced(true);
    } catch (error) {
      console.error("Place order error:", error);
      setErrors({ general: "Something went wrong while placing your order." });
    } finally {
      setPlacingOrder(false);
    }
  }

  /*
   * =========================================================
   * SUCCESS SCREEN
   *
   * IMPORTANT:
   * This comes BEFORE the empty-cart check.
   *
   * After successful order the backend cart is empty,
   * but we still need to show the order confirmation.
   * =========================================================
   */

  if (
    orderPlaced &&
    createdOrder
  ) {
    return (
      <main className="min-h-screen bg-brand-cream px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50">
            <CheckCircle2
              size={45}
              className="text-brand-green"
            />
          </div>

          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
            Order confirmed
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Thank you!
          </h1>

          <p className="mt-3 text-sm text-black/50">
            Your order has been successfully created.
          </p>

          <div className="mt-8 rounded-2xl bg-brand-cream p-5 text-left">
            <div className="flex justify-between gap-4">
              <span className="text-sm text-black/50">
                Order ID
              </span>

              <span className="font-black">
                #{createdOrder.id}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4">
              <span className="text-sm text-black/50">
                Total
              </span>

              <span className="text-lg font-black text-brand-green">
                ₹{createdOrder.total_amount}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4">
              <span className="text-sm text-black/50">
                Payment
              </span>

              <span className="text-sm font-bold uppercase">
                {createdOrder.payment_method}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4">
              <span className="text-sm text-black/50">
                Status
              </span>

              <span className="text-sm font-bold capitalize">
                {createdOrder.order_status}
              </span>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/account"
              className="rounded-full border border-black/10 px-8 py-4 text-sm font-extrabold transition hover:border-brand-green hover:text-brand-green"
            >
              VIEW MY ORDERS
            </Link>

            <Link
              to="/shop"
              className="rounded-full bg-brand-green px-8 py-4 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * EMPTY CART
   * =========================================================
   */

  if (!items.length) {
    return (
      <main className="min-h-screen bg-brand-cream px-4 py-16">
        <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-green/10">
            <MapPin
              size={34}
              className="text-brand-green"
            />
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Your cart is empty
          </h1>

          <p className="mt-3 text-sm text-black/50">
            Add some homemade favorites before
            proceeding to checkout.
          </p>

          <Link
            to="/shop"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-green px-7 py-3.5 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
          >
            <ArrowLeft size={16} />
            BACK TO SHOP
          </Link>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * CHECKOUT PAGE
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* HEADER */}
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm font-bold text-black/50 transition hover:text-brand-green"
          >
            <ArrowLeft size={16} />
            Back to cart
          </Link>

          <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
            Secure checkout
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Checkout
          </h1>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT */}
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-8">
            {/* DELIVERY ADDRESS */}
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-green/10">
                <MapPin
                  size={19}
                  className="text-brand-green"
                />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  Delivery Address
                </h2>

                <p className="text-xs text-black/40">
                  Select where we should deliver your order.
                </p>
              </div>
            </div>

            {errors.general && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                {errors.general}
              </div>
            )}

            {/* SAVED ADDRESSES */}
            {loadingAddresses ? (
              <div className="mt-6 flex items-center justify-center rounded-2xl border border-black/10 p-8">
                <Loader2
                  size={22}
                  className="animate-spin text-brand-green"
                />
              </div>
            ) : addresses.length > 0 ? (
              <div className="mt-6 space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`block cursor-pointer rounded-2xl border p-4 transition ${
                      String(address.id) ===
                      String(selectedAddressId)
                        ? "border-brand-green bg-brand-green/5"
                        : "border-black/10 hover:border-brand-green/40"
                    }`}
                  >
                    <div className="flex gap-3">
                      <input
                        type="radio"
                        name="savedAddress"
                        value={address.id}
                        checked={
                          String(address.id) ===
                          String(selectedAddressId)
                        }
                        onChange={(e) => {
                          setSelectedAddressId(
                            e.target.value
                          );

                          setErrors((prev) => ({
                            ...prev,
                            address: "",
                          }));
                        }}
                        className="mt-1 accent-brand-green"
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black">
                            {address.full_name}
                          </p>

                          <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-bold uppercase">
                            {address.address_type}
                          </span>

                          {address.is_default && (
                            <span className="rounded-full bg-brand-green/10 px-2 py-1 text-[10px] font-bold text-brand-green">
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm leading-6 text-black/55">
                          {address.house_flat},{" "}
                          {address.area_street},{" "}
                          {address.city},{" "}
                          {address.state} -{" "}
                          {address.pincode}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {address.phone}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-black/15 p-6 text-center">
                <p className="text-sm font-bold">
                  No saved address
                </p>

                <p className="mt-1 text-xs text-black/40">
                  Add a delivery address to continue.
                </p>
              </div>
            )}

            {errors.address && (
              <p className="mt-2 text-xs font-semibold text-red-500">
                {errors.address}
              </p>
            )}

            {/* ADD ADDRESS */}
            {!showAddressForm && (
              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(true);
                  setErrors({});
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-green px-5 py-3 text-sm font-extrabold text-brand-green transition hover:bg-brand-green/5"
              >
                <Plus size={16} />
                ADD NEW ADDRESS
              </button>
            )}

            {/* NEW ADDRESS FORM */}
            {showAddressForm && (
              <div className="mt-6 rounded-2xl border border-black/10 bg-brand-cream/40 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-black">
                    New Address
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      setShowAddressForm(false)
                    }
                    className="text-xs font-bold text-black/40 hover:text-black"
                  >
                    CANCEL
                  </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Full name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                  />

                  <FormField
                    label="Phone number"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    type="tel"
                    maxLength={10}
                  />

                  <FormField
                    label="House / Flat"
                    name="house"
                    value={form.house}
                    onChange={handleChange}
                    error={errors.house}
                  />

                  <FormField
                    label="Area / Street"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    error={errors.street}
                  />

                  <FormField
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    error={errors.city}
                  />

                  <FormField
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    error={errors.state}
                  />

                  <FormField
                    label="Pincode"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    error={errors.pincode}
                    maxLength={6}
                  />

                  <FormField
                    label="Landmark (optional)"
                    name="landmark"
                    value={form.landmark}
                    onChange={handleChange}
                  />
                </div>

                {/* ADDRESS TYPE */}
                <div className="mt-4">
                  <p className="text-xs font-bold text-black/50">
                    Address type
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      "home",
                      "work",
                      "other",
                    ].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            addressType: type,
                          }))
                        }
                        className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
                          form.addressType === type
                            ? "bg-brand-green text-white"
                            : "bg-black/5 hover:bg-black/10"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAddress}
                  disabled={savingAddress}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-3 text-sm font-extrabold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingAddress && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {savingAddress
                    ? "SAVING..."
                    : "SAVE ADDRESS"}
                </button>
              </div>
            )}

            {/* PLACE ORDER */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-brand-green py-4 text-sm font-extrabold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placingOrder && (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              )}

              {placingOrder ? "PROCESSING..." : "ORDER ON WHATSAPP"}
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-black/40">
              <ShieldCheck size={15} />
              Secure checkout
            </div>
          </section>

          {/* SUMMARY */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                {items.map((item) => {
                  const itemPrice = Number(
                    item.variant?.price ??
                      item.product?.price ??
                      0
                  );

                  return (
                    <div
                      key={item.key}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {item.product.name}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {item.variant?.label} ×{" "}
                          {item.qty}
                        </p>
                      </div>

                      <span className="shrink-0 font-bold">
                        ₹
                        {itemPrice *
                          item.qty}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="my-6 h-px bg-black/10" />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">Delivery</span>
                  <span className="font-bold text-brand-green">FREE</span>
                </div>
              </div>

              <div className="my-6 h-px bg-black/10" />

              <div className="flex items-center justify-between">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-2xl font-black text-brand-green">
                  ₹{estimatedTotal}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  maxLength,
}) {
  return (
    <div>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        maxLength={maxLength}
        placeholder={label}
        className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm outline-none transition ${
          error
            ? "border-red-400"
            : "border-black/10 focus:border-brand-green"
        }`}
      />

      {error && (
        <p className="mt-1.5 px-1 text-xs font-semibold text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}