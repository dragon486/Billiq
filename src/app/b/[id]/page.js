import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Logo from '@/components/Logo';
import BillLiveTracker from "@/components/BillLiveTracker";

export default async function BillView({ params }) {
  const { id } = await params;
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { 
      shop: true, 
      items: true,
      kitchenOrder: {
        select: {
          status: true,
          estimatedMinutes: true,
          preparingStartedAt: true,
          readyAt: true,
          servedAt: true,
          createdAt: true
        }
      }
    }
  });

  if (!bill) {
    notFound();
  }

  const formattedDate = new Date(bill.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const shopConfig = {
    primaryColor: bill.shop.primaryColor || "#0A0A0A",
    secondaryColor: bill.shop.secondaryColor || "#D4AF37",
    isFood: bill.shop.businessType === "RESTAURANT" || ["Restaurant", "Cafe"].includes(bill.shop.category),
    isService: bill.shop.businessType === "SERVICE" || ["Salon", "Clinic"].includes(bill.shop.category),
    isRetail: bill.shop.businessType === "RETAIL" || ["Retail", "Pharmacy"].includes(bill.shop.category)
  };

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "billiq.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const currentUrl = `${protocol}://${host}/b/${id}`;

  return (
    <div className="page-wrapper" style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      padding: "40px 20px", 
      minHeight: "100vh", 
      background: "#F8F9FA", 
      fontFamily: "'Inter', sans-serif",
      "--primary": shopConfig.primaryColor,
      "--secondary": shopConfig.secondaryColor
    }}>
      
      {/* Top Brand Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px", width: "100%", maxWidth: "550px" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.05)" }}></div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)", fontWeight: "800", fontSize: "0.9rem", letterSpacing: "1px" }}>
           <Logo size="xs" />
           <span>{bill.shop.category?.toUpperCase()} NODE</span>
        </div>
        <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.05)" }}></div>
      </div>

      <div className="bill-container" style={{ 
        maxWidth: "550px", 
        width: "100%", 
        padding: "48px 40px", 
        background: "#FFFFFF", 
        borderRadius: "24px", 
        boxShadow: "0 20px 50px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.05)",
        position: "relative"
      }}>
        
        {/* Professional Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          {bill.shop.logoUrl ? (
            <img src={bill.shop.logoUrl} alt="Logo" style={{ height: "60px", marginBottom: "20px", objectFit: "contain" }} />
          ) : (
            <div style={{ width: "60px", height: "60px", background: "var(--primary)", borderRadius: "16px", margin: "0 auto 20px auto", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.8rem", fontWeight: "900" }}>
              {bill.shop.name?.[0]}
            </div>
          )}
          <h1 style={{ 
            fontSize: "2.2rem", 
            fontWeight: "900", 
            marginBottom: "6px", 
            color: "var(--primary)",
            letterSpacing: "-1px"
          }}>{bill.shop.name || "BILLIQ MERCHANT"}</h1>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            gap: "6px", 
            color: "#666", 
            fontSize: "0.85rem",
            fontWeight: "500",
            maxWidth: "90%",
            margin: "0 auto 8px auto"
          }}>
            <MapPinIcon />
            <span>{bill.shop.address || "Digital Receipt"}</span>
          </div>
          {bill.shop.gstNumber && (
            <p style={{ fontSize: "0.75rem", color: "#888", fontWeight: "700", letterSpacing: "1px" }}>GSTIN: {bill.shop.gstNumber}</p>
          )}
        </div>

        {/* Info Matrix */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)", 
          gap: "1px", 
          marginBottom: "40px", 
          background: "rgba(0,0,0,0.05)",
          border: "1px solid rgba(0,0,0,0.05)",
          borderRadius: "16px",
          overflow: "hidden"
        }}>
          <MatrixItem label="INVOICE ID" value={bill.invoiceNum || `#${bill.id.slice(-6).toUpperCase()}`} />
          <MatrixItem label="DATE & TIME" value={formattedDate} />
          <MatrixItem label="PAYMENT" value={bill.paymentMethod || "UPI"} />
          <MatrixItem label="CASHIER" value={bill.cashierName || "System"} />
        </div>

        {/* LIVE TRACKER (Restaurant Only) */}
        {shopConfig.isFood && (
          <div style={{ marginBottom: "40px" }}>
            <BillLiveTracker initialData={bill.kitchenOrder || { status: "placed", createdAt: bill.createdAt }} billId={id} />
          </div>
        )}

        {/* Line Items */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "2px solid #000", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "#888", letterSpacing: "1px" }}>ITEM DESCRIPTION</span>
            <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "#888", letterSpacing: "1px" }}>TOTAL</span>
          </div>
          
          {bill.items.map((item, idx) => (
            <div key={idx} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "1rem", fontWeight: "700", color: "#111", margin: 0 }}>{item.name}</p>
                  <p style={{ fontSize: "0.8rem", color: "#888", fontWeight: "600", margin: "2px 0 0 0" }}>{item.quantity} x ₹{item.price.toFixed(2)}</p>
                </div>
                <span style={{ fontSize: "1rem", fontWeight: "800", color: "#111" }}>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div style={{ 
          background: "#F8F9FA", 
          borderRadius: "16px", 
          padding: "24px",
          marginBottom: "32px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.9rem" }}>Subtotal</span>
            <span style={{ fontWeight: "700" }}>₹{(bill.subtotal || bill.total).toFixed(2)}</span>
          </div>
          {bill.discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#22c55e" }}>
              <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Discount</span>
              <span style={{ fontWeight: "700" }}>-₹{bill.discountAmount.toFixed(2)}</span>
            </div>
          )}
          {bill.taxAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "#666", fontWeight: "600", fontSize: "0.9rem" }}>Tax ({bill.taxRate}%)</span>
              <span style={{ fontWeight: "700" }}>₹{bill.taxAmount.toFixed(2)}</span>
            </div>
          )}
          {bill.tipAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "#666", fontWeight: "600", fontSize: "0.9rem" }}>Tip / Surcharge</span>
              <span style={{ fontWeight: "700" }}>₹{bill.tipAmount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", margin: "12px 0" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--primary)" }}>Amount Paid</span>
            <span style={{ fontSize: "1.8rem", fontWeight: "900", color: "var(--primary)", fontFamily: "monospace" }}>₹{bill.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Verification & Experience */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
           <div style={{ flex: 1, padding: "24px", border: "1.5px dashed rgba(0,0,0,0.1)", borderRadius: "20px", textAlign: "center" }}>
              <p style={{ fontFamily: "serif", fontSize: "1.8rem", margin: "0 0 4px 0", color: "var(--secondary)", fontStyle: "italic" }}>Thank you</p>
              <p style={{ fontSize: "0.7rem", color: "#111", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", margin: 0 }}>{bill.shop.footerText || "Visit again soon!"}</p>
              <div style={{ color: "var(--secondary)", marginTop: "12px" }}>❤</div>
           </div>
           <div style={{ padding: "12px", background: "#fcfcfc", border: "1px solid #f0f0f0", borderRadius: "16px", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px" }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`} alt="QR" style={{ width: "100%", height: "100%" }} />
              </div>
              <p style={{ fontSize: "0.5rem", fontWeight: "800", color: "#888", marginTop: "8px" }}>VERIFY BILL</p>
           </div>
        </div>

      </div>

      {/* COMPLIANCE & FOOTER */}
      <div style={{ 
        marginTop: "32px", 
        width: "100%", 
        maxWidth: "550px", 
        textAlign: "center",
        color: "#B0B0B0",
        fontSize: "0.7rem",
        fontWeight: "700",
        letterSpacing: "1px"
      }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "16px" }}>
          <span>SECURE BILLING</span>
          <span>•</span>
          <span>GO GREEN</span>
          <span>•</span>
          <span>BILLIQ NODE</span>
        </div>
        <p style={{ opacity: 0.6 }}>THIS IS A DIGITAL TRANSACTION RECEIPT GENERATED BY BILLIQ INTELLIGENCE OS</p>
      </div>

    </div>
  );
}

// HELPERS
function MatrixItem({ label, value }) {
  return (
    <div style={{ background: "#fff", padding: "16px", textAlign: "left" }}>
      <p style={{ fontSize: "0.6rem", fontWeight: "800", color: "#B0B0B0", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px 0" }}>{label}</p>
      <p style={{ fontSize: "0.85rem", fontWeight: "800", color: "#111", margin: 0 }}>{value}</p>
    </div>
  );
}

function MapPinIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>; }
