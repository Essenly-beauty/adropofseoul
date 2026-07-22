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

// --- Places types (moved up) -----------------------------------------------
// A directory entry is either a bookable spot or a bookable activity.
export const PLACE_ENTRY_KINDS = [
  { value: "place", label: "Places" },
  { value: "experience", label: "Experiences" },
] as const;
export type PlaceEntryKind = (typeof PLACE_ENTRY_KINDS)[number]["value"];

// --- Around Seoul ---------------------------------------------------------
/** One purpose-based group on a neighborhood hub page. */
export type NeighborhoodSection = {
  /** Section heading, e.g. "Shop the flagships". */
  title: string;
  /** Optional one-line intro under the heading. */
  blurb?: string;
  /** place_category enum values that belong to this section. */
  categories: string[];
  /** Restrict to one entry kind; omit to accept both. */
  entryType?: PlaceEntryKind;
};

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
  /** Purpose-based directory sections, in editorial order. */
  sections?: NeighborhoodSection[];
  /** Place `area` values this hub aggregates; defaults to [label]. */
  areas?: string[];
};

export const AROUND_SEOUL_NEIGHBORHOODS: Neighborhood[] = [
  {
    slug: "seongsu",
    label: "Seongsu",
    blurb:
      "Seoul's beauty-and-fashion district — flagships, local tables, and warehouse cafés.",
    heading: "Seongsu, the local way",
    lede: "Seongsu is where Seoul's beauty industry actually works — flagship stores, warehouse cafés, and the workshops behind them. Shop the flagships people fly in for, take the classes locals book, and walk our cross-checked beauty-and-bites mile on the map below.",
    hasMap: true,
    sections: [
      {
        title: "Shop the flagships",
        blurb: "The K-beauty and fashion flagships people actually fly in for.",
        categories: ["shop"],
      },
      {
        title: "Warehouse cafés",
        blurb: "Factory-conversion coffee — Seongsu's original draw.",
        categories: ["cafe"],
      },
      {
        title: "Make something",
        blurb:
          "Perfume, makeup, and traditional-drink classes worth booking ahead.",
        categories: ["perfume", "makeup", "cooking_class", "facial"],
        entryType: "experience",
      },
      {
        title: "Beauty services on the rise",
        blurb:
          "Salons and studios locals book by DM — barely on the booking apps yet.",
        categories: [
          "personal_color",
          "nail_lash",
          "salon",
          "head_spa",
          "spa",
          "facial",
        ],
        entryType: "place",
      },
    ],
  },
  {
    slug: "hongdae",
    label: "Hongdae",
    blurb:
      "Personal color, nails, lashes, and indie perfume — Seoul's youngest beauty district.",
    heading: "Hongdae, in full color",
    lede: "Hongdae is where Seoul gets its color done — the personal-color capital, plus walk-in friendly salons, lash and nail studios, and perfume labs, all at student-district prices.",
    areas: ["Hongdae", "Yeonnam"],
    sections: [
      {
        title: "Personal color & makeup",
        blurb: "Where Seoul's personal-color boom lives — book ahead.",
        categories: ["personal_color", "makeup"],
      },
      {
        title: "Nails & lashes",
        blurb: "Detail work Hongdae does better than anywhere.",
        categories: ["nail_lash"],
      },
      {
        title: "Hair salons",
        blurb: "English-friendly cuts and color without the Gangnam price tag.",
        categories: ["salon"],
      },
      {
        title: "Perfume workshops",
        blurb: "Blend your own bottle to take home.",
        categories: ["perfume"],
        entryType: "experience",
      },
      {
        title: "Spa & skin",
        blurb: "Scrubs, facials, and skin clinics between the studios.",
        categories: ["spa", "facial", "clinic"],
      },
    ],
  },
  {
    slug: "myeongdong",
    label: "Myeongdong",
    blurb: "Spas, facials, and walk-in salons in the heart of tourist Seoul.",
    heading: "Myeongdong, made easy",
    lede: "Myeongdong is Seoul's beauty-service hub for first-timers — the densest cluster of tourist-friendly spas, facials, and walk-in salons, minutes from the flagship shopping streets.",
    sections: [
      {
        title: "Spa & massage",
        blurb: "Full-body, foot, and everything in between — no Korean needed.",
        categories: ["spa"],
      },
      {
        title: "Facial & skincare",
        blurb: "Glass-skin facials an elevator ride from the shopping.",
        categories: ["facial"],
      },
      {
        title: "Hair & makeup",
        blurb: "Walk-in friendly salons used to international guests.",
        categories: ["salon", "makeup"],
      },
      {
        title: "Personal color",
        blurb: "Quick diagnoses that fit between itinerary stops.",
        categories: ["personal_color"],
      },
    ],
  },
  {
    slug: "gangnam-cheongdam",
    label: "Gangnam & Cheongdam",
    blurb: "K-pop hair & makeup, head spas, and the premium end of K-beauty.",
    heading: "Gangnam & Cheongdam, the premium tier",
    lede: "South of the river is Seoul's premium tier — the K-pop stylist salons of Cheongdam, the city's head-spa district, and the studios where personal color analysis got serious.",
    areas: ["Gangnam", "Cheongdam", "Apgujeong", "Garosugil"],
    sections: [
      {
        title: "K-pop hair & makeup",
        blurb: "The salons idols actually sit in — book well ahead.",
        categories: ["salon", "makeup"],
      },
      {
        title: "Head spa & massage",
        blurb: "Seoul's head-spa district, plus aroma and body work.",
        categories: ["head_spa", "spa"],
      },
      {
        title: "Personal color",
        blurb: "The first-generation studios that started the trend.",
        categories: ["personal_color"],
      },
      {
        title: "Classes & workshops",
        blurb: "Private perfume blending and hands-on Korean cooking.",
        categories: ["perfume", "cooking_class"],
        entryType: "experience",
      },
      {
        title: "Nails & clinics",
        blurb: "Celebrity nail art and dermatology-grade skin care.",
        categories: ["nail_lash", "clinic"],
      },
    ],
  },
];

