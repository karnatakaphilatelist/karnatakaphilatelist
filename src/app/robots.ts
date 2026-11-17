import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/** Public pages are open to search engines; personal and app-only screens are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/passport", "/delete-account", "/welcome", "/auth/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
