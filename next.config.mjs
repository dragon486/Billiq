/** @type {import('next').NextConfig} */
const nextConfig = {
  // Harden HTTP security headers on all responses
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Block MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Enforce HTTPS in browsers
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Restrict referrer info
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features not needed
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Images: allow only trusted domains for external images (WhatsApp, uploads)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.billiq.in",
      },
    ],
  },
};

export default nextConfig;
