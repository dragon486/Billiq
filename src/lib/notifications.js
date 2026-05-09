/**
 * BILLIQ Notification Library
 *
 * EMAIL SETUP (Gmail):
 * 1. Enable 2FA on your Google account
 * 2. Go to: myaccount.google.com → Security → App Passwords
 * 3. Create an App Password for "Mail"
 * 4. Copy the 16-character password (spaces don't matter)
 * 5. Set in .env:
 *    EMAIL_USER=you@gmail.com
 *    EMAIL_PASS=abcd efgh ijkl mnop
 *    EMAIL_FROM="BILLIQ <you@gmail.com>"
 *
 * WHATSAPP API SETUP (Meta Cloud API):
 * 1. Go to developers.facebook.com → My Apps → Create App
 * 2. Add WhatsApp product → Get Phone Number ID + Token
 * 3. Set in .env:
 *    WHATSAPP_API_TOKEN=your_token
 *    WHATSAPP_PHONE_NUMBER_ID=your_number_id
 */

import nodemailer from "nodemailer";

// ─── Transport ───────────────────────────────────────────────────────────────
function getTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function isEmailConfigured() {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

// ─── Bill Receipt Email ───────────────────────────────────────────────────────
export async function sendBillEmail({ toEmail, storeName, total, items, billId, customTitle, customBody }) {
  if (!isEmailConfigured()) {
    console.warn("[EMAIL] Not configured — set EMAIL_USER + EMAIL_PASS in .env");
    return { success: false, error: "Email not configured" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const billLink = `${appUrl}/b/${billId}`;
  const itemRows = items
    .map(
      (it) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${it.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;">${it.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;">₹${(it.price * it.quantity).toLocaleString("en-IN")}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:#0a0a0a;padding:32px 40px;text-align:center;">
      <p style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;margin:0;">BILLIQ</p>
      <p style="color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:6px 0 0;">Digital Receipt</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:15px;color:#555;margin:0 0 24px;">Your receipt from <strong style="color:#111;">${storeName}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
        <thead><tr style="border-bottom:2px solid #111;">
          <th style="text-align:left;padding:8px 0;font-size:11px;text-transform:uppercase;color:#999;">Item</th>
          <th style="text-align:center;padding:8px 0;font-size:11px;text-transform:uppercase;color:#999;">Qty</th>
          <th style="text-align:right;padding:8px 0;font-size:11px;text-transform:uppercase;color:#999;">Amount</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="border-top:2px solid #111;margin-top:16px;padding-top:16px;display:flex;justify-content:space-between;">
        <span style="font-weight:800;font-size:16px;">Total Paid</span>
        <span style="font-weight:800;font-size:22px;color:#111;">₹${total.toLocaleString("en-IN")}</span>
      </div>
      <div style="text-align:center;margin-top:32px;">
        <a href="${billLink}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px;">View Full Receipt →</a>
      </div>
      <p style="margin-top:24px;font-size:12px;color:#aaa;text-align:center;">Powered by BILLIQ · Digital Billing Intelligence</p>
    </div>
  </div>
</body></html>`;

  try {
    await getTransport().sendMail({
      from: process.env.EMAIL_FROM || `"BILLIQ" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: customTitle || `Your receipt from ${storeName} — ₹${total.toLocaleString("en-IN")}`,
      html: customBody ? `
        <div style="font-family:sans-serif;max-width:480px;margin:40px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;padding:40px;">
          <h1 style="color:#0a0a0a;font-weight:900;margin-bottom:20px;">BILLIQ</h1>
          <h2 style="font-size:20px;margin-bottom:10px;color:#111;">${customTitle}</h2>
          <p style="color:#555;line-height:1.6;margin-bottom:25px;">${customBody}</p>
          <a href="${billLink}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px;">View Your Receipt →</a>
        </div>
      ` : html,
    });
    return { success: true };
  } catch (err) {
    console.error("[EMAIL] Bill send failed:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── Test Email ───────────────────────────────────────────────────────────────
export async function sendTestEmail() {
  if (!isEmailConfigured()) {
    return { success: false, error: "EMAIL_USER / EMAIL_PASS not set in .env" };
  }
  try {
    await getTransport().sendMail({
      from: process.env.EMAIL_FROM || `"BILLIQ" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "BILLIQ — Email test ✅",
      text: "If you received this, email delivery is working correctly.",
    });
    return { success: true, sentTo: process.env.EMAIL_USER };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── WhatsApp wa.me link ───────────────────────────────────────────────────────
export function buildWhatsAppLink({ phone, storeName, total, billId }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const billLink = `${appUrl}/b/${billId}`;
  const msg = `🧾 Your digital bill from *${storeName}*\n\n*Total: ₹${total.toLocaleString("en-IN")}*\n\nView itemised receipt:\n${billLink}\n\n_Powered by BILLIQ_`;
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
}

// ─── WhatsApp API (Meta Cloud API) ───────────────────────────────────────────
export async function sendWhatsAppMessage({ phone, storeName, total, billId, customText }) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const link = buildWhatsAppLink({ phone, storeName, total, billId });

  if (!token || !phoneNumberId) {
    return { success: false, fallbackLink: link, error: "WhatsApp API not configured" };
  }

  const cleaned = phone.replace(/\D/g, "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleaned,
          type: "text",
          text: {
            body: customText || `🧾 Your bill from *${storeName}*\n\n*Total: ₹${total.toLocaleString("en-IN")}*\n\nView receipt: ${appUrl}/b/${billId}`,
          },
        }),
      });
      if (res.ok) return { success: true };
      console.error(`[WA] Attempt ${attempt}:`, await res.text());
    } catch (err) {
      console.error(`[WA] Attempt ${attempt} error:`, err.message);
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
  }
  return { success: false, fallbackLink: link, error: "Meta API failed after 3 attempts" };
}

// ─── Offer Broadcast Message ──────────────────────────────────────────────────
export function buildOfferMessage(offer, storeName) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://billiq.in";
  const parts = [
    `✨ *EXCLUSIVE OFFER from ${storeName.toUpperCase()}*`,
    ``,
    `🛍️ *${offer.title}*`,
    `_${offer.message}_`,
    ``,
  ];
  if (offer.discountValue) {
    const disc =
      offer.discountType === "pct"
        ? `${offer.discountValue}% OFF`
        : offer.discountType === "rs" || offer.discountType === "flat"
        ? `₹${offer.discountValue} OFF`
        : offer.discountType === "free"
        ? `FREE ITEM INCLUDED 🎁`
        : offer.discountValue;
    parts.push(`💰 *Deal:* ${disc}`);
  }
  if (offer.validUntil) {
    parts.push(`📅 *Valid Until:* ${new Date(offer.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`);
  }
  parts.push(
    ``,
    `_Powered by BILLIQ_`
  );
  return parts.join("\n");
}

/**
 * Send a broadcast message to one recipient.
 * Tries: Meta WhatsApp API → Email with wa.me link → console log
 */
export async function sendBroadcastToRecipient({ phone, email, offer, storeName }) {
  const message = buildOfferMessage(offer, storeName);
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // 1. Meta WhatsApp API
  if (phone && token && phoneNumberId) {
    try {
      const cleaned = phone.replace(/\D/g, "");
      const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleaned,
          type: "text",
          text: { body: message },
        }),
      });
      if (res.ok) return { success: true, channel: "whatsapp-api" };
    } catch {}
  }

  // 2. Email with wa.me link
  if (email && isEmailConfigured()) {
    const waText = encodeURIComponent(message);
    const waLink = phone
      ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${waText}`
      : null;

    const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="margin-bottom:8px;">${offer.title}</h2>
      <p style="white-space:pre-wrap;color:#333;">${offer.message}</p>
      ${offer.discountValue ? `<p style="font-size:18px;font-weight:700;">💰 ${offer.discountType === "pct" ? offer.discountValue + "% off" : "₹" + offer.discountValue + " off"}</p>` : ""}
      ${offer.validUntil ? `<p>📅 Valid until: ${new Date(offer.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>` : ""}
      ${waLink ? `<a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none;margin-top:16px;">Open on WhatsApp →</a>` : ""}
    </div>`;

    try {
      await getTransport().sendMail({
        from: process.env.EMAIL_FROM || `"BILLIQ" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${storeName}: ${offer.title}`,
        html,
      });
      return { success: true, channel: "email" };
    } catch (err) {
      console.error("[BROADCAST] Email failed:", err.message);
    }
  }

  // 3. Console fallback (dev)
  console.log(`[BROADCAST] ${phone || email}: ${offer.title}`);
  return { success: false, channel: "console", error: "No delivery channel configured" };
}

// ─── WhatsApp Image Offer ───────────────────────────────────────────────────
export async function sendOfferWithImage({ phone, offer, storeName }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://billiq.in";
  const imageUrl = `${appUrl}/api/offers/image/${offer.id}`;
  
  if (appUrl.includes("localhost")) {
    console.warn(`[WA_IMAGE] Meta cannot fetch images from localhost (${appUrl}). Falling back to text message.`);
    return sendBroadcastToRecipient({ phone, offer, storeName });
  }

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const caption = [
    `✨ *EXCLUSIVE OFFER from ${storeName.toUpperCase()}*`,
    ``,
    `🛍️ *${offer.title}*`,
    `_${offer.message}_`,
    ``,
    offer.discountValue ? `💰 *Deal:* ${offer.discountType === "pct" ? offer.discountValue + "% OFF" : "₹" + offer.discountValue + " OFF"}` : "",
    offer.validUntil ? `📅 *Valid Until:* ${new Date(offer.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "",
    ``,
    `_Powered by BILLIQ_`
  ].filter(p => p !== "").join("\n");

  if (token && phoneNumberId) {
    try {
      const cleaned = phone.replace(/\D/g, "");
      const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleaned,
          type: "image",
          image: {
            link: imageUrl,
            caption: caption
          }
        })
      });
      if (res.ok) return { success: true };
    } catch (err) {
      console.error("[WA_IMAGE_ERROR]", err.message);
    }
  }

  // Fallback to text broadcast if image fails or not configured
  return sendBroadcastToRecipient({ phone, offer, storeName });
}
