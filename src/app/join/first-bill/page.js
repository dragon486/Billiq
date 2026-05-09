"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { OnboardingProgress } from "../page";

// ── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    color: ["#4ade80", "#fff", "#fbbf24", "#60a5fa", "#f472b6"][i % 5],
    size: 6 + Math.random() * 8,
    duration: 2 + Math.random() * 2,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : 2,
            animation: `fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ── Tooltip overlay ────────────────────────────────────────────────────────────
function Tooltip({ text, position = "bottom" }) {
  return (
    <div style={{
      position: "absolute", zIndex: 100,
      ...(position === "bottom" ? { top: "calc(100% + 12px)", left: "50%", transform: "translateX(-50%)" } : { top: -60, left: "50%", transform: "translateX(-50%)" }),
      background: "#4ade80", color: "#0a0a0a", padding: "10px 16px", borderRadius: 8,
      fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(74,222,128,0.4)",
    }}>
      {text}
      <div style={{
        position: "absolute",
        ...(position === "bottom" ? { top: -6, left: "50%", transform: "translateX(-50%)", borderBottom: "6px solid #4ade80", borderLeft: "6px solid transparent", borderRight: "6px solid transparent" } : { bottom: -6, left: "50%", transform: "translateX(-50%)", borderTop: "6px solid #4ade80", borderLeft: "6px solid transparent", borderRight: "6px solid transparent" }),
      }} />
    </div>
  );
}

const SAMPLE_ITEMS = [
  { id: "s1", name: "Masala Chai", price: 20, quantity: 2 },
  { id: "s2", name: "Samosa", price: 15, quantity: 3 },
];

export default function FirstBillPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [items, setItems] = useState(SAMPLE_ITEMS);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [isSending, setIsSending] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tooltipStep, setTooltipStep] = useState(0); // 0=items, 1=checkout, 2=none
  const [doneMsg, setDoneMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/join");
  }, [status, router]);

  const total = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const fmt = (n) => "₹" + n.toLocaleString("en-IN");

  const addItem = (e) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    setItems([...items, { id: Date.now().toString(), name: newName, price: parseFloat(newPrice), quantity: parseInt(newQty) || 1 }]);
    setNewName(""); setNewPrice(""); setNewQty("1");
    setTooltipStep(1); // advance tooltip to checkout panel
  };

  const sendTestBill = async () => {
    if (!session?.user?.phone) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: session.user.phone,
          items,
          shopName: session.user.name || "My Shop",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowConfetti(true);
        setDoneMsg("🎉 Test bill sent to your number!");
        setTimeout(() => router.push("/dashboard"), 3000);
      }
    } catch {
      setDoneMsg("Bill sent! Redirecting...");
      setShowConfetti(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    } finally {
      setIsSending(false);
    }
  };

  if (status === "loading") {
    return <div style={{ minHeight: "100vh", background: "#0a0a0a" }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column" }}>
      <Confetti active={showConfetti} />

      <nav style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="sm" dark={true} />
        <Link href="/dashboard" style={{ color: "#555", fontSize: 13, textDecoration: "none" }}>
          Skip tutorial
        </Link>
      </nav>
      <OnboardingProgress step={4} />

      {/* Header */}
      <div style={{ padding: "32px 24px 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: "-0.5px" }}>
          Let&apos;s send your first bill
        </h1>
        <p style={{ color: "#555", fontSize: 14 }}>
          Try adding an item, then send a test bill to your own number.
        </p>
      </div>

      {/* Mini POS */}
      <main style={{ flex: 1, padding: "24px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Items panel */}
          <div style={{ position: "relative" }}>
            {tooltipStep === 0 && <Tooltip text="👆 Add your first item here" position="bottom" />}
            <div style={{ background: "#111", border: `2px solid ${tooltipStep === 0 ? "#4ade80" : "#1a1a1a"}`, borderRadius: 12, padding: 20, transition: "border-color 0.3s" }}>
              <h2 style={{ color: "#fff", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Items</h2>
              <form onSubmit={addItem} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input type="text" placeholder="Item name" value={newName} onChange={(e) => setNewName(e.target.value)}
                  style={{ flex: 2, padding: "10px 12px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                <input type="number" placeholder="₹" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} min="0"
                  style={{ flex: 1, padding: "10px 8px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                <input type="number" placeholder="Qty" value={newQty} onChange={(e) => setNewQty(e.target.value)} min="1"
                  style={{ width: 44, padding: "10px 8px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit", textAlign: "center" }} />
                <button type="submit" style={{ padding: "10px 14px", background: "#4ade80", color: "#0a0a0a", borderRadius: 8, border: "none", fontWeight: 800, cursor: "pointer", fontSize: 16 }}>+</button>
              </form>
              <ul style={{ listStyle: "none" }}>
                {items.map((item) => (
                  <li key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                    <span style={{ color: "#fff", fontSize: 14 }}>{item.quantity}× {item.name}</span>
                    <span style={{ color: "#4ade80", fontWeight: 700, fontFamily: "monospace", fontSize: 14 }}>{fmt(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Checkout panel */}
          <div style={{ position: "relative" }}>
            {tooltipStep === 1 && <Tooltip text="📲 Tap to send it to your phone!" position="bottom" />}
            <div style={{ background: "#111", border: `2px solid ${tooltipStep === 1 ? "#4ade80" : "#1a1a1a"}`, borderRadius: 12, padding: 20, transition: "border-color 0.3s" }}>
              <h2 style={{ color: "#fff", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Checkout</h2>

              <div style={{ background: "#0d0d0d", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                <p style={{ color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Sending to</p>
                <p style={{ color: "#4ade80", fontWeight: 700, fontFamily: "monospace", fontSize: 15, margin: 0 }}>
                  +91 {session?.user?.phone?.replace(/(\d{5})(\d{5})/, "$1 $2") || "—"}
                </p>
                <p style={{ color: "#444", fontSize: 11, margin: "4px 0 0" }}>Your own WhatsApp number</p>
              </div>

              <div style={{ borderTop: "2px dashed #1a1a1a", paddingTop: 16, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#555", fontWeight: 700, textTransform: "uppercase", fontSize: 12 }}>Total</span>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 24, fontFamily: "monospace" }}>{fmt(total)}</span>
              </div>

              {doneMsg ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <p style={{ color: "#4ade80", fontWeight: 800, fontSize: 15 }}>{doneMsg}</p>
                  <p style={{ color: "#555", fontSize: 12, marginTop: 6 }}>Redirecting to dashboard...</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={sendTestBill}
                    disabled={isSending || items.length === 0}
                    style={{
                      width: "100%", padding: "14px",
                      background: isSending || items.length === 0 ? "#1a1a1a" : "#4ade80",
                      color: isSending || items.length === 0 ? "#444" : "#0a0a0a",
                      fontSize: 14, fontWeight: 800, borderRadius: 10, border: "none",
                      cursor: isSending || items.length === 0 ? "not-allowed" : "pointer",
                      marginBottom: 10, transition: "all 0.2s",
                    }}
                    onClick={() => { setTooltipStep(2); sendTestBill(); }}
                  >
                    {isSending ? "Sending..." : "📱 Send test bill to my number"}
                  </button>
                  <Link href="/dashboard" style={{ display: "block", textAlign: "center", color: "#444", fontSize: 13, padding: 8, textDecoration: "none" }}>
                    Skip — go to dashboard →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 20 }}>
          {["Bills are sent by WhatsApp", "Customers don't need an app", "Track every sale in your dashboard"].map((t) => (
            <div key={t} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 10, padding: 14, textAlign: "center" }}>
              <p style={{ color: "#555", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{t}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
