import type { Metadata } from "next";
import { listPlaces } from "@/services/places";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import {
  PlaceFilters,
  type TypeOption,
} from "@/components/editorial/PlaceFilters";
import { canonical } from "@/lib/seo";
import {
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
  searchParams: { area?: string; type?: string };
}) {
  let places: Awaited<ReturnType<typeof listPlaces>> = [];
  try {
    places = await listPlaces({ limit: 96 });
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

  const activeArea =
    searchParams.area && areas.includes(searchParams.area)
      ? searchParams.area
      : undefined;
  const activeType =
    searchParams.type && types.some((t) => t.slug === searchParams.type)
      ? searchParams.type
      : undefined;
  const activeCategory = activeType
    ? placeCategoryFromType(activeType)
    : undefined;

  const visible = places.filter(
    (p) =>
      (!activeArea || p.area === activeArea) &&
      (!activeCategory || p.category === activeCategory)
  );

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Seoul Directory" eyebrow="Places" />
      {(areas.length > 0 || types.length > 0) && (
        <PlaceFilters
          areas={areas}
          types={types}
          activeArea={activeArea}
          activeType={activeType}
        />
      )}
      {visible.length === 0 ? (
        <p className="text-text-muted">
          No places listed yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {visible.map((pl) => (
            <PlaceCard key={pl.id} place={pl} />
          ))}
        </div>
      )}
    </main>
  );
}
