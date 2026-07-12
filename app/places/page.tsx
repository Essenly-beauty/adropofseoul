import type { Metadata } from "next";
import Link from "next/link";
import { DiscoveryPlaceCard } from "@/components/editorial/DiscoveryCards";
import { JsonLd } from "@/components/editorial/JsonLd";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import {
  PLACES,
  PLACE_TYPE_LABELS,
  PLACE_TYPE_ROUTES,
  type PlaceType,
} from "@/lib/discovery";
import { breadcrumbJsonLd, canonical, itemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Seoul Beauty Places",
  description:
    "A curated Seoul directory for hair salons, head spas, skin clinics, and Korean beauty stores.",
  alternates: { canonical: canonical("/places") },
  openGraph: {
    title: "Seoul Beauty Places | A Drop of Seoul",
    description:
      "Discover salons, head spas, clinics, and beauty stores worth knowing in Seoul.",
  },
};

const FILTERS: { label: string; href: string; type?: PlaceType }[] = [
  { label: "All", href: "/places" },
  ...Object.entries(PLACE_TYPE_ROUTES).map(([type, href]) => ({
    label: PLACE_TYPE_LABELS[type as PlaceType],
    href,
    type: type as PlaceType,
  })),
];

export default function PlacesPage() {
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Places", path: "/places" },
        ])}
      />
      <JsonLd
        data={itemListJsonLd(
          "Seoul beauty places",
          PLACES.map((place) => ({
            name: place.name,
            path: `/places/${place.slug}`,
          }))
        )}
      />
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">
          Seoul Directory
        </p>
        <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
          Find your beauty spot in Seoul.
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-muted">
          Explore carefully selected salons, head spas, clinics, and beauty
          stores across Seoul. Sample listings are structured so verified
          addresses, booking links, and maps can be added cleanly.
        </p>
      </header>

      <nav aria-label="Place filters" className="mt-10 flex flex-wrap gap-3">
        {FILTERS.map((filter) => (
          <Link
            key={filter.href}
            href={filter.href}
            className="rounded-full border border-soft-gray px-4 py-2 text-xs uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <section className="mt-12">
        <SectionHeading title="All Seoul Places" eyebrow="Directory" />
        <div className="grid gap-8 md:grid-cols-3">
          {PLACES.map((place) => (
            <DiscoveryPlaceCard key={place.slug} place={place} />
          ))}
        </div>
      </section>
    </main>
  );
}
