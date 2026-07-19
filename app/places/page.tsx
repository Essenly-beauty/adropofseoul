import type { Metadata } from "next";
import Link from "next/link";
import { listPlaces } from "@/services/places";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import {
  PlaceFilters,
  type TypeOption,
} from "@/components/editorial/PlaceFilters";
import { canonical } from "@/lib/seo";
import {
  PLACE_ENTRY_KINDS,
  PLACE_TYPE_LABELS,
  placeCategoryFromType,
  placeTypeSlug,
} from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Seoul Directory",
  description:
    "Head spas, salons, clinics, cafes, and wellness spots worth knowing in Seoul.",
  alternates: { canonical: canonical("/places") },
};

export const dynamic = "force-dynamic";

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: { area?: string; type?: string; kind?: string };
}) {
  let places: Awaited<ReturnType<typeof listPlaces>> = [];
  try {
    places = await listPlaces({ limit: 200 });
  } catch (err) {
    console.error("places: places fetch failed", err);
  }

  const areas = Array.from(
    new Set(places.map((p) => p.area).filter((a): a is string => !!a))
  ).sort((a, b) => a.localeCompare(b));

  const types: TypeOption[] = Array.from(new Set(places.map((p) => p.category)))
    .map((category) => ({
      slug: placeTypeSlug(category),
      label: PLACE_TYPE_LABELS[category] ?? category,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const kinds = PLACE_ENTRY_KINDS.filter((k) =>
    places.some((p) => p.entryType === k.value)
  );

  const activeArea =
    searchParams.area && areas.includes(searchParams.area)
      ? searchParams.area
      : undefined;
  const activeType =
    searchParams.type && types.some((t) => t.slug === searchParams.type)
      ? searchParams.type
      : undefined;
  const activeKind = kinds.some((k) => k.value === searchParams.kind)
    ? searchParams.kind
    : undefined;
  const activeCategory = activeType
    ? placeCategoryFromType(activeType)
    : undefined;

  const visible = places.filter(
    (p) =>
      (!activeKind || p.entryType === activeKind) &&
      (!activeArea || p.area === activeArea) &&
      (!activeCategory || p.category === activeCategory)
  );

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Seoul Directory" eyebrow="Places" />
      <div className="-mt-2 mb-8 max-w-2xl">
        <p className="text-text-muted">
          Specific spots, ready to book — by service and neighborhood.
        </p>
        <p className="mt-1.5 text-sm text-text-muted">
          Want the bigger picture first?{" "}
          <Link
            href="/around-seoul"
            className="text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
          >
            Explore Seoul by neighborhood →
          </Link>
        </p>
      </div>
      {(areas.length > 0 || types.length > 0) && (
        <PlaceFilters
          kinds={kinds.length > 1 ? [...kinds] : []}
          areas={areas}
          types={types}
          activeKind={activeKind}
          activeArea={activeArea}
          activeType={activeType}
        />
      )}
      {visible.length === 0 ? (
        <p className="text-text-muted">
          No places listed yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((pl) => (
            <PlaceCard key={pl.id} place={pl} />
          ))}
        </div>
      )}
    </main>
  );
}
