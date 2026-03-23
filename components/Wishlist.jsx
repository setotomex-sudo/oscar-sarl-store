"use client";

/**
 * Oscar Sarl — Wishlist + WhatsApp Cart
 * ──────────────────────────────────────
 * Usage:
 * 1. Copy this file to components/Wishlist.jsx
 * 2. Import in page.js:
 *    import { WishlistProvider, useWishlist, WishlistCart } from "@/components/Wishlist";
 * 3. Wrap your page with <WishlistProvider>
 * 4. Add <WishlistCart /> anywhere in the page
 * 5. Use the useWishlist() hook on product cards
 */

import { createContext, useContext, useState, useEffect } from "react";

const WHATSAPP = "213698506549";
const WishlistContext = createContext(null);

// ── Provider ──
export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("oscar_wishlist");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("oscar_wishlist", JSON.stringify(items));
  }, [items, loaded]);

  const toggle = (product) => {
    setItems((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  };

  const remove = (id) => setItems((prev) => prev.filter((p) => p.id !== id));
  const clear = () => setItems([]);
  const isInWishlist = (id) => items.some((p) => p.id === id);

  return (
    <WishlistContext.Provider value={{ items, toggle, remove, clear, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

// ── Hook ──
export function useWishlist() {
  return useContext(WishlistContext);
}

// ── Heart Button (add to product cards) ──
export function WishlistButton({ product }) {
  const { toggle, isInWishlist } = useWishlist();
  const active = isInWishlist(product.id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
      }}
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        background: active ? "#C17A3A" : "rgba(0,0,0,0.5)",
        border: active ? "none" : "1px solid rgba(255,255,255,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        backdropFilter: "blur(4px)",
        zIndex: 10,
      }}
      aria-label={active ? "Retirer de la liste" : "Ajouter à la liste"}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "white" : "none"} stroke="white" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}

// ── Floating Cart ──
export function WishlistCart() {
  const { items, remove, clear } = useWishlist();
  const [open, setOpen] = useState(false);
  const [bounce, setBounce] = useState(false);
  const count = items.length;

  // Bounce animation when item added
  useEffect(() => {
    if (count > 0) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 400);
      return () => clearTimeout(t);
    }
  }, [count]);

  const sendToWhatsApp = () => {
    if (!items.length) return;
    const lines = items.map((p, i) => {
      const price = p.price ? `${Number(p.price).toLocaleString()} DZD` : "Prix sur demande";
      return `${i + 1}. ${p.name} — ${price}`;
    });
    const message = `Bonjour Oscar Sarl ! 👋\n\nJe voudrais commander :\n\n${lines.join("\n")}\n\nMerci !`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <>
      <style>{`
        @keyframes cartBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Floating button */}
      <div style={{ position: "fixed", bottom: "90px", right: "24px", zIndex: 9998 }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: count > 0 ? "#C17A3A" : "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: count > 0 ? "0 4px 20px rgba(193,122,58,0.4)" : "0 4px 20px rgba(0,0,0,0.4)",
            transition: "all 0.3s ease",
            animation: bounce ? "cartBounce 0.4s ease" : "none",
            position: "relative",
          }}
          aria-label="Ma liste"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {count > 0 && (
            <span style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#25D366",
              color: "#fff",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              fontSize: "10px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #000",
            }}>
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Cart panel */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: "155px",
          right: "24px",
          width: "320px",
          maxWidth: "calc(100vw - 48px)",
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          zIndex: 9997,
          overflow: "hidden",
          animation: "slideUp 0.25s ease",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#C17A3A" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>
                Ma liste ({count})
              </span>
            </div>
            {count > 0 && (
              <button onClick={clear} style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                fontSize: "11px", cursor: "pointer", padding: "4px 8px",
                borderRadius: "8px", transition: "color 0.15s",
              }}>
                Vider
              </button>
            )}
          </div>

          {/* Items */}
          <div style={{ maxHeight: "260px", overflowY: "auto", padding: "8px 0" }}>
            {count === 0 ? (
              <div style={{
                padding: "32px 20px",
                textAlign: "center",
                color: "rgba(255,255,255,0.4)",
                fontSize: "13px",
              }}>
                Votre liste est vide.<br/>
                <span style={{ fontSize: "11px", marginTop: "4px", display: "block" }}>
                  Cliquez sur ❤️ pour ajouter des produits
                </span>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{
                      width: "40px", height: "40px", borderRadius: "8px",
                      objectFit: "cover", flexShrink: 0,
                    }} />
                  ) : (
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "8px",
                      background: "#222", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px",
                    }}>🛍️</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: "#fff", fontSize: "12px", fontWeight: "500",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {item.name}
                    </div>
                    <div style={{ color: "#C17A3A", fontSize: "11px", marginTop: "2px" }}>
                      {item.price ? `${Number(item.price).toLocaleString()} DZD` : "Prix sur demande"}
                    </div>
                  </div>
                  <button onClick={() => remove(item.id)} style={{
                    background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                    cursor: "pointer", fontSize: "16px", padding: "4px",
                    flexShrink: 0, transition: "color 0.15s",
                  }}>×</button>
                </div>
              ))
            )}
          </div>

          {/* WhatsApp button */}
          {count > 0 && (
            <div style={{ padding: "12px 16px" }}>
              <button
                onClick={sendToWhatsApp}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "#25D366",
                  border: "none",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "opacity 0.15s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.032-1.388l-.36-.214-3.762.896.952-3.671-.235-.375A9.793 9.793 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
                Commander tout sur WhatsApp
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
