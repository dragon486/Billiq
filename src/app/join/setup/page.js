"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import { OnboardingProgress } from "../page";

const CATEGORIES = [
  "Grocery", "Food & Dining", "Medical / Pharmacy",
  "Electronics", "Clothing & Fashion", "Salon / Beauty",
  "Hardware", "Stationary", "Other",
];

export default function SetupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState({ name: "", category: "", address: "", gstNumber: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/join");
  }, [status, router]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Shop name is required"); return; }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shop/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      router.push("/join/first-bill");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#555" }}>Loading...</p></div>;
  }

  const inputStyle = {
    width: "100%", padding: "14px 16px", background: "#111",
    border: "2px solid #1a1a1a", borderRadius: 10, color: "#fff",
    fontSize: 15, outline: "none", fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "20px 24px" }}><Logo size="sm" dark={true} /></nav>
      <OnboardingProgress step={3} />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: "-1px" }}>
            Set up your shop
          </h1>
          <p style={{ color: "#555", fontSize: 14, marginBottom: 32 }}>
            This info appears on every bill you send. You can change it later.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Shop Name */}
            <div>
              <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", fontWeight: 700, marginBottom: 8 }}>
                Shop Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ravi General Store"
                value={form.name}
                onChange={set("name")}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#4ade80"}
                onBlur={(e) => e.target.style.borderColor = "#1a1a1a"}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", fontWeight: 700, marginBottom: 8 }}>
                Shop Category
              </label>
              <select
                value={form.category}
                onChange={set("category")}
                style={{ ...inputStyle, cursor: "pointer", appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23555' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 14px) 50%",
                }}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* WhatsApp number */}
            <div>
              <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", fontWeight: 700, marginBottom: 8 }}>
                WhatsApp Number
              </label>
              <input
                type="text"
                value={`+91 ${session?.user?.phone?.replace(/(\d{5})(\d{5})/, "$1 $2") || ""}`}
                readOnly
                style={{ ...inputStyle, background: "#0d0d0d", color: "#444", cursor: "not-allowed" }}
              />
              <p style={{ fontSize: 11, color: "#444", marginTop: 6 }}>This is where customers will reach you.</p>
            </div>

            {/* Address */}
            <div>
              <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", fontWeight: 700, marginBottom: 8 }}>
                Address <span style={{ color: "#333" }}>(optional)</span>
              </label>
              <textarea
                placeholder="Shop 3, Main Market, Sector 12, Delhi"
                value={form.address}
                onChange={set("address")}
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={(e) => e.target.style.borderColor = "#4ade80"}
                onBlur={(e) => e.target.style.borderColor = "#1a1a1a"}
              />
            </div>

            {/* GST */}
            <div>
              <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", fontWeight: 700, marginBottom: 8 }}>
                GST Number <span style={{ color: "#333" }}>(optional — for GST invoices)</span>
              </label>
              <input
                type="text"
                placeholder="29ABCDE1234F1Z5"
                value={form.gstNumber}
                onChange={set("gstNumber")}
                style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: 2 }}
                onFocus={(e) => e.target.style.borderColor = "#4ade80"}
                onBlur={(e) => e.target.style.borderColor = "#1a1a1a"}
              />
            </div>

            {error && <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 500 }}>{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%", padding: "18px",
                background: isLoading ? "#1a1a1a" : "#fff",
                color: isLoading ? "#444" : "#0a0a0a",
                fontSize: 16, fontWeight: 800, borderRadius: 12, border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s", marginTop: 8,
              }}
            >
              {isLoading ? "Saving..." : "Save & Continue →"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
