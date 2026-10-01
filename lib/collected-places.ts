import collected from "@/data/collected-places.json";
import { resolvePlaceImages } from "./place-images";
import type { Place } from "@/services/types";

export type CollectedPlace = {
  commonId: string;
  slug: string;
  name: string;
  nameKr: string | null;
  category: string;
  area: string | null;
  address: string | null;
  entryType: "place" | "experience";
  shortDescription: string | null;
  serviceDetail: string | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  googleMapUrl: string | null;
  naverMapUrl: string | null;
  instagramUrl: string | null;
  sourceUrl: string | null;
};

// Only photo-backed, explicitly included records live here. Existing CMS
// entries win during merging; their descriptions and links are never replaced.
export const collectedPlaces: Place[] = (collected as CollectedPlace[]).map(
  (place) => ({
    ...place,
    id: `collected-${place.commonId}`,
    rating: null,
    reviewCount: null,
    longDescription: null,
    whyWeLikeIt: null,
    bestFor: null,
    priceRange: null,
    languages: [],
    images: resolvePlaceImages(place.slug, []),
  })
);

export function mergeCollectedPlaces(
  databasePlaces: Place[],
  opts: {
    category?: string;
    area?: string;
    areas?: string[];
    limit?: number;
  } = {}
): Place[] {
  const merged = new Map(collectedPlaces.map((place) => [place.slug, place]));
  for (const place of databasePlaces) merged.set(place.slug, place);
  return Array.from(merged.values())
    .filter(
      (place) =>
        (!opts.category || place.category === opts.category) &&
        (!opts.area || place.area === opts.area) &&
        (!opts.areas?.length ||
          (!!place.area && opts.areas.includes(place.area)))
    )
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .slice(0, opts.limit ?? 50);
}

export function getCollectedPlace(slug: string): Place | null {
  return collectedPlaces.find((place) => place.slug === slug) ?? null;
}
