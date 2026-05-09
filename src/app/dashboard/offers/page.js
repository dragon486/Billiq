"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const STATUS_COLORS = {
  pending:   { bg: "rgba(234,179,8,0.1)",  text: "#eab308", label: "Pending" },
  scheduled: { bg: "rgba(96,165,250,0.1)", text: "#60a5fa", label: "Scheduled" },
  sending:   { bg: "rgba(74,222,128,0.1)", text: "#4ade80", label: "Sending…" },
  completed: { bg: "rgba(74,222,128,0.1)", text: "#4ade80", label: "Completed" },
  failed:    { bg: "rgba(239,68,68,0.1)",  text: "#ef4444", label: "Failed" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 100 }}>
      {s.label}
    </span>
  );
}

function DeliveryBar({ sent, failed, total }) {
  const sentPct = total > 0 ? (sent / total) * 100 : 0;
  const failPct = total > 0 ? (failed / total) * 100 : 0;
  return (
    <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden", display: "flex" }}>
      <div style={{ width: `${sentPct}%`, background: "#4ade80", transition: "width 0.5s" }} />
      <div style={{ width: `${failPct}%`, background: "#ef4444", transition: "width 0.5s" }} />
    </div>
  );
}

export default function OffersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState({});

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated") fetchOffers();
  }, [status, router]);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      setOffers(data.offers || []);
    } catch {}
    finally { setIsLoading(false); }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (expandedData[id]) return;
    try {
      const res = await fetch(`/api/offers/${id}/status`);
      const data = await res.json();
      setExpandedData((p) => ({ ...p, [id]: data }));
    } catch {}
  };

  const totalSent = offers.reduce((a, o) => a + (o.stats?.sent || 0), 0);
  const totalAll = offers.reduce((a, o) => a + (o._count?.recipients || 0), 0);
  const avgRate = totalAll > 0 ? Math.round((totalSent / totalAll) * 100) : 0;

  if (status === "loading" || isLoading) {
    return <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#555" }}>Loading offers...</p></div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Link href="/dashboard" style={{ color: "#555", fontSize: 13, textDecoration: "none" }}>← Dashboard</Link>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 900, marginTop: 4, letterSpacing: "-0.5px" }}>WhatsApp Offers</h1>
        </div>
        <Link href="/dashboard/offers/new" style={{ padding: "12px 24px", background: "#4ade80", color: "#0a0a0a", borderRadius: 10, fontWeight: 800, textDecoration: "none", fontSize: 14 }}>
          + New Offer
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, borderBottom: "1px solid #1a1a1a" }}>
        {[
          { label: "Total Offers", value: offers.length },
          { label: "Total Sent", value: totalSent.toLocaleString("en-IN") },
          { label: "Avg Delivery Rate", value: `${avgRate}%` },
          { label: "Customers Reached", value: totalAll.toLocaleString("en-IN") },
        ].map((s) => (
          <div key={s.label} style={{ padding: "20px 24px", borderRight: "1px solid #1a1a1a" }}>
            <p style={{ color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px", fontWeight: 700 }}>{s.label}</p>
            <p style={{ color: "#fff", fontSize: "1.6rem", fontWeight: 900, margin: 0, letterSpacing: "-1px" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Offers table */}
      <div style={{ padding: "0 24px" }}>
        {offers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📣</p>
            <h2 style={{ color: "#fff", fontSize: "1.3rem", marginBottom: 8, fontWeight: 800 }}>No offers yet</h2>
            <p style={{ color: "#555", marginBottom: 24, fontSize: 14 }}>Send your first WhatsApp offer to bring customers back.</p>
            <Link href="/dashboard/offers/new" style={{ padding: "14px 32px", background: "#4ade80", color: "#0a0a0a", borderRadius: 10, fontWeight: 800, textDecoration: "none" }}>
              Create First Offer →
            </Link>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                {["Offer", "Audience", "Delivered", "Failed", "Date", "Status", ""].map((h) => (
                  <th key={h} style={{ padding: "14px 12px", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => {
                const total = o._count?.recipients || 0;
                const sent  = o.stats?.sent || 0;
                const failed = o.stats?.failed || 0;
                const isExpanded = expandedId === o.id;
                const detail = expandedData[o.id];

                return (
                  <Fragment key={o.id}>
                    <tr key={o.id} style={{ borderBottom: "1px solid #1a1a1a", cursor: "pointer" }} onClick={() => toggleExpand(o.id)}>
                      <td style={{ padding: "16px 12px" }}>
                        <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>{o.title}</p>
                        <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{o.message.slice(0, 50)}{o.message.length > 50 ? "…" : ""}</p>
                        <div style={{ marginTop: 6 }}>
                          <DeliveryBar sent={sent} failed={failed} total={total} />
                        </div>
                      </td>
                      <td style={{ padding: "16px 12px", color: "#fff", fontWeight: 700 }}>{total}</td>
                      <td style={{ padding: "16px 12px", color: "#4ade80", fontWeight: 700 }}>{sent}</td>
                      <td style={{ padding: "16px 12px", color: failed > 0 ? "#ef4444" : "#555", fontWeight: 700 }}>{failed}</td>
                      <td style={{ padding: "16px 12px", color: "#555", fontSize: 13 }}>
                        {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td style={{ padding: "16px 12px" }}><StatusBadge status={o.status} /></td>
                      <td style={{ padding: "16px 12px", color: "#555", fontSize: 18 }}>{isExpanded ? "▲" : "▼"}</td>
                    </tr>

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr key={`${o.id}-detail`} style={{ background: "#080808" }}>
                        <td colSpan={7} style={{ padding: "0 12px 16px" }}>
                          {!detail ? (
                            <p style={{ color: "#555", fontSize: 13, padding: "12px 0" }}>Loading delivery details...</p>
                          ) : (
                            <div style={{ padding: "16px 0" }}>
                              <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                                {[
                                  { label: "Total", value: detail.stats.total, color: "#fff" },
                                  { label: "Queued", value: detail.stats.queued, color: "#555" },
                                  { label: "Sent", value: detail.stats.sent, color: "#4ade80" },
                                  { label: "Failed", value: detail.stats.failed, color: "#ef4444" },
                                ].map((s) => (
                                  <div key={s.label}>
                                    <p style={{ color: "#555", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px", fontWeight: 700 }}>{s.label}</p>
                                    <p style={{ color: s.color, fontSize: 20, fontWeight: 900, margin: 0 }}>{s.value}</p>
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {detail.offer.recipients.slice(0, 30).map((r) => (
                                  <div key={r.id} style={{
                                    padding: "6px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                                    background: r.status === "sent" ? "rgba(74,222,128,0.1)" : r.status === "failed" ? "rgba(239,68,68,0.1)" : "#1a1a1a",
                                    color: r.status === "sent" ? "#4ade80" : r.status === "failed" ? "#ef4444" : "#555",
                                    border: `1px solid ${r.status === "sent" ? "rgba(74,222,128,0.2)" : r.status === "failed" ? "rgba(239,68,68,0.2)" : "#1a1a1a"}`,
                                    display: "flex", alignItems: "center", gap: 6,
                                  }}>
                                    <span>{r.status === "sent" ? "✓" : r.status === "failed" ? "✗" : "…"}</span>
                                    <span>{r.phone || r.email || "unknown"}</span>
                                  </div>
                                ))}
                                {detail.offer.recipients.length > 30 && (
                                  <div style={{ padding: "6px 12px", borderRadius: 100, fontSize: 12, color: "#555", background: "#1a1a1a" }}>
                                    +{detail.offer.recipients.length - 30} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
