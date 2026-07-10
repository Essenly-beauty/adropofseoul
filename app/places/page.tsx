import type { Metadata } from "next";
import { listPlaces } from "@/services/places";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { AreaFilter } from "@/components/editorial/AreaFilter";
import { canonical } from "@/lib/seo";

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
  searchParams: { area?: string };
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
  const active =
    searchParams.area && areas.includes(searchParams.area)
      ? searchParams.area
      : undefined;
  const visible = active ? places.filter((p) => p.area === active) : places;

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Seoul Directory" eyebrow="Places" />
      {areas.length > 0 && <AreaFilter areas={areas} active={active} />}
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
