"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Check, X, Search, Grid3X3, 
  Users, Loader2, AlertCircle, QrCode
} from "lucide-react";

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [qrTable, setQRTable] = useState(null);
  
  const [formData, setFormData] = useState({
    number: "",
    capacity: 4,
    isActive: true
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tables");
      const data = await res.json();
      if (data.tables) setTables(data.tables);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingTable ? "PATCH" : "POST";
    const body = editingTable ? { id: editingTable.id, ...formData } : formData;

    try {
      const res = await fetch("/api/tables", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingTable(null);
        setFormData({ number: "", capacity: 4, isActive: true });
        fetchTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this table?")) return;
    try {
      const res = await fetch(`/api/tables?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchTables();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading && tables.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", flexDirection: "column", gap: 16 }}>
        <Loader2 className="animate-spin" size={24} color="#666" />
        <p style={{ color: "#666", fontSize: "0.85rem", fontWeight: 600 }}>FETCHING TABLES...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Table Management</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Organize your restaurant floor and QR billing</p>
        </div>
        <button 
          onClick={() => { setEditingTable(null); setFormData({ number: "", capacity: 4, isActive: true }); setIsModalOpen(true); }}
          className="btn-primary" 
          style={{ background: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
        >
          <Plus size={18} /> Add New Table
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
        {tables.map(table => (
          <div key={table.id} className="saas-card" style={{ padding: 24, textAlign: "center", border: "1px solid var(--card-border)" }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: 16, background: "var(--bg-secondary)", 
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
              border: "1px solid var(--card-border)"
            }}>
              <Grid3X3 size={24} color="var(--text-primary)" />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 4 }}>Table {table.number}</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20 }}>
              <Users size={14} /> {table.capacity} Seats
            </p>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button 
                onClick={() => { setEditingTable(table); setFormData({ ...table }); setIsModalOpen(true); }}
                style={{ padding: 10, borderRadius: 12, background: "var(--bg-secondary)", border: "1px solid var(--card-border)", color: "var(--text-secondary)", cursor: "pointer" }}
                title="Edit Table"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => { setQRTable(table); setIsQRModalOpen(true); }}
                style={{ padding: 10, borderRadius: 12, background: "var(--text-primary)", border: "1px solid var(--card-border)", color: "#fff", cursor: "pointer" }}
                title="View Table QR"
              >
                <QrCode size={16} />
              </button>
              <button 
                onClick={() => handleDelete(table.id)}
                style={{ padding: 10, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer" }}
                title="Delete Table"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0", background: "var(--bg-secondary)", borderRadius: 24, border: "1px dashed var(--card-border)" }}>
            <AlertCircle size={48} style={{ color: "#333", marginBottom: 16, margin: "0 auto" }} />
            <h3 style={{ color: "var(--text-primary)", marginBottom: 8 }}>No tables set up</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Add your first table to enable floor management.</p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {isQRModalOpen && qrTable && (
        <div style={{ 
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", 
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(10px)"
        }}>
          <div style={{ 
            background: "#fff", width: "100%", maxWidth: 400, borderRadius: 32, padding: 40, 
            textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", color: "#000"
          }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 0 }}>
               <button onClick={() => setIsQRModalOpen(false)} style={{ background: "#f0f0f0", border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} /></button>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, background: "var(--bg-secondary)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Grid3X3 size={32} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: 8 }}>Table {qrTable.number}</h3>
              <p style={{ fontSize: "0.85rem", color: "#666", fontWeight: 600 }}>SCAN TO ORDER & PAY</p>
            </div>

            <div style={{ 
              background: "#fcfcfc", padding: 24, borderRadius: 24, border: "1px solid #eee", 
              marginBottom: 32, display: "flex", justifyContent: "center" 
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/pos?t=${qrTable.number}` : '')}`} 
                alt="Table QR" 
                style={{ width: 200, height: 200 }} 
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => window.print()} className="btn-primary" style={{ background: "#000", color: "#fff", padding: 16, borderRadius: 16, fontWeight: 800 }}>Download Print Copy</button>
              <button onClick={() => setIsQRModalOpen(false)} style={{ background: "none", border: "none", color: "#666", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ 
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", 
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(5px)"
        }}>
          <div style={{ 
            background: "var(--bg-primary)", width: "100%", maxWidth: 400, borderRadius: 24, padding: 32, 
            border: "1px solid var(--card-border)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{editingTable ? "Edit Table" : "Add New Table"}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>TABLE NUMBER / NAME</label>
                <input 
                  type="text" 
                  required
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  placeholder="e.g. 101 or A1" 
                  style={{ width: "100%", padding: 14, background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--text-primary)", outline: "none" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>SEATING CAPACITY</label>
                <input 
                  type="number" 
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  placeholder="4" 
                  style={{ width: "100%", padding: 14, background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--text-primary)", outline: "none" }} 
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  style={{ width: 20, height: 20 }}
                />
                <label htmlFor="isActive" style={{ fontSize: "0.9rem", fontWeight: 600 }}>Active & Ready for Bills</label>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ background: "#fff", color: "#000", padding: 16, marginTop: 10, fontSize: "1rem", fontWeight: 800 }}
              >
                {editingTable ? "Save Changes" : "Create Table"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
