/**
 * Editorial facets for A Local's Seoul.
 *
 * `guides` remains the stable database category. These facets describe how a
 * Seoul story is surfaced without forcing it into a second category tree.
 * Tags use `namespace:value`, which keeps them compatible with the current
 * Post model and admin editor.
 */

export const SEOUL_FACET_PREFIXES = [
  "region",
  "format",
  "interest",
  "mood",
  "season",
  "audience",
] as const;

export type SeoulFacetPrefix = (typeof SEOUL_FACET_PREFIXES)[number];

export type SeoulStoryFacets = Partial<
  Record<SeoulFacetPrefix, readonly string[]>
>;

export function parseSeoulFacets(tags: readonly string[]): SeoulStoryFacets {
  const facets: Record<string, string[]> = {};
  for (const tag of tags) {
    const separator = tag.indexOf(":");
    if (separator < 1) continue;
    const prefix = tag.slice(0, separator).toLowerCase();
    const value = tag
      .slice(separator + 1)
      .trim()
      .toLowerCase();
    if (!SEOUL_FACET_PREFIXES.includes(prefix as SeoulFacetPrefix) || !value)
      continue;
    (facets[prefix] ??= []).push(value);
  }
  return facets as SeoulStoryFacets;
}

/** A story has one canonical neighborhood, while filters may be many-to-many. */
export function primarySeoulRegion(tags: readonly string[]): string {
  return parseSeoulFacets(tags).region?.[0] ?? "common";
}

export const SEOUL_BROWSE_GROUPS = [
  {
    key: "neighborhood",
    label: "By neighborhood",
    description: "Choose the part of Seoul you want to spend time in.",
  },
  {
    key: "plan",
    label: "By kind of day",
    description: "Walking routes, half-days, full days, and trip plans.",
  },
  {
    key: "interest",
    label: "By interest",
    description: "Food, design, beauty, history, cafés, art, and outdoors.",
  },
  {
    key: "need",
    label: "Practical guides",
    description: "Transport, maps, etiquette, seasons, and first-trip basics.",
  },
] as const;
