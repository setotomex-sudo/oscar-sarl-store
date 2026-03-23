"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const ADMIN_PASSWORD = "admin123";

const initialFormState = {
  id: null,
  name: "",
  price: "",
  description: "",
  category: "",
  imageFile: null,
  imagePreview: "",
};

const CATEGORIES = ["Jouets", "Scolaire", "Bureautique", "Beaux Arts", "Livres", "Sac à dos"];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [products, setProducts] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [form, setForm] = useState(initialFormState);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("my-store-admin-auth");
    if (stored === "true") setIsAuthenticated(true);
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
      if (typeof window !== "undefined") window.localStorage.setItem("my-store-admin-auth", "true");
      setPasswordInput("");
    } else {
      setPasswordError("Mot de passe incorrect.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") window.localStorage.removeItem("my-store-admin-auth");
  };

  const resetForm = () => { setForm(initialFormState); setFormError(""); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) { setForm((prev) => ({ ...prev, imageFile: null, imagePreview: "" })); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, imageFile: file, imagePreview: reader.result || "" }));
    reader.readAsDataURL(file);
  };

  const isEditing = useMemo(() => !!form.id, [form.id]);

  const handleEditClick = (product) => {
    setForm({
      id: product.id,
      name: product.name || "",
      price: product.price?.toString() || "",
      description: product.description || "",
      category: product.category || "",
      imageFile: null,
      imagePreview: product.image_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce produit ?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSuccessMessage("Produit supprimé.");
    }
    setDeletingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    if (!form.name.trim()) { setFormError("Veuillez entrer un nom de produit."); return; }
    let priceValue = null;
    if (form.price.trim()) {
      const parsed = Number(form.price);
      if (Number.isNaN(parsed) || parsed < 0) { setFormError("Prix invalide."); return; }
      priceValue = parsed;
    }
    setSaving(true);
    let imageUrl = form.imagePreview || "";
    if (form.imageFile) {
      const fileExt = form.imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, form.imageFile);
      if (uploadError) { setFormError("Échec du téléchargement de l'image."); setSaving(false); return; }
      const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
      imageUrl = publicUrlData?.publicUrl || "";
    }
    const payload = {
      name: form.name.trim(),
      price: priceValue,
      description: form.description.trim(),
      category: form.category || null,
      image_url: imageUrl,
    };
    if (isEditing) {
      const { data, error } = await supabase.from("products").update(payload).eq("id", form.id).select().single();
      if (error) { setFormError("Échec de la mise à jour."); }
      else { setProducts((prev) => prev.map((p) => (p.id === form.id ? { ...p, ...data } : p))); setSuccessMessage("Produit mis à jour !"); resetForm(); }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
      if (error) { setFormError("Échec de la création."); }
      else { setProducts((prev) => [data, ...prev]); setSuccessMessage("Produit ajouté !"); resetForm(); }
    }
    setSaving(false);
  };

  // Stats
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  // Filtered
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const inputClass = "block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#C17A3A] focus:outline-none focus:ring-1 focus:ring-[#C17A3A]";

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#111] border border-white/10 shadow-xl px-6 py-8">
          <div className="text-center mb-6">
            <div className="text-3xl font-black text-white tracking-tight mb-1">OSCAR</div>
            <div className="text-xs text-white/40 uppercase tracking-widest">Admin Panel</div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-white/60 mb-1.5">Mot de passe</label>
              <input id="password" type="password" className={inputClass} value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" required />
            </div>
            {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
            <button type="submit" className="w-full rounded-xl bg-[#C17A3A] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#D4924E] transition-colors">
              Connexion
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-lg font-black tracking-tight">OSCAR</div>
            <div className="text-xs text-white/40 uppercase tracking-widest hidden md:block">Admin Dashboard</div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-white/50 hover:text-white transition-colors">← Voir la boutique</a>
            <button onClick={handleLogout} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white hover:border-white/30 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Produits</p>
            <p className="text-3xl font-black text-[#C17A3A]">{totalProducts}</p>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Catégories</p>
            <p className="text-3xl font-black text-white">{categories.length || CATEGORIES.length}</p>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Valeur totale</p>
            <p className="text-2xl font-black text-emerald-400">{totalValue.toLocaleString()} DZD</p>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Statut</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm font-semibold text-emerald-400">En ligne</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <section className="bg-[#111] border border-white/5 rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold">{isEditing ? "✏️ Modifier le produit" : "➕ Ajouter un produit"}</h2>
              <p className="text-xs text-white/40 mt-0.5">Remplissez les détails et uploadez une photo.</p>
            </div>
            {isEditing && (
              <button onClick={resetForm} className="text-xs text-white/40 hover:text-white underline">Annuler</button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Nom du produit *</label>
                  <input name="name" type="text" className={inputClass} value={form.name} onChange={handleInputChange} placeholder="Ex: Stylo bille bleu" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Prix (DZD)</label>
                  <input name="price" type="number" min="0" step="1" className={inputClass} value={form.price} onChange={handleInputChange} placeholder="Ex: 250" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Catégorie</label>
                  <select name="category" className={inputClass} value={form.category} onChange={handleInputChange}>
                    <option value="">Choisir une catégorie</option>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Description</label>
                  <textarea name="description" rows={4} className={inputClass} value={form.description} onChange={handleInputChange} placeholder="Description courte du produit..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Image produit</label>
                  <input type="file" accept="image/*" onChange={handleFileChange}
                    className="block w-full text-xs text-white/50 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/5 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white/70 hover:file:bg-white/10 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Image preview */}
            {form.imagePreview && (
              <div className="relative aspect-[4/3] w-full max-w-xs rounded-xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imagePreview} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}

            {formError && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{formError}</div>}
            {successMessage && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">✅ {successMessage}</div>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={resetForm} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:border-white/30 transition-colors" disabled={saving}>
                Effacer
              </button>
              <button type="submit" className="rounded-xl bg-[#C17A3A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#D4924E] transition-colors disabled:opacity-60" disabled={saving}>
                {saving ? (isEditing ? "Enregistrement..." : "Création...") : (isEditing ? "Enregistrer" : "Ajouter le produit")}
              </button>
            </div>
          </form>
        </section>

        {/* Products list */}
        <section className="bg-[#111] border border-white/5 rounded-2xl p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
            <h2 className="text-base font-semibold">📦 Produits ({filteredProducts.length})</h2>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="🔍 Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#C17A3A] w-40"
              />
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#C17A3A]"
              >
                <option value="all">Toutes catégories</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {listLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 border-4 border-[#C17A3A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/40">
              Aucun produit trouvé.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleEditClick(product)}
                  className="group flex flex-col rounded-xl border border-white/5 bg-black/40 hover:border-[#C17A3A]/40 hover:bg-white/5 cursor-pointer transition-all"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleEditClick(product); } }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-white/5">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl opacity-30">🛍️</div>
                    )}
                    {product.category && (
                      <span className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white/80">
                        {product.category}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-semibold text-white line-clamp-2">{product.name}</h3>
                      <span className="rounded-full bg-[#C17A3A]/20 px-2 py-0.5 text-[11px] font-medium text-[#C17A3A] whitespace-nowrap">
                        {product.price != null ? `${Number(product.price).toLocaleString()} DZD` : "N/A"}
                      </span>
                    </div>
                    {product.description && <p className="text-[11px] text-white/40 line-clamp-2">{product.description}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-white/30">Cliquer pour modifier</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                        className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition-colors"
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? "..." : "Supprimer"}
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
