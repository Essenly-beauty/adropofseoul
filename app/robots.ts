import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Quiz + attempt routes are noindex per-page; also disallow here as
    // defense-in-depth so attempt URLs are never crawled.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/beauty-profile/hair/quiz"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
