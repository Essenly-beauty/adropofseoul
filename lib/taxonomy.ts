// Single source of truth for the site's information architecture.
//
// Published articles live in the DB with their original `category` enum value;
// this module expresses the *presentation* taxonomy (the GNB) in code, so no
// data migration is needed. Beauty is the reader-facing umbrella for Skincare
// and Hair & Scalp, while Places + Around Seoul merge into the Seoul section
// (display name "A Local's Seoul") — all as a code-level remapping over the
// stable `category` enum (see sectionForCategory). `label` is editorial
// branding only: the `seoul` slug and the /seoul route never change with it.

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
    blurb:
      "Skincare, hair and scalp care, and a profile that helps you know where to begin",
  },
  {
    slug: "wellness",
    label: "Wellness",
    href: "/wellness",
    blurb:
      "Bathhouses, saunas, and the rituals that shape everyday well-being in Korea",
  },
  {
    slug: "seoul",
    label: "A Local's Seoul",
    href: "/seoul",
    blurb:
      "The places, neighborhoods, and little things we'd share with a friend visiting Seoul",
  },
  {
    slug: "stories",
    label: "Stories",
    href: "/stories",
    blurb:
      "Every latest story in one place — skincare, haircare, wellness, Seoul",
  },
];

// --- Category → section mapping ------------------------------------------
// Which top-level section a DB `category` belongs to, for breadcrumbs, the
// article eyebrow link, and the Stories filter. head_spa maps to Wellness (a
// head spa reads as a spa ritual) but is *also* surfaced under Haircare's
// Scalp Care via HAIRCARE_CATEGORIES — surfacing is separate from the primary.
export type SectionRef = { slug: string; label: string; href: string };

export function sectionForCategory(category: string): SectionRef {
  switch (category) {
    case "beauty":
    case "products":
    case "hair":
    case "head_spa":
      return { slug: "beauty", label: "Beauty", href: "/beauty" };
    case "wellness":
      return { slug: "wellness", label: "Wellness", href: "/wellness" };
    case "places":
    case "guides":
      return { slug: "seoul", label: "A Local's Seoul", href: "/seoul" };
    default:
      return { slug: "stories", label: "Stories", href: "/stories" };
  }
}

// Category unions per section landing page. A category can be surfaced by more
// than one subsection (head_spa appears under Hair & Scalp and Wellness).
export const SKINCARE_CATEGORIES = ["beauty", "products"];
export const HAIRCARE_CATEGORIES = ["hair", "head_spa"];
export const WELLNESS_CATEGORIES = ["wellness", "head_spa"];

// --- Section tabs ---------------------------------------------------------
// Ingredients is a dictionary shared by Skincare and Haircare; Picks lives
// under Skincare. Each set drives the shared SectionTabs chip switcher.
export const SKINCARE_TABS = [
  { key: "skincare", label: "Skincare", href: "/skincare" },
  { key: "ingredients", label: "Ingredients", href: "/ingredients" },
  { key: "picks", label: "Picks", href: "/skincare/picks" },
] as const;
export type SkincareTabKey = (typeof SKINCARE_TABS)[number]["key"];

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

// --- Seoul: neighborhoods -------------------------------------------------
// A directory entry is either a bookable spot or a bookable activity.
// (Declared here, above Neighborhood, so NeighborhoodSection can reference it.)
export const PLACE_ENTRY_KINDS = [
  { value: "place", label: "Places" },
  { value: "experience", label: "Experiences" },
] as const;
export type PlaceEntryKind = (typeof PLACE_ENTRY_KINDS)[number]["value"];

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
  /** Short line for the neighborhood card on the Seoul landing. */
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

