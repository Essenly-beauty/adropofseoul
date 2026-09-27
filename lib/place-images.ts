import photoManifest from "@/data/place-photos.json";
import { mergeFillOnlyPhotos } from "@/lib/place-fill-only";

type PlacePhoto = { src: string; alt: string };
type PhotoEntry = { commonId: string; photos: PlacePhoto[] };

const photosBySlug: Record<string, PhotoEntry> = photoManifest;

/** Existing admin images stay first; reviewed photos only fill empty slots. */
export function resolvePlaceImages(slug: string, images: string[]): string[] {
  return mergeFillOnlyPhotos(
    images,
    photosBySlug[slug]?.photos.map((photo) => photo.src) ?? []
  );
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
