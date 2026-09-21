import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SEOUL_NEIGHBORHOODS } from "@/lib/taxonomy";
import { HAIR_PROFILE_SLUGS } from "@/lib/haircare/profiles";
import { listSitemapContent } from "@/services/sitemap";
import { GUIDES } from "@/lib/seongsu/guides";
import { PILLARS } from "@/lib/articles/pillars";
import { SHOPPING_SITEMAP_ARTICLES } from "@/lib/articles/shopping-sitemap";

// Refresh published URLs without requiring a deployment. A failed regeneration
// must retain the last complete sitemap, not cache a successful partial one.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/stories",
    "/seoul-explained",
    "/seoul-explained/everyday-life",
    "/seoul-explained/food-drink",
    "/seoul-explained/shopping",
    "/beauty/the-edit",
    "/skincare",
    "/beauty",
    "/skincare/picks",
    "/haircare",
    ...HAIR_PROFILE_SLUGS.map((s) => `/haircare/profiles/${s}`),
    "/beauty-profile",
    "/beauty-profile/hair",
    "/beauty-profile/skin",
    "/ingredients",
    "/seoul",
    "/seoul/places",
    "/seoul/neighborhoods",
    "/seoul/neighborhoods/common",
    ...SEOUL_NEIGHBORHOODS.map((n) => `/seoul/neighborhoods/${n.slug}`),
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];

  const { posts, places, ingredients } = await listSitemapContent();

  const entries: MetadataRoute.Sitemap = [
    ...staticPaths.map((p) => ({
      url: `${SITE_URL}${p}`,
    })),
    ...GUIDES.map((guide) => ({
      url: `${SITE_URL}/articles/${guide.slug}`,
      lastModified: guide.publishedAt,
    })),
    ...PILLARS.map((pillar) => ({
      url: `${SITE_URL}/articles/${pillar.slug}`,
      lastModified: pillar.publishedAt,
    })),
    ...SHOPPING_SITEMAP_ARTICLES.map((article) => ({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: article.publishedAt,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/articles/${p.slug}`,
      lastModified: p.updatedAt ?? p.publishedAt ?? undefined,
    })),
    ...places.map((pl) => ({
      url: `${SITE_URL}/seoul/places/${pl.slug}`,
    })),
    ...ingredients.map((i) => ({
      url: `${SITE_URL}/ingredients/${i.slug}`,
    })),
  ];

  // Code-defined articles take priority in the page renderer too. Preserve
  // their metadata when a legacy database row has the same slug.
  const seen = new Set<string>();
  return entries.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}
