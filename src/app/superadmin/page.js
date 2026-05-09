"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { LogOut, Activity, Store, FileWarning, CheckCircle, XCircle } from "lucide-react";

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("logs");
  
  // Data states
  const [logs, setLogs] = useState([]);
  const [shops, setShops] = useState([]);
  const [recon, setRecon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reconLoading, setReconLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/superadmin/login");
    } else if (session?.user?.role !== "superadmin") {
      router.push("/login");
    } else {
      fetchData();
    }
  }, [status, session, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "logs") {
        const res = await fetch("/api/admin/logs");
        const data = await res.json();
        setLogs(data.logs || []);
      } else if (activeTab === "shops") {
        const res = await fetch("/api/admin/shops");
        const data = await res.json();
        setShops(data.shops || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const runReconciliation = async () => {
    setReconLoading(true);
    try {
      const res = await fetch("/api/admin/reconciliation");
      const data = await res.json();
      setRecon(data);
    } catch (err) {
      console.error(err);
    }
    setReconLoading(false);
  };

  const toggleModule = async (shopId, currentModulesStr, moduleName) => {
    try {
      let modules = JSON.parse(currentModulesStr || "[]");
      if (modules.includes(moduleName)) {
        modules = modules.filter(m => m !== moduleName);
      } else {
        modules.push(moduleName);
      }
      
      const res = await fetch("/api/admin/shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, enabledModules: JSON.stringify(modules) })
      });
      
      if (res.ok) {
        // Optimistic update
        setShops(shops.map(s => s.id === shopId ? { ...s, enabledModules: JSON.stringify(modules) } : s));
      }
    } catch (err) {
      alert("Failed to toggle module");
    }
  };

  if (status === "loading" || !session) {
    return <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>LOADING SYSTEM...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <header style={{ padding: "24px 40px", borderBottom: "1px solid #222", background: "#0A0A0A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Logo size="sm" />
          <div style={{ padding: "4px 12px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "1px", border: "1px solid rgba(239,68,68,0.3)" }}>
            SUPER ADMIN OVERRIDE
          </div>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: "/superadmin/login" })}
          style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
        >
          <LogOut size={16} /> LOGOUT
        </button>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* SIDEBAR */}
        <nav style={{ width: "240px", background: "#0A0A0A", borderRight: "1px solid #222", padding: "24px 0" }}>
          <TabButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")} icon={<Activity size={18} />} label="Audit Logs" />
          <TabButton active={activeTab === "shops"} onClick={() => setActiveTab("shops")} icon={<Store size={18} />} label="Shop Modules" />
          <TabButton active={activeTab === "reconciliation"} onClick={() => setActiveTab("reconciliation")} icon={<FileWarning size={18} />} label="Reconciliation" />
        </nav>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: "40px", overflowY: "auto", height: "calc(100vh - 80px)" }}>
          {loading && activeTab !== "reconciliation" ? (
            <div style={{ color: "#888" }}>Fetching data...</div>
          ) : (
            <>
              {activeTab === "logs" && <LogsView logs={logs} />}
              {activeTab === "shops" && <ShopsView shops={shops} onToggle={toggleModule} />}
              {activeTab === "reconciliation" && <ReconView recon={recon} runRecon={runReconciliation} loading={reconLoading} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        width: "100%", padding: "16px 24px", background: active ? "#111" : "transparent", border: "none", 
        borderRight: active ? "3px solid #fff" : "3px solid transparent",
        color: active ? "#fff" : "#888", display: "flex", alignItems: "center", gap: "12px", 
        fontSize: "0.95rem", fontWeight: active ? 700 : 500, cursor: "pointer", textAlign: "left", transition: "all 0.2s"
      }}
    >
      {icon} {label}
    </button>
  );
}

