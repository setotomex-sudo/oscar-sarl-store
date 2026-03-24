"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { WishlistProvider, WishlistButton, WishlistCart } from "@/components/Wishlist";

const WHATSAPP_BASE_URL = "https://wa.me/213698506549";
const HERO_IMAGES = {
  hero1: "Capture d'écran 2026-03-16 032529.png",
  hero2: "Capture d'écran 2026-03-16 032915.png",
  hero3: "ChatGPT Image 16 mars 2026, 03_17_30.png",
};
const publicImageUrl = (filename) => `/images/${encodeURIComponent(filename)}`;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const [visibleProductIds, setVisibleProductIds] = useState({});
  const [heroImageError, setHeroImageError] = useState({
    hero1: false,
    hero2: false,
    hero3: false,
  });
  const [heroTitleStyle, setHeroTitleStyle] = useState({
    position: "absolute",
    top: "0px",
    left: "0px",
    transformOrigin: "top left",
    transform: "translate(0px, 0px) scale(1)",
  });

  const scrollYRef = useRef(0);
  const viewportRef = useRef({ w: 1, h: 1 });
  const animRef = useRef({
    topPx: 0,
    leftPx: 0,
    translateXPx: 0,
    translateYPx: 0,
    scale: 1,
  });

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchError) {
        console.error(fetchError);
        setError("Failed to load products. Please try again later.");
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || 0;
      scrollYRef.current = y;
      setScrollY(y);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      viewportRef.current = {
        w: window.innerWidth || 1,
        h: window.innerHeight || 1,
      };
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    let rafId = 0;
    const lerp = (current, target, alpha) =>
      current + (target - current) * alpha;
    let smoothProgress = 0;
    const tick = () => {
      const y = scrollYRef.current || 0;
      const targetProgress = Math.max(0, Math.min(1, (y - 150) / 450));
      smoothProgress += (targetProgress - smoothProgress) * 0.12;
      const eased = 1 - Math.pow(1 - smoothProgress, 3);
      const navH = 56;
      const startLeftPx = 0;
      const startTopPx = navH;
      const endLeftPx = 20;
      const endTopPx = 15;
      const targetLeftPx = startLeftPx + (endLeftPx - startLeftPx) * eased;
      const targetTopPx = startTopPx + (endTopPx - startTopPx) * eased;
      const targetTranslateXPx = 0;
      const targetTranslateYPx = 0;
      const targetScale = 1 + (0.07 - 1) * eased;
      animRef.current.leftPx = lerp(animRef.current.leftPx, targetLeftPx, 0.08);
      animRef.current.topPx = lerp(animRef.current.topPx, targetTopPx, 0.08);
      animRef.current.translateXPx = lerp(animRef.current.translateXPx, targetTranslateXPx, 0.08);
      animRef.current.translateYPx = lerp(animRef.current.translateYPx, targetTranslateYPx, 0.08);
      animRef.current.scale = lerp(animRef.current.scale, targetScale, 0.08);
      setHeroTitleStyle({
        position: "fixed",
        left: `${animRef.current.leftPx}px`,
        top: `${animRef.current.topPx}px`,
        zIndex: 45,
        transformOrigin: "top left",
        transform: `translate(${animRef.current.translateXPx}px, ${animRef.current.translateYPx}px) scale(${animRef.current.scale})`,
      });
      rafId = window.requestAnimationFrame(tick);
    };
    animRef.current.leftPx = 0;
    animRef.current.topPx = 56;
    animRef.current.translateXPx = 0;
    animRef.current.translateYPx = 0;
    animRef.current.scale = 1;
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (!products.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-id");
            if (id) {
              setVisibleProductIds((prev) => ({ ...prev, [id]: true }));
            }
          }
        });
      },
      { threshold: 0.2 }
    );
    const cards = document.querySelectorAll("[data-product-card='true']");
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [products]);

  const getWhatsAppLink = (productName) => {
    const encodedText = encodeURIComponent(`I want to order: ${productName}`);
    return `${WHATSAPP_BASE_URL}?text=${encodedText}`;
  };

  return (
    <WishlistProvider>
      <div className="min-h-screen bg-black text-white">
        {/* Navbar */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-black/30 backdrop-blur-sm">
          <div className="h-14 border-b border-white/10">
            <nav className="h-full max-w-6xl mx-auto px-4 flex items-center">
              <div className="w-full flex items-center justify-end gap-8 text-xs uppercase tracking-[0.25em] text-white">
                <a href="#top" className="hover:opacity-80">Accueil</a>
                <a href="#products" className="hover:opacity-80">Produits</a>
                <a href="#categories" className="hover:opacity-80">Catégories</a>
                <a href="/admin" className="hover:opacity-80">Admin</a>
              </div>
            </nav>
          </div>
        </header>

        <main id="top" className="relative z-10">
          {/* Hero */}
          <section className="relative h-screen bg-black" style={{backgroundImage: "url('/images/hero-bg.png')", backgroundSize: "cover", backgroundPosition: "center"}}>
            <div className="fixed top-0 left-0 w-screen h-[50vh] overflow-hidden z-30 pointer-events-none px-[2vw]">
              <h1
                className="font-black text-[23vw] leading-none text-white whitespace-nowrap w-[100vw]"
                style={{ ...heroTitleStyle, fontWeight: 900, letterSpacing: "-5px" }}
              >
                OSCAR
              </h1>
            </div>
            <div className="absolute left-0 right-0 bottom-0 h-[55vh] px-1">
              <div className="h-full flex gap-[4px]">
                {heroImageError.hero1 ? (
                  <div className="w-[33.33vw] h-full bg-[#E61A1A] flex items-center justify-center text-white font-semibold uppercase tracking-[0.25em]">Jouets</div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={publicImageUrl(HERO_IMAGES.hero1)} alt="Garçon avec sac à dos" className="w-[33.33vw] h-full object-cover"
                    onError={(e) => { e.currentTarget.style.background = "#1a1a1a"; setHeroImageError((prev) => ({ ...prev, hero1: true })); }} />
                )}
                {heroImageError.hero2 ? (
                  <div className="w-[33.33vw] h-full bg-[#1A1AE6] flex items-center justify-center text-white font-semibold uppercase tracking-[0.25em]">Scolaire</div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={publicImageUrl(HERO_IMAGES.hero2)} alt="Fille qui peint" className="w-[33.33vw] h-full object-cover"
                    onError={(e) => { e.currentTarget.style.background = "#1a1a1a"; setHeroImageError((prev) => ({ ...prev, hero2: true })); }} />
                )}
                {heroImageError.hero3 ? (
                  <div className="w-[33.33vw] h-full bg-[#F5A623] flex items-center justify-center text-white font-semibold uppercase tracking-[0.25em]">Bureautique</div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={publicImageUrl(HERO_IMAGES.hero3)} alt="Enfants avec jouets" className="w-[33.33vw] h-full object-cover"
                    onError={(e) => { e.currentTarget.style.background = "#1a1a1a"; setHeroImageError((prev) => ({ ...prev, hero3: true })); }} />
                )}
              </div>
            </div>
          </section>

          {/* Ticker */}
          <section className="bg-black text-white border-y border-white/10">
            <div className="overflow-hidden">
              <div className="whitespace-nowrap py-3 text-sm font-medium tracking-[0.25em] uppercase flex">
                <div className="animate-[ticker_25s_linear_infinite] flex">
                  <span className="mx-6">Jouets ★ Scolaire ★ Bureautique ★ Beaux Arts ★ Livres ★ Sac à dos ★</span>
                  <span className="mx-6">Jouets ★ Scolaire ★ Bureautique ★ Beaux Arts ★ Livres ★ Sac à dos ★</span>
                </div>
              </div>
            </div>
          </section>

          {/* Products */}
          <section id="products" className="px-6 md:px-8 lg:px-12 py-20 space-y-10 bg-gradient-to-b from-[#0a0a0a]/80 via-black/90 to-[#050505]">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Nos Produits</h2>
              <p className="text-sm text-white/70 max-w-xl">
                Une sélection cinématographique de jouets, fournitures scolaires, beaux-arts et plus encore — prête à être commandée par WhatsApp.
              </p>
              {/* Search bar */}
              <input
                type="text"
                placeholder="🔍 Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-md mt-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/40 outline-none focus:border-white/30"
              />
            </div>

            <div className="max-w-6xl mx-auto">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="max-w-md bg-red-900/40 border border-red-500/40 text-red-100 text-sm rounded-2xl px-4 py-3">{error}</div>
              ) : filteredProducts.length === 0 ? (
                <div className="max-w-md bg-white/5 border border-white/10 rounded-2xl px-6 py-10 text-center text-sm text-white/70">
                  {search ? `Aucun produit trouvé pour "${search}"` : "Aucun produit pour le moment."}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product, index) => {
                    const isVisible = visibleProductIds[product.id];
                    const delay = 0.1 * index;
                    return (
                      <article
                        key={product.id}
                        data-product-card="true"
                        data-id={product.id}
                        style={{
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? "translateY(0)" : "translateY(60px)",
                          transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
                        }}
                        className="bg-[#101010]/90 border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-[0_18px_45px_rgba(0,0,0,0.65)] backdrop-blur-md"
                      >
                        <div className="relative aspect-[4/3] bg-black/60 overflow-hidden">
                          <WishlistButton product={product} />
                          {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-white/40">Aucune image</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        </div>
                        <div className="flex-1 flex flex-col p-4 space-y-3">
                          <div>
                            <h3 className="text-sm font-semibold tracking-tight">{product.name}</h3>
                            {product.description && (
                              <p className="mt-1 text-xs text-white/60 line-clamp-3">{product.description}</p>
                            )}
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <span className="text-base font-semibold text-[#F5A623]">
                              {product.price != null ? `${Number(product.price).toLocaleString()} DZD` : "Prix sur demande"}
                            </span>
                            <a
                              href={getWhatsAppLink(product.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-400"
                            >
                              Commander
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Categories */}
          <section id="categories" className="px-6 md:px-8 lg:px-12 py-20 bg-[#050505]">
            <div className="max-w-6xl mx-auto space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Nos Catégories</h2>
                <p className="text-sm text-white/70 max-w-xl">Un univers d&apos;écriture, de jeu et de création pour chaque âge.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-4 auto-rows-[minmax(160px,1fr)]">
                {[
                  { name: "Jouets", emoji: "🧸", count: "150+ articles", span: "md:col-span-2", color: "#F5A623" },
                  { name: "Bureautique", emoji: "🖊️", count: "80+ références", color: "#1A1AE6" },
                  { name: "Beaux Arts", emoji: "🎨", count: "60+ gammes", color: "#E61A1A" },
                  { name: "Scolaire", emoji: "📚", count: "200+ fournitures", span: "md:row-span-2", color: "#F5A623" },
                  { name: "Livres", emoji: "📖", count: "300+ titres", color: "#1A1AE6" },
                  { name: "Sac à dos", emoji: "🎒", count: "50+ modèles", span: "md:col-span-2", color: "#E61A1A" },
                ].map((cat) => (
                  <div
                    key={cat.name}
                    className={`relative overflow-hidden rounded-2xl bg-[#111] border border-white/5 p-4 flex flex-col justify-between group cursor-pointer transition-transform duration-300 hover:scale-[1.05] hover:shadow-[0_18px_45px_rgba(0,0,0,0.75)] ${cat.span || ""}`}
                    style={{ boxShadow: "0 0 0 0 rgba(0,0,0,0.3), 0 20px 40px rgba(0,0,0,0.7)" }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `radial-gradient(circle at top left, ${cat.color}33, transparent 60%)` }} />
                    <div className="relative z-10">
                      <div className="text-3xl mb-3">{cat.emoji}</div>
                      <div className="text-base font-semibold">{cat.name}</div>
                      <div className="text-xs text-white/60 mt-1">{cat.count}</div>
                    </div>
                    <div className="relative z-10 mt-4 h-[1px] w-16"
                      style={{ background: `linear-gradient(to right, ${cat.color}, transparent)` }} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* About */}
          <section id="about" className="px-6 md:px-8 lg:px-12 py-20 bg-gradient-to-b from-[#050505] to-black">
            <div className="max-w-6xl mx-auto space-y-10">
              <div className="space-y-3">
                <p className="text-sm tracking-[0.25em] uppercase text-[#F5A623]">الخبرة و التميز — Expérience et Excellence</p>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Oscar Sarl, votre partenaire scolaire &amp; bureautique à Tlemcen.</h2>
                <p className="text-sm text-white/70 max-w-xl">Adresse : N°36 Bataille Felaoucen, Tlemcen — un espace dédié aux fournitures scolaires, jouets éducatifs, arts plastiques et solutions bureautiques.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-[#101010] border border-white/10 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Années d&apos;expérience</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#F5A623]">15+</p>
                  <p className="mt-1 text-xs text-white/60">Une présence durable auprès des écoles, familles et entreprises.</p>
                </div>
                <div className="bg-[#101010] border border-white/10 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Références produits</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#1A1AE6]">800+</p>
                  <p className="mt-1 text-xs text-white/60">Jouets, livres, fournitures, bureautique et beaux-arts dans un même lieu.</p>
                </div>
                <div className="bg-[#101010] border border-white/10 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Clients satisfaits</p>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-400">5K+</p>
                  <p className="mt-1 text-xs text-white/60">Parents, élèves, artistes et entreprises qui nous font confiance.</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-[#050505] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
            <div className="font-semibold tracking-tight">OSCAR SARL</div>
            <div className="flex items-center gap-4">
              <a href="#top" className="hover:text-white">Accueil</a>
              <a href="#products" className="hover:text-white">Produits</a>
              <a href="#categories" className="hover:text-white">Catégories</a>
              <a href="#about" className="hover:text-white">Contact</a>
            </div>
            <div className="flex items-center gap-2">
              <span>Powered by</span>
              <span className="font-semibold text-emerald-400">WhatsApp</span>
            </div>
          </div>
        </footer>

        <WishlistCart />

        <style>{`
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          html { scroll-behavior: smooth; }
        `}</style>
      </div>
    </WishlistProvider>
  );
}
