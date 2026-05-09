import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

export async function GET(req, { params }) {
  const { offerId } = params;

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { shop: true }
    });

    if (!offer) return new Response("Offer not found", { status: 404 });

    const themes = {
      dark:    { bg: "#0A0A0A", accent: "#4ADE80", text: "#fff" },
      saffron: { bg: "#E8671A", accent: "#fff",    text: "#fff" },
      green:   { bg: "#1D9E75", accent: "#fff",    text: "#fff" },
      royal:   { bg: "#1A1446", accent: "#C9922C", text: "#fff" },
    };
    const theme = themes[offer.theme || "dark"];
    
    const discount = offer.discountType === "pct"
      ? `${offer.discountValue}% OFF`
      : (offer.discountType === "rs" || offer.discountType === "flat")
      ? `₹${offer.discountValue} OFF`
      : "";

    const initials = offer.shop.name.slice(0, 2).toUpperCase();

    const url = new URL(req.url);
    const origin = url.origin;
    const fullImageUrl = offer.imageUrl?.startsWith("/") ? `${origin}${offer.imageUrl}` : offer.imageUrl;
    const isCustom = offer.imageMode === "custom" && fullImageUrl;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: theme.bg,
            fontFamily: "sans-serif",
            padding: "40px",
            position: "relative",
          }}
        >
          {/* Custom Image Background */}
          {isCustom && (
            <img 
              src={fullImageUrl} 
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} 
            />
          )}

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", position: "relative", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "15px", backgroundColor: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", color: theme.bg, fontSize: "28px", fontWeight: "900" }}>
                {initials}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#fff", fontSize: "24px", fontWeight: "900", letterSpacing: "-1px" }}>{offer.shop.name.toUpperCase()}</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: "700", letterSpacing: "2px" }}>EXCLUSIVE OFFER</span>
              </div>
            </div>
            <div style={{ padding: "8px 16px", borderRadius: "100px", border: `2px solid ${theme.accent}`, color: theme.accent, fontSize: "14px", fontWeight: "900", backgroundColor: "rgba(0,0,0,0.3)" }}>
              BILLIQ
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", zIndex: 10 }}>
            {discount && <span style={{ color: theme.accent, fontSize: "100px", fontWeight: "900", lineHeight: "1", marginBottom: "10px", textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>{discount}</span>}
            <span style={{ color: "#fff", fontSize: "42px", fontWeight: "900", textAlign: "center", letterSpacing: "-1px", textShadow: "0 5px 15px rgba(0,0,0,0.5)" }}>{offer.title}</span>
          </div>

          {/* Footer Card */}
          <div style={{ 
            marginTop: "40px", 
            backgroundColor: "rgba(255,255,255,0.95)", 
            borderRadius: "20px", 
            padding: "24px 32px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            position: "relative",
            zIndex: 10
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ color: "#000", fontSize: "18px", fontWeight: "800" }}>{offer.message.slice(0, 60)}...</span>
              <span style={{ color: "#666", fontSize: "13px", fontWeight: "600" }}>
                Valid until {new Date(offer.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </div>
              REDEEM AT STORE
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 566,
      }
    );
  } catch (e) {
    return new Response("Failed to generate image", { status: 500 });
  }
}
