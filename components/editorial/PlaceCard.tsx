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
      href={`/seoul/places/${place.slug}`}
      className="group block rounded-lg border border-soft-gray p-5 transition-colors duration-medium ease-editorial hover:border-accent"
    >
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
    </Link>
  );
}
