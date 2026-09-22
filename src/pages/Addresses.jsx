import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const emptyForm = {
  fullName: "",
  phone: "",
  houseFlat: "",
  areaStreet: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  addressType: "home",
  isDefault: false,
};

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function loadAddresses() {
    const token = getToken();

    if (!token) {
      setError("Please login to manage addresses.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load addresses"
        );
      }

      setAddresses(data.addresses || []);
      setError("");
    } catch (err) {
      console.error("Load addresses error:", err);
      setError(err.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startEdit(address) {
    setEditing(address.id);

    setForm({
      fullName: address.full_name || "",
      phone: address.phone || "",
      houseFlat: address.house_flat || "",
      areaStreet: address.area_street || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      landmark: address.landmark || "",
      addressType: address.address_type || "home",
      isDefault: Boolean(address.is_default),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetForm() {
    setEditing(null);
    setForm({ ...emptyForm });
  }

  async function saveAddress(event) {
    event.preventDefault();
    setError("");

    const token = getToken();

    if (!token) {
      setError("Please login to manage addresses.");
      return;
    }

    try {
      setSaving(true);

      const url = editing
        ? `${API_URL}/api/addresses/${editing}`
        : `${API_URL}/api/addresses`;

      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save address"
        );
      }

      resetForm();
      await loadAddresses();
    } catch (err) {
      console.error("Save address error:", err);
      setError(err.message || "Unable to save address");
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id) {
    if (!window.confirm("Delete this address?")) {
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Please login to manage addresses.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/addresses/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to delete address"
        );
      }

      await loadAddresses();
    } catch (err) {
      console.error("Delete address error:", err);
      setError(err.message || "Unable to delete address");
    }
  }

  async function makeDefault(id) {
    const token = getToken();

    if (!token) {
      setError("Please login to manage addresses.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/addresses/${id}/default`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to set default address"
        );
      }

      await loadAddresses();
    } catch (err) {
      console.error("Make default address error:", err);
      setError(
        err.message || "Unable to set default address"
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-[75vh] bg-brand-cream p-16 text-center">
        <Loader2
          className="mx-auto animate-spin text-brand-green"
          size={28}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-cream">
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/account"
            className="inline-flex items-center gap-2 text-sm font-bold text-black/50 transition hover:text-brand-green"
          >
            <ArrowLeft size={16} />
            Back to account
          </Link>

          <h1 className="mt-6 text-3xl font-black">
            Saved Addresses
          </h1>

          <p className="mt-2 text-sm text-black/50">
            Manage your delivery addresses.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          {/* ADDRESS FORM */}
          <form
            onSubmit={saveAddress}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">
                {editing ? "Edit address" : "Add address"}
              </h2>

              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-bold text-black/45 transition hover:text-brand-green"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-3">
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Full name"
                autoComplete="name"
                required
                className="rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-brand-green"
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone number"
                inputMode="tel"
                autoComplete="tel"
                required
                className="rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-brand-green"
              />

              <input
                name="houseFlat"
                value={form.houseFlat}
                onChange={handleChange}
                placeholder="House / Flat"
                autoComplete="street-address"
                required
                className="rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-brand-green"
              />

              <input
                name="areaStreet"
                value={form.areaStreet}
                onChange={handleChange}
                placeholder="Area / Street"
                required
                className="rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-brand-green"
              />

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                autoComplete="address-level2"
                required
                className="rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-brand-green"
              />

              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State / Region"
                autoComplete="address-level1"
                required
                className="rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-brand-green"
              />

              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="Postal / ZIP code"
                autoComplete="postal-code"
                required
                className="rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-brand-green"
              />

              <input
                name="landmark"
                value={form.landmark}
                onChange={handleChange}
                placeholder="Landmark (optional)"
                className="rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-brand-green"
              />
            </div>

            <select
              name="addressType"
              value={form.addressType}
              onChange={handleChange}
              className="mt-3 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-brand-green"
            >
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                name="isDefault"
                checked={form.isDefault}
                onChange={handleChange}
              />

              Set as default
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand-green px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />

              {saving
                ? "Saving..."
                : editing
                ? "UPDATE ADDRESS"
                : "ADD ADDRESS"}
            </button>
          </form>

          {/* SAVED ADDRESSES */}
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center">
                <MapPin
                  className="mx-auto text-black/20"
                  size={42}
                />

                <p className="mt-4 font-black">
                  No saved addresses
                </p>

                <p className="mt-2 text-sm text-black/45">
                  Add an address to continue with your order.
                </p>
              </div>
            ) : (
              addresses.map((address) => (
                <article
                  key={address.id}
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">
                          {address.full_name}
                        </h3>

                        {address.is_default && (
                          <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-[10px] font-extrabold text-brand-green">
                            DEFAULT
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-black/60">
                        {address.house_flat},{" "}
                        {address.area_street},{" "}
                        {address.city},{" "}
                        {address.state} -{" "}
                        {address.pincode}

                        {address.landmark
                          ? `, ${address.landmark}`
                          : ""}
                      </p>

                      <p className="mt-1 text-xs text-black/45">
                        {address.phone} ·{" "}
                        {address.address_type}
                      </p>
                    </div>

                    <MapPin
                      className="shrink-0 text-brand-green"
                      size={20}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(address)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-xs font-bold transition hover:border-brand-green hover:text-brand-green"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    {!address.is_default && (
                      <button
                        type="button"
                        onClick={() =>
                          makeDefault(address.id)
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/20 px-4 py-2 text-xs font-bold text-brand-green transition hover:bg-brand-green/5"
                      >
                        <Star size={14} />
                        Make default
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeAddress(address.id)
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-100 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}