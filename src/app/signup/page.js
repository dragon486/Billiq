"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Logo from '@/components/Logo';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // Automatically sign in after signup
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        type: "shop",
      });

      if (signInRes?.error) {
        setError("Account created, but automatic login failed.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper bg-grid-pattern" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px", position: "relative" }}>
      <Link href="/" style={{ position: "absolute", top: "30px", left: "30px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontWeight: "500", transition: "color 0.2s ease" }} onMouseOver={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseOut={e => e.currentTarget.style.color = "var(--text-secondary)"}>
        ← RETURN
      </Link>
      <div className="saas-card" style={{ maxWidth: "450px", width: "100%", padding: "40px", border: "2px solid #000000" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <Logo size="md" dark={false} />
          </div>
          <h1 style={{ fontSize: "2rem", marginBottom: "10px", color: "var(--text-primary)" }}>INITIALIZE NODE</h1>
          <p style={{ color: "var(--text-secondary)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "600" }}>Create System Profile</p>
        </div>

        {error && (
          <div style={{ padding: "10px", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", borderRadius: "8px", marginBottom: "20px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Shop Name</label>
            <input 
              type="text" 
              name="name"
              placeholder="e.g. Urban Cafe" 
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Shop Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              placeholder="+91 98765 43210" 
              value={formData.phone}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Email Address</label>
            <input 
              type="email" 
              name="email"
              placeholder="shop@example.com" 
              value={formData.email}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Password</label>
            <input 
              type="password" 
              name="password"
              placeholder="••••••••" 
              value={formData.password}
              onChange={handleChange}
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
            {isLoading ? "Creating Account..." : "Create Shop Account"}
          </button>

        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Already have an account? <Link href="/login" style={{ color: "var(--accent-primary)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
