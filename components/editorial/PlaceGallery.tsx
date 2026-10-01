"use client";

import { useState } from "react";
import { PlacePhoto } from "./PlacePhoto";

type GalleryPhoto = { src: string; alt: string };

export function PlaceGallery({
  photos,
  name,
}: {
  photos: GalleryPhoto[];
  name: string;
}) {
  const [selected, setSelected] = useState(0);
  const active = photos[selected] ?? photos[0];
  if (!active) return null;

  return (
    <section className="mt-7" aria-label={`${name} photos`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-porcelain sm:aspect-[3/2]">
        <PlacePhoto
          key={active.src}
          {...active}
          sizes="(max-width: 896px) calc(100vw - 48px), 848px"
          priority
          contain
        />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" aria-label="Choose a photo">
            {photos.map((photo, index) => (
              <button
                key={`${photo.src}-${index}`}
                type="button"
                aria-label={`Show photo ${index + 1} of ${photos.length}`}
                aria-pressed={active === photo}
                onClick={() => setSelected(index)}
                className={`rounded-md border p-1 transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  active === photo
                    ? "border-accent"
                    : "border-transparent hover:border-soft-gray"
                }`}
              >
                <span className="relative block h-12 w-[72px] overflow-hidden rounded-sm bg-porcelain sm:h-16 sm:w-24">
                  <PlacePhoto src={photo.src} alt="" sizes="96px" />
                </span>
              </button>
            ))}
          </div>
          <p
            className="text-xs tabular-nums text-text-muted"
            aria-live="polite"
          >
            {photos.indexOf(active) + 1} / {photos.length} photos
          </p>
        </div>
      )}
    </section>
  );
}
