import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SEOUL_NEIGHBORHOODS } from "@/lib/taxonomy";
import { HAIR_PROFILE_SLUGS } from "@/lib/haircare/profiles";
import { listPublishedPosts } from "@/services/posts";
import { listPlaces } from "@/services/places";
import { listIngredients } from "@/services/ingredients";
import { GUIDE_SLUGS } from "@/lib/seongsu/guides";
import { PILLAR_SLUGS } from "@/lib/articles/pillars";
import { PLACES_DIRECTORY_PUBLIC } from "@/lib/publishing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/stories",
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
    ...(PLACES_DIRECTORY_PUBLIC ? ["/seoul/places"] : []),
    "/seoul/neighborhoods",
    "/seoul/neighborhoods/common",
    ...SEOUL_NEIGHBORHOODS.map((n) => `/seoul/neighborhoods/${n.slug}`),
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    ...GUIDE_SLUGS.map((s) => `/articles/${s}`),
    ...PILLAR_SLUGS.map((s) => `/articles/${s}`),
  ];

  let posts: { slug: string }[] = [];
  let places: { slug: string }[] = [];
  let ingredients: { slug: string }[] = [];
  try {
    [posts, places, ingredients] = await Promise.all([
      listPublishedPosts({ limit: 1000 }),
      PLACES_DIRECTORY_PUBLIC
        ? listPlaces({ limit: 1000 })
        : Promise.resolve([]),
      listIngredients({ limit: 1000 }),
    ]);
  } catch {
    // No live DB yet (or transient failure): still emit the static routes.
  }

  return [
    ...staticPaths.map((p) => ({
      url: `${SITE_URL}${p}`,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/articles/${p.slug}`,
    })),
    ...places.map((pl) => ({
      url: `${SITE_URL}/seoul/places/${pl.slug}`,
    })),
    ...ingredients.map((i) => ({
      url: `${SITE_URL}/ingredients/${i.slug}`,
    })),
  ];
}
