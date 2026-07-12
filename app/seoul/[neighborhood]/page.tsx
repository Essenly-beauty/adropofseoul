import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DiscoveryPlaceCard,
  GuideCard,
  NeighborhoodCard,
} from "@/components/editorial/DiscoveryCards";
import { JsonLd } from "@/components/editorial/JsonLd";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { TonalFrame } from "@/components/editorial/TonalFrame";
import {
  NEIGHBORHOODS,
  getNeighborhoodBySlug,
  getRelatedGuides,
  getRelatedPlaces,
} from "@/lib/discovery";
import { breadcrumbJsonLd, canonical } from "@/lib/seo";

export function generateStaticParams() {
  return NEIGHBORHOODS.map((neighborhood) => ({
    neighborhood: neighborhood.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { neighborhood: string };
}): Metadata {
  const neighborhood = getNeighborhoodBySlug(params.neighborhood);
  if (!neighborhood) return { title: "Not found" };
  return {
    title: `${neighborhood.name} Beauty Guide`,
    description: neighborhood.introduction,
    alternates: { canonical: canonical(`/seoul/${neighborhood.slug}`) },
    openGraph: {
      title: `${neighborhood.name} Beauty Guide`,
      description: neighborhood.introduction,
      images: neighborhood.image ? [canonical(neighborhood.image)] : undefined,
    },
  };
}

export default function NeighborhoodPage({
  params,
}: {
  params: { neighborhood: string };
}) {
  const neighborhood = getNeighborhoodBySlug(params.neighborhood);
  if (!neighborhood) notFound();

  const places = getRelatedPlaces(neighborhood.featuredPlaceSlugs);
  const guides = getRelatedGuides(neighborhood.relatedGuideSlugs);
  const otherNeighborhoods = NEIGHBORHOODS.filter(
    (item) => item.slug !== neighborhood.slug
  ).slice(0, 3);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Seoul", path: "/seoul" },
          {
            name: neighborhood.name,
            path: `/seoul/${neighborhood.slug}`,
          },
        ])}
      />
      <header className="grid gap-10 lg:grid-cols-[1fr_28rem] lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent">
            Seoul Neighborhood
          </p>
          <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
            {neighborhood.name}
          </h1>
          <p className="mt-5 text-xl leading-8 text-text-muted">
            {neighborhood.introduction}
          </p>
        </div>
        <TonalFrame
          src={neighborhood.image}
          alt={neighborhood.imageAlt}
          ratio="aspect-[4/5]"
          sizes="(max-width: 1024px) 100vw, 448px"
          priority
          branded
        />
      </header>

      <section className="mt-14 grid gap-8 md:grid-cols-3">
        <InfoBlock title="Why visit" items={neighborhood.whyVisit} />
        <InfoBlock
          title="Best beauty experiences"
          items={neighborhood.bestExperiences}
        />
        <InfoBlock title="Suggested itinerary" items={neighborhood.itinerary} />
      </section>

      {places.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="Featured places" eyebrow="Directory" />
          <div className="grid gap-8 md:grid-cols-3">
            {places.map((place) => (
              <DiscoveryPlaceCard key={place.slug} place={place} />
            ))}
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="Related guides" eyebrow="Plan the day" />
          <div className="grid gap-8 md:grid-cols-3">
            {guides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-16">
        <SectionHeading
          title="Explore another neighborhood"
          eyebrow="Seoul next"
        />
        <div className="grid gap-8 md:grid-cols-3">
          {otherNeighborhoods.map((item) => (
            <NeighborhoodCard key={item.slug} neighborhood={item} />
          ))}
        </div>
      </section>
    </main>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-y border-soft-gray py-6">
      <h2 className="font-serif text-2xl">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-text-muted">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
