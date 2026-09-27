import photoManifest from "@/data/place-photos.json";

type PlacePhoto = { src: string; alt: string };
type PhotoEntry = { commonId: string; photos: PlacePhoto[] };

const photosBySlug: Record<string, PhotoEntry> = photoManifest;

/** Admin-managed images take precedence over the collected photo fallback. */
export function resolvePlaceImages(slug: string, images: string[]): string[] {
  return images.length > 0
    ? images
    : (photosBySlug[slug]?.photos.map((photo) => photo.src) ?? []);
}

export function placeImageAlt(
  slug: string,
  src: string,
  name: string,
  index = 0
): string {
  return (
    photosBySlug[slug]?.photos.find((photo) => photo.src === src)?.alt ??
    `${name} — photo ${index + 1}`
  );
}
