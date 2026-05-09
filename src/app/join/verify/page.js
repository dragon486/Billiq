"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Logo from "@/components/Logo";
import { OnboardingProgress } from "../page";

const RESEND_WAIT = 30; // seconds

export default function VerifyPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_WAIT);
  const [devCode, setDevCode] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    const p = sessionStorage.getItem("billiq_otp_phone");
    if (!p) { router.replace("/join"); return; }
    setPhone(p);
    const dc = sessionStorage.getItem("billiq_dev_otp");
    if (dc) setDevCode(dc);
    inputRefs.current[0]?.focus();
  }, [router]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleDigitChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError("");

    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();

    // Auto-submit when all 6 filled
    if (val && idx === 5) {
      const full = [...next].join("");
      if (full.length === 6) handleVerify(full);
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...pasted.padEnd(6, "")].slice(0, 6);
    setDigits(next);
    if (pasted.length === 6) handleVerify(pasted);
    else inputRefs.current[pasted.length]?.focus();
  };

  const handleVerify = async (code) => {
    if (isLoading) return;
    const otp = code || digits.join("");
    if (otp.length !== 6) { setError("Please enter the 6-digit code"); return; }
    setIsLoading(true);
    setError("");

    try {
      // Step 1: verify OTP + create/find shop
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Incorrect code. Try again."); setDigits(["","","","","",""]); inputRefs.current[0]?.focus(); return; }

      // Step 2: create NextAuth session
      const signInResult = await signIn("credentials", {
        redirect: false,
        phone,
        type: "shop-otp",
      });

      if (signInResult?.error) {
        setError("Session creation failed. Please try again.");
        return;
      }

      sessionStorage.removeItem("billiq_dev_otp");
      // Redirect based on onboarding step
      if (data.onboardingStep >= 3) router.replace("/dashboard");
      else router.replace("/join/setup");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResendTimer(RESEND_WAIT);
    setDigits(["", "", "", "", "", ""]);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.devCode) { setDevCode(data.devCode); sessionStorage.setItem("billiq_dev_otp", data.devCode); }
    } catch {}
    inputRefs.current[0]?.focus();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "20px 24px" }}>
        <Logo size="sm" dark={true} />
      </nav>
      <OnboardingProgress step={2} />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "rgba(74,222,128,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 28 }}>
            📱
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: "-1px" }}>Check your WhatsApp</h1>
          <p style={{ color: "#555", fontSize: 14, marginBottom: 8 }}>
            We sent a 6-digit code to
          </p>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 32, fontFamily: "monospace" }}>
            +91 {phone.replace(/(\d{5})(\d{5})/, "$1 $2")}
          </p>

          {/* Dev mode hint */}
          {devCode && (
            <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 24, textAlign: "left" }}>
              <p style={{ color: "#eab308", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, margin: "0 0 4px" }}>Dev mode</p>
              <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, fontFamily: "monospace", letterSpacing: 4, margin: 0 }}>{devCode}</p>
            </div>
          )}

          {/* 6-digit input */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                style={{
                  width: 46, height: 56, textAlign: "center", fontSize: 22, fontWeight: 800,
                  background: d ? "#1a1a1a" : "#111",
                  border: `2px solid ${error ? "#ef4444" : d ? "#4ade80" : "#1a1a1a"}`,
                  borderRadius: 10, color: "#fff", outline: "none",
                  transition: "border-color 0.15s",
                  fontFamily: "monospace",
                }}
              />
            ))}
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>{error}</p>}

          <button
            onClick={() => handleVerify()}
            disabled={isLoading || digits.join("").length < 6}
            style={{
              width: "100%", padding: "16px",
              background: digits.join("").length === 6 && !isLoading ? "#fff" : "#1a1a1a",
              color: digits.join("").length === 6 && !isLoading ? "#0a0a0a" : "#444",
              fontSize: 15, fontWeight: 800, borderRadius: 12, border: "none",
              cursor: digits.join("").length === 6 && !isLoading ? "pointer" : "not-allowed",
              transition: "all 0.2s", marginBottom: 20,
            }}
          >
            {isLoading ? "Verifying..." : "Verify & Continue →"}
          </button>

          <button
            onClick={handleResend}
            disabled={resendTimer > 0}
            style={{
              background: "none", border: "none", cursor: resendTimer > 0 ? "not-allowed" : "pointer",
              color: resendTimer > 0 ? "#444" : "#4ade80", fontSize: 13, fontWeight: 600, padding: 8,
            }}
          >
            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
          </button>
        </div>
      </main>
    </div>
  );
}
