import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { listPublishedPosts } from "@/services/posts";
import { listPlaces } from "@/services/places";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/articles",
    "/places",
    "/picks",
    "/about",
    "/contact",
    "/privacy",
    ...CATEGORY_SLUGS.map((s) => `/${s}`),
  ];

  let posts: { slug: string }[] = [];
  let places: { slug: string }[] = [];
  try {
    [posts, places] = await Promise.all([
      listPublishedPosts({ limit: 1000 }),
      listPlaces({ limit: 1000 }),
    ]);
  } catch {
    // No live DB yet (or transient failure): still emit the static routes.
  }

  return [
    ...staticPaths.map((p) => ({
      url: `${SITE_URL}${p}`,
      lastModified: new Date(),
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/articles/${p.slug}`,
      lastModified: new Date(),
    })),
    ...places.map((pl) => ({
      url: `${SITE_URL}/places/${pl.slug}`,
      lastModified: new Date(),
    })),
  ];
}
