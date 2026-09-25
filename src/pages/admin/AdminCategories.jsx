import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

/*
=========================================================
COMPRESS CATEGORY IMAGE IN THE BROWSER
=========================================================
*/

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const image = new Image();

      image.onload = () => {
        const MAX_SIZE = 1400;

        let width = image.width;
        let height = image.height;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round(
              (height / width) * MAX_SIZE
            );
            width = MAX_SIZE;
          } else {
            width = Math.round(
              (width / height) * MAX_SIZE
            );
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(
            new Error("Unable to process the image.")
          );
          return;
        }

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  "Unable to compress the image."
                )
              );
              return;
            }

            const compressedFile = new File(
              [blob],
              `${file.name
                .replace(/\.[^/.]+$/, "")
                .replace(/\s+/g, "-")}.webp`,
              {
                type: "image/webp",
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
          },
          "image/webp",
          0.82
        );
      };

      image.onerror = () => {
        reject(
          new Error("Unable to read the selected image.")
        );
      };

      image.src = event.target.result;
    };

    reader.onerror = () => {
      reject(
        new Error("Unable to read the selected file.")
      );
    };

    reader.readAsDataURL(file);
  });
}

/*
=========================================================
COMPONENT
=========================================================
*/

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [processingId, setProcessingId] =
    useState(null);

  const [processingText, setProcessingText] =
    useState("");

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  /*
  ========================================================
  LOAD CATEGORIES
  ========================================================
  */

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_BASE}/api/categories/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load categories."
        );
      }

      setCategories(
        Array.isArray(data.categories)
          ? data.categories
          : []
      );
    } catch (err) {
      console.error(
        "Load categories error:",
        err
      );

      setError(
        err.message ||
          "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  /*
  ========================================================
  GET CLOUDINARY SIGNATURE
  ========================================================
  */

  async function getUploadSignature() {
    const token = getToken();

    const response = await fetch(
      `${API_BASE}/api/categories/upload-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to prepare image upload."
      );
    }

    return data;
  }

  /*
  ========================================================
  UPLOAD TO CLOUDINARY
  ========================================================
  */

  async function uploadToCloudinary(
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

    if (!response.ok || !data.secure_url) {
      throw new Error(
        data.error?.message ||
          "Cloudinary upload failed."
      );
    }

    return data.secure_url;
  }

  /*
  ========================================================
  SAVE IMAGE URL TO DATABASE
  ========================================================
  */

  async function saveCategoryImage(
    categoryId,
    imageUrl
  ) {
    const token = getToken();

    const response = await fetch(
      `${API_BASE}/api/categories/admin/${categoryId}/image`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to save category image."
      );
    }

    return data.category;
  }

  /*
  ========================================================
  HANDLE IMAGE
  ========================================================
  */

  async function handleImageUpload(
    category,
    event
  ) {
    const originalFile =
      event.target.files?.[0];

    event.target.value = "";

    if (!originalFile) return;

    if (
      !originalFile.type.startsWith("image/")
    ) {
      setError(
        "Please select a JPG, PNG, WEBP or other image file."
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      setProcessingId(category.id);

      /*
      ------------------------------------------------------
      STEP 1 — COMPRESS
      ------------------------------------------------------
      */

      setProcessingText("Optimizing image...");

      const compressedFile =
        await compressImage(originalFile);

      /*
      ------------------------------------------------------
      STEP 2 — GET CLOUDINARY SIGNATURE
      ------------------------------------------------------
      */

      setProcessingText("Preparing upload...");

      const signatureData =
        await getUploadSignature();

      /*
      ------------------------------------------------------
      STEP 3 — UPLOAD
      ------------------------------------------------------
      */

      setProcessingText("Uploading image...");

      const imageUrl =
        await uploadToCloudinary(
          compressedFile,
          signatureData
        );

      /*
      ------------------------------------------------------
      STEP 4 — SAVE URL
      ------------------------------------------------------
      */

      setProcessingText("Saving...");

      const updatedCategory =
        await saveCategoryImage(
          category.id,
          imageUrl
        );

      /*
      ------------------------------------------------------
      UPDATE UI
      ------------------------------------------------------
      */

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? updatedCategory
            : item
        )
      );

      setMessage(
        `${category.name} image updated successfully.`
      );
    } catch (err) {
      console.error(
        "Category image upload error:",
        err
      );

      setError(
        err.message ||
          "Failed to upload category image."
      );
    } finally {
      setProcessingId(null);
      setProcessingText("");
    }
  }

  /*
  ========================================================
  UI
  ========================================================
  */

  return (
    <main className="min-h-screen bg-brand-cream">

      {/* HEADER */}

      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">

          <div>
            <Link
              to="/admin"
              className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-brand-green"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <h1 className="text-2xl font-black sm:text-3xl">
              Category Images
            </h1>

            <p className="mt-1 text-sm text-black/50">
              Manage images displayed across your
              store categories.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCategories}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-bold transition hover:bg-black/[0.03] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>

        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
            {message}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">

            <div className="flex items-center gap-3 text-brand-green">

              <Loader2
                size={24}
                className="animate-spin"
              />

              <span className="font-bold">
                Loading categories...
              </span>

            </div>

          </div>
        ) : categories.length === 0 ? (

          /* EMPTY */

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">

            <ImagePlus
              size={42}
              className="mx-auto text-black/20"
            />

            <h2 className="mt-4 text-xl font-black">
              No categories found
            </h2>

          </div>

        ) : (

          /* CATEGORY GRID */

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {categories.map((category) => {

              const isProcessing =
                processingId === category.id;

              return (
                <article
                  key={category.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5"
                >

                  {/* IMAGE */}

                  <div className="relative aspect-[4/3] overflow-hidden bg-[#eee4cf]">

                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-black/30">

                        <ImagePlus size={40} />

                        <p className="mt-2 text-sm font-bold">
                          No image
                        </p>

                      </div>
                    )}

                    {/* PROCESSING OVERLAY */}

                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45">

                        <div className="rounded-2xl bg-white px-6 py-4 text-center shadow-xl">

                          <Loader2
                            size={24}
                            className="mx-auto animate-spin text-brand-green"
                          />

                          <p className="mt-2 text-sm font-black text-brand-green">
                            {processingText}
                          </p>

                        </div>

                      </div>
                    )}

                  </div>

                  {/* DETAILS */}

                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-gold">
                          Category
                        </p>

                        <h2 className="mt-1 text-xl font-black">
                          {category.name}
                        </h2>

                        <p className="mt-1 text-xs text-black/40">
                          /shop/{category.slug}
                        </p>

                      </div>

                      {category.food_type && (
                        <span className="rounded-full bg-brand-green/10 px-3 py-1 text-[11px] font-extrabold uppercase text-brand-green">
                          {category.food_type}
                        </span>
                      )}

                    </div>

                    {/* UPLOAD BUTTON */}

                    <label
                      className={`mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-green px-4 py-3 text-sm font-extrabold text-white transition hover:bg-brand-green/90 ${
                        isProcessing
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    >

                      {isProcessing ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Upload size={17} />
                      )}

                      {isProcessing
                        ? processingText
                        : category.image_url
                        ? "Change Image"
                        : "Upload Image"}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={isProcessing}
                        onChange={(event) =>
                          handleImageUpload(
                            category,
                            event
                          )
                        }
                      />

                    </label>

                    {/* IMAGE SIZE NOTE */}

                    <p className="mt-3 text-center text-[11px] text-black/35">
                      Images are automatically optimized
                      before upload.
                    </p>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}