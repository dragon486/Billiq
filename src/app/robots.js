export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/kitchen/", "/superadmin/"],
    },
    sitemap: "https://billiq.in/sitemap.xml",
  };
}
