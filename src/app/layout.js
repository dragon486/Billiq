import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "BILLIQ | Bills that remember. Business that grows.",
  description: "Next-generation digital billing, WhatsApp CRM, and real-time KDS for ambitious restaurants and retail stores.",
  openGraph: {
    title: "BILLIQ | Bills that remember. Business that grows.",
    description: "Next-generation digital billing, WhatsApp CRM, and real-time KDS for ambitious restaurants and retail stores.",
    url: "https://billiq.in",
    siteName: "BILLIQ",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BILLIQ | Bills that remember. Business that grows.",
    description: "Next-generation digital billing, WhatsApp CRM, and real-time KDS.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "BILLIQ",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Next-generation digital billing, WhatsApp CRM, and real-time KDS for retail and restaurants.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        }
      },
      {
        "@type": "Organization",
        "name": "BILLIQ",
        "url": "https://billiq.in",
        "logo": "https://billiq.in/icon.png"
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
