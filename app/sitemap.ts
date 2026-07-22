import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { AROUND_SEOUL_NEIGHBORHOODS } from "@/lib/taxonomy";
import { listPublishedPosts } from "@/services/posts";
import { listPlaces } from "@/services/places";
import { listIngredients } from "@/services/ingredients";
import { GUIDE_SLUGS } from "@/lib/seongsu/guides";
import { PILLAR_SLUGS } from "@/lib/articles/pillars";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/articles",
    "/beauty",
    "/beauty/skincare",
    "/beauty/hair",
    "/beauty/picks",
    "/ingredients",
    "/wellness",
    "/places",
    "/around-seoul",
    "/around-seoul/common",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    ...AROUND_SEOUL_NEIGHBORHOODS.map((n) => `/around-seoul/${n.slug}`),
    ...GUIDE_SLUGS.map((s) => `/articles/${s}`),
    ...PILLAR_SLUGS.map((s) => `/articles/${s}`),
  ];

  let posts: { slug: string }[] = [];
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
    ...ingredients.map((i) => ({
      url: `${SITE_URL}/ingredients/${i.slug}`,
      lastModified: new Date(),
    })),
  ];
}
