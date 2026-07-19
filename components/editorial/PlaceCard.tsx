import Link from "next/link";
import type { Place } from "@/services/types";
import { TonalFrame } from "./TonalFrame";

export function PlaceCard({ place }: { place: Place }) {
  return (
    <Link href={`/places/${place.slug}`} className="group block">
      <TonalFrame
        src={place.images[0]}
        alt={place.name}
        label={place.area ?? undefined}
        ratio="aspect-[4/5]"
        sizes="(max-width: 768px) 100vw, 33vw"
        branded
      />
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl transition-colors duration-medium ease-editorial group-hover:text-accent">
          {place.name}
        </h3>
        {place.area && (
          <span className="shrink-0 text-[11px] uppercase tracking-label text-accent">
            {place.area}
          </span>
        )}
      </div>
      {(place.rating != null || place.entryType === "experience") && (
        <p className="mt-1 flex items-center gap-2 text-xs text-text-muted">
          {place.rating != null && (
            <span>
              ★ {place.rating.toFixed(1)}
              {place.reviewCount != null && ` (${place.reviewCount})`}
            </span>
          )}
          {place.entryType === "experience" && (
            <span className="uppercase tracking-label text-[10px]">
              Experience
            </span>
          )}
        </p>
      )}
      {place.shortDescription && (
        <p className="mt-2 text-sm text-text-muted line-clamp-2">
          {place.shortDescription}
        </p>
      )}
    </Link>
  );
}
