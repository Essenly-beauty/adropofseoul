// Maps a post's DB `category` enum value to the label shown on cards.
// The site's sections/routes live in lib/taxonomy.ts; this is presentation only.
// Keep these reader-facing labels aligned with the current top-level IA while
// preserving the legacy DB category values.
const CATEGORY_LABELS: Record<string, string> = {
  beauty: "Skincare",
  hair: "Hair & Scalp",
  head_spa: "Hair & Scalp",
  wellness: "Everyday Life",
  guides: "Places",
  places: "Places",
  products: "Picks",
  shopping: "Shopping",
};

export function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value;
}
