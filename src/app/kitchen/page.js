"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSSE } from "@/hooks/useSSE";
import Logo from "@/components/Logo";
import { 
  Clock, CheckCircle2, Play, AlertCircle, 
  ChevronRight, Utensils, LayoutDashboard, Volume2, VolumeX, Check
} from "lucide-react";

// Web Audio Sound Engine
const playSound = (type) => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "new") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "ready") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === "urgent") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(440, now + 0.1);
      osc.frequency.setValueAtTime(220, now + 0.2);
      osc.frequency.setValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

export default function KDS() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0, avgWait: 0 });
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { data: session, status } = useSession();
  const router = useRouter();
  const lastOrderCount = useRef(0);

  // Timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { connected } = useSSE({
    url: `/api/kitchen/stream?shopId=${session?.user?.id}`,
    enabled: status === "authenticated",
    onMessage: (event, data) => {
      if (event === 'initial_state' || event === 'order:update') {
        setOrders(data.orders || []);
        setStats(data.stats || { pending: 0, preparing: 0, ready: 0, avgWait: 0 });

        // Sound alerts for new orders
        if (data.orders?.length > lastOrderCount.current && soundEnabled) {
          playSound("new");
        }
        lastOrderCount.current = data.orders?.length || 0;
      }
    }
  });

  useEffect(() => {
    setConnectionStatus(connected ? "connected" : "error");
  }, [connected]);

  // Wake Lock
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.warn("Wake Lock failed", err);
      }
    };
    requestWakeLock();
    return () => { wakeLock?.release(); };
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch("/api/kitchen/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok && newStatus === "ready" && soundEnabled) {
        playSound("ready");
      }
    } catch (err) {
      alert("Error updating status");
    }
  };

  const toggleItem = async (itemId, completed) => {
    try {
      await fetch("/api/kitchen/item-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, completed }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatElapsed = (createdAt) => {
    const diffMs = currentTime - new Date(createdAt).getTime();
    const diffSec = Math.floor(Math.abs(diffMs) / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgency = (createdAt) => {
    const diffMins = (currentTime - new Date(createdAt).getTime()) / 60000;
    if (diffMins > 10) return "urgent";
    if (diffMins > 5) return "warning";
    return "normal";
  };

  if (status === "loading") return <div className="loading-screen" style={{ minHeight: "100vh", background: "#050505", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>KITCHEN TERMINAL WARMING UP...</div>;

  if (connectionStatus === "error" && orders.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: "24px" }} />
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "8px" }}>MODULE LOCKED</h1>
        <p style={{ color: "#888", marginBottom: "32px" }}>The Kitchen Display module has been disabled by the Super Admin.</p>
        <button onClick={() => router.push("/dashboard")} style={{ padding: "12px 24px", borderRadius: 8, background: "#fff", color: "#000", cursor: "pointer", fontSize: "0.9rem", fontWeight: 900, border: "none" }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const colOrders = {
    pending: orders.filter(o => o.status === "pending"),
    preparing: orders.filter(o => o.status === "preparing"),
    ready: orders.filter(o => o.status === "ready")
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif" }}>
      {/* ── TOP STATS BAR ── */}
      <header style={{ 
        padding: "16px 40px", background: "#000", borderBottom: "1px solid #111",
        display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Logo size="sm" />
          <div style={{ display: "flex", gap: 24 }}>
            <StatItem label="PENDING" value={stats.pending} color="#FBBF24" />
            <StatItem label="PREPARING" value={stats.preparing} color="#60A5FA" />
            <StatItem label="READY" value={stats.ready} color="#4ADE80" />
            <StatItem label="AVG WAIT" value={`${stats.avgWait}m`} color="#888" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ background: "none", border: "none", color: soundEnabled ? "#4ADE80" : "#555", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", fontWeight: 800 }}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />} {soundEnabled ? "SOUND ON" : "MUTED"}
          </button>
          <div style={{ width: 1, height: 24, background: "#111" }}></div>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "8px 16px", borderRadius: 8, background: "#111", border: "1px solid #222", color: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>
            Dashboard
          </button>
        </div>
      </header>

      {/* ── 3-COLUMN GRID ── */}
      <main style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, height: "calc(100vh - 73px)" }}>
        <Column 
          title="PENDING" 
          accent="#FBBF24" 
          count={colOrders.pending.length}
          orders={colOrders.pending}
          renderCard={(o) => (
            <OrderCard 
              key={o.id}
              order={o} 
              currentTime={currentTime}
              onAction={() => updateStatus(o.id, "preparing")}
              actionLabel="START PREPARING"
              accent="#FBBF24"
            />
          )}
        />
        <Column 
          title="PREPARING" 
          accent="#60A5FA" 
          count={colOrders.preparing.length}
          orders={colOrders.preparing}
          renderCard={(o) => {
            const allDone = o.items.every(i => i.completedAt);
            return (
              <OrderCard 
                key={o.id}
                order={o} 
                currentTime={currentTime}
                onAction={() => updateStatus(o.id, "ready")}
                actionLabel="MARK AS READY"
                accent="#60A5FA"
                showItems={true}
                onItemToggle={(itemId, done) => toggleItem(itemId, done)}
                allDone={allDone}
              />
            );
          }}
        />
        <Column 
          title="READY" 
          accent="#4ADE80" 
          count={colOrders.ready.length}
          orders={colOrders.ready}
          renderCard={(o) => (
            <OrderCard 
              key={o.id}
              order={o} 
              currentTime={currentTime}
              onAction={() => updateStatus(o.id, "served")}
              actionLabel="MARK SERVED"
              accent="#4ADE80"
              statusLabel="Ready"
            />
          )}
        />
      </main>

      <style jsx global>{`
        @keyframes pulse-border {
          0% { border-color: #ef4444; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { border-color: #ff0000; box-shadow: 0 0 20px 5px rgba(239, 68, 68, 0.4); }
          100% { border-color: #ef4444; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        }
        @keyframes pulse-ready {
          0% { transform: scale(1); background: #4ade80; }
          50% { transform: scale(1.02); background: #22c55e; }
          100% { transform: scale(1); background: #4ade80; }
        }
        .animate-urgent { animation: pulse-border 2s infinite; }
        .animate-ready-btn { animation: pulse-ready 1.5s infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#555", letterSpacing: "1px" }}>{label}</span>
      <span style={{ fontSize: "1.2rem", fontWeight: 900, color }}>{value}</span>
    </div>
  );
}

function Column({ title, accent, count, orders, renderCard }) {
  return (
    <div style={{ borderRight: "1px solid #111", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "0.8rem", fontWeight: 900, color: accent, letterSpacing: "2px", margin: 0 }}>{title}</h2>
        <span style={{ background: accent, color: "#000", fontSize: "0.7rem", fontWeight: 900, padding: "2px 8px", borderRadius: 100 }}>{count}</span>
      </div>
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
        {orders.map(renderCard)}
      </div>
    </div>
  );
}

function OrderCard({ order, currentTime, onAction, actionLabel, accent, showItems, onItemToggle, allDone, statusLabel }) {
  const diffMins = (currentTime - new Date(order.createdAt).getTime()) / 60000;
  const urgency = diffMins > 10 ? "urgent" : diffMins > 5 ? "warning" : "normal";
  const timerColor = urgency === "urgent" ? "#ef4444" : urgency === "warning" ? "#FBBF24" : "#4ade80";

  const formatElapsed = (createdAt) => {
    const diffMs = currentTime - new Date(createdAt).getTime();
    const diffSec = Math.floor(Math.abs(diffMs) / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={urgency === "urgent" && order.status !== "ready" ? "animate-urgent" : ""} style={{ 
      background: "#111", border: `1px solid ${urgency === "urgent" ? "#ef4444" : "#222"}`, 
      borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#555", textTransform: "uppercase" }}>
            {order.bill?.table?.number ? `TABLE ${order.bill.table.number}` : "TAKEAWAY"} · {order.bill?.table?.number ? "DINE-IN" : "COLLECT"}
          </div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 900, margin: "4px 0" }}>#{order.billId.slice(-4).toUpperCase()}</h3>
          {order.estimatedMinutes && (
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#60A5FA" }}>ETA {order.estimatedMinutes} min</div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 900, fontFamily: "monospace", color: timerColor }}>
            {statusLabel ? statusLabel : formatElapsed(order.createdAt)}
          </div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#444" }}>
            {statusLabel ? `${formatElapsed(order.createdAt)} ago` : "WAITING"}
          </div>
        </div>
      </div>

      {showItems && (
        <div style={{ borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "12px 0" }}>
          {order.items.map((item, idx) => (
            <div 
              key={item.id} 
              onClick={() => onItemToggle(item.id, !item.completedAt)}
              style={{ 
                display: "flex", justifyContent: "space-between", padding: "8px 0", cursor: "pointer",
                opacity: item.completedAt ? 0.4 : 1, transition: "opacity 0.2s"
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontWeight: 900, color: accent }}>{item.qty}x</span>
                <span style={{ fontWeight: 600, textDecoration: item.completedAt ? "line-through" : "none" }}>{item.name}</span>
              </div>
              <div style={{ 
                width: 20, height: 20, borderRadius: "50%", border: `2px solid ${item.completedAt ? accent : "#333"}`,
                display: "flex", alignItems: "center", justifyContent: "center", background: item.completedAt ? accent : "transparent"
              }}>
                {item.completedAt && <Check size={12} color="#000" strokeWidth={4} />}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.65rem", fontWeight: 800, color: "#4ade80", background: "rgba(74,222,128,0.05)", padding: "4px 8px", borderRadius: 4, width: "fit-content" }}>
          WA sent · "{order.status === "pending" ? `Ready in ~${order.estimatedMinutes} min` : order.status === "preparing" ? "Being prepared now" : "Your order is ready!"}"
        </div>
      </div>

      <button 
        onClick={onAction}
        className={allDone && order.status === "preparing" ? "animate-ready-btn" : ""}
        style={{ 
          width: "100%", padding: "16px", borderRadius: 12, border: "none", 
          background: (allDone || order.status !== "preparing") ? accent : "#222", 
          color: (allDone || order.status !== "preparing") ? "#000" : "#555",
          fontSize: "0.9rem", fontWeight: 900, cursor: "pointer", transition: "all 0.3s"
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