function LogsView({ logs }) {
  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "24px" }}>System Audit Logs</h2>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#0A0A0A", borderBottom: "1px solid #222" }}>
              <th style={{ padding: "16px", color: "#888", fontWeight: 700 }}>TIMESTAMP</th>
              <th style={{ padding: "16px", color: "#888", fontWeight: 700 }}>SHOP</th>
              <th style={{ padding: "16px", color: "#888", fontWeight: 700 }}>ACTION</th>
              <th style={{ padding: "16px", color: "#888", fontWeight: 700 }}>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "16px", color: "#aaa" }}>{new Date(log.createdAt).toLocaleString()}</td>
                <td style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>{log.shop.name}</td>
                <td style={{ padding: "16px", color: "#60A5FA", fontWeight: 700 }}>{log.action}</td>
                <td style={{ padding: "16px", color: "#ccc" }}>{log.description}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan="4" style={{ padding: "24px", textAlign: "center", color: "#888" }}>No logs found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShopsView({ shops, onToggle }) {
  const RISKY_MODULES = ["kitchen", "billing", "inventory"];
  
  const totalShops = shops.length;
  const totalBills = shops.reduce((acc, shop) => acc + (shop._count?.bills || 0), 0);
  const totalCustomers = shops.reduce((acc, shop) => acc + (shop._count?.customers || 0), 0);

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "24px" }}>Shop Modules Control</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "32px" }}>
        <div style={{ padding: "24px", background: "#111", border: "1px solid #222", borderRadius: "12px" }}>
          <div style={{ color: "#888", fontSize: "0.8rem", fontWeight: 700, marginBottom: "8px" }}>TOTAL SHOPS</div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fff" }}>{totalShops}</div>
        </div>
        <div style={{ padding: "24px", background: "#111", border: "1px solid #222", borderRadius: "12px" }}>
          <div style={{ color: "#888", fontSize: "0.8rem", fontWeight: 700, marginBottom: "8px" }}>PLATFORM BILLS</div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fff" }}>{totalBills.toLocaleString()}</div>
        </div>
        <div style={{ padding: "24px", background: "#111", border: "1px solid #222", borderRadius: "12px" }}>
          <div style={{ color: "#888", fontSize: "0.8rem", fontWeight: 700, marginBottom: "8px" }}>PLATFORM CUSTOMERS</div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fff" }}>{totalCustomers.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ background: "#111", border: "1px solid #222", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#0A0A0A", borderBottom: "1px solid #222" }}>
              <th style={{ padding: "16px", color: "#888", fontWeight: 700 }}>SHOP NAME</th>
              <th style={{ padding: "16px", color: "#888", fontWeight: 700 }}>TYPE</th>
              <th style={{ padding: "16px", color: "#888", fontWeight: 700 }}>BILLS</th>
              <th style={{ padding: "16px", color: "#888", fontWeight: 700 }}>RISKY MODULES (Click to Toggle)</th>
            </tr>
          </thead>
          <tbody>
            {shops.map(shop => {
              const activeModules = JSON.parse(shop.enabledModules || "[]");
              return (
                <tr key={shop.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>
                    {shop.name || "Unnamed"}<br/>
                    <span style={{ color: "#666", fontSize: "0.75rem", fontWeight: 400 }}>{shop.phone}</span>
                  </td>
                  <td style={{ padding: "16px", color: "#aaa" }}>{shop.businessType}</td>
                  <td style={{ padding: "16px", color: "#aaa" }}>{shop._count.bills}</td>
                  <td style={{ padding: "16px", display: "flex", gap: "8px" }}>
                    {RISKY_MODULES.map(mod => {
                      const isActive = activeModules.includes(mod);
                      return (
                        <button
                          key={mod}
                          onClick={() => onToggle(shop.id, shop.enabledModules, mod)}
                          style={{
                            padding: "6px 12px", borderRadius: "100px", border: `1px solid ${isActive ? "#166534" : "#7f1d1d"}`,
                            background: isActive ? "rgba(22, 101, 52, 0.2)" : "rgba(127, 29, 29, 0.2)",
                            color: isActive ? "#4ade80" : "#ef4444", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "4px"
                          }}
                        >
                          {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />} {mod.toUpperCase()}
                        </button>
                      );
                    })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReconView({ recon, runRecon, loading }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0 }}>Invoice Reconciliation</h2>
        <button 
          onClick={runRecon} 
          disabled={loading}
          style={{ background: "#fff", color: "#000", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 900, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "SCANNING DATABASE..." : "RUN RECONCILIATION SCAN"}
        </button>
      </div>

      {!recon && !loading && (
        <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #333", borderRadius: "12px", color: "#888", lineHeight: "1.6" }}>
          <p style={{ margin: "0 0 8px 0", color: "#fff", fontWeight: 700 }}>What is this?</p>
          This tool double-checks the math on your system's bills. It calculates the correct total based on the individual items, taxes, and discounts, and compares it to the final amount charged. If the numbers don't match exactly, it will flag the bill for your review.<br/><br/>
          Click the button above to start the scan.
        </div>
      )}

      {recon && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", gap: "24px" }}>
            <div style={{ flex: 1, padding: "24px", background: "#111", border: "1px solid #222", borderRadius: "12px" }}>
              <div style={{ color: "#888", fontSize: "0.8rem", fontWeight: 700, marginBottom: "8px" }}>INVOICES SCANNED</div>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fff" }}>{recon.checkedCount}</div>
            </div>
            <div style={{ flex: 1, padding: "24px", background: "#111", border: `1px solid ${recon.discrepanciesCount > 0 ? "#ef4444" : "#22c55e"}`, borderRadius: "12px" }}>
              <div style={{ color: "#888", fontSize: "0.8rem", fontWeight: 700, marginBottom: "8px" }}>DISCREPANCIES FOUND</div>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: recon.discrepanciesCount > 0 ? "#ef4444" : "#4ade80" }}>{recon.discrepanciesCount}</div>
            </div>
          </div>

          {recon.discrepanciesCount > 0 && (
            <div style={{ background: "#111", border: "1px solid #ef4444", borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid #ef4444" }}>
                    <th style={{ padding: "16px", color: "#ef4444", fontWeight: 700 }}>INVOICE #</th>
                    <th style={{ padding: "16px", color: "#ef4444", fontWeight: 700 }}>SHOP</th>
                    <th style={{ padding: "16px", color: "#ef4444", fontWeight: 700 }}>SAVED TOTAL</th>
                    <th style={{ padding: "16px", color: "#ef4444", fontWeight: 700 }}>EXPECTED TOTAL</th>
                    <th style={{ padding: "16px", color: "#ef4444", fontWeight: 700 }}>DIFFERENCE</th>
                  </tr>
                </thead>
                <tbody>
                  {recon.discrepancies.map(d => (
                    <tr key={d.billId} style={{ borderBottom: "1px solid #222" }}>
                      <td style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>{d.invoiceNum}</td>
                      <td style={{ padding: "16px", color: "#aaa" }}>{d.shopName}</td>
                      <td style={{ padding: "16px", color: "#fff" }}>₹{d.savedTotal}</td>
                      <td style={{ padding: "16px", color: "#fff" }}>₹{d.expectedTotal}</td>
                      <td style={{ padding: "16px", color: "#ef4444", fontWeight: 900 }}>₹{d.diff.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
