// Maps a post's DB `category` enum value to the label shown on cards.
// The site's sections/routes live in lib/taxonomy.ts; this is presentation only.
// Note: head-spa articles now surface under Wellness, and guides under Around
// Seoul, so their labels follow the new IA.
const CATEGORY_LABELS: Record<string, string> = {
  beauty: "Beauty",
  hair: "Hair",
  head_spa: "Wellness",
  wellness: "Wellness",
  guides: "Around Seoul",
  places: "Places",
  products: "Picks",
};

export function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value;
}