export function getNeighborhood(slug: string): Neighborhood | undefined {
  return AROUND_SEOUL_NEIGHBORHOODS.find((n) => n.slug === slug);
}

/** The place `area` values that belong to a neighborhood hub. */
export function neighborhoodAreas(n: Neighborhood): string[] {
  return n.areas ?? [n.label];
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

// Category glyphs for the compact directory cards (mirrors the Seongsu
// course-stop card idiom).
export const PLACE_TYPE_EMOJI: Record<string, string> = {
  head_spa: "💆",
  salon: "💇",
  cafe: "☕",
  clinic: "🏥",
  shop: "🛍️",
  wellness: "🌿",
  personal_color: "🎨",
  makeup: "💄",
  spa: "🧖",
  facial: "✨",
  nail_lash: "💅",
  perfume: "🧴",
  cooking_class: "🍳",
  food_tour: "🥢",
};

/** URL type-slug ("head-spa") → place category enum ("head_spa"). */
export function placeCategoryFromType(typeSlug: string): string {
  return typeSlug.replace(/-/g, "_");
}

/** place category enum ("head_spa") → URL type-slug ("head-spa"). */
export function placeTypeSlug(category: string): string {
  return category.replace(/_/g, "-");
}

/**
 * Group places into a neighborhood's sections. Section order is preserved,
 * each place lands in the first section whose categories (and entryType,
 * when set) match, and empty sections are omitted.
 */
export function groupPlacesBySection<
  T extends { category: string; entryType: PlaceEntryKind },
>(
  places: T[],
  sections: NeighborhoodSection[]
): { section: NeighborhoodSection; places: T[] }[] {
  const remaining = [...places];
  const groups: { section: NeighborhoodSection; places: T[] }[] = [];
  for (const section of sections) {
    const matched: T[] = [];
    for (let i = 0; i < remaining.length;) {
      const p = remaining[i];
      if (
        section.categories.includes(p.category) &&
        (!section.entryType || p.entryType === section.entryType)
      ) {
        matched.push(p);
        remaining.splice(i, 1);
      } else {
        i++;
      }
    }
    if (matched.length > 0) groups.push({ section, places: matched });
  }
  return groups;
}

// --- Posts -----------------------------------------------------------------
export const POST_CATEGORIES: { value: string; label: string }[] = [
  { value: "beauty", label: "Beauty" },
  { value: "hair", label: "Hair" },
  { value: "head_spa", label: "Head Spa" },
  { value: "places", label: "Places" },
  { value: "wellness", label: "Wellness" },
  { value: "products", label: "Products" },
  { value: "guides", label: "Guides" },
];

export const POST_STATUSES: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];
