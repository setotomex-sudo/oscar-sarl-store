"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const ADMIN_PASSWORD = "admin123";

const initialFormState = {
  id: null,
  name: "",
  price: "",
  description: "",
  imageFile: null,
  imagePreview: "",
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [form, setForm] = useState(initialFormState);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("my-store-admin-auth");
    if (stored === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProducts = async () => {
      setListLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setFormError("Failed to load products.");
      } else {
        setProducts(data || []);
      }
      setListLoading(false);
    };

    fetchProducts();
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    setPasswordError("");
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("my-store-admin-auth", "true");
      }
      setPasswordInput("");
    } else {
      setPasswordError("Incorrect password.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("my-store-admin-auth");
    }
  };

  const resetForm = () => {
    setForm(initialFormState);
    setFormError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm((prev) => ({ ...prev, imageFile: null, imagePreview: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result || "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const isEditing = useMemo(() => !!form.id, [form.id]);

  const handleEditClick = (product) => {
    setForm({
      id: product.id,
      name: product.name || "",
      price: product.price?.toString() || "",
      description: product.description || "",
      imageFile: null,
      imagePreview: product.image_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeletingId(id);
    setFormError("");
    setSuccessMessage("");

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error(error);
      setFormError("Failed to delete product.");
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSuccessMessage("Product deleted.");
    }

    setDeletingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!form.name.trim()) {
      setFormError("Please enter a product name.");
      return;
    }

    let priceValue = null;
    if (form.price.trim()) {
      const parsed = Number(form.price);
      if (Number.isNaN(parsed) || parsed < 0) {
        setFormError("Please enter a valid price (number).");
        return;
      }
      priceValue = parsed;
    }

    setSaving(true);

    let imageUrl = form.imagePreview || "";

    if (form.imageFile) {
      const fileExt = form.imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, form.imageFile);

      if (uploadError) {
        console.error(uploadError);
        setFormError("Failed to upload image.");
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData?.publicUrl || "";
    }

    const payload = {
      name: form.name.trim(),
      price: priceValue,
      description: form.description.trim(),
      image_url: imageUrl,
    };

    if (isEditing) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", form.id)
        .select()
        .single();

      if (error) {
        console.error(error);
        setFormError("Failed to update product.");
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === form.id ? { ...p, ...data } : p))
        );
        setSuccessMessage("Product updated successfully.");
        resetForm();
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error(error);
        setFormError("Failed to create product.");
      } else {
        setProducts((prev) => [data, ...prev]);
        setSuccessMessage("Product created successfully.");
        resetForm();
      }
    }

    setSaving(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-1 text-center">
            Admin Login
          </h1>
          <p className="text-xs text-slate-500 mb-5 text-center">
            Enter the admin password to manage products.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>
            {passwordError && (
              <p className="text-xs text-red-600">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              Add, edit, and remove products for your store.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 underline underline-offset-4"
            >
              View Store
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? "Edit product" : "Add new product"}
              </h2>
              <p className="text-xs text-slate-500">
                Fill in the details and upload a photo.
              </p>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-4"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="price"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Price (DZD)
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    value={form.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 2500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="description"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Short description of the product..."
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr,3fr] items-start">
              <div className="space-y-2">
                <label
                  htmlFor="image"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Product image
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-slate-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100"
                />
                <p className="text-[11px] text-slate-500">
                  JPG, PNG or WEBP. A square or 4:3 image works best.
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative aspect-[4/3] w-full max-w-xs rounded-xl border border-dashed border-slate-300 bg-slate-50 overflow-hidden">
                  {form.imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-slate-400 px-6 text-center">
                      <span className="h-8 w-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                        +
                      </span>
                      <span>No image selected yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                {formError}
              </div>
            )}
            {successMessage && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {successMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                disabled={saving}
              >
                Clear
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60"
                disabled={saving}
              >
                {saving
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                  ? "Save changes"
                  : "Add product"}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Existing products
            </h2>
            <p className="text-[11px] text-slate-500">
              Click a product to edit it.
            </p>
          </div>

          {listLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500">
              No products added yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleEditClick(product)}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50 text-left hover:border-emerald-200 hover:bg-white cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleEditClick(product);
                    }
                  }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-slate-100">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-semibold text-slate-900 line-clamp-2">
                        {product.name}
                      </h3>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        {product.price != null
                          ? `${Number(product.price).toLocaleString()} DZD`
                          : "N/A"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Click to edit
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id);
                        }}
                        className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

