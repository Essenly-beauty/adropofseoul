export type Category = { slug: string; label: string; enumValue: string };

export const CATEGORIES: Category[] = [
  { slug: "beauty", label: "Beauty", enumValue: "beauty" },
  { slug: "hair", label: "Hair", enumValue: "hair" },
  { slug: "head-spa", label: "Head Spa", enumValue: "head_spa" },
  { slug: "wellness", label: "Wellness", enumValue: "wellness" },
  { slug: "guides", label: "Guides", enumValue: "guides" },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