export const SEOUL_NEIGHBORHOODS: Neighborhood[] = [
  {
    slug: "seongsu",
    label: "Seongsu",
    blurb:
      "Seoul's beauty-and-fashion district — flagships, local tables, and warehouse cafés.",
    heading: "Seongsu, the local way",
    lede: "Seongsu is where Seoul's beauty industry actually works — and the food scene grew up to feed it. Two connected walks, cross-checked and walked by our team: the beauty-and-bites mile, and the warehouse-café crawl just east. They share one map, and they link into a single day.",
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
      {
        title: "Eat & drink with a guide",
        blurb: "Bar and street-food crawls that start here after dark.",
        categories: ["food_tour"],
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
      {
        title: "Markets",
        blurb:
          "Namdaemun's wholesale rows, and the stalls that set up at dusk.",
        categories: ["market"],
      },
      {
        title: "Malls & arcades",
        blurb: "Underground shopping and fashion floors, a few blocks apart.",
        categories: ["mall"],
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
        title: "Facials, nails & clinics",
        blurb:
          "Facial studios, celebrity nail art, and dermatology-grade skin care.",
        categories: ["facial", "nail_lash", "clinic"],
      },
      {
        title: "Malls",
        blurb: "Underground complexes big enough to fill a whole afternoon.",
        categories: ["mall"],
      },
    ],
  },
  {
    // Itaewon rides along because Hannam-dong runs the Itaewon–Hangangjin axis
    // and the walking tours are sold as Itaewon. NOT `Yongsan`: that is the
    // administrative district, and pulling it in drags N Seoul Tower, IPark
    // Mall, and Lotte Outlets onto a hillside gallery walk. Most sections
    // below are empty on purpose; groupPlacesBySection omits them until they
    // fill.
    slug: "hannam",
    label: "Hannam",
    blurb:
      "Galleries, fragrance, and independent flagships on a hillside above the river.",
    heading: "Hannam, unhurried",
    lede: "If Seongsu shouts, Hannam doesn't feel the need. This is where Seoul's international galleries landed, where independent designers open rooms instead of concessions, and where an afternoon is measured in staircases rather than stops.",
    areas: ["Hannam", "Itaewon"],
    sections: [
      {
        title: "Fragrance",
        blurb: "Niche Korean scent, tested slowly rather than sprayed at you.",
        categories: ["perfume"],
      },
      {
        title: "Shops & flagships",
        blurb: "Independent Korean labels with rooms of their own.",
        categories: ["shop"],
      },
      {
        title: "Cafés",
        blurb: "Where the afternoon ends, on a courtyard if you time it right.",
        categories: ["cafe"],
      },
      {
        title: "Personal color & makeup",
        blurb: "Studios on the quieter side of the river.",
        categories: ["personal_color", "makeup"],
      },
      {
        title: "Spa, skin & wellness",
        blurb: "Hotel spas on the Namsan side, and the quieter studios below.",
        categories: [
          "spa",
          "wellness",
          "facial",
          "head_spa",
          "salon",
          "clinic",
          "nail_lash",
        ],
      },
      {
        title: "Eat & drink with a guide",
        blurb: "Crawls that start on the Itaewon side after dark.",
        categories: ["food_tour"],
      },
    ],
  },
];

export function getNeighborhood(slug: string): Neighborhood | undefined {
  return SEOUL_NEIGHBORHOODS.find((n) => n.slug === slug);
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

// --- Seoul: places --------------------------------------------------------
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
  observatory: "Observatory & Tower",
  market: "Market",
  mall: "Shopping Mall",
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
  observatory: "🔭",
  market: "🏮",
  mall: "🛒",
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

/**
 * The /seoul/places directory link for a hub section. `area` is included only
 * for single-area hubs (a multi-area hub's label is not a valid `area` value);
 * `type` is added for single-category sections, else `kind` when the section
 * is entry-type-restricted.
 */
export function sectionDirectoryHref(
  neighborhood: Neighborhood,
  section: NeighborhoodSection
): string {
  const params = new URLSearchParams();
  if (!neighborhood.areas) params.set("area", neighborhood.label);
  if (section.categories.length === 1)
    params.set("type", placeTypeSlug(section.categories[0]));
  else if (section.entryType) params.set("kind", section.entryType);
  const query = params.toString();
  return query ? `/seoul/places?${query}` : "/seoul/places";
}

// --- Posts -----------------------------------------------------------------
// The DB `post_category` enum, for the admin editor. These are the stored
// values; the reader-facing sections (SECTIONS) are the presentation mapping
// over them (see sectionForCategory).
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
