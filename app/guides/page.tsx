import type { Metadata } from "next";
import Link from "next/link";
import { GuideCard } from "@/components/editorial/DiscoveryCards";
import { JsonLd } from "@/components/editorial/JsonLd";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { GUIDE_CATEGORIES, GUIDES } from "@/lib/discovery";
import { breadcrumbJsonLd, canonical, itemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Seoul Beauty Guides",
  description:
    "Best-of Seoul guides, neighborhood guides, beauty itineraries, and practical how-to guides for Korean beauty discovery.",
  alternates: { canonical: canonical("/guides") },
  openGraph: {
    title: "Seoul Beauty Guides | A Drop of Seoul",
    description:
      "Plan salons, head spas, skin clinics, beauty shopping, and neighborhood itineraries with clearer context.",
  },
};

export default function GuidesPage() {
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ])}
      />
      <JsonLd
        data={itemListJsonLd(
          "Seoul beauty guides",
          GUIDES.map((guide) => ({
            name: guide.title,
            path: `/guides/${guide.slug}`,
          }))
        )}
      />
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">Guides</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
          Plan beauty days with fewer tabs open.
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-muted">
          Search-intent guides for Seoul beauty places, neighborhoods,
          itineraries, and practical booking decisions.
        </p>
      </header>

      <section className="mt-12">
        <SectionHeading title="Guide Types" eyebrow="Start here" />
        <div className="grid gap-px overflow-hidden border-y border-soft-gray bg-soft-gray md:grid-cols-4">
          {GUIDE_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/guides/${category.slug}`}
              className="group bg-bg p-6 transition-colors duration-medium ease-editorial hover:bg-porcelain"
            >
              <h2 className="font-serif text-2xl transition-colors duration-medium ease-editorial group-hover:text-accent">
                {category.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                {category.intro}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading title="Featured Guides" eyebrow="Read next" />
        <div className="grid gap-8 md:grid-cols-3">
          {GUIDES.map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </section>
    </main>
  );
}
