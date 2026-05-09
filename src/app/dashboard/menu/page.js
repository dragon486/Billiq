"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Check, X, Search, Filter, 
  ChevronRight, LayoutGrid, List as ListIcon, Loader2, AlertCircle
} from "lucide-react";

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "Mains",
    description: "",
    isAvailable: true,
    sortOrder: 0
  });

  const categories = ["All", "Starters", "Mains", "Drinks", "Desserts", "Custom"];

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingItem ? "PATCH" : "POST";
    const body = editingItem ? { id: editingItem.id, ...formData } : formData;

    try {
      const res = await fetch("/api/menu", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ name: "", price: "", category: "Mains", description: "", isAvailable: true, sortOrder: 0 });
        fetchMenu();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isAvailable: !item.isAvailable }),
      });
      if (res.ok) fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (isLoading && items.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column", gap: 16 }}>
        <Loader2 className="animate-spin" size={24} color="#666" />
        <p style={{ color: "#666", fontSize: "0.85rem", fontWeight: 600 }}>FETCHING CATALOGUE...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Menu Catalogue</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Manage your restaurant's digital product list</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setFormData({ name: "", price: "", category: "Mains", description: "", isAvailable: true, sortOrder: 0 }); setIsModalOpen(true); }}
          className="btn-primary" 
          style={{ background: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
        >
          <Plus size={18} /> Add New Item
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#666" }} />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: "100%", padding: "12px 12px 12px 48px", background: "var(--bg-secondary)", 
              border: "1px solid var(--card-border)", borderRadius: 12, color: "#fff", outline: "none"
            }} 
          />
        </div>
        <div style={{ display: "flex", background: "var(--bg-secondary)", padding: 4, borderRadius: 12, border: "1px solid var(--card-border)" }}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{ 
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                background: activeCategory === cat ? "var(--text-primary)" : "transparent",
                color: activeCategory === cat ? "#000" : "#888",
                fontSize: "0.85rem", fontWeight: 700, transition: "all 0.2s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "100px 0", background: "var(--bg-secondary)", borderRadius: 20, border: "1px dashed var(--card-border)" }}>
          <AlertCircle size={48} style={{ color: "#333", marginBottom: 16 }} />
          <h3 style={{ color: "var(--text-primary)", marginBottom: 8 }}>No items found</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Try adjusting your search or add a new item to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {Object.keys(groupedItems).map(cat => (
            <section key={cat}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-muted)" }}>{cat}</h3>
                <div style={{ flex: 1, height: 1, background: "var(--card-border)" }}></div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{groupedItems[cat].length} items</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {groupedItems[cat].map(item => (
                  <div key={item.id} className="saas-card" style={{ padding: 0, overflow: "hidden", border: `1px solid ${item.isAvailable ? "var(--card-border)" : "#ef4444"}` }}>
                    <div style={{ padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: item.isAvailable ? "var(--text-primary)" : "#ef4444" }}>{item.name}</h4>
                          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>{item.description || "No description"}</p>
                        </div>
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--text-primary)" }}>₹{item.price}</div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--card-border)" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button 
                            onClick={() => { setEditingItem(item); setFormData({ ...item }); setIsModalOpen(true); }}
                            style={{ padding: 8, borderRadius: 8, background: "#1a1a1a", border: "none", color: "#888", cursor: "pointer" }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            style={{ padding: 8, borderRadius: 8, background: "#1a1a1a", border: "none", color: "#ef4444", cursor: "pointer" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <button 
                          onClick={() => toggleAvailability(item)}
                          style={{ 
                            fontSize: "0.75rem", fontWeight: 700, padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                            background: item.isAvailable ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
                            color: item.isAvailable ? "#4ade80" : "#ef4444"
                          }}
                        >
                          {item.isAvailable ? "Available" : "Sold Out"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ 
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", 
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(5px)"
        }}>
          <div style={{ 
            background: "var(--bg-primary)", width: "100%", maxWidth: 450, borderRadius: 24, padding: 32, 
            border: "1px solid var(--card-border)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{editingItem ? "Edit Item" : "Add New Item"}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>PRODUCT NAME</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Butter Chicken" 
                  style={{ width: "100%", padding: 14, background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 12, color: "#fff", outline: "none" }} 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>PRICE (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="250" 
                    style={{ width: "100%", padding: 14, background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 12, color: "#fff", outline: "none" }} 
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>CATEGORY</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{ width: "100%", padding: 14, background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 12, color: "#fff", outline: "none" }} 
                  >
                    {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>DESCRIPTION (OPTIONAL)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g. Served with butter naan" 
                  rows={3}
                  style={{ width: "100%", padding: 14, background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 12, color: "#fff", outline: "none", resize: "none" }} 
                ></textarea>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                <input 
                  type="checkbox" 
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                  style={{ width: 20, height: 20 }}
                />
                <label htmlFor="isAvailable" style={{ fontSize: "0.9rem", fontWeight: 600 }}>In Stock & Available</label>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ background: "#fff", color: "#000", padding: 16, marginTop: 10, fontSize: "1rem", fontWeight: 800 }}
              >
                {editingItem ? "Save Changes" : "Create Item"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
