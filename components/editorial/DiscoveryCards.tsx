import Link from "next/link";
import {
  formatEnglishAvailability,
  PLACE_TYPE_LABELS,
  type Guide,
  type Neighborhood,
  type Place,
  type Product,
} from "@/lib/discovery";
import { TonalFrame } from "./TonalFrame";

export function DiscoveryPlaceCard({ place }: { place: Place }) {
  return (
    <Link href={`/places/${place.slug}`} className="group block">
      <TonalFrame
        src={place.image}
        alt={place.imageAlt}
        label={place.neighborhood}
        ratio="aspect-[3/2]"
        sizes="(max-width: 768px) 100vw, 33vw"
        branded
      />
      <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[11px] uppercase tracking-label text-text-muted">
        <span>{PLACE_TYPE_LABELS[place.type]}</span>
        <span className="h-[3px] w-[3px] rounded-full bg-text/40" />
        <span>{place.neighborhood}</span>
      </div>
      <h3 className="mt-2 font-serif text-2xl leading-snug transition-colors duration-medium ease-editorial group-hover:text-accent">
        {place.name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-text-muted line-clamp-2">
        {place.summary}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-label text-text-muted">
        {place.priceRange && <span>{place.priceRange}</span>}
        <span>{formatEnglishAvailability(place.englishAvailable)}</span>
      </div>
    </Link>
  );
}

export function NeighborhoodCard({
  neighborhood,
}: {
  neighborhood: Neighborhood;
}) {
  return (
    <Link href={`/seoul/${neighborhood.slug}`} className="group block">
      <TonalFrame
        src={neighborhood.image}
        alt={neighborhood.imageAlt}
        label={neighborhood.name}
        ratio="aspect-[4/3]"
        sizes="(max-width: 768px) 100vw, 33vw"
        branded
      />
      <h3 className="mt-4 font-serif text-2xl transition-colors duration-medium ease-editorial group-hover:text-accent">
        {neighborhood.name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-text-muted">
        {neighborhood.positioning}
      </p>
    </Link>
  );
}

export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link href={`/guides/${guide.slug}`} className="group block">
      <TonalFrame
        src={guide.heroImage}
        alt={guide.heroAlt}
        label="Guide"
        ratio="aspect-[3/2]"
        sizes="(max-width: 768px) 100vw, 33vw"
        branded
      />
      <p className="mt-4 text-[11px] uppercase tracking-label text-accent">
        Updated {guide.lastUpdated}
      </p>
      <h3 className="mt-2 font-serif text-2xl leading-snug transition-colors duration-medium ease-editorial group-hover:text-accent">
        {guide.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-text-muted line-clamp-2">
        {guide.deck}
      </p>
    </Link>
  );
}

export function EditProductCard({ product }: { product: Product }) {
  return (
    <div className="group">
      <TonalFrame
        src={product.image}
        alt={product.imageAlt}
        label={product.category}
        ratio="aspect-square"
        sizes="(max-width: 768px) 50vw, 25vw"
        branded
      />
      <p className="mt-3.5 text-[10.5px] uppercase tracking-label text-text-muted">
        {product.brand}
      </p>
      <h3 className="mt-1 font-serif text-lg leading-tight">{product.name}</h3>
      <p className="mt-2 text-sm leading-6 text-text-muted">{product.note}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm tabular-nums">{product.price}</span>
        {product.retailerUrl ? (
          <a
            href={product.retailerUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-[11px] uppercase tracking-label text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
          >
            Retailer →
          </a>
        ) : (
          <span className="text-[11px] uppercase tracking-label text-text-muted">
            Editorial sample
          </span>
        )}
      </div>
      {product.disclosureRequired && (
        <p className="mt-2 text-[11px] text-text-muted">
          Contains affiliate links. We may earn a commission.
        </p>
      )}
    </div>
  );
}
