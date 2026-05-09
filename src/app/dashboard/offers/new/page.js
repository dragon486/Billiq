"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const AUDIENCE_OPTIONS = [
  { value: "all",         label: "All customers",    desc: "Everyone who ever got a bill from your shop" },
  { value: "regular",     label: "Regular customers", desc: "Visited 3+ times — your loyal base" },
  { value: "inactive",    label: "Win-back",          desc: "No visit in the last 30 days" },
  { value: "highspender", label: "High spenders",     desc: "Top 20% by total spend — your VIPs" },
];

const DISCOUNT_TYPES = [
  { value: "pct",    label: "% Off" },
  { value: "rs",     label: "₹ Off" },
  { value: "free",   label: "Free item" },
  { value: "custom", label: "Custom" },
];

const THEMES = [
  { value: "dark",    label: "Dark",    bg: "#0A0A0A" },
  { value: "saffron", label: "Saffron", bg: "#E8671A" },
  { value: "green",   label: "Green",   bg: "#1D9E75" },
  { value: "royal",   label: "Royal",   bg: "#1A1446" },
];

function VisualPreview({ theme, title, message, discountType, discountValue, validUntil, shopName, imageMode, imageUrl }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullImageUrl = imageUrl?.startsWith("/") ? `${origin}${imageUrl}` : imageUrl;

  const params = new URLSearchParams({
    title, message, discountType, discountValue, theme, shop: shopName, 
    validUntil: validUntil || new Date().toISOString(),
    imageMode, imageUrl: fullImageUrl || ""
  }).toString();
  const previewUrl = `/api/offers/image/preview?${params}`;

  return (
    <div style={{ marginTop: 32 }}>
      <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Marketing Card Preview</p>
      <div style={{ position: "relative", aspectRatio: "1080/566", width: "100%", background: "#111", borderRadius: 16, overflow: "hidden", border: "1px solid #1a1a1a", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        <img src={previewUrl} alt="Offer Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "#fff", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
          {imageMode === "custom" ? "Custom Photo" : "Generated via OG"}
        </div>
      </div>
    </div>
  );
}

function WhatsAppPreview({ storeName, title, message, discountType, discountValue, validUntil }) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://billiq.in";
  const disc = discountValue
    ? discountType === "pct" ? `${discountValue}% off`
    : discountType === "rs" ? `₹${discountValue} off`
    : discountType === "free" ? "Free item included" : discountValue
    : null;
  const dateStr = validUntil ? new Date(validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null;

  return (
    <div style={{ background: "#e5ddd5", borderRadius: 12, padding: 16, fontFamily: "'Segoe UI', sans-serif" }}>
      <p style={{ fontSize: 11, color: "#667781", marginBottom: 8, textAlign: "center" }}>WhatsApp preview</p>
      <div style={{ background: "#fff", borderRadius: 8, padding: "12px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", maxWidth: 300, marginLeft: "auto" }}>
        <p style={{ fontSize: 12, color: "#25D366", fontWeight: 700, margin: "0 0 4px" }}>{storeName || "Your Shop"}</p>
        <div style={{ fontSize: 13, color: "#111", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          <p style={{ margin: "0 0 4px" }}>🛍️ <strong>{title || "Your Offer Title"}</strong></p>
          {message && <p style={{ margin: "0 0 4px" }}>{message}</p>}
          {disc && <p style={{ margin: "0 0 4px" }}>💰 {disc}</p>}
          {dateStr && <p style={{ margin: "0 0 4px" }}>📅 Valid until: {dateStr}</p>}
          <p style={{ margin: "4px 0 0", color: "#999", fontSize: 11 }}>_Powered by BILLIQ_</p>
          <p style={{ margin: "4px 0 0", color: "#999", fontSize: 11 }}>Reply STOP to unsubscribe</p>
        </div>
        <p style={{ fontSize: 11, color: "#667781", textAlign: "right", margin: "8px 0 0" }}>now ✓✓</p>
      </div>
    </div>
  );
}

export default function NewOfferPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const { data: session, status } = useSession();
  const [form, setForm] = useState({
    title: "", message: "", discountType: "pct", discountValue: "",
    validUntil: "", audienceType: "all", scheduledAt: "", theme: "dark",
    imageMode: "generated", imageUrl: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [audienceCount, setAudienceCount] = useState(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const storeName = session?.user?.name || "Your Shop";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const fetchCount = useCallback(
    (() => {
      let timer;
      return (type) => {
        clearTimeout(timer);
        setIsLoadingCount(true);
        timer = setTimeout(async () => {
          try {
            const res = await fetch(`/api/offers/audience-count?type=${type}`);
            const data = await res.json();
            setAudienceCount(data.count);
          } catch { setAudienceCount(null); }
          finally { setIsLoadingCount(false); }
        }, 500);
      };
    })(),
    []
  );

  useEffect(() => { fetchCount(form.audienceType); }, [form.audienceType, fetchCount]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large (max 5MB)");
      return;
    }

    setIsUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setForm(f => ({ ...f, imageUrl: data.url }));
      } else {
        setError("Upload failed");
      }
    } catch (err) {
      setError("Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.message.trim()) { setError("Message is required"); return; }
    if (form.message.length > 160) { setError("Message must be ≤ 160 characters"); return; }
    if (form.imageMode === "custom" && !form.imageUrl) { setError("Please upload a product photo"); return; }
    
    setIsSending(true); setError("");
    try {
      const res = await fetch("/api/offers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discountValue: form.discountValue ? parseFloat(form.discountValue) : null,
          scheduledAt: isScheduled && form.scheduledAt ? form.scheduledAt : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create offer"); return; }
      setSuccess(data);
    } catch { setError("Network error. Please try again."); }
    finally { setIsSending(false); }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", background: "#111", border: "1px solid #1a1a1a",
    borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit",
    transition: "border-color 0.2s",
  };
  const labelStyle = { display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", fontWeight: 700, marginBottom: 8 };
  const sectionStyle = { background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 20, marginBottom: 16 };

  if (status === "loading") return <div style={{ minHeight: "100vh", background: "#0a0a0a" }} />;

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 60, marginBottom: 24 }}>🎉</div>
          <h1 style={{ color: "#4ade80", fontSize: "1.8rem", fontWeight: 900, marginBottom: 8 }}>Offer Launched!</h1>
          <p style={{ color: "#555", marginBottom: 8 }}>Reaching <strong style={{ color: "#fff" }}>{success.audienceCount} customers</strong></p>
          {success.scheduled ? (
            <p style={{ color: "#666", fontSize: 13 }}>Scheduled for {new Date(success.scheduled).toLocaleString("en-IN")}</p>
          ) : (
            <p style={{ color: "#666", fontSize: 13 }}>Messages are being sent now.</p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
            <Link href={`/dashboard/offers`} style={{ padding: "12px 24px", background: "#fff", color: "#0a0a0a", borderRadius: 10, fontWeight: 800, textDecoration: "none", fontSize: 14 }}>
              View Offers →
            </Link>
            <button onClick={() => { setSuccess(null); setForm({ title:"",message:"",discountType:"pct",discountValue:"",validUntil:"",audienceType:"all",scheduledAt:"",theme:"dark",imageMode:"generated",imageUrl:"" }); }}
              style={{ padding: "12px 24px", background: "#1a1a1a", color: "#fff", borderRadius: 10, fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14 }}>
              New Offer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Link href="/dashboard/offers" style={{ color: "#555", fontSize: 13, textDecoration: "none" }}>← Offers</Link>
          <h1 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 900, marginTop: 4, letterSpacing: "-0.5px" }}>New Offer</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSend} disabled={isSending || audienceCount === 0 || isUploading}
            style={{
              padding: "12px 24px", background: isSending || audienceCount === 0 || isUploading ? "#1a1a1a" : "#4ade80",
              color: isSending || audienceCount === 0 || isUploading ? "#444" : "#0a0a0a",
              borderRadius: 10, border: "none", fontWeight: 800, cursor: isSending || audienceCount === 0 || isUploading ? "not-allowed" : "pointer",
              fontSize: 14, transition: "all 0.2s",
            }}>
            {isSending ? "Sending..." : isScheduled ? "📅 Schedule" : "🚀 Send Now"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 0, height: "calc(100vh - 73px)" }}>
        <div style={{ overflowY: "auto", padding: 24 }}>
          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#ef4444", fontSize: 13 }}>{error}</div>}

          <div style={sectionStyle}>
            <h2 style={{ color: "#fff", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>1 — Offer Details</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Offer Title</label>
              <input type="text" placeholder="Weekend Special 🎉" value={form.title} onChange={set("title")} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#4ade80"} onBlur={(e) => e.target.style.borderColor = "#1a1a1a"} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={labelStyle}>Message</label>
                <span style={{ fontSize: 11, color: form.message.length > 160 ? "#ef4444" : "#555", fontWeight: 700 }}>{form.message.length}/160</span>
              </div>
              <textarea placeholder="Get 20% off this weekend! Show this message at the counter to claim." value={form.message}
                onChange={(e) => { setForm((f) => ({ ...f, message: e.target.value.slice(0, 160) })); }}
                rows={3} style={{ ...inputStyle, resize: "vertical" }}
                onFocus={(e) => e.target.style.borderColor = "#4ade80"} onBlur={(e) => e.target.style.borderColor = "#1a1a1a"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Discount Type</label>
                <select value={form.discountType} onChange={set("discountType")}
                  style={{ ...inputStyle, cursor: "pointer", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23555' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 12px) 50%" }}>
                  {DISCOUNT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Value</label>
                <input type="number" placeholder={form.discountType === "pct" ? "20" : "100"} value={form.discountValue} onChange={set("discountValue")} min="0" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#4ade80"} onBlur={(e) => e.target.style.borderColor = "#1a1a1a"} />
              </div>
              <div>
                <label style={labelStyle}>Valid Until</label>
                <input type="date" value={form.validUntil} onChange={set("validUntil")} min={new Date().toISOString().split("T")[0]}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                  onFocus={(e) => e.target.style.borderColor = "#4ade80"} onBlur={(e) => e.target.style.borderColor = "#1a1a1a"} />
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <label style={labelStyle}>Marketing Card Style</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button 
                  onClick={() => setForm({...form, imageMode: "generated"})}
                  style={{ 
                    flex: 1, padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: form.imageMode === "generated" ? "#4ADE80" : "#111",
                    color: form.imageMode === "generated" ? "#000" : "#555",
                    border: `1px solid ${form.imageMode === "generated" ? "#4ADE80" : "#1a1a1a"}`,
                    cursor: "pointer"
                  }}
                >
                  Automated Design
                </button>
                <button 
                  onClick={() => setForm({...form, imageMode: "custom"})}
                  style={{ 
                    flex: 1, padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: form.imageMode === "custom" ? "#4ADE80" : "#111",
                    color: form.imageMode === "custom" ? "#000" : "#555",
                    border: `1px solid ${form.imageMode === "custom" ? "#4ADE80" : "#1a1a1a"}`,
                    cursor: "pointer"
                  }}
                >
                  Product Photo
                </button>
              </div>

              {form.imageMode === "generated" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {THEMES.map(t => (
                    <button 
                      key={t.value}
                      onClick={() => setForm({...form, theme: t.value})}
                      style={{
                        padding: "16px 8px", borderRadius: 12, border: `2px solid ${form.theme === t.value ? '#4ADE80' : '#1A1A1A'}`,
                        background: t.bg, transition: "all 0.2s", cursor: "pointer", position: "relative"
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>{t.label}</span>
                      {form.theme === t.value && (
                        <div style={{ position: "absolute", top: -6, right: -6, background: "#4ADE80", color: "#000", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold" }}>
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Product Photo</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${form.imageUrl ? '#4ADE80' : '#1a1a1a'}`,
                      borderRadius: 12, padding: "32px 16px", textAlign: "center",
                      cursor: isUploading ? "not-allowed" : "pointer", background: "#0d0d0d",
                      transition: "all 0.2s", position: "relative"
                    }}
                  >
                    {isUploading ? (
                      <p style={{ color: "#555", fontSize: 13, margin: 0 }}>Uploading photo...</p>
                    ) : form.imageUrl ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <img src={form.imageUrl} style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 6 }} />
                        <p style={{ color: "#4ADE80", fontSize: 13, fontWeight: 700, margin: 0 }}>Photo uploaded! Click to change.</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 24 }}>📸</div>
                        <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: 0 }}>Select Product Image</p>
                        <p style={{ color: "#555", fontSize: 11, margin: 0 }}>JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: "#555", marginTop: 8 }}>We'll automatically overlay your branding and offer details on this photo.</p>
                </div>
              )}
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ color: "#fff", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>2 — Audience</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {AUDIENCE_OPTIONS.map((opt) => (
                <label key={opt.value} style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
                  background: form.audienceType === opt.value ? "rgba(74,222,128,0.08)" : "#0d0d0d",
                  border: `1px solid ${form.audienceType === opt.value ? "rgba(74,222,128,0.4)" : "#1a1a1a"}`,
                  borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                }}>
                  <input type="radio" name="audienceType" value={opt.value} checked={form.audienceType === opt.value}
                    onChange={() => setForm((f) => ({ ...f, audienceType: opt.value }))} style={{ marginTop: 2, accentColor: "#4ade80" }} />
                  <div>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>{opt.label}</p>
                    <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#0d0d0d", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
              {isLoadingCount ? (
                <p style={{ color: "#555", fontSize: 13, margin: 0 }}>Calculating audience...</p>
              ) : audienceCount !== null ? (
                <>
                  <span style={{ width: 8, height: 8, background: audienceCount > 0 ? "#4ade80" : "#ef4444", borderRadius: "50%" }} />
                  <p style={{ color: audienceCount > 0 ? "#4ade80" : "#ef4444", fontSize: 14, fontWeight: 700, margin: 0 }}>
                    This offer will reach <strong>{audienceCount}</strong> customer{audienceCount !== 1 ? "s" : ""}
                  </p>
                </>
              ) : null}
            </div>
            {audienceCount > 100 && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10 }}>
                <p style={{ color: "#eab308", fontSize: 12, fontWeight: 600, margin: 0 }}>⚠️ Large send — batching over {Math.ceil(audienceCount / 600)} minutes.</p>
              </div>
            )}
          </div>

          <div style={sectionStyle}>
            <h2 style={{ color: "#fff", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>3 — Schedule</h2>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: isScheduled ? 16 : 0 }}>
              <div onClick={() => setIsScheduled(!isScheduled)} style={{
                width: 44, height: 24, background: isScheduled ? "#4ade80" : "#1a1a1a",
                borderRadius: 100, position: "relative", transition: "background 0.2s", flexShrink: 0,
              }}>
                <div style={{ position: "absolute", top: 3, left: isScheduled ? 23 : 3, width: 18, height: 18, background: "#fff", borderRadius: "50%", transition: "left 0.2s" }} />
              </div>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Schedule for later</span>
            </label>
            {isScheduled && (
              <input type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")}
                min={new Date().toISOString().slice(0, 16)}
                style={{ ...inputStyle, colorScheme: "dark" }}
                onFocus={(e) => e.target.style.borderColor = "#4ade80"} onBlur={(e) => e.target.style.borderColor = "#1a1a1a"} />
            )}
          </div>
        </div>

        <div style={{ borderLeft: "1px solid #1a1a1a", padding: 24, overflowY: "auto", background: "#080808" }}>
          <h3 style={{ color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 16 }}>Live Preview</h3>
          <WhatsAppPreview storeName={storeName} title={form.title} message={form.message}
            discountType={form.discountType} discountValue={form.discountValue} validUntil={form.validUntil} />
          
          <VisualPreview 
            theme={form.theme} title={form.title} message={form.message} 
            discountType={form.discountType} discountValue={form.discountValue} 
            validUntil={form.validUntil} shopName={storeName} 
            imageMode={form.imageMode} imageUrl={form.imageUrl}
          />

          <div style={{ marginTop: 20, padding: "14px 16px", background: "#111", borderRadius: 10 }}>
            <p style={{ color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px", fontWeight: 700 }}>Summary</p>
            <p style={{ color: "#fff", fontSize: 13, margin: "0 0 4px" }}>📣 Audience: <strong>{AUDIENCE_OPTIONS.find((o) => o.value === form.audienceType)?.label}</strong></p>
            <p style={{ color: audienceCount > 0 ? "#4ade80" : "#ef4444", fontSize: 13, margin: "0 0 4px", fontWeight: 700 }}>
              {isLoadingCount ? "..." : `${audienceCount ?? "—"} recipients`}
            </p>
            {isScheduled && form.scheduledAt && (
              <p style={{ color: "#eab308", fontSize: 13, margin: 0 }}>📅 {new Date(form.scheduledAt).toLocaleString("en-IN")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
