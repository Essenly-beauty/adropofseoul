import { SITE_URL } from "@/lib/site";
import { PLACE_TYPE_LABELS } from "@/lib/taxonomy";
import type { Place } from "@/services/types";

// The share/preview image for a place: the real photo when the place has an
// absolute one, otherwise the generated brand card. Relative admin-entered
// paths fall back to the card too — a relative URL handed to link scrapers
// or Pinterest's media= param is a broken image.
export function placeShareImage(place: Pick<Place, "slug" | "images">): string {
  const first = place.images[0];
  if (first && /^https?:\/\//.test(first)) return first;
  return `${SITE_URL}/places/${place.slug}/og`;
}

export function placeOgSubtitle(
  place: Pick<Place, "category" | "area">
): string {
  const label =
    PLACE_TYPE_LABELS[place.category] ?? place.category.replace(/_/g, " ");
  return [label, place.area].filter(Boolean).join(" · ");
}
