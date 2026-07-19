// Single source of truth for the site's information architecture.
//
// Published articles live in the DB with their original `category` enum value;
// this module expresses the *presentation* taxonomy (the new GNB) in code, so
// no data migration is needed. Grouping rules that can't be read straight from
// `category` (Picks review-type, the Wellness union, neighborhoods) live here.

import type { Post } from "@/services/types";

/** Top-level content sections — drives nav, footer, and the home index. */
export type Section = {
  slug: string;
  label: string;
  href: string;
  blurb: string;
};

export const SECTIONS: Section[] = [
  {
    slug: "beauty",
    label: "Beauty",
    href: "/beauty",
    blurb: "K-beauty routines, serums, and the science of glass skin",
  },
  {
    slug: "places",
    label: "Places",
    href: "/places",
    blurb: "Head spas, salons, clinics, and cafés worth knowing in Seoul",
  },
  {
    slug: "wellness",
    label: "Wellness",
    href: "/wellness",
    blurb: "Bathhouses, head spas, and the quieter side of Seoul",
  },
  {
    slug: "around-seoul",
    label: "Around Seoul",
    href: "/around-seoul",
    blurb: "Neighborhood-by-neighborhood, for first-timers and regulars",
  },
];

// --- Beauty tabs ----------------------------------------------------------
// All = every editorial beauty article (skincare + hair). Skincare = the
// routine/tips articles. Ingredients = the K-beauty ingredient dictionary
// (its own /ingredients route, surfaced here as a Beauty tab).
export const BEAUTY_TABS = [
  { key: "all", label: "All", href: "/beauty" },
  { key: "skincare", label: "Skincare", href: "/beauty/skincare" },
  { key: "hair", label: "Hair", href: "/beauty/hair" },
  { key: "ingredients", label: "Ingredients", href: "/ingredients" },
  { key: "picks", label: "Picks", href: "/beauty/picks" },
] as const;

export type BeautyTabKey = (typeof BEAUTY_TABS)[number]["key"];

/**
 * Review / comparison "Picks" articles. Currently stored as `category='beauty'`;
 * we separate them here. Extensible without code changes: any beauty post tagged
 * `review` or `picks` in the admin also counts.
 */
export const PICKS_SLUGS = new Set<string>([
  "five-k-beauty-serums",
  "best-korean-serums-skin-type",
  "best-korean-sunscreens-skin-type",
]);

const PICK_TAGS = new Set(["review", "picks"]);

export function isPick(post: Pick<Post, "slug" | "tags">): boolean {
  if (PICKS_SLUGS.has(post.slug)) return true;
  return (post.tags ?? []).some((t) => PICK_TAGS.has(t.toLowerCase()));
}

// --- Wellness -------------------------------------------------------------
/** Wellness surfaces both native wellness posts and head-spa explainers. */
export const WELLNESS_CATEGORIES = ["wellness", "head_spa"];

// --- Around Seoul ---------------------------------------------------------
export type Neighborhood = {
  slug: string;
  label: string;
  /** Short line for the neighborhood card on the Around Seoul landing. */
  blurb: string;
  /** Optional hub headline; falls back to `label`. */
  heading?: string;
  /** Optional hub lede; falls back to `blurb`. */
  lede?: string;
  /** True if this neighborhood has a dedicated interactive course map. */
  hasMap?: boolean;
};

export const AROUND_SEOUL_NEIGHBORHOODS: Neighborhood[] = [
  {
    slug: "seongsu",
    label: "Seongsu",
    blurb:
      "Seoul's beauty-and-fashion district — flagships, local tables, and warehouse cafés.",
    heading: "Seongsu, the local way",
    lede: "Seongsu is where Seoul's beauty industry actually works — and the food scene grew up to feed it. Two connected walks, cross-checked and walked by our team: the beauty-and-bites mile, and the warehouse-café crawl just east. They share one map, and they link into a single day.",
    hasMap: true,
  },
];

export function getNeighborhood(slug: string): Neighborhood | undefined {
  return AROUND_SEOUL_NEIGHBORHOODS.find((n) => n.slug === slug);
}

/**
 * Which neighborhood a `guides`-category post belongs to. All current guides
 * are Seongsu; new neighborhoods add a case (or tag posts `region:<slug>`).
 */
export function regionForGuide(post: Pick<Post, "slug" | "tags">): string {
  const tagged = (post.tags ?? []).find((t) => t.startsWith("region:"));
  if (tagged) return tagged.slice("region:".length);
  return "seongsu";
}

// --- Places types ---------------------------------------------------------
// A place's `type` filter maps 1:1 to its existing `category` enum value.
export const PLACE_TYPE_LABELS: Record<string, string> = {
  head_spa: "Head Spa",
  salon: "Salon",
  cafe: "Café",
  clinic: "Clinic",
  shop: "Shop",
  wellness: "Wellness",
  personal_color: "Personal Color",
  makeup: "Makeup",
  spa: "Spa & Massage",
  facial: "Facial",
  nail_lash: "Nails & Lashes",
  perfume: "Perfume Workshop",
  cooking_class: "Cooking Class",
  food_tour: "Food Tour",
};

// A directory entry is either a bookable spot or a bookable activity.
export const PLACE_ENTRY_KINDS = [
  { value: "place", label: "Places" },
  { value: "experience", label: "Experiences" },
] as const;
export type PlaceEntryKind = (typeof PLACE_ENTRY_KINDS)[number]["value"];

/** URL type-slug ("head-spa") → place category enum ("head_spa"). */
export function placeCategoryFromType(typeSlug: string): string {
  return typeSlug.replace(/-/g, "_");
}

/** place category enum ("head_spa") → URL type-slug ("head-spa"). */
export function placeTypeSlug(category: string): string {
  return category.replace(/_/g, "-");
}
