"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Onboarding() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storeName || !storePhone) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: storeName, phone: storePhone })
      });
      const data = await response.json();
      
      if (data.success) {
        // Save store ID to local storage to persist session
        localStorage.setItem("billify_store_id", data.store.id);
        localStorage.setItem("billify_store_name", data.store.name);
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(error);
      alert("Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: "40px 20px", display: "flex", alignItems: "center", justifyItems: "center" }}>
      <div className="container" style={{ maxWidth: "450px", width: "100%" }}>
        <div className="glass-panel" style={{ padding: "40px", background: "var(--bg-primary)" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1 className="text-gradient" style={{ fontSize: "2rem", marginBottom: "10px" }}>Store Onboarding</h1>
            <p style={{ color: "var(--text-secondary)" }}>Create your digital store profile to start generating bills and tracking sales.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Store Name</label>
              <input 
                type="text" 
                placeholder="e.g. Urban Cafe" 
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                required
                style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Store Phone Number</label>
              <input 
                type="tel" 
                placeholder="+91 98765 43210" 
                value={storePhone}
                onChange={e => setStorePhone(e.target.value)}
                required
                style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isSubmitting}
              style={{ width: "100%", padding: "14px", marginTop: "10px", fontSize: "1.05rem" }}
            >
              {isSubmitting ? "Setting up..." : "Create Store Dashboard"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Already have a store? <Link href="/onboarding" style={{ color: "var(--accent-primary)" }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
