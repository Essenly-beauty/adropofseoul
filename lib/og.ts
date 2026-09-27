import { SITE_URL } from "@/lib/site";
import { PLACE_TYPE_LABELS } from "@/lib/taxonomy";
import type { Place } from "@/services/types";

// The share/preview image for a place: the real photo when the place has an
// absolute or site-root photo, otherwise the generated brand card. Scrapers
// and Pinterest require absolute URLs, including for our collected photos.
export function placeShareImage(place: Pick<Place, "slug" | "images">): string {
  const first = place.images[0];
  if (first && /^https?:\/\//.test(first)) return first;
  if (first?.startsWith("/") && !first.startsWith("//")) {
    return `${SITE_URL}${first}`;
  }
  return `${SITE_URL}/seoul/places/${place.slug}/og`;
}

export function placeOgSubtitle(
  place: Pick<Place, "category" | "area">
): string {
  const label =
    PLACE_TYPE_LABELS[place.category] ?? place.category.replace(/_/g, " ");
  return [label, place.area].filter(Boolean).join(" · ");
}
