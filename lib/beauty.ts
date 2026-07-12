export type BeautySection = {
  slug: string;
  label: string;
  eyebrow: string;
  description: string;
  href: string;
  tags: string[];
};

export const BEAUTY_SECTIONS: BeautySection[] = [
  {
    slug: "ingredients",
    label: "Ingredients",
    eyebrow: "Learn the label",
    description:
      "A K-beauty ingredient dictionary for actives, botanicals, barrier helpers, and the texture-makers that shape a routine.",
    href: "/beauty/ingredients",
    tags: ["ingredients", "ingredient guide", "actives"],
  },
  {
    slug: "routines",
    label: "Routines",
    eyebrow: "Build the ritual",
    description:
      "Morning, evening, seasonal, and skin-type routines that explain the logic behind Korean skincare layering.",
    href: "/beauty/routines",
    tags: ["routine", "routines", "skincare routine"],
  },
  {
    slug: "products",
    label: "Products",
    eyebrow: "Shop with context",
    description:
      "Editorial product guides that weigh texture, skin type, climate, availability, and value without turning the magazine into a storefront.",
    href: "/beauty/products",
    tags: ["products", "product guide", "shopping"],
  },
  {
    slug: "skin-concerns",
    label: "Skin Concerns",
    eyebrow: "Read your skin",
    description:
      "Guides for acne, redness, dryness, dark spots, pores, barrier repair, and other concerns people bring to K-beauty.",
    href: "/beauty/skin-concerns",
    tags: ["acne", "redness", "dryness", "hyperpigmentation", "barrier"],
  },
  {
    slug: "trends",
    label: "Trends & Culture",
    eyebrow: "Why it matters",
    description:
      "The culture behind glass skin, toner pads, Olive Young browsing, sunscreen habits, and the details that make K-beauty travel.",
    href: "/beauty/trends",
    tags: ["trends", "culture", "glass skin", "olive young"],
  },
  {
    slug: "guides",
    label: "Guides",
    eyebrow: "Start clearly",
    description:
      "Beginner-friendly explainers for reading ingredient lists, shopping in Korea, choosing sunscreen, and building a calmer routine.",
    href: "/beauty/guides",
    tags: ["guide", "guides", "beginner"],
  },
];

export const BEAUTY_SECTION_SLUGS = BEAUTY_SECTIONS.map((s) => s.slug);

export function getBeautySectionBySlug(
  slug: string
): BeautySection | undefined {
  return BEAUTY_SECTIONS.find((section) => section.slug === slug);
}

export function postMatchesBeautySection(
  tags: string[],
  section: BeautySection
): boolean {
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  return section.tags.some((tag) => normalizedTags.includes(tag.toLowerCase()));
}
