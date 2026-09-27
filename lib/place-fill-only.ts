export const PLACE_PHOTO_TARGET_MIN = 3;
export const PLACE_PHOTO_TARGET_MAX = 5;

/** Preserve existing paths and order; append only unique candidates. */
export function mergeFillOnlyPhotos(
  existing: readonly string[],
  candidates: readonly string[],
  maximum = PLACE_PHOTO_TARGET_MAX
): string[] {
  const merged = [...existing];
  const seen = new Set(existing);
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate) || merged.length >= maximum) continue;
    merged.push(candidate);
    seen.add(candidate);
  }
  return merged;
}
