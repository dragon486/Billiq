"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { 
  Plus, Minus, Trash2, Search, Filter, 
  ChevronLeft, ShoppingCart, Users, Grid3X3, 
  Send, CheckCircle2, Loader2, Utensils, Settings, X
} from "lucide-react";

export default function POS() {
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [shopName, setShopName] = useState("");
  
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.id) {
      setShopName(session.user.name);
      fetchInitialData();
    }
  }, [status, session, router]);

  const fetchInitialData = async () => {
    try {
      const [menuRes, tableRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/tables")
      ]);
      const menuData = await menuRes.json();
      const tableData = await tableRes.json();
      setMenuItems(menuData.items || []);
      setTables(tableData.tables || []);
    } catch (err) {
      console.error("Failed to load POS data", err);
    }
  };

  const addToCart = (item) => {
    if (!item.isAvailable) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const calculateTotal = () => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const handleGenerateBill = async () => {
    if (cart.length === 0) return alert("Cart is empty");
    if (!selectedTable && !customerPhone) return alert("Select a table or enter customer phone");

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          tableId: selectedTable?.id || null,
          paymentMethod,
          items: cart,
          shopName
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult({
          billId: data.bill.id,
          billLink: `/b/${data.bill.id}`,
          waLink: data.waLink,
          total: data.bill.total,
          notifications: data.notifications
        });
        setCart([]);
        setSelectedTable(null);
        setCustomerPhone("");
      } else {
        alert(data.error || "Failed to generate bill");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "General" });

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) return;
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newItem, price: parseFloat(newItem.price), isAvailable: true })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewItem({ name: "", price: "", category: "General" });
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ["All", ...new Set(menuItems.map(i => i.category))];

  const filteredMenu = menuItems.filter(i => {
    const matchesCat = activeCategory === "All" || i.category === activeCategory;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (status === "loading" || !shopName) return <div className="loading-screen">INITIALIZING TERMINAL...</div>;

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      {/* ── LEFT: MENU SELECTION ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--card-border)" }}>
        <header style={{ padding: "24px 32px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Logo size="sm" />
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{shopName} POS</h1>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", width: 300 }}>
              <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 16px 10px 48px", background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 100, color: "var(--text-primary)", outline: "none" }}
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{ padding: "10px 16px", borderRadius: 100, border: "1px solid var(--card-border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={14} /> Add Item
            </button>
            <button 
              onClick={() => router.push("/dashboard?tab=Menu")}
              style={{ padding: "10px 16px", borderRadius: 100, border: "1px solid var(--card-border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Settings size={14} /> Manage Menu
            </button>
          </div>
        </header>

        {/* Categories */}
        <div style={{ padding: "16px 32px", display: "flex", gap: 12, overflowX: "auto", background: "rgba(255,255,255,0.02)" }}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{ 
                padding: "8px 16px", borderRadius: 100, border: "1px solid var(--card-border)", cursor: "pointer",
                background: activeCategory === cat ? "var(--text-primary)" : "transparent",
                color: activeCategory === cat ? "#fff" : "var(--text-secondary)",
                fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          {filteredMenu.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
              {filteredMenu.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => addToCart(item)}
                  style={{ 
                    background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 16, padding: 20, 
                    cursor: item.isAvailable ? "pointer" : "not-allowed", opacity: item.isAvailable ? 1 : 0.5,
                    transition: "all 0.2s", display: "flex", flexDirection: "column", justifyContent: "space-between"
                  }}
                  onMouseOver={(e) => item.isAvailable && (e.currentTarget.style.borderColor = "var(--text-primary)")}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--card-border)"}
                >
                  <div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: 1 }}>{item.category}</span>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 4, color: "var(--text-primary)" }}>{item.name}</h3>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>₹{item.price}</span>
                    <div style={{ background: "var(--text-primary)", padding: 6, borderRadius: 8, color: "#fff" }}><Plus size={16} /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
              <div style={{ background: "var(--accent-light)", padding: 24, borderRadius: "50%", marginBottom: 20 }}>
                <Utensils size={48} color="var(--text-primary)" />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 12 }}>Your menu is empty</h2>
              <p style={{ color: "var(--text-secondary)", maxWidth: 300, marginBottom: 32 }}>Add your products right here to start taking orders.</p>
              <button 
                className="btn-primary" 
                onClick={() => setShowAddModal(true)}
                style={{ padding: "14px 32px", fontSize: "1rem" }}
              >
                Quick Add My First Product
              </button>
            </div>
          )}
        </div>

        {/* Quick Add Modal */}
        {showAddModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(10px)" }}>
            <div className="premium-card animate-fade-in" style={{ width: 400, background: "var(--bg-primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>Quick Add Product</h3>
                <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Product Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Butter Chicken" 
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    style={{ width: "100%", padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--text-primary)", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="250" 
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    style={{ width: "100%", padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--text-primary)", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Category</label>
                  <input 
                    type="text" 
                    placeholder="Main Course" 
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    style={{ width: "100%", padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--text-primary)", outline: "none" }}
                  />
                </div>
                <button 
                  className="btn-primary" 
                  onClick={handleAddItem}
                  style={{ width: "100%", padding: "16px", marginTop: "12px" }}
                >
                  Confirm & Add to Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: CART & CHECKOUT ── */}
      <aside style={{ width: 400, background: "var(--bg-secondary)", borderLeft: "1px solid var(--card-border)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 24, borderBottom: "1px solid var(--card-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <ShoppingCart size={20} color="var(--text-primary)" />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Order Cart</h2>
          </div>
          
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Select Table</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {tables.map(t => (
              <button 
                key={t.id}
                onClick={() => setSelectedTable(t)}
                style={{ 
                  padding: "8px", borderRadius: 8, border: "1px solid var(--card-border)", cursor: "pointer",
                  background: selectedTable?.id === t.id ? "var(--text-primary)" : "transparent",
                  color: selectedTable?.id === t.id ? "#fff" : "var(--text-primary)",
                  fontSize: "0.75rem", fontWeight: 800
                }}
              >
                {t.number}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {cart.map(item => (
            <div key={item.id} style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{item.name}</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>₹{item.price} each</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-primary)", borderRadius: 10, padding: "4px 8px" }}>
                <button onClick={() => updateQuantity(item.id, -1)} style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer" }}><Minus size={14} /></button>
                <span style={{ fontSize: "0.9rem", fontWeight: 800, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer" }}><Plus size={14} /></button>
              </div>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, minWidth: 60, textAlign: "right" }}>₹{item.price * item.quantity}</span>
              <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={16} /></button>
            </div>
          ))}
          {cart.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "var(--text-muted)" }}>
              <Utensils size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
              <p style={{ fontSize: "0.9rem" }}>Your cart is empty.<br/>Tap items on the left to add.</p>
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        <div style={{ padding: 24, background: "rgba(255,255,255,0.02)", borderTop: "1px solid var(--card-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>Total Amount</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 900 }}>₹{calculateTotal()}</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase" }}>Payment Method</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {["Cash", "UPI", "Card"].map(method => (
                <button 
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  style={{ 
                    padding: "12px", borderRadius: 12, border: "1px solid var(--card-border)", cursor: "pointer",
                    background: paymentMethod === method ? "var(--text-primary)" : "var(--bg-primary)",
                    color: paymentMethod === method ? "#fff" : "var(--text-primary)",
                    fontSize: "0.8rem", fontWeight: 800, transition: "all 0.2s"
                  }}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <input 
              type="tel" 
              placeholder="Customer Phone (for WhatsApp bill)" 
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ width: "100%", padding: "12px", background: "var(--bg-primary)", border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--text-primary)", outline: "none", fontSize: "0.9rem" }}
            />
          </div>

          <button 
            onClick={handleGenerateBill}
            disabled={isSubmitting || cart.length === 0}
            style={{ 
              width: "100%", padding: "16px", borderRadius: 16, border: "none", cursor: "pointer",
              background: "var(--text-primary)", color: "#fff", fontSize: "1rem", fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              opacity: isSubmitting || cart.length === 0 ? 0.5 : 1
            }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Place Kitchen Order</>}
          </button>
          
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
            <Link href="/dashboard" style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "none" }}>Exit POS</Link>
            <button onClick={() => setCart([])} style={{ fontSize: "0.8rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Clear Cart</button>
          </div>
        </div>
      </aside>

      {/* ── SUCCESS MODAL ── */}
      {result && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(10px)" }}>
          <div style={{ background: "var(--bg-primary)", padding: 40, borderRadius: 32, border: "1px solid var(--card-border)", textAlign: "center", maxWidth: 400 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <CheckCircle2 size={48} color="#4ade80" />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>Order Dispatched</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Kitchen order created & bill generated successfully.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link href={result.billLink} target="_blank" className="btn-primary" style={{ background: "#fff", color: "#000", padding: 14, borderRadius: 12, fontWeight: 800, textDecoration: "none" }}>View Digital Bill</Link>
              {result.waLink && <a href={result.waLink} target="_blank" className="btn-secondary" style={{ padding: 14, borderRadius: 12, border: "1px solid #25D366", color: "#25D366", textDecoration: "none", fontWeight: 800 }}>Send via WhatsApp</a>}
              <button onClick={() => setResult(null)} style={{ padding: 14, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontWeight: 600 }}>Back to POS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
