import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SEOUL_NEIGHBORHOODS } from "@/lib/taxonomy";
import { HAIR_PROFILE_SLUGS } from "@/lib/haircare/profiles";
import { listPublishedPosts } from "@/services/posts";
import { listPlaces } from "@/services/places";
import { listIngredients } from "@/services/ingredients";
import { GUIDES } from "@/lib/seongsu/guides";
import { PILLARS } from "@/lib/articles/pillars";
import { SHOPPING_SITEMAP_ARTICLES } from "@/lib/articles/shopping-sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/stories",
    "/stories/shopping",
    "/skincare",
    "/beauty",
    "/skincare/picks",
    "/haircare",
    ...HAIR_PROFILE_SLUGS.map((s) => `/haircare/profiles/${s}`),
    "/beauty-profile",
    "/beauty-profile/hair",
    "/beauty-profile/skin",
    "/ingredients",
    "/wellness",
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

  let posts: {
    slug: string;
    publishedAt: string | null;
    updatedAt?: string | null;
  }[] = [];
  let places: { slug: string }[] = [];
  let ingredients: { slug: string }[] = [];
  try {
    [posts, places, ingredients] = await Promise.all([
      listPublishedPosts({ limit: 1000 }),
      listPlaces({ limit: 1000 }),
      listIngredients({ limit: 1000 }),
    ]);
  } catch {
    // No live DB yet (or transient failure): still emit the static routes.
  }

  return [
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
}
