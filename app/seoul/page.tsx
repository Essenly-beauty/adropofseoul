import type { Metadata } from "next";
import { NeighborhoodCard } from "@/components/editorial/DiscoveryCards";
import { JsonLd } from "@/components/editorial/JsonLd";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { NEIGHBORHOODS } from "@/lib/discovery";
import { breadcrumbJsonLd, canonical, itemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Seoul Beauty Neighborhoods",
  description:
    "Explore Seoul by neighborhood for beauty places, rituals, salons, head spas, clinics, and shopping stops.",
  alternates: { canonical: canonical("/seoul") },
};

export default function SeoulPage() {
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Seoul", path: "/seoul" },
        ])}
      />
      <JsonLd
        data={itemListJsonLd(
          "Seoul beauty neighborhoods",
          NEIGHBORHOODS.map((neighborhood) => ({
            name: neighborhood.name,
            path: `/seoul/${neighborhood.slug}`,
          }))
        )}
      />
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">Seoul</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
          Explore Seoul by neighborhood.
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-muted">
          Find the beauty places, rituals, and local favorites worth knowing in
          each part of the city.
        </p>
      </header>

      <section className="mt-12">
        <SectionHeading title="Neighborhood Guides" eyebrow="Where to go" />
        <div className="grid gap-8 md:grid-cols-3">
          {NEIGHBORHOODS.map((neighborhood) => (
            <NeighborhoodCard
              key={neighborhood.slug}
              neighborhood={neighborhood}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
