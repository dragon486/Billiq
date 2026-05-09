import { ImageResponse } from "next/og";
import React from "react";

export const runtime = "edge";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  
  const title = searchParams.get("title") || "Special Offer";
  const message = searchParams.get("message") || "Claim this exclusive deal at the counter.";
  const discountValue = searchParams.get("discountValue") || "20";
  const discountType = searchParams.get("discountType") || "pct";
  const themeKey = searchParams.get("theme") || "dark";
  const shopName = searchParams.get("shop") || "BILLIQ STORE";
  const validUntil = searchParams.get("validUntil") || new Date().toISOString();
  const imageUrl = searchParams.get("imageUrl") || null;
  const imageMode = searchParams.get("imageMode") || "generated";

  const themes = {
    dark:    { bg: "#0A0A0A", accent: "#4ADE80", text: "#fff" },
    saffron: { bg: "#E8671A", accent: "#fff",    text: "#fff" },
    green:   { bg: "#1D9E75", accent: "#fff",    text: "#fff" },
    royal:   { bg: "#1A1446", accent: "#C9922C", text: "#fff" },
  };
  const theme = themes[themeKey] || themes.dark;
  
  const discount = discountType === "pct"
    ? discountValue + "% OFF"
    : (discountType === "rs" || discountType === "flat")
    ? "Rs." + discountValue + " OFF"
    : "";

  const initials = shopName.slice(0, 2).toUpperCase();
  
  const url = new URL(req.url);
  const origin = url.origin;
  const fullImageUrl = imageUrl && imageUrl.startsWith("/") ? origin + imageUrl : imageUrl;
  const isCustom = imageMode === "custom" && !!fullImageUrl;

  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.bg,
          fontFamily: "sans-serif",
          padding: "40px",
          position: "relative",
          color: "#fff"
        }
      },
      [
        isCustom ? React.createElement("img", {
          src: fullImageUrl,
          style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }
        }) : null,
        React.createElement("div", {
          style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", position: "relative", zIndex: 10 }
        }, [
          React.createElement("div", {
            style: { display: "flex", alignItems: "center", gap: "15px" }
          }, [
            React.createElement("div", {
              style: { width: "60px", height: "60px", borderRadius: "15px", backgroundColor: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", color: theme.bg, fontSize: "28px", fontWeight: "900" }
            }, initials),
            React.createElement("div", {
              style: { display: "flex", flexDirection: "column" }
            }, [
              React.createElement("span", { style: { color: "#fff", fontSize: "24px", fontWeight: "900", letterSpacing: "-1px" } }, shopName.toUpperCase()),
              React.createElement("span", { style: { color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: "700", letterSpacing: "2px" } }, "EXCLUSIVE OFFER")
            ])
          ]),
          React.createElement("div", {
            style: { padding: "8px 16px", borderRadius: "100px", border: "2px solid " + theme.accent, color: theme.accent, fontSize: "14px", fontWeight: "900", backgroundColor: "rgba(0,0,0,0.3)" }
          }, "BILLIQ")
        ]),
        React.createElement("div", {
          style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", zIndex: 10 }
        }, [
          discount ? React.createElement("span", {
            style: { color: theme.accent, fontSize: "100px", fontWeight: "900", lineHeight: "1", marginBottom: "10px", textShadow: "0 10px 30px rgba(0,0,0,0.5)" }
          }, discount) : null,
          React.createElement("span", {
            style: { color: "#fff", fontSize: "42px", fontWeight: "900", textAlign: "center", letterSpacing: "-1px", textShadow: "0 5px 15px rgba(0,0,0,0.5)" }
          }, title)
        ]),
        React.createElement("div", {
          style: { marginTop: "40px", backgroundColor: "rgba(255,255,255,0.95)", borderRadius: "20px", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10 }
        }, [
          React.createElement("div", {
            style: { display: "flex", flexDirection: "column", gap: "4px" }
          }, [
            React.createElement("span", { style: { color: "#000", fontSize: "18px", fontWeight: "800" } }, message.slice(0, 60) + "..."),
            React.createElement("span", { style: { color: "#666", fontSize: "13px", fontWeight: "600" } }, "OFFER VALID FOR LIMITED TIME")
          ]),
          React.createElement("div", {
            style: { padding: "10px 20px", backgroundColor: "#000", color: "#fff", borderRadius: "12px", fontSize: "14px", fontWeight: "900" }
          }, "REDEEM AT STORE")
        ])
      ]
    ),
    {
      width: 1080,
      height: 566,
    }
  );
}
