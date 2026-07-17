import { slugify } from "@/lib/slug";
import type { Candidate } from "./schemas";

/**
 * Stable identity for a candidate: normalized name scoped to its area.
 * Matches the `place_candidates.dedupe_key` unique column.
 */
export function dedupeKey(name: string, area: string): string {
  return `${slugify(name)}|${slugify(area)}`;
}

/**
 * Fuzzy match for re-discoveries the exact key misses: case/punctuation
 * variants and containment ("Sool Loft Head Spa" vs "Sool Loft") within the
 * same area. Never matches across areas.
 */
export function isNearDuplicate(a: Candidate, b: Candidate): boolean {
  if (slugify(a.area) !== slugify(b.area)) return false;
  const na = slugify(a.name);
  const nb = slugify(b.name);
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

/**
 * Drops candidates already known (by dedupe_key) or near-duplicated within
 * the batch itself. Preserves input order; first occurrence wins.
 */
export function filterNewCandidates(
  candidates: Candidate[],
  existingKeys: ReadonlySet<string>
): Candidate[] {
  const kept: Candidate[] = [];
  for (const c of candidates) {
    if (existingKeys.has(dedupeKey(c.name, c.area))) continue;
    if (kept.some((k) => isNearDuplicate(k, c))) continue;
    kept.push(c);
  }
  return kept;
}
