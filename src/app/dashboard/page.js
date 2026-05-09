"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard, Utensils, Monitor, Grid3X3, List, ShoppingCart,
  Users, MessageSquare, Mail, Settings, HelpCircle, Bell, Search,
  BarChart2, Plus, Filter, Download, ChevronRight, Zap, Target, Store, Package, CheckCircle,
  X
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import NotificationSystem from '@/components/NotificationSystem';
import MenuManager from '@/components/dashboard/MenuManager';
import TableManager from '@/components/dashboard/TableManager';
import Logo from '@/components/Logo';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shopId, setShopId] = useState("");
  const [shopName, setShopName] = useState("");
  const [data, setData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("Overview");
  const [activeSubTab, setActiveSubTab] = useState("Overview");
  const [timeframe, setTimeframe] = useState("7");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      if (["Menu", "Tables", "Customers", "Order History", "Message", "Email"].includes(tab)) {
        setActiveMenu(tab);
      } else if (["Overview", "Sales", "Kitchen Orders"].includes(tab)) {
        setActiveMenu("Overview");
        setActiveSubTab(tab);
      }
    }
  }, [searchParams]);

  const renderMenu = () => <MenuManager />;
  const renderTables = () => <TableManager />;

  // Live Communication State
  const [messages, setMessages] = useState([]);
  const [emailCampaigns, setEmailCampaigns] = useState([]);
  const [activeCustomerId, setActiveCustomerId] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [emailForm, setEmailForm] = useState({ name: "", subject: "", body: "" });

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    } else if (status === "authenticated" && session?.user?.id) {
      setShopId(session.user.id);
      setShopName(session.user.name);
      fetchData(session.user.id, timeframe);
    }
  }, [status, session, router, timeframe]);

  const fetchData = async (id, tf = timeframe) => {
    try {
      const res = await fetch(`/api/dashboard?days=${tf}`);
      const json = await res.json();
      setData(json);
      // Set initial active customer for chat if available
      if (json?.crm?.length > 0) {
        setActiveCustomerId(json.crm[0].customerId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    if (!shopId) return;
    try {
      const res = await fetch(`/api/messages?shopId=${shopId}`);
      const json = await res.json();
      setMessages(json.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmails = async () => {
    if (!shopId) return;
    try {
      const res = await fetch(`/api/emails?shopId=${shopId}`);
      const json = await res.json();
      setEmailCampaigns(json.campaigns || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeMenu === "Message") fetchMessages();
    if (activeMenu === "Email") fetchEmails();
  }, [activeMenu, shopId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeCustomerId || !shopId) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          customerId: activeCustomerId,
          content: messageInput
        })
      });
      if (res.ok) {
        setMessageInput("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCampaign = async () => {
    if (!emailForm.name || !emailForm.subject || !emailForm.body || !shopId) return;
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          name: emailForm.name,
          subject: emailForm.subject,
          messageBody: emailForm.body,
          sentToCount: activeCustomers
        })
      });
      if (res.ok) {
        setEmailForm({ name: "", subject: "", body: "" });
        fetchEmails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };


  // Computed early so it can be used in handleSendCampaign below
  const totalRevenue = data?.metrics?.totalSales || 0;
  const totalOrders = data?.metrics?.activeOrders || 0;
  const activeCustomers = data?.crm?.length || 0;
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

  if (status === "loading" || !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-primary)", flexDirection: "column", gap: 16 }}>
        <p style={{ fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1, fontSize: 13 }}>Loading Dashboard...</p>
      </div>
    );
  }

  const SidebarItem = ({ icon: Icon, label, isActive, badge, onClick }) => (
    <div
      onClick={onClick || (() => setActiveMenu(label))}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderRadius: "var(--radius-md)", cursor: "pointer",
        background: isActive ? "var(--text-primary)" : "transparent",
        color: isActive ? "#fff" : "var(--text-secondary)",
        fontWeight: isActive ? "700" : "500",
        marginBottom: "8px", transition: "all var(--transition-fast)",
        boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
      }}
      className={!isActive ? "hover-lift" : ""}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        <span style={{ fontSize: "0.95rem" }}>{label}</span>
      </div>
      {badge && (
        <span style={{
          background: isActive ? "rgba(255,255,255,0.2)" : "var(--bg-primary)",
          fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: "100px",
          color: isActive ? "#fff" : "var(--text-primary)"
        }}>
          {badge}
        </span>
      )}
    </div>
  );

  const MetricCard = ({ label, value, trend, trendLabel, positive }) => (
    <div className="saas-card" style={{ padding: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
      <div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>{label}</p>
        <h3 style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-1px" }}>{value}</h3>
      </div>
      <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          fontSize: "0.75rem", fontWeight: 900,
          color: positive ? "#4ADE80" : "#EF4444",
          background: positive ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
          padding: "4px 10px", borderRadius: "100px"
        }}>
          {positive && "+"} {trend}
        </span>
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{trendLabel}</span>
      </div>
    </div>
  );

  const OnboardingFunnel = ({ step }) => {
    const steps = [
      { id: 1, label: "Identity", desc: "Profile setup", icon: Store, route: "/dashboard/profile" },
      { id: 2, label: "Catalogue", desc: "Items ready", icon: Package, menu: "Menu" },
      { id: 3, label: "Floor Map", desc: "Tables set", icon: Grid3X3, menu: "Tables" },
      { id: 4, label: "Operation", desc: "First sale", icon: Utensils, route: "/pos" },
    ];

    return (
      <div className="premium-card animate-fade-in" style={{ marginBottom: "32px", background: "var(--text-primary)", border: "none", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 150, height: 150, background: "rgba(255,255,255,0.03)", borderRadius: "50%" }}></div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.5px" }}>Activation Progress</h3>
              <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>Initialize your shop node to begin intelligence tracking.</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "6px 16px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 800 }}>
              {Math.round(((step - 1) / 4) * 100)}% ACTIVE
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            {steps.map((s) => {
              const isDone = step > s.id;
              const isCurrent = step === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => s.route ? router.push(s.route) : setActiveMenu(s.menu)}
                  style={{
                    flex: 1, padding: "20px", borderRadius: "16px",
                    background: isCurrent ? "#fff" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isCurrent ? "#fff" : "rgba(255,255,255,0.1)"}`,
                    color: isCurrent ? "#000" : "#fff",
                    cursor: "pointer", transition: "all 0.3s"
                  }}
                  className={isCurrent ? "animate-pulse" : "hover-lift"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: isCurrent ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isDone ? <CheckCircle size={16} color="#4ADE80" /> : <span style={{ fontSize: 10, fontWeight: 900 }}>{s.id}</span>}
                    </div>
                  </div>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: "2px" }}>{s.label}</h4>
                  <p style={{ fontSize: "0.65rem", opacity: 0.6, fontWeight: 600 }}>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "20px", borderBottom: "1px solid var(--card-border)", width: "fit-content" }}>
          <span
            onClick={() => setActiveSubTab("Overview")}
            style={{
              padding: "10px 15px",
              borderBottom: activeSubTab === "Overview" ? "2px solid var(--text-primary)" : "none",
              fontWeight: activeSubTab === "Overview" ? "600" : "500",
              color: activeSubTab === "Overview" ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer"
            }}
          >Overview</span>
          <span
            onClick={() => setActiveSubTab("Sales")}
            style={{
              padding: "10px 15px",
              borderBottom: activeSubTab === "Sales" ? "2px solid var(--text-primary)" : "none",
              fontWeight: activeSubTab === "Sales" ? "600" : "500",
              color: activeSubTab === "Sales" ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer"
            }}
          >Sales</span>
          <span
            onClick={() => setActiveSubTab("Kitchen Orders")}
            style={{
              padding: "10px 15px",
              borderBottom: activeSubTab === "Kitchen Orders" ? "2px solid var(--text-primary)" : "none",
              fontWeight: activeSubTab === "Kitchen Orders" ? "600" : "500",
              color: activeSubTab === "Kitchen Orders" ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer"
            }}
          >Kitchen Orders</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary" onClick={() => router.push("/pos")}><Utensils size={14} /> Open POS</button>
          <button className="btn-primary" style={{ background: "var(--text-primary)" }} onClick={() => router.push("/kitchen")}><Monitor size={14} /> View Kitchen</button>
        </div>
      </div>

      {data?.metrics?.onboardingStep < 5 && <OnboardingFunnel step={data.metrics.onboardingStep} />}

      {activeSubTab === "Overview" && (
        <>
          {/* SMART METRICS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
            <MetricCard
              label="Today's Revenue"
              value={`₹${(data?.metrics?.todayRevenue || 0).toLocaleString("en-IN")}`}
              trend={`${data?.metrics?.dayOverDayChange || 0}%`}
              trendLabel="vs Yesterday"
              positive={data?.metrics?.dayOverDayChange >= 0}
            />
            <MetricCard
              label="Bills Dispatched"
              value={data?.metrics?.activeOrders || 0}
              trend={`${data?.recentOrders?.length || 0}`}
              trendLabel="Latest"
              positive={true}
            />
            <MetricCard
              label="Returning Rate"
              value={`${data?.metrics?.returningRate || 0}%`}
              trend={`${data?.metrics?.newRate || 0}%`}
              trendLabel="New Users"
              positive={data?.metrics?.returningRate > 40}
            />
            <MetricCard
              label="Avg Prep Time"
              value={`${data?.metrics?.kitchen?.avgPrepTime || 0}m`}
              trend={data?.metrics?.kitchen?.delayedToday || 0}
              trendLabel="Delays Today"
              positive={(data?.metrics?.kitchen?.delayedToday || 0) === 0}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "24px", marginBottom: "32px" }}>

            {/* PROACTIVE INTELLIGENCE FEED */}
            <div className="premium-card" style={{ padding: "32px", border: "1px solid var(--card-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ background: "var(--text-primary)", color: "#fff", padding: "8px", borderRadius: "10px" }}><Zap size={18} fill="currentColor" /></div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.5px" }}>Business Intelligence Feed</h3>
                </div>
                <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "var(--text-muted)", background: "var(--bg-primary)", padding: "4px 10px", borderRadius: "100px" }}>LIVE ANALYSIS</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: (data?.insights?.salesChange >= 0) ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <BarChart2 size={20} color={(data?.insights?.salesChange >= 0) ? "#4ADE80" : "#EF4444"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "4px" }}>
                      {(data?.insights?.salesChange >= 0) ? "Positive Sales Momentum" : "Sales Dip Detected"}
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      Your sales are {(data?.insights?.salesChange >= 0) ? "up" : "down"} {Math.abs(data?.insights?.salesChange || 0)}% compared to last {data?.insights?.dayName}.
                      Peak hour expected at {((data?.insights?.peakHour || 19) % 12) || 12} {(data?.insights?.peakHour || 19) >= 12 ? 'PM' : 'AM'}.
                      {(data?.insights?.salesChange >= 0) ? " Prepare for higher demand." : " Consider running a flash offer."}
                    </p>
                    {(data?.insights?.salesChange < 0) && (
                      <button onClick={() => router.push("/dashboard/offers/new")} style={{ marginTop: "12px", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-primary)", background: "none", border: "1px solid var(--card-border)", padding: "6px 16px", borderRadius: "8px", cursor: "pointer" }}>Create Retention Offer</button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package size={20} color="var(--text-primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "4px" }}>Trending Inventory Alert</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      "{data?.topProducts?.[0]?.name || 'Your top item'}" is currently trending.
                      Consider increasing stock for the {((data?.insights?.peakHour || 19) % 12) || 12} {(data?.insights?.peakHour || 19) >= 12 ? 'PM' : 'AM'} rush.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(37,211,102,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={20} color="#25D366" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "4px" }}>Customer Retention Opportunity</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      You have {activeCustomers} unique customers. {data?.metrics?.returningRate}% are returning guests.
                      Launch a WhatsApp broadcast to re-engage the {100 - data?.metrics?.returningRate}% of one-time visitors.
                    </p>
                    <button onClick={() => router.push("/dashboard/offers/new")} style={{ marginTop: "12px", fontSize: "0.75rem", fontWeight: 800, color: "#fff", background: "#25D366", border: "none", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Zap size={14} fill="currentColor" /> Launch Retention Campaign
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* REVENUE CHART */}
            <div className="premium-card" style={{ padding: "32px", border: "1px solid var(--card-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.5px" }}>Revenue Analytics</h3>
                
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Filter size={14} color="var(--text-muted)" />
                  <select 
                    value={timeframe} 
                    onChange={(e) => setTimeframe(e.target.value)}
                    style={{ padding: "6px 12px", fontSize: "0.75rem", borderRadius: "8px", border: "1px solid var(--card-border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontWeight: 700, cursor: "pointer" }}
                  >
                    <option value="1">Today</option>
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.barData || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 600 }} dy={10} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 600 }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--card-border)', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="sales" radius={[4, 4, 0, 0]} fill="var(--text-primary)" barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>

            {/* TOP SELLING */}
            <div className="saas-card" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "24px", color: "var(--text-muted)" }}>Top Selling Items</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {data?.topProducts?.map((product, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: idx === 0 ? "var(--text-primary)" : "var(--card-border)" }}></div>
                      <p style={{ fontSize: "0.95rem", fontWeight: 700 }}>{product.name}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.95rem", fontWeight: 800 }}>₹{product.revenue.toLocaleString("en-IN")}</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{product.quantity} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* OPERATIONS HEALTH */}
            <div className="saas-card" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "24px", color: "var(--text-muted)" }}>Operations Health</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Table Turnover</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 800 }}>38 mins</p>
                  </div>
                  <div style={{ padding: "4px 10px", background: "rgba(74,222,128,0.1)", color: "#4ADE80", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 800 }}>HEALTHY</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Kitchen Efficiency</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 800 }}>{data?.metrics?.kitchen?.etaAccuracy || 0}% On-Time</p>
                  </div>
                  <div style={{ padding: "4px 10px", background: data?.metrics?.kitchen?.etaAccuracy > 80 ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: data?.metrics?.kitchen?.etaAccuracy > 80 ? "#4ADE80" : "#EF4444", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 800 }}>
                    {data?.metrics?.kitchen?.etaAccuracy > 80 ? "OPTIMAL" : "DIPPING"}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Kitchen Delays</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 800 }}>{data?.metrics?.kitchen?.delayedToday || 0} today</p>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>LIVE TRACKING</div>
                </div>
              </div>
            </div>

            {/* CUSTOMER RETENTION IQ */}
            <div className="saas-card" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "24px", color: "var(--text-muted)" }}>Retention Intelligence</h3>
              <div style={{ height: "160px", marginBottom: "24px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Returning", value: data?.metrics?.returningRate || 0 },
                        { name: "New", value: data?.metrics?.newRate || 100 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="var(--text-primary)" />
                      <Cell fill="var(--card-border)" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase" }}>Returning</p>
                  <p style={{ fontSize: "1rem", fontWeight: 800 }}>{data?.metrics?.returningRate || 0}%</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase" }}>New</p>
                  <p style={{ fontSize: "1rem", fontWeight: 800 }}>{data?.metrics?.newRate || 0}%</p>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {activeSubTab === "Sales" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {renderOrders()}
        </div>
      )}

      {activeSubTab === "Kitchen Orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ textAlign: "center", padding: "100px 0", background: "var(--bg-secondary)", borderRadius: 24, border: "1px dashed var(--card-border)" }}>
            <Monitor size={48} style={{ color: "#333", marginBottom: 16 }} />
            <h3 style={{ color: "var(--text-primary)", marginBottom: 8 }}>Kitchen Stream Active</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto 24px" }}>The KDS is currently broadcasting live orders. You can monitor them here or open the dedicated Kitchen View.</p>
            <button className="btn-primary" onClick={() => router.push("/kitchen")}>Open Full Kitchen View</button>
          </div>
        </div>
      )}
    </>
  );


  const renderOrders = () => (
    <div className="saas-card" style={{ padding: "30px", minHeight: "60vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px" }}>
        <h2 style={{ fontSize: "1.2rem", textTransform: "uppercase" }}>Recent Orders & Receipts</h2>
        <Link href="/pos" className="btn-primary" style={{ background: "var(--text-primary)", textDecoration: "none" }}><Plus size={14} /> New POS Order</Link>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--card-border)", color: "var(--text-secondary)", textTransform: "uppercase", fontSize: "0.85rem" }}>
            <th style={{ padding: "15px 10px" }}>Bill ID</th>
            <th style={{ padding: "15px 10px" }}>Date</th>
            <th style={{ padding: "15px 10px" }}>Customer / Table</th>
            <th style={{ padding: "15px 10px" }}>Amount</th>
            <th style={{ padding: "15px 10px", textAlign: "right" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {data?.recentOrders?.map((o, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "15px 10px", fontFamily: "monospace", fontSize: "0.85rem" }}>{o.id.substring(0, 8)}...</td>
              <td style={{ padding: "15px 10px" }}>{new Date(o.date).toLocaleDateString()}</td>
              <td style={{ padding: "15px 10px", fontFamily: "monospace" }}>{o.customerPhone || `Table ${o.tableNum || '??'}`}</td>
              <td style={{ padding: "15px 10px", fontWeight: "700", fontFamily: "monospace" }}>₹{o.total.toLocaleString("en-IN")}</td>
              <td style={{ padding: "15px 10px", textAlign: "right" }}>
                <Link href={`/b/${o.id}`} target="_blank" className="btn-secondary" style={{ fontSize: "0.8rem", padding: "6px 12px", textDecoration: "none" }}>View Receipt</Link>
              </td>
            </tr>
          ))}
          {(!data?.recentOrders || data.recentOrders.length === 0) && (
            <tr><td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No bills generated yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCustomers = () => (
    <div className="saas-card" style={{ padding: "30px", minHeight: "60vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px" }}>
        <h2 style={{ fontSize: "1.2rem", textTransform: "uppercase" }}>Customer Directory (CRM)</h2>
        <button className="btn-primary" style={{ background: "var(--text-primary)" }}><Download size={14} /> Export CSV</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--card-border)", color: "var(--text-secondary)", textTransform: "uppercase", fontSize: "0.85rem" }}>
            <th style={{ padding: "15px 10px" }}>Phone Number</th>
            <th style={{ padding: "15px 10px" }}>Lifetime Visits</th>
            <th style={{ padding: "15px 10px" }}>Last Visit</th>
            <th style={{ padding: "15px 10px" }}>Lifetime Value (LTV)</th>
          </tr>
        </thead>
        <tbody>
          {data?.crm?.map((c, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "15px 10px", fontFamily: "monospace", fontWeight: "600" }}>{c.phone}</td>
              <td style={{ padding: "15px 10px", fontFamily: "monospace" }}>{c.visitCount}</td>
              <td style={{ padding: "15px 10px" }}>{new Date(c.lastVisit).toLocaleDateString()}</td>
              <td style={{ padding: "15px 10px", fontFamily: "monospace", fontWeight: "700" }}>₹{c.totalSpent.toLocaleString("en-IN")}</td>
            </tr>
          ))}
          {(!data?.crm || data.crm.length === 0) && (
            <tr><td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No customer data collected yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderLockedModule = (moduleName) => (
    <div className="saas-card" style={{ padding: "60px", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", border: "2px dashed var(--card-border)" }}>
      <Zap size={48} style={{ color: "var(--text-muted)", marginBottom: "20px" }} />
      <h2 style={{ fontSize: "1.5rem", marginBottom: "10px", textTransform: "uppercase" }}>{moduleName} Module Locked</h2>
      <p style={{ color: "var(--text-secondary)", maxWidth: "400px", marginBottom: "30px" }}>
        The {moduleName} engine is part of the BILLIQ Enterprise tier. Upgrade your node to unlock advanced capabilities.
      </p>
      <button className="btn-primary" style={{ background: "var(--text-primary)", padding: "12px 24px", fontSize: "1rem" }}>Upgrade Node →</button>
    </div>
  );

  const renderMessage = () => (
    <div className="saas-card" style={{ padding: "30px", minHeight: "60vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px" }}>
        <h2 style={{ fontSize: "1.2rem", textTransform: "uppercase" }}>Messages & Communications</h2>
        <button className="btn-primary" style={{ background: "var(--text-primary)", borderRadius: "0" }}><Plus size={14} /> New Message</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "20px" }}>
        <div style={{ border: "1px solid var(--card-border)", height: "450px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "15px", borderBottom: "1px solid var(--card-border)", background: "var(--bg-primary)" }}>
            <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase" }}>Recent Chats</h3>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {data?.crm && data.crm.length > 0 ? data.crm.map((customer, i) => (
              <div
                key={i}
                onClick={() => setActiveCustomerId(customer.customerId)}
                style={{
                  padding: "15px", borderBottom: "1px solid var(--card-border)", cursor: "pointer",
                  background: activeCustomerId === customer.customerId ? "var(--accent-light)" : "transparent"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontWeight: "600", fontSize: "0.85rem", fontFamily: "monospace" }}>{customer.phone}</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {messages.filter(m => m.customerId === customer.customerId).slice(-1)[0]?.content || "Start a conversation..."}
                </div>
              </div>
            )) : (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "monospace" }}>No contacts found</div>
            )}
          </div>
        </div>

        <div style={{ border: "1px solid var(--card-border)", height: "450px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "15px", borderBottom: "1px solid var(--card-border)", background: "var(--bg-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase", fontFamily: "monospace" }}>
              {data?.crm?.find(c => c.customerId === activeCustomerId)?.phone || "Select Customer"}
            </h3>
            <span style={{ fontSize: "0.75rem", background: "var(--text-primary)", color: "white", padding: "2px 8px", borderRadius: "0", fontFamily: "monospace" }}>WhatsApp</span>
          </div>

          <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px", background: "var(--bg-primary)" }}>
            {messages.filter(m => m.customerId === activeCustomerId).map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.isFromStore ? "flex-end" : "flex-start",
                background: msg.isFromStore ? "var(--text-primary)" : "white",
                color: msg.isFromStore ? "white" : "black",
                border: msg.isFromStore ? "none" : "1px solid var(--card-border)",
                padding: "12px 15px", borderRadius: "0", maxWidth: "80%"
              }}>
                <p style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>{msg.content}</p>
                <span style={{ fontSize: "0.65rem", color: msg.isFromStore ? "#a0a0a0" : "var(--text-muted)", marginTop: "8px", display: "block", textAlign: msg.isFromStore ? "right" : "left" }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {messages.filter(m => m.customerId === activeCustomerId).length === 0 && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "monospace" }}>
                No messages yet.
              </div>
            )}
          </div>

          <div style={{ padding: "15px", borderTop: "1px solid var(--card-border)", background: "white", display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              style={{ flex: 1, padding: "12px", border: "1px solid var(--card-border)", borderRadius: "0", fontFamily: "monospace" }}
            />
            <button
              className="btn-primary"
              onClick={handleSendMessage}
              style={{ background: "var(--text-primary)", padding: "10px 24px", borderRadius: "0" }}
            >Send</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHelpCenter = () => (
    <div className="saas-card" style={{ padding: "30px", minHeight: "60vh" }}>
      <h2 style={{ fontSize: "1.2rem", textTransform: "uppercase", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px" }}>Help Center</h2>
      <div style={{ display: "grid", gap: "15px" }}>
        <div style={{ padding: "15px", border: "1px solid var(--card-border)", background: "var(--bg-primary)" }}>
          <h4 style={{ fontSize: "0.95rem", marginBottom: "5px" }}>How do I change my shop logo?</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Navigate to Settings {'>'} Brand Identity to upload a new monochrome logo.</p>
        </div>
        <div style={{ padding: "15px", border: "1px solid var(--card-border)", background: "var(--bg-primary)" }}>
          <h4 style={{ fontSize: "0.95rem", marginBottom: "5px" }}>Can I export my customer list?</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Yes, visit the Customer tab and click "Export CSV" to download your full CRM directory.</p>
        </div>
        <div style={{ padding: "15px", border: "1px solid var(--card-border)", background: "var(--bg-primary)" }}>
          <h4 style={{ fontSize: "0.95rem", marginBottom: "5px" }}>How is LTV calculated?</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Lifetime Value (LTV) is the total sum of all servings a customer has purchased across their bill history.</p>
        </div>
      </div>
      <div style={{ marginTop: "30px", padding: "20px", background: "var(--gray-100)", borderLeft: "4px solid #000000" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "10px" }}>Still need help?</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "15px" }}>Our support team is available 24/7 for Enterprise nodes.</p>
        <button className="btn-primary" style={{ background: "#000000" }}><Mail size={14} style={{ marginRight: "6px" }} /> Contact Support</button>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="saas-card" style={{ padding: "30px", minHeight: "60vh" }}>
      <h2 style={{ fontSize: "1.2rem", textTransform: "uppercase", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px" }}>Submit Feedback</h2>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>Help us improve the BILLIQ platform. All feedback is read directly by our engineering team.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxWidth: "500px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px" }}>Topic</label>
          <select style={{ width: "100%", padding: "10px", border: "1px solid var(--card-border)", background: "var(--bg-primary)" }}>
            <option>Feature Request</option>
            <option>Bug Report</option>
            <option>Design Suggestion</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px" }}>Message</label>
          <textarea rows="6" placeholder="Describe your idea or issue..." style={{ width: "100%", padding: "10px", border: "1px solid var(--card-border)", background: "var(--bg-primary)", resize: "vertical" }}></textarea>
        </div>
        <button className="btn-primary" style={{ background: "var(--text-primary)", width: "fit-content" }}>Submit Feedback</button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="saas-card" style={{ padding: "30px", minHeight: "60vh" }}>
      <h2 style={{ fontSize: "1.2rem", textTransform: "uppercase", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px" }}>Node Settings</h2>

      <div style={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <h3 style={{ fontSize: "1rem", marginBottom: "15px" }}>Shop Configuration</h3>
          <div style={{ display: "grid", gap: "15px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase" }}>Shop Name</label>
              <input type="text" defaultValue={shopName} style={{ width: "100%", padding: "12px", border: "1px solid var(--card-border)", background: "var(--bg-primary)", borderRadius: "0", fontFamily: "monospace" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase" }}>Contact Email</label>
              <input type="email" defaultValue={session?.user?.email || ""} style={{ width: "100%", padding: "12px", border: "1px solid var(--card-border)", background: "var(--bg-primary)", borderRadius: "0", fontFamily: "monospace" }} />
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "20px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "15px" }}>Brand Identity</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "15px" }}>
            <div style={{ padding: "10px 20px", background: "var(--bg-primary)", border: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Logo size="sm" dark={false} />
            </div>
            <button className="btn-secondary" style={{ borderRadius: "0" }}>Upload Custom Logo</button>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>We recommend using a monochrome SVG or PNG for best results.</p>
        </div>

        <button className="btn-primary" style={{ background: "var(--text-primary)", width: "fit-content", marginTop: "10px", borderRadius: "0" }}>Save Changes</button>
      </div>
    </div>
  );

  const renderEmail = () => (
    <div className="saas-card" style={{ padding: "30px", minHeight: "60vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px" }}>
        <h2 style={{ fontSize: "1.2rem", textTransform: "uppercase" }}>Email Campaigns</h2>
        <button className="btn-primary" onClick={handleSendCampaign} style={{ background: "var(--text-primary)", borderRadius: "0" }}>
          <Plus size={14} /> Compose Broadcast
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "20px" }}>
        <div style={{ border: "1px solid var(--card-border)", height: "450px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "15px", borderBottom: "1px solid var(--card-border)", background: "var(--bg-primary)" }}>
            <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase" }}>Recent Broadcasts</h3>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {emailCampaigns.length > 0 ? emailCampaigns.map((camp, idx) => (
              <div key={idx} style={{ padding: "15px", borderBottom: "1px solid var(--card-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase" }}>{camp.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(camp.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{camp.subject}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "5px" }}>Sent to {camp.sentToCount} customers</div>
              </div>
            )) : (
              <div style={{ flex: 1, padding: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "monospace", textTransform: "uppercase" }}>
                No recent campaigns.
              </div>
            )}
          </div>
        </div>
        <div style={{ border: "1px solid var(--card-border)", height: "450px", padding: "25px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase" }}>Campaign Name</label>
            <input
              type="text"
              value={emailForm.name}
              onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
              placeholder="e.g. Winter Promo"
              style={{ width: "100%", padding: "12px", border: "1px solid var(--card-border)", background: "var(--bg-primary)", borderRadius: "0", fontFamily: "monospace" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase" }}>Subject Line</label>
            <input
              type="text"
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              placeholder="Special offer inside..."
              style={{ width: "100%", padding: "12px", border: "1px solid var(--card-border)", background: "var(--bg-primary)", borderRadius: "0", fontFamily: "monospace" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase" }}>Message Body</label>
            <textarea
              value={emailForm.body}
              onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
              placeholder="Write your broadcast..."
              style={{ width: "100%", flex: 1, padding: "12px", border: "1px solid var(--card-border)", background: "var(--bg-primary)", resize: "none", borderRadius: "0", fontFamily: "monospace" }}
            ></textarea>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button className="btn-secondary" style={{ borderRadius: "0" }}>Save Draft</button>
            <button
              className="btn-primary"
              onClick={handleSendCampaign}
              style={{ background: "var(--text-primary)", borderRadius: "0" }}
            >Send to {activeCustomers} Customers</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-typography" style={{ display: "flex", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* SIDEBAR */}
      <aside style={{ width: "260px", background: "var(--card-bg)", borderRight: "1px solid var(--card-border)", display: "flex", flexDirection: "column", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px", padding: "10px" }}>
          <Logo size="sm" dark={false} />
        </div>

        <div style={{ position: "relative", marginBottom: "30px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search" style={{ width: "100%", padding: "10px 10px 10px 36px", background: "var(--bg-primary)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }} />
          <div style={{ position: "absolute", right: "8px", top: "8px", background: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", color: "var(--text-muted)", border: "1px solid var(--card-border)" }}>⌘ K</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "10px", paddingLeft: "10px" }}>OPERATIONS</p>
          <SidebarItem icon={LayoutDashboard} label="Overview" isActive={activeMenu === "Overview"} onClick={() => setActiveMenu("Overview")} />
          <SidebarItem icon={Utensils} label="POS" isActive={false} onClick={() => router.push("/pos")} />
          
          {(data?.shop?.businessType === "RESTAURANT" || data?.shop?.category === "Restaurant" || data?.shop?.category === "Cafe") && (
            <>
              <SidebarItem icon={Monitor} label="Kitchen" isActive={false} onClick={() => router.push("/kitchen")} />
              <SidebarItem icon={Grid3X3} label="Tables" isActive={activeMenu === "Tables"} onClick={() => setActiveMenu("Tables")} />
              <SidebarItem icon={List} label="Menu" isActive={activeMenu === "Menu"} onClick={() => setActiveMenu("Menu")} />
            </>
          )}

          {data?.shop?.businessType !== "RESTAURANT" && data?.shop?.category !== "Restaurant" && data?.shop?.category !== "Cafe" && (
            <>
              <SidebarItem icon={Package} label="Inventory" isActive={activeMenu === "Menu"} onClick={() => setActiveMenu("Menu")} />
            </>
          )}

          <SidebarItem icon={ShoppingCart} label="Orders" isActive={activeMenu === "Order History"} onClick={() => setActiveMenu("Order History")} />

          <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", marginTop: "25px", marginBottom: "10px", paddingLeft: "10px" }}>GROWTH</p>
          <SidebarItem icon={Users} label="Customers" isActive={activeMenu === "Customers"} onClick={() => setActiveMenu("Customers")} />
          <SidebarItem icon={MessageSquare} label="Message" badge={data?.unreadMessages ? data.unreadMessages : null} isActive={activeMenu === "Message"} onClick={() => setActiveMenu("Message")} />
          <SidebarItem icon={Zap} label="WA Offers" isActive={false} onClick={() => router.push("/dashboard/offers")} />
          <SidebarItem icon={Mail} label="Email" isActive={activeMenu === "Email"} onClick={() => setActiveMenu("Email")} />
        </div>

        <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "20px", marginTop: "20px" }}>
          <SidebarItem icon={Settings} label="Settings" isActive={activeMenu === "Settings"} />
          <div onClick={() => setActiveMenu("Upgrade")} style={{ marginTop: "15px", background: "var(--accent-light)", padding: "15px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "var(--accent-primary)", padding: "6px", borderRadius: "6px", color: "white" }}><Zap size={14} /></div>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--accent-primary)" }}>Upgrade Node</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Enterprise</p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--accent-primary)" }} />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflowY: "auto", padding: "30px" }}>

        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "1.8rem", color: "var(--text-primary)" }}>{activeMenu === "Dashboard" ? "Overview" : activeMenu}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <NotificationSystem />
            <div
              onClick={() => router.push("/dashboard/profile")}
              style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--card-bg)", padding: "4px 16px 4px 4px", borderRadius: "100px", border: "1px solid var(--card-border)", cursor: "pointer" }}
            >
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.8rem", fontWeight: "bold", textTransform: "uppercase" }}>
                {session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : "ST"}
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{session?.user?.name}</span>
            </div>
            <button className="btn-secondary" onClick={() => signOut()}><Settings size={16} /> Customize Widget</button>
          </div>
        </header>

        {activeMenu === "Overview" && renderDashboard()}
        {activeMenu === "Dashboard" && renderDashboard()}
        {activeMenu === "Menu" && renderMenu()}
        {activeMenu === "Tables" && renderTables()}
        {activeMenu === "Order History" && renderOrders()}
        {activeMenu === "Order" && renderOrders()}
        {activeMenu === "Customers" && renderCustomers()}
        {activeMenu === "Customer" && renderCustomers()}
        {activeMenu === "Message" && renderMessage()}
        {activeMenu === "Email" && renderEmail()}
        {activeMenu === "Settings" && renderSettings()}
        {["Analytics", "Automation", "Integration", "Upgrade"].includes(activeMenu) && renderLockedModule(activeMenu)}

      </main>
    </div>
  );
}
