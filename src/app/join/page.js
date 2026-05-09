"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

// ── Shared Progress Bar ────────────────────────────────────────────────────────
export function OnboardingProgress({ step }) {
  const steps = ["Phone", "Verify", "Profile", "First Bill"];
  return (
    <div style={{ padding: "16px 24px", borderBottom: "1px solid #1a1a1a", display: "flex", gap: 0 }}>
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? "#4ade80" : active ? "#fff" : "#1a1a1a",
                border: active ? "2px solid #fff" : done ? "2px solid #4ade80" : "2px solid #333",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800,
                color: done ? "#0a0a0a" : active ? "#0a0a0a" : "#555",
                transition: "all 0.3s",
              }}>
                {done ? "✓" : num}
              </div>
              <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4, color: active ? "#fff" : done ? "#4ade80" : "#555" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ height: 2, flex: 1, background: done ? "#4ade80" : "#1a1a1a", margin: "0 4px", marginBottom: 20, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function JoinPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send OTP"); return; }
      sessionStorage.setItem("billiq_otp_phone", clean);
      // In dev mode, store the code for easy testing
      if (data.devCode) sessionStorage.setItem("billiq_dev_otp", data.devCode);
      router.push("/join/verify");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="sm" dark={true} />
        <Link href="/login" style={{ color: "#666", fontSize: 13, textDecoration: "none" }}>
          Already have an account? <span style={{ color: "#fff", fontWeight: 600 }}>Login</span>
        </Link>
      </nav>

      {/* Progress */}
      <OnboardingProgress step={1} />

      {/* Main */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 100, padding: "4px 14px", marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%", display: "block" }} />
            <span style={{ fontSize: 11, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Free forever for small shops</span>
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: "#fff", lineHeight: 1.05, marginBottom: 16, letterSpacing: "-1.5px" }}>
            Start sending<br />digital bills in<br /><span style={{ color: "#4ade80" }}>5 minutes.</span>
          </h1>
          <p style={{ color: "#666", fontSize: 16, marginBottom: 40, lineHeight: 1.6 }}>
            No app. No hardware. Just enter your WhatsApp number and you&apos;re ready to bill.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#555", fontSize: 15, fontWeight: 700, pointerEvents: "none" }}>+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(""); }}
                  required
                  maxLength={15}
                  style={{
                    width: "100%", padding: "18px 16px 18px 52px",
                    fontSize: 20, fontWeight: 600, letterSpacing: 2,
                    background: "#111", border: `2px solid ${error ? "#ef4444" : "#1a1a1a"}`,
                    borderRadius: 12, color: "#fff", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { if (!error) e.target.style.borderColor = "#4ade80"; }}
                  onBlur={(e) => { if (!error) e.target.style.borderColor = "#1a1a1a"; }}
                />
              </div>
              {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8, fontWeight: 500 }}>{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%", padding: "18px", background: isLoading ? "#333" : "#fff",
                color: "#0a0a0a", fontSize: 16, fontWeight: 800,
                borderRadius: 12, border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s", letterSpacing: "-0.3px",
              }}
            >
              {isLoading ? "Sending OTP..." : "Get started free →"}
            </button>
          </form>

          <p style={{ color: "#444", fontSize: 12, marginTop: 20, textAlign: "center", lineHeight: 1.6 }}>
            We&apos;ll send a 6-digit OTP to verify your number. No spam ever.
          </p>

          {/* Features row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 48 }}>
            {["₹0 setup cost", "Bills in 30 sec", "Works on any phone"].map((f) => (
              <div key={f} style={{ background: "#111", borderRadius: 10, padding: "14px 10px", textAlign: "center" }}>
                <p style={{ color: "#4ade80", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{f}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
