import type { Metadata } from "next";
import { listPlaces } from "@/services/places";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Seoul Directory",
  description:
    "Head spas, salons, clinics, cafes, and wellness spots worth knowing in Seoul.",
  alternates: { canonical: canonical("/places") },
};

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  let places: Awaited<ReturnType<typeof listPlaces>> = [];
  try {
    places = await listPlaces({ limit: 96 });
  } catch (err) {
    console.error("places: places fetch failed", err);
  }
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Seoul Directory" eyebrow="Places" />
      {places.length === 0 ? (
        <p className="text-text-muted">
          No places listed yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {places.map((pl) => (
            <PlaceCard key={pl.id} place={pl} />
          ))}
        </div>
      )}
    </main>
  );
}
