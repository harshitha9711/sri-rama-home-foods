import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Edit3,
  Image as ImageIcon,
  Package,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_SERVER = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const API_BASE = `${API_SERVER}/api`;

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

const EMPTY_VARIANT = {
  id: null,
  label: "",
  weight_grams: "",
  price: "",
  original_price: "",
  stock_quantity: 0,
  sku: "",
};

const EMPTY_FORM = {
  name: "",
  category_id: "",
  short_description: "",
  description: "",
  ingredients: "",
  food_type: "veg",
  is_featured: false,
  is_active: true,
  variants: [{ ...EMPTY_VARIANT }],
};

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function ProductImage({ product }) {
  if (!product?.main_image_url) {
    return (
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-brand-cream text-brand-green">
        <ImageIcon size={22} />
      </div>
    );
  }

  return (
    <img
      src={product.main_image_url}
      alt={product.name}
      className="h-16 w-16 shrink-0 rounded-xl bg-brand-cream object-cover"
    />
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold text-black/60">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
      />
    </label>
  );
}

function VariantRow({
  variant,
  index,
  onChange,
  onRemove,
  canRemove,
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-brand-cream/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black">Variant {index + 1}</p>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="grid h-8 w-8 place-items-center rounded-full text-red-500 transition hover:bg-red-50"
            aria-label="Remove variant"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Label"
          value={variant.label}
          onChange={(value) => onChange("label", value)}
          placeholder="250g"
          required
        />

        <Field
          label="Weight (grams)"
          type="number"
          value={variant.weight_grams}
          onChange={(value) => onChange("weight_grams", value)}
          placeholder="250"
        />

        <Field
          label="Price"
          type="number"
          value={variant.price}
          onChange={(value) => onChange("price", value)}
          placeholder="149"
          required
        />

        <Field
          label="Original Price"
          type="number"
          value={variant.original_price}
          onChange={(value) => onChange("original_price", value)}
          placeholder="169"
        />

        <Field
          label="Stock"
          type="number"
          value={variant.stock_quantity}
          onChange={(value) => onChange("stock_quantity", value)}
          placeholder="50"
        />

        <Field
          label="SKU"
          value={variant.sku}
          onChange={(value) => onChange("sku", value)}
          placeholder="SKU-250"
        />
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);

  async function apiFetch(url, options = {}) {
    const token = getToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  }

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch(`${API_BASE}/products/admin/all`);

      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await apiFetch(`${API_BASE}/categories`);

      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load categories");
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        String(product.name || "").toLowerCase().includes(query) ||
        String(product.slug || "").toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        String(product.category?.id) === String(categoryFilter);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  function resetImageState() {
    newImageFiles.forEach((item) => {
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });

    setExistingImages([]);
    setNewImageFiles([]);
  }

  function openCreate() {
    resetImageState();

    setEditingProduct(null);

    setForm({
      ...EMPTY_FORM,
      variants: [{ ...EMPTY_VARIANT }],
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEdit(product) {
    resetImageState();

    setEditingProduct(product);

    setForm({
      name: product.name || "",
      category_id: product.category?.id
        ? String(product.category.id)
        : "",
      short_description: product.short_description || "",
      description: product.description || "",
      ingredients: product.ingredients || "",
      food_type: product.food_type || "veg",
      is_featured: Boolean(product.is_featured),
      is_active: Boolean(product.is_active),

      variants:
        product.variants?.length > 0
          ? product.variants.map((variant) => ({
              id: variant.id || null,
              label: variant.label || "",
              weight_grams: variant.weight_grams ?? "",
              price: variant.price ?? "",
              original_price: variant.original_price ?? "",
              stock_quantity: variant.stock_quantity ?? 0,
              sku: variant.sku || "",
            }))
          : [{ ...EMPTY_VARIANT }],
    });

    setExistingImages(
      (product.images || []).map((image, index) => ({
        id: image.id,
        image_url: image.image_url,
        public_id: image.public_id || "",
        alt_text:
          image.alt_text || product.name || "Product image",
        sort_order: index,
        is_primary:
          Boolean(image.is_primary) || index === 0,
      }))
    );

    setNewImageFiles([]);

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingProduct(null);
    resetImageState();
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateVariant(index, field, value) {
    setForm((current) => {
      const variants = [...current.variants];

      variants[index] = {
        ...variants[index],
        [field]: value,
      };

      return {
        ...current,
        variants,
      };
    });
  }

  function addVariant() {
    setForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        { ...EMPTY_VARIANT },
      ],
    }));
  }

  function removeVariant(index) {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter(
        (_, variantIndex) => variantIndex !== index
      ),
    }));
  }

  function handleImageSelection(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const invalidFiles = files.filter(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > 5 * 1024 * 1024
    );

    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") &&
        file.size <= 5 * 1024 * 1024
    );

    const currentCount =
      existingImages.length + newImageFiles.length;

    const available = Math.max(0, 12 - currentCount);

    const accepted = validFiles.slice(0, available);

    if (
      invalidFiles.length > 0 ||
      accepted.length < validFiles.length
    ) {
      setError(
        "Only image files up to 5MB each are allowed, with a maximum of 12 images per product."
      );
    }

    setNewImageFiles((current) => [
      ...current,
      ...accepted.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        is_primary:
          existingImages.length === 0 &&
          current.length === 0 &&
          accepted.length > 0,
      })),
    ]);

    event.target.value = "";
  }

  function removeExistingImage(index) {
    setExistingImages((current) => {
      const removed = current[index];

      const next = current.filter(
        (_, imageIndex) => imageIndex !== index
      );

      if (
        removed?.is_primary &&
        next.length > 0
      ) {
        next[0] = {
          ...next[0],
          is_primary: true,
        };
      }

      return next.map((image, imageIndex) => ({
        ...image,
        sort_order: imageIndex,
      }));
    });

    if (existingImages[index]?.is_primary) {
      setNewImageFiles((current) =>
        current.map((image, imageIndex) => ({
          ...image,
          is_primary:
            imageIndex === 0 && current.length > 0,
        }))
      );
    }
  }

  function removeNewImage(index) {
    setNewImageFiles((current) => {
      const removed = current[index];

      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }

      const next = current.filter(
        (_, imageIndex) => imageIndex !== index
      );

      const hasExistingPrimary =
        existingImages.some(
          (image) => image.is_primary
        );

      if (
        removed?.is_primary &&
        !hasExistingPrimary &&
        next.length > 0
      ) {
        next[0] = {
          ...next[0],
          is_primary: true,
        };
      }

      return next;
    });
  }

  function setExistingPrimary(index) {
    setExistingImages((current) =>
      current.map((image, imageIndex) => ({
        ...image,
        is_primary: imageIndex === index,
      }))
    );

    setNewImageFiles((current) =>
      current.map((image) => ({
        ...image,
        is_primary: false,
      }))
    );
  }

  function setNewPrimary(index) {
    setExistingImages((current) =>
      current.map((image) => ({
        ...image,
        is_primary: false,
      }))
    );

    setNewImageFiles((current) =>
      current.map((image, imageIndex) => ({
        ...image,
        is_primary: imageIndex === index,
      }))
    );
  }

  async function getCloudinaryUploadSignature() {
    return apiFetch(
      `${API_BASE}/product-images/signature`,
      {
        method: "POST",
      }
    );
  }

  async function uploadImageToCloudinary(
    file,
    signatureData
  ) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append(
      "api_key",
      signatureData.api_key
    );
    formData.append(
      "timestamp",
      signatureData.timestamp
    );
    formData.append(
      "signature",
      signatureData.signature
    );
    formData.append(
      "folder",
      signatureData.folder
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (
      !response.ok ||
      !data.secure_url ||
      !data.public_id
    ) {
      throw new Error(
        data.error?.message ||
          "Cloudinary image upload failed"
      );
    }

    return {
      image_url: data.secure_url,
      public_id: data.public_id,
    };
  }

  async function syncImages(productId) {
    const uploaded = [];

    if (newImageFiles.length) {
      const signatureData =
        await getCloudinaryUploadSignature();

      for (const item of newImageFiles) {
        const uploadedImage =
          await uploadImageToCloudinary(
            item.file,
            signatureData
          );

        uploaded.push({
          ...uploadedImage,
          alt_text: form.name.trim(),
          is_primary: item.is_primary,
        });
      }
    }

    const images = [
      ...existingImages.map((image) => ({
        id: image.id || null,
        image_url: image.image_url,
        public_id: image.public_id,
        alt_text:
          image.alt_text || form.name.trim(),
        is_primary: image.is_primary,
      })),
      ...uploaded,
    ];

    if (
      images.length &&
      !images.some(
        (image) => image.is_primary
      )
    ) {
      images[0].is_primary = true;
    }

    await apiFetch(
      `${API_BASE}/product-images/${productId}/sync`,
      {
        method: "PUT",
        body: JSON.stringify({
          images: images.map((image, index) => ({
            ...image,
            sort_order: index,
          })),
        }),
      }
    );
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Product name is required";
    }

    if (!form.category_id) {
      return "Please select a category";
    }

    if (!form.food_type) {
      return "Please select food type";
    }

    if (!form.variants.length) {
      return "Add at least one variant";
    }

    for (const variant of form.variants) {
      if (!variant.label.trim()) {
        return "Every variant needs a label";
      }

      if (
        variant.price === "" ||
        Number(variant.price) < 0
      ) {
        return "Every variant needs a valid price";
      }

      if (
        variant.stock_quantity === "" ||
        Number(variant.stock_quantity) < 0
      ) {
        return "Every variant needs valid stock";
      }
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        category_id: Number(form.category_id),
        short_description:
          form.short_description.trim(),
        description: form.description.trim(),
        ingredients: form.ingredients.trim(),
        food_type: form.food_type,
        main_image_url: null,
        is_featured: Boolean(form.is_featured),
        is_active: Boolean(form.is_active),

        variants: form.variants.map((variant) => ({
          id: variant.id || null,
          label: variant.label.trim(),
          weight_grams:
            variant.weight_grams === ""
              ? null
              : Number(variant.weight_grams),
          price: Number(variant.price),
          original_price:
            variant.original_price === ""
              ? null
              : Number(variant.original_price),
          stock_quantity:
            Number(variant.stock_quantity) || 0,
          sku: variant.sku.trim() || null,
        })),
      };

      let productId;

      if (editingProduct) {
        const result = await apiFetch(
          `${API_BASE}/products/admin/${editingProduct.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        productId =
          result.product?.id ||
          editingProduct.id;
      } else {
        const result = await apiFetch(
          `${API_BASE}/products/admin`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        productId = result.product?.id;
      }

      if (!productId) {
        throw new Error(
          "Product was saved but its ID was not returned"
        );
      }

      await syncImages(productId);

      setSuccess(
        editingProduct
          ? "Product updated successfully."
          : "Product created successfully."
      );

      await loadProducts();

      setTimeout(() => {
        setModalOpen(false);
        setEditingProduct(null);
        resetImageState();
      }, 600);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to save product"
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(product) {
    const confirmed = window.confirm(
      product.is_active
        ? `Deactivate "${product.name}"?`
        : `Activate "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await apiFetch(
        `${API_BASE}/products/admin/${product.id}/status`,
        {
          method: "PATCH",
        }
      );

      setSuccess(
        product.is_active
          ? "Product deactivated."
          : "Product activated."
      );

      await loadProducts();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to change product status"
      );
    }
  }

  return (
    <main className="min-h-screen bg-brand-cream">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white transition hover:bg-brand-cream"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={17} />
            </Link>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-gold">
                Admin
              </p>

              <h1 className="text-xl font-black sm:text-2xl">
                Product Management
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-brand-green px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-green-dark"
          >
            <Plus size={17} />

            <span className="hidden sm:inline">
              Add Product
            </span>

            <span className="sm:hidden">
              Add
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <label className="relative block">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products..."
                className="w-full rounded-xl border border-black/10 bg-brand-cream/30 py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />
            </label>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-black/10 bg-brand-cream/30 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-green"
            >
              <option value="all">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-gold">
                Products
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {filteredProducts.length}
              </h2>
            </div>

            <p className="text-xs font-semibold text-black/40">
              {products.length} total
            </p>
          </div>

          {loading ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-semibold text-black/50">
                Loading products...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/10 text-brand-green">
                <Package size={25} />
              </div>

              <h3 className="mt-4 text-lg font-black">
                No products found
              </h3>

              <p className="mt-1 text-sm text-black/45">
                Add your first product from the admin panel.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <ProductImage product={product} />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-black sm:text-lg">
                            {product.name}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                              product.food_type ===
                              "non_veg"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {product.food_type ===
                            "non_veg"
                              ? "Non-Veg"
                              : "Veg"}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                              product.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-black/5 text-black/45"
                            }`}
                          >
                            {product.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-semibold text-black/45">
                          {product.category?.name ||
                            "No category"}
                        </p>

                        <p className="mt-2 line-clamp-1 text-sm text-black/50">
                          {product.short_description ||
                            "No short description"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {product.variants?.map(
                            (variant) => (
                              <span
                                key={variant.id}
                                className="rounded-full bg-brand-cream px-3 py-1 text-xs font-bold text-black/65"
                              >
                                {variant.label} ·{" "}
                                {money(
                                  variant.price
                                )}{" "}
                                · Stock{" "}
                                {
                                  variant.stock_quantity
                                }
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2 lg:flex-col">
                      <button
                        type="button"
                        onClick={() =>
                          openEdit(product)
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-xs font-extrabold transition hover:bg-brand-cream lg:flex-none"
                      >
                        <Edit3 size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleStatus(product)
                        }
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition lg:flex-none ${
                          product.is_active
                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                            : "bg-brand-green text-white hover:bg-brand-green-dark"
                        }`}
                      >
                        {product.is_active ? (
                          <ToggleRight size={15} />
                        ) : (
                          <ToggleLeft size={15} />
                        )}

                        {product.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 px-3 py-5 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-4xl rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[2rem] border-b border-black/5 bg-white px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-gold">
                  {editingProduct
                    ? "Edit Product"
                    : "New Product"}
                </p>

                <h2 className="mt-1 text-xl font-black sm:text-2xl">
                  {editingProduct
                    ? editingProduct.name
                    : "Add Product"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="grid h-10 w-10 place-items-center rounded-full border border-black/10 transition hover:bg-brand-cream disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-5 sm:p-7"
            >
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  {success}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Product Name"
                  value={form.name}
                  onChange={(value) =>
                    updateForm("name", value)
                  }
                  placeholder="Product name"
                  required
                />

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold text-black/60">
                    Category *
                  </span>

                  <select
                    value={form.category_id}
                    onChange={(event) =>
                      updateForm(
                        "category_id",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-green"
                    required
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold text-black/60">
                    Food Type *
                  </span>

                  <select
                    value={form.food_type}
                    onChange={(event) =>
                      updateForm(
                        "food_type",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-green"
                  >
                    <option value="veg">
                      Veg
                    </option>
                    <option value="non_veg">
                      Non-Veg
                    </option>
                    <option value="mixed">
                      Mixed
                    </option>
                  </select>
                </label>

                <div className="rounded-2xl border border-black/10 bg-brand-cream/30 p-4 md:col-span-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black">
                        Product Images
                      </p>

                      <p className="mt-1 text-xs font-semibold text-black/45">
                        Upload up to 12 images. Maximum
                        5MB per image. The primary image
                        is used as the product main image.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-green px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-brand-green-dark">
                      <ImageIcon size={15} />
                      Add Images

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelection}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {(
                    existingImages.length >
                      0 ||
                    newImageFiles.length > 0
                  ) ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {existingImages.map(
                        (image, index) => (
                          <div
                            key={`existing-${
                              image.id || index
                            }`}
                            className="overflow-hidden rounded-2xl border border-black/10 bg-white"
                          >
                            <div className="relative aspect-square">
                              <img
                                src={image.image_url}
                                alt={
                                  image.alt_text ||
                                  form.name
                                }
                                className="h-full w-full object-cover"
                              />

                              {image.is_primary && (
                                <span className="absolute left-2 top-2 rounded-full bg-brand-green px-2 py-1 text-[10px] font-black text-white">
                                  Primary
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  removeExistingImage(
                                    index
                                  )
                                }
                                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-600 shadow-sm"
                                aria-label="Remove image"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setExistingPrimary(
                                  index
                                )
                              }
                              className="w-full px-3 py-2 text-xs font-extrabold text-brand-green hover:bg-brand-cream"
                            >
                              {image.is_primary
                                ? "Primary image"
                                : "Set as primary"}
                            </button>
                          </div>
                        )
                      )}

                      {newImageFiles.map(
                        (image, index) => (
                          <div
                            key={`new-${image.preview}`}
                            className="overflow-hidden rounded-2xl border border-brand-green/30 bg-white"
                          >
                            <div className="relative aspect-square">
                              <img
                                src={image.preview}
                                alt={
                                  form.name ||
                                  "New product"
                                }
                                className="h-full w-full object-cover"
                              />

                              {image.is_primary && (
                                <span className="absolute left-2 top-2 rounded-full bg-brand-green px-2 py-1 text-[10px] font-black text-white">
                                  Primary
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  removeNewImage(
                                    index
                                  )
                                }
                                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-600 shadow-sm"
                                aria-label="Remove image"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setNewPrimary(index)
                              }
                              className="w-full px-3 py-2 text-xs font-extrabold text-brand-green hover:bg-brand-cream"
                            >
                              {image.is_primary
                                ? "Primary image"
                                : "Set as primary"}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-white px-4 py-8 text-center">
                      <ImageIcon
                        className="mx-auto text-black/25"
                        size={28}
                      />

                      <p className="mt-2 text-sm font-bold text-black/45">
                        No product images selected
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Field
                label="Short Description"
                value={form.short_description}
                onChange={(value) =>
                  updateForm(
                    "short_description",
                    value
                  )
                }
                placeholder="Short product description"
              />

              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold text-black/60">
                  Description
                </span>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Describe the product..."
                  className="w-full resize-y rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-green"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold text-black/60">
                  Ingredients
                </span>

                <textarea
                  value={form.ingredients}
                  onChange={(event) =>
                    updateForm(
                      "ingredients",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Enter ingredients"
                  className="w-full resize-y rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-green"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 p-4">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(event) =>
                      updateForm(
                        "is_featured",
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 accent-brand-green"
                  />

                  <span className="text-sm font-bold">
                    Featured product
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 p-4">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateForm(
                        "is_active",
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 accent-brand-green"
                  />

                  <span className="text-sm font-bold">
                    Active product
                  </span>
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-gold">
                      Pricing & Stock
                    </p>

                    <h3 className="mt-1 text-lg font-black">
                      Variants
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-3.5 py-2 text-xs font-extrabold text-brand-green"
                  >
                    <Plus size={14} />
                    Add Variant
                  </button>
                </div>

                <div className="space-y-3">
                  {form.variants.map(
                    (variant, index) => (
                      <VariantRow
                        key={
                          variant.id ||
                          `new-${index}`
                        }
                        variant={variant}
                        index={index}
                        canRemove={
                          form.variants.length > 1
                        }
                        onRemove={() =>
                          removeVariant(index)
                        }
                        onChange={(
                          field,
                          value
                        ) =>
                          updateVariant(
                            index,
                            field,
                            value
                          )
                        }
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-black/5 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-black/10 px-5 py-3 text-sm font-extrabold transition hover:bg-brand-cream disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-green px-6 py-3 text-sm font-extrabold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Save Changes"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}