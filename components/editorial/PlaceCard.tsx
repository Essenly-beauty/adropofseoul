import Link from "next/link";
import type { Place } from "@/services/types";
import { Stars } from "./Stars";
import { PLACE_TYPE_EMOJI, PLACE_TYPE_LABELS } from "@/lib/taxonomy";

// Compact, text-first directory card — the detail card holds the full fact
// sheet, so the list card stays a scannable teaser.
export function PlaceCard({ place }: { place: Place }) {
  const service =
    place.serviceDetail ??
    PLACE_TYPE_LABELS[place.category] ??
    place.category.replace(/_/g, " ");
  return (
    <Link
      href={`/places/${place.slug}`}
      className="group block rounded-lg border border-soft-gray p-5 transition-colors duration-medium ease-editorial hover:border-accent"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-xl leading-snug transition-colors duration-medium ease-editorial group-hover:text-accent">
          {place.name}{" "}
          {place.nameKr && (
            <span className="text-sm text-text-muted">{place.nameKr}</span>
          )}
        </h3>
        {place.area && (
          <span className="shrink-0 text-[10px] uppercase tracking-label text-accent">
            {place.area}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-text-muted">
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
    </Link>
  );
}
