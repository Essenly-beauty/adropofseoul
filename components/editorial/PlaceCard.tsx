import Link from "next/link";
import Image from "next/image";
import type { Place } from "@/services/types";

export function PlaceCard({ place }: { place: Place }) {
  const cover = place.images[0];
  return (
    <Link href={`/places/${place.slug}`} className="group block">
      {cover && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-soft-gray">
          <Image
            src={cover}
            alt={place.name}
            fill
            className="object-cover transition-transform duration-medium group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl group-hover:text-accent">
          {place.name}
        </h3>
        {place.area && (
          <span className="text-xs text-text-muted">{place.area}</span>
        )}
      </div>
      {place.shortDescription && (
        <p className="mt-1 text-sm text-text-muted line-clamp-2">
          {place.shortDescription}
        </p>
      )}
    </Link>
  );
}
