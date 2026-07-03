export type Category = {
  slug: string;
  label: string;
  enumValue: string;
  blurb: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "beauty",
    label: "Beauty",
    enumValue: "beauty",
    blurb: "K-beauty routines, serums, and the science of glass skin",
  },
  {
    slug: "hair",
    label: "Hair",
    enumValue: "hair",
    blurb: "Salons, color, and treatments worth the flight",
  },
  {
    slug: "head-spa",
    label: "Head Spa",
    enumValue: "head_spa",
    blurb: "The slow ritual of Korean scalp care",
  },
  {
    slug: "wellness",
    label: "Wellness",
    enumValue: "wellness",
    blurb: "Bathhouses, tea, and the quieter side of Seoul",
  },
  {
    slug: "guides",
    label: "Guides",
    enumValue: "guides",
    blurb: "Neighborhood-by-neighborhood, for first-timers and regulars",
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.enumValue === value)?.label ?? value;
}
