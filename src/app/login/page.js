"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from '@/components/Logo';

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        identifier,
        email: identifier,
        phone: identifier,
        password,
        type: "shop",
      });

      if (res?.error) {
        setError(res.error);
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData?.user?.role === "superadmin") {
          router.push("/superadmin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper bg-grid-pattern" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px", position: "relative" }}>
      <Link href="/" style={{ position: "absolute", top: "30px", left: "30px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontWeight: "500", transition: "color 0.2s ease" }} onMouseOver={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseOut={e => e.currentTarget.style.color = "var(--text-secondary)"}>
        ← RETURN
      </Link>
      <div className="saas-card" style={{ maxWidth: "400px", width: "100%", padding: "40px", border: "2px solid #000000" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <Logo size="md" dark={false} />
          </div>
          <h1 style={{ fontSize: "2rem", marginBottom: "10px", color: "var(--text-primary)" }}>BILLIQ TERMINAL</h1>
          <p style={{ color: "var(--text-secondary)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "600" }}>System Authentication</p>
        </div>

        {error && (
          <div style={{ padding: "10px", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", borderRadius: "8px", marginBottom: "20px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Email or Phone Number</label>
            <input 
              type="text" 
              placeholder="Enter email or phone" 
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading}
            style={{ width: "100%", padding: "14px", marginTop: "10px", fontSize: "1.05rem", opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Don't have an account? <Link href="/signup" style={{ color: "var(--accent-primary)" }}>Register Shop</Link>
        </p>
      </div>
    </div>
  );
}
