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
  GUIDE_CATEGORIES,
  GUIDES,
  getGuideBySlug,
  getGuideCategoryBySlug,
  getGuidesByCategory,
  getNeighborhoodBySlug,
  getPlaceBySlug,
} from "@/lib/discovery";
import {
  breadcrumbJsonLd,
  canonical,
  faqJsonLd,
  guideJsonLd,
  itemListJsonLd,
} from "@/lib/seo";

export function generateStaticParams() {
  return [
    ...GUIDE_CATEGORIES.map((category) => ({ slug: category.slug })),
    ...GUIDES.map((guide) => ({ slug: guide.slug })),
  ];
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const category = getGuideCategoryBySlug(params.slug);
  if (category) {
    return {
      title: category.title,
      description: category.intro,
      alternates: { canonical: canonical(`/guides/${category.slug}`) },
    };
  }

  const guide = getGuideBySlug(params.slug);
  if (!guide) return { title: "Not found" };
  return {
    title: guide.title,
    description: guide.deck,
    alternates: { canonical: canonical(`/guides/${guide.slug}`) },
    openGraph: {
      title: guide.title,
      description: guide.deck,
      images: guide.heroImage ? [canonical(guide.heroImage)] : undefined,
    },
  };
}

export default function GuideRoutePage({
  params,
}: {
  params: { slug: string };
}) {
  const category = getGuideCategoryBySlug(params.slug);
  if (category) {
    const guides = getGuidesByCategory(category.slug);
    return (
      <main className="mx-auto max-w-content px-6 py-16">
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: category.title, path: `/guides/${category.slug}` },
          ])}
        />
        <JsonLd
          data={itemListJsonLd(
            category.title,
            guides.map((guide) => ({
              name: guide.title,
              path: `/guides/${guide.slug}`,
            }))
          )}
        />
        <header className="max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-accent">
            Guides
          </p>
          <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
            {category.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-text-muted">
            {category.intro}
          </p>
        </header>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {guides.map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </main>
    );
  }

  const guide = getGuideBySlug(params.slug);
  if (!guide) notFound();

  const recommendations = guide.recommendations
    .map((item) => ({
      note: item.editorNote,
      place: getPlaceBySlug(item.placeSlug),
    }))
    .filter(
      (
        item
      ): item is {
        note: string;
        place: NonNullable<ReturnType<typeof getPlaceBySlug>>;
      } => Boolean(item.place)
    );
  const neighborhoods = guide.relatedNeighborhoodSlugs
    .map(getNeighborhoodBySlug)
    .filter(
      (
        neighborhood
      ): neighborhood is NonNullable<
        ReturnType<typeof getNeighborhoodBySlug>
      > => Boolean(neighborhood)
    );
  const relatedGuides = GUIDES.filter(
    (candidate) =>
      candidate.slug !== guide.slug && candidate.category === guide.category
  ).slice(0, 3);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd data={guideJsonLd(guide)} />
      <JsonLd data={faqJsonLd(guide.faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ])}
      />
      <article className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">Guide</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
          {guide.title}
        </h1>
        <p className="mt-5 text-xl leading-8 text-text-muted">{guide.deck}</p>
        <p className="mt-4 text-sm text-text-muted">
          Last updated {guide.lastUpdated}
        </p>
        <figure className="mt-8">
          <TonalFrame
            src={guide.heroImage}
            alt={guide.heroAlt}
            ratio="aspect-[16/10]"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            branded
          />
        </figure>

        <section className="mt-10">
          <h2 className="font-serif text-3xl">Quick answer</h2>
          <p className="mt-4 leading-8 text-text-muted">{guide.intro}</p>
        </section>

        <section className="mt-10 border-t border-soft-gray pt-8">
          <h2 className="font-serif text-3xl">Who this guide is for</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-text-muted md:grid-cols-2">
            {guide.whoFor.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10 border-t border-soft-gray pt-8">
          <h2 className="font-serif text-3xl">Quick recommendations</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-text-muted">
            {guide.quickRecommendations.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>
      </article>

      {recommendations.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="Recommended places" eyebrow="Shortlist" />
          <div className="grid gap-8 md:grid-cols-3">
            {recommendations.map(({ place, note }) => (
              <div key={place.slug}>
                <DiscoveryPlaceCard place={place} />
                <p className="mt-3 text-sm leading-6 text-text-muted">{note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 grid gap-8 md:grid-cols-[1fr_1fr]">
        <div className="border-y border-soft-gray py-8">
          <h2 className="font-serif text-3xl">Comparison notes</h2>
          <dl className="mt-5 space-y-4">
            {guide.comparison.map((row) => (
              <div key={row.label}>
                <dt className="text-[11px] uppercase tracking-label text-text-muted">
                  {row.label}
                </dt>
                <dd className="mt-1 text-sm">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="border-y border-soft-gray py-8">
          <h2 className="font-serif text-3xl">Map</h2>
          <div className="mt-5 flex min-h-48 items-center justify-center bg-porcelain text-center text-sm leading-6 text-text-muted">
            Map integration placeholder. Place coordinates can be added when
            listings are verified.
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-serif text-3xl">FAQ</h2>
        <div className="mt-5 space-y-5">
          {guide.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-medium">{faq.question}</h3>
              <p className="mt-2 leading-7 text-text-muted">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {neighborhoods.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            title="Related neighborhoods"
            eyebrow="Explore Seoul"
          />
          <div className="grid gap-8 md:grid-cols-3">
            {neighborhoods.map((neighborhood) => (
              <NeighborhoodCard
                key={neighborhood.slug}
                neighborhood={neighborhood}
              />
            ))}
          </div>
        </section>
      )}

      {relatedGuides.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="Related guides" eyebrow="Keep planning" />
          <div className="grid gap-8 md:grid-cols-3">
            {relatedGuides.map((relatedGuide) => (
              <GuideCard key={relatedGuide.slug} guide={relatedGuide} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
