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
    slug: "skincare",
    label: "Skincare",
    eyebrow: "Routines and ingredients",
    description:
      "Korean skincare routines, sunscreen habits, barrier care, ingredients, and product context for choosing less but better.",
    href: "/beauty/skincare",
    tags: [
      "skincare",
      "routine",
      "routines",
      "skincare routine",
      "ingredient guide",
      "barrier",
      "glass skin",
    ],
  },
  {
    slug: "hair",
    label: "Hair",
    eyebrow: "Salons and care",
    description:
      "Hair salons, cuts, color, styling, and the practical details visitors need before booking in Seoul.",
    href: "/beauty/hair",
    tags: ["hair", "salon", "haircare"],
  },
  {
    slug: "scalp",
    label: "Scalp",
    eyebrow: "Head spa culture",
    description:
      "Scalp care, head spas, and the slower rituals that connect Korean haircare with wellness.",
    href: "/beauty/scalp",
    tags: ["scalp", "head spa", "head_spa", "haircare"],
  },
  {
    slug: "treatments",
    label: "Treatments",
    eyebrow: "Clinic context",
    description:
      "Treatment explainers, clinic culture, recovery routines, and realistic planning for Seoul beauty appointments.",
    href: "/beauty/treatments",
    tags: ["treatments", "clinic", "skin clinic", "laser", "recovery"],
  },
];

export const BEAUTY_SECTION_SLUGS = BEAUTY_SECTIONS.map((s) => s.slug);

export const BEAUTY_SECTION_REDIRECTS: Record<string, string> = {
  ingredients: "/ingredients",
  routines: "/beauty/skincare",
  products: "/the-edit/products",
  "skin-concerns": "/beauty/skincare",
  trends: "/beauty/skincare",
  guides: "/guides/how-to",
};

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
