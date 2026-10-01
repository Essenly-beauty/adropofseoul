import Link from "next/link";
import type { Place } from "@/services/types";
import { Stars } from "./Stars";
import { PLACE_TYPE_EMOJI, PLACE_TYPE_LABELS } from "@/lib/taxonomy";
import { placeImageAlt } from "@/lib/place-images";
import { PlacePhoto } from "./PlacePhoto";

// Collected photos lead the card; places awaiting photos keep a compact teaser.
export function PlaceCard({ place }: { place: Place }) {
  const service =
    place.serviceDetail ??
    PLACE_TYPE_LABELS[place.category] ??
    place.category.replace(/_/g, " ");
  return (
    <Link
      href={`/seoul/places/${place.slug}`}
      className="group block overflow-hidden rounded-lg border border-soft-gray transition-colors duration-medium ease-editorial hover:border-accent"
    >
      {place.images[0] && (
        <div className="relative aspect-[3/2] bg-porcelain">
          <PlacePhoto
            src={place.images[0]}
            alt={placeImageAlt(place.slug, place.images[0], place.name)}
            sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 1024px) 50vw, 368px"
          />
        </div>
      )}
      <div className="p-5">
        {/* Sans, not the site serif: these are wayfinding labels, and globals.css
          puts h1–h3 in `font-serif` unless a face is asked for explicitly. */}
        <h3 className="font-sans text-[19px] font-semibold leading-tight tracking-[-0.01em] text-text-ink transition-colors duration-medium ease-editorial group-hover:text-accent">
          {place.name}
        </h3>
        {place.nameKr && (
          <p className="mt-0.5 break-keep text-sm text-text-muted">
            {place.nameKr}
          </p>
        )}
        <p className="mt-1.5 text-xs text-text-muted">
          {place.area && (
            <>
              <span className="whitespace-nowrap text-[10px] uppercase tracking-label text-accent">
                {place.area}
              </span>{" "}
              ·{" "}
            </>
          )}
          {place.rating != null && (
            <>
              <Stars rating={place.rating} />{" "}
              <span className="font-semibold text-text">
                {place.rating.toFixed(1)}
              </span>
              {place.reviewCount != null && (
                <> ({place.reviewCount.toLocaleString()})</>
              )}{" "}
              ·{" "}
            </>
          )}
          <span aria-hidden>{PLACE_TYPE_EMOJI[place.category]}</span> {service}
          {place.entryType === "experience" && " · Experience"}
        </p>
        {place.shortDescription && (
          <p className="mt-2 text-sm text-text-muted line-clamp-2">
            {place.shortDescription}
          </p>
        )}
      </div>
    </Link>
  );
}
