"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from '@/components/Logo';
import { 
  Store, Settings, BarChart2, Zap, Save, CheckCircle, 
  ChevronRight, Phone, MapPin, Hash, Palette, Clock, User,
  Globe, Bell, Shield, Mail
} from "lucide-react";

const AVATAR_COLORS = ["#000000", "#E8671A", "#1D9E75", "#1A1446", "#E24B4A", "#7C3AED"];
const THEMES = ["dark", "saffron", "green", "royal"];

export default function ShopProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState({ 
    name: "", category: "Grocery", address: "", gstNumber: "", 
    phone: "", billingPrefix: "", autoSendWA: true, autoSendEmail: true,
    defaultTheme: "dark", defaultValidity: 7, avatarColor: "#000000"
  });
  const [stats, setStats] = useState({ 
    totalBills: 0, totalCustomers: 0, totalRevenue: 0, 
    avgBill: 0, bestSeller: "N/A", busiestDay: "Monday" 
  });
  const [prefs, setPrefs] = useState({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/shop/profile");
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
      if (data.stats) setStats(data.stats);
      if (data.preferences) setPrefs(data.preferences);
      setLoading(false);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/shop/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setDirty(false);
        showToast("Profile updated successfully");
      }
    } catch (err) {}
    setSaving(false);
  };

  const handleSavePrefs = async (newPrefs) => {
    setPrefs(newPrefs);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs)
      });
      showToast("Notification preferences updated");
    } catch (err) {}
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-primary)" }}>
      <p style={{ fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Initializing Profile Intelligence...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", paddingBottom: "100px" }}>
      {/* Header */}
      <header style={{ 
        padding: "20px 40px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--card-border)", 
        display: "flex", justifyContent: "space-between", alignItems: "center", sticky: "top", zIndex: 100 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard"><Logo size="sm" /></Link>
          <div style={{ width: 1, height: 24, background: "var(--card-border)" }}></div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.5px" }}>Shop Intelligence Profile</h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ background: "var(--text-primary)", color: "#fff", padding: "10px 24px", opacity: saving ? 0.7 : 1 }}
          >
            <Save size={16} /> {saving ? "Saving..." : "Commit Changes"}
          </button>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: "10px 24px" }}>Exit Settings</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 40px", display: "grid", gridTemplateColumns: "1fr 350px", gap: 40 }}>
        
        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          
          {/* Identity Section */}
          <div className="saas-card" style={{ padding: 40 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 32 }}>01. Brand & Identity</p>
            
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ 
                  width: 120, height: 120, borderRadius: 24, background: profile.avatarColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "3rem", fontWeight: 900, color: "#fff", boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}>
                  {profile.name ? profile.name[0].toUpperCase() : "S"}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {AVATAR_COLORS.map(c => (
                    <button 
                      key={c}
                      onClick={() => { setProfile({...profile, avatarColor: c}); setDirty(true); }}
                      style={{ 
                        width: 16, height: 16, borderRadius: "50%", background: c, border: "2px solid #fff", 
                        cursor: "pointer", outline: profile.avatarColor === c ? "2px solid #000" : "none"
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, display: "grid", gap: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Shop Name</label>
                    <input 
                      value={profile.name}
                      onChange={(e) => { setProfile({...profile, name: e.target.value}); setDirty(true); }}
                      style={{ width: "100%", padding: "14px", background: "var(--bg-primary)", border: "1px solid var(--card-border)", borderRadius: 12, fontSize: "1.1rem", fontWeight: 700, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Category</label>
                    <select 
                      value={profile.category}
                      onChange={(e) => { setProfile({...profile, category: e.target.value}); setDirty(true); }}
                      style={{ width: "100%", padding: "14px", background: "var(--bg-primary)", border: "1px solid var(--card-border)", borderRadius: 12, fontSize: "1rem", fontWeight: 700, outline: "none" }}
                    >
                      {["Grocery", "Food & Dining", "Medical", "Electronics", "Clothing", "Other"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Business Address</label>
                  <textarea 
                    value={profile.address}
                    onChange={(e) => { setProfile({...profile, address: e.target.value}); setDirty(true); }}
                    rows={2}
                    placeholder="Complete business address..."
                    style={{ width: "100%", padding: "14px", background: "var(--bg-primary)", border: "1px solid var(--card-border)", borderRadius: 12, fontSize: "1rem", fontWeight: 600, outline: "none", resize: "none" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="saas-card" style={{ padding: 40 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 32 }}>02. Billing Configuration</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
               <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Bill Prefix</label>
                  <input 
                    value={profile.billingPrefix}
                    onChange={(e) => { setProfile({...profile, billingPrefix: e.target.value.toUpperCase()}); setDirty(true); }}
                    placeholder="e.g. BILL-"
                    style={{ width: "100%", padding: "14px", background: "var(--bg-primary)", border: "1px solid var(--card-border)", borderRadius: 12, fontSize: "1rem", fontWeight: 800, outline: "none", fontFamily: "monospace" }}
                  />
               </div>
               <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>GSTIN / Tax ID</label>
                  <input 
                    value={profile.gstNumber}
                    onChange={(e) => { setProfile({...profile, gstNumber: e.target.value}); setDirty(true); }}
                    placeholder="Optional"
                    style={{ width: "100%", padding: "14px", background: "var(--bg-primary)", border: "1px solid var(--card-border)", borderRadius: 12, fontSize: "1rem", fontWeight: 800, outline: "none", fontFamily: "monospace" }}
                  />
               </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "var(--bg-primary)", borderRadius: 16, border: "1px solid var(--card-border)" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ background: "#25D366", padding: 8, borderRadius: 10, color: "#fff" }}><Zap size={18} fill="currentColor" /></div>
                    <div>
                      <p style={{ fontWeight: 700 }}>WhatsApp Automation</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Automatically dispatch digital bills to WhatsApp</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setProfile({...profile, autoSendWA: !profile.autoSendWA}); setDirty(true); }}
                    style={{ width: 44, height: 24, borderRadius: 12, background: profile.autoSendWA ? "#25D366" : "var(--card-border)", cursor: "pointer", position: "relative", transition: "all 0.3s" }}
                  >
                    <div style={{ width: 18, height: 18, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, left: profile.autoSendWA ? 23 : 3, transition: "all 0.3s" }}></div>
                  </button>
               </div>

               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "var(--bg-primary)", borderRadius: 16, border: "1px solid var(--card-border)" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ background: "#4B5563", padding: 8, borderRadius: 10, color: "#fff" }}><Mail size={18} fill="currentColor" /></div>
                    <div>
                      <p style={{ fontWeight: 700 }}>Email Receipts</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Deliver copy of bill to customer's email inbox</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setProfile({...profile, autoSendEmail: !profile.autoSendEmail}); setDirty(true); }}
                    style={{ width: 44, height: 24, borderRadius: 12, background: profile.autoSendEmail ? "var(--text-primary)" : "var(--card-border)", cursor: "pointer", position: "relative", transition: "all 0.3s" }}
                  >
                    <div style={{ width: 18, height: 18, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, left: profile.autoSendEmail ? 23 : 3, transition: "all 0.3s" }}></div>
                  </button>
               </div>
            </div>
          </div>

          {/* Intelligence & Alerts */}
          <div className="saas-card" style={{ padding: 40 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 32 }}>03. Intelligence & Notifications</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
               {[
                 { key: "newCustomerAlert", label: "Acquisition Alert", desc: "Notify on first-time customer visit", icon: User },
                 { key: "dailySummary", label: "EOD Intelligence", desc: "9 PM revenue & performance report", icon: BarChart2 },
                 { key: "weeklyReport", label: "Market Growth", desc: "Monday morning expansion summary", icon: Globe },
                 { key: "offerReport", label: "Campaign Audit", desc: "Detailed broadcast reach report", icon: Shield },
               ].map(p => (
                 <div key={p.key} style={{ padding: 24, background: "var(--bg-primary)", borderRadius: 20, border: "1px solid var(--card-border)", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <p.icon size={20} color="var(--text-muted)" />
                      <button 
                        onClick={() => handleSavePrefs({...prefs, [p.key]: !prefs[p.key]})}
                        style={{ width: 40, height: 20, borderRadius: 10, background: prefs[p.key] ? "var(--text-primary)" : "var(--card-border)", cursor: "pointer", position: "relative" }}
                      >
                        <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, left: prefs[p.key] ? 23 : 3 }}></div>
                      </button>
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: "0.9rem" }}>{p.label}</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginTop: 4 }}>{p.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>

        </div>

        {/* Sidebar Intelligence */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
           
           <div className="saas-card" style={{ padding: 32, background: "var(--text-primary)", color: "#fff", border: "none" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 800, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 24 }}>Shop Performance</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                 <div>
                    <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: 4 }}>Total Revenue Pipeline</p>
                    <h3 style={{ fontSize: "2rem", fontWeight: 900 }}>₹{stats.totalRevenue.toLocaleString("en-IN")}</h3>
                 </div>

                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div>
                       <p style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: 4 }}>Orders</p>
                       <p style={{ fontSize: "1.2rem", fontWeight: 800 }}>{stats.totalBills}</p>
                    </div>
                    <div>
                       <p style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: 4 }}>Customers</p>
                       <p style={{ fontSize: "1.2rem", fontWeight: 800 }}>{stats.totalCustomers}</p>
                    </div>
                 </div>

                 <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }}></div>

                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div>
                       <p style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: 4 }}>Avg Order</p>
                       <p style={{ fontSize: "1.1rem", fontWeight: 800 }}>₹{Math.round(stats.avgBill)}</p>
                    </div>
                    <div>
                       <p style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: 4 }}>Busiest</p>
                       <p style={{ fontSize: "1.1rem", fontWeight: 800 }}>{stats.busiestDay}</p>
                    </div>
                 </div>

                 <div style={{ padding: 16, background: "rgba(255,255,255,0.05)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
                    <p style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", color: "#4ADE80", marginBottom: 4 }}>Best Seller</p>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>{stats.bestSeller}</p>
                 </div>
              </div>
           </div>

           <div className="saas-card" style={{ padding: 32, background: "rgba(0,0,0,0.02)", border: "1px dashed var(--card-border)" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", opacity: 0.5 }}>
                 <Shield size={24} />
                 <div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 800 }}>Staff Governance</p>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Coming to Enterprise Tier</p>
                 </div>
              </div>
           </div>

        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{ 
          position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", 
          background: "var(--text-primary)", color: "#fff", padding: "14px 32px", borderRadius: 100, 
          fontWeight: 800, fontSize: "0.9rem", boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: 12, zIndex: 1000
        }}>
          <CheckCircle size={20} color="#4ADE80" /> {toast}
        </div>
      )}
    </div>
  );
}
