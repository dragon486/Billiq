"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      type: "superadmin",
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/superadmin");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ padding: "40px", background: "#111", borderRadius: "16px", border: "1px solid #222", width: "100%", maxWidth: "400px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
          <Logo size="lg" />
        </div>
        <h1 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 900, textAlign: "center", marginBottom: "8px" }}>SYSTEM OVERRIDE</h1>
        <p style={{ color: "#888", fontSize: "0.9rem", textAlign: "center", marginBottom: "32px" }}>Authorized personnel only.</p>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, marginBottom: "24px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", color: "#888", fontSize: "0.75rem", fontWeight: 700, marginBottom: "8px" }}>ADMIN EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "12px 16px", background: "#000", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "1rem" }}
            />
          </div>
          <div>
            <label style={{ display: "block", color: "#888", fontSize: "0.75rem", fontWeight: 700, marginBottom: "8px" }}>PASSWORD</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "12px 16px", background: "#000", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "1rem" }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: "16px", width: "100%", padding: "16px", background: "#fff", color: "#000", border: "none", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 900, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "AUTHENTICATING..." : "ACCESS DASHBOARD"}
          </button>
        </form>
      </div>
    </div>
  );
}
