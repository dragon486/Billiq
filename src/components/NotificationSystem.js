"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, ExternalLink, Calendar, MessageSquare, Tag, AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const TYPE_ICONS = {
  NEW_BILL: { icon: "🧾", color: "#4ADE80" },
  OFFER_RECEIVED: { icon: "🛍️", color: "#60A5FA" },
  BUDGET_WARNING: { icon: "⚠️", color: "#FBBF24" },
  BUDGET_EXCEEDED: { icon: "🚨", color: "#EF4444" },
  NEW_CUSTOMER: { icon: "👤", color: "#A855F7" },
  DAILY_SUMMARY: { icon: "📊", color: "#10B981" },
  SMART_INSIGHT: { icon: "💡", color: "#F59E0B" }
};

export default function NotificationSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/notifications/count");
      const data = await res.json();
      setUnreadCount(data.unread || 0);
    } catch {}
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=20");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {}
    setLoading(false);
  };

  const markAsRead = async (id) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] })
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds })
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setIsOpen(false);
    
    // Logic to navigate based on type
    if (n.type === "NEW_BILL" && n.data?.billId) {
      router.push(`/b/${n.data.billId}`);
    } else if (n.type === "NEW_CUSTOMER") {
      router.push("/dashboard");
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 60000); // mins
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          position: "relative", padding: "8px", borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer",
          transition: "background 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "#1A1A1A"}
        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
      >
        <Bell size={22} color={unreadCount > 0 ? "#4ADE80" : "#555"} />
        {unreadCount > 0 && (
          <span style={{ 
            position: "absolute", top: "4px", right: "4px", width: "16px", height: "16px", 
            background: "#EF4444", color: "#fff", fontSize: "10px", fontWeight: "900", 
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #0A0A0A"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div style={{ 
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", 
          zIndex: 1000, display: "flex", justifyContent: "flex-end" 
        }} onClick={() => setIsOpen(false)}>
          <div 
            ref={drawerRef}
            style={{ 
              width: "100%", maxWidth: "400px", height: "100%", background: "#0A0A0A", 
              borderLeft: "1px solid #1A1A1A", display: "flex", flexDirection: "column",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.5)", animation: "slideInRight 0.3s ease-out"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ padding: "24px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0D0D0D" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Bell size={18} color="#4ADE80" />
                <h2 style={{ fontSize: "0.75rem", fontWeight: "900", letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>System Alerts</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    style={{ background: "none", border: "none", color: "#4ADE80", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Clear All
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={20} /></button>
              </div>
            </div>

            {/* Notifications List */}
            <div style={{ flex: 1, overflowY: "auto", background: "#050505" }}>
              {loading && notifications.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                   <div style={{ width: "32px", height: "32px", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#4ADE80", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }}></div>
                   <p style={{ fontSize: "10px", color: "#444", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em" }}>Synchronizing...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.2 }}>
                   <Bell size={64} color="#888" style={{ marginBottom: "24px" }} />
                   <p style={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.3em", color: "#888" }}>Zero Alerts Found</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      style={{ 
                        padding: "24px", cursor: "pointer", borderBottom: "1px solid #111", transition: "all 0.2s",
                        background: !n.read ? "rgba(74,222,128,0.02)" : "transparent",
                        position: "relative"
                      }}
                    >
                      {!n.read && <div style={{ position: "absolute", left: 0, top: 0, width: "3px", height: "100%", background: "#4ADE80", boxShadow: "0 0 10px rgba(74,222,128,0.3)" }}></div>}
                      <div style={{ display: "flex", gap: "20px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#111", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                          {TYPE_ICONS[n.type]?.icon || "🔔"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "4px" }}>
                            <h3 style={{ fontSize: "13px", fontWeight: "700", color: !n.read ? "#fff" : "#555", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {n.title}
                            </h3>
                            <span style={{ fontSize: "9px", color: "#444", fontWeight: "900", textTransform: "uppercase", flexShrink: 0 }}>
                              {formatTime(n.createdAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: "12px", lineHeight: "1.6", color: !n.read ? "#888" : "#444", margin: 0 }}>
                            {n.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "24px", borderTop: "1px solid #111", background: "#080808" }}>
              <button 
                onClick={() => { router.push("/dashboard/profile"); setIsOpen(false); }}
                style={{ 
                  width: "100%", padding: "16px", borderRadius: "12px", background: "#111", border: "1px solid #222", 
                  color: "#555", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.2em",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", transition: "all 0.2s"
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = "#4ADE80"; e.currentTarget.style.borderColor = "rgba(74,222,128,0.3)"; }}
                onMouseOut={(e) => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#222"; }}
              >
                <Settings size={14} /> Node Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
