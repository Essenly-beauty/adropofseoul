import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DiscoveryPlaceCard,
  GuideCard,
} from "@/components/editorial/DiscoveryCards";
import { JsonLd } from "@/components/editorial/JsonLd";
import { Prose } from "@/components/editorial/Prose";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { TonalFrame } from "@/components/editorial/TonalFrame";
import {
  PLACES,
  PLACE_TYPE_LABELS,
  getGuideBySlug,
  getPlaceBySlug as getDiscoveryPlaceBySlug,
  getPlacesByType,
  getRelatedPlaces,
  type PlaceType,
} from "@/lib/discovery";
import {
  breadcrumbJsonLd,
  canonical,
  discoveryPlaceJsonLd,
  itemListJsonLd,
  localBusinessJsonLd,
} from "@/lib/seo";
import { getPlaceBySlug as getDbPlaceBySlug } from "@/services/places";

const PLACE_TYPE_BY_ROUTE: Record<string, PlaceType> = {
  "hair-salons": "hair-salon",
  "head-spas": "head-spa",
  "skin-clinics": "skin-clinic",
  "beauty-stores": "beauty-store",
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const type = PLACE_TYPE_BY_ROUTE[params.slug];
  if (type) {
    const title = `${PLACE_TYPE_LABELS[type]} in Seoul`;
    return {
      title,
      description: `Discover ${PLACE_TYPE_LABELS[
        type
      ].toLowerCase()} worth knowing in Seoul.`,
      alternates: { canonical: canonical(`/places/${params.slug}`) },
      openGraph: { title },
    };
  }

  const place = getDiscoveryPlaceBySlug(params.slug);
  if (place) {
    return {
      title: place.name,
      description: place.summary,
      alternates: { canonical: canonical(`/places/${place.slug}`) },
      openGraph: {
        title: place.name,
        description: place.summary,
        images: place.image ? [canonical(place.image)] : undefined,
      },
    };
  }

  const dbPlace = await getDbPlaceBySlug(params.slug);
  if (!dbPlace) return { title: "Not found" };
  return {
    title: dbPlace.name,
    description: dbPlace.shortDescription ?? undefined,
    alternates: { canonical: canonical(`/places/${dbPlace.slug}`) },
    openGraph: {
      title: dbPlace.name,
      description: dbPlace.shortDescription ?? undefined,
      images: dbPlace.images[0] ? [dbPlace.images[0]] : undefined,
    },
  };
}

export function generateStaticParams() {
  return [
    ...Object.keys(PLACE_TYPE_BY_ROUTE).map((slug) => ({ slug })),
    ...PLACES.map((place) => ({ slug: place.slug })),
  ];
}

export default async function PlaceRoutePage({
  params,
}: {
  params: { slug: string };
}) {
  const type = PLACE_TYPE_BY_ROUTE[params.slug];
  if (type) return <PlaceTypePage slug={params.slug} type={type} />;

  const place = getDiscoveryPlaceBySlug(params.slug);
  if (place) return <DiscoveryPlaceDetail place={place} />;

  const dbPlace = await getDbPlaceBySlug(params.slug);
  if (!dbPlace) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={localBusinessJsonLd(dbPlace)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Places", path: "/places" },
          { name: dbPlace.name, path: `/places/${dbPlace.slug}` },
        ])}
      />
      <p className="text-xs uppercase tracking-widest text-accent">
        {dbPlace.category.replace(/_/g, " ")}
        {dbPlace.area ? ` / ${dbPlace.area}` : ""}
      </p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">{dbPlace.name}</h1>
      {dbPlace.shortDescription && (
        <p className="mt-3 text-xl text-text-muted">
          {dbPlace.shortDescription}
        </p>
      )}
      {dbPlace.longDescription && (
        <div className="mt-8">
          <Prose markdown={dbPlace.longDescription} />
        </div>
      )}
    </main>
  );
}

function PlaceTypePage({ slug, type }: { slug: string; type: PlaceType }) {
  const places = getPlacesByType(type);
  const label = PLACE_TYPE_LABELS[type];

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Places", path: "/places" },
          { name: label, path: `/places/${slug}` },
        ])}
      />
      <JsonLd
        data={itemListJsonLd(
          `${label} in Seoul`,
          places.map((place) => ({
            name: place.name,
            path: `/places/${place.slug}`,
          }))
        )}
      />
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">Places</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
          {label} in Seoul
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-muted">
          A scannable shortlist built for discovery, comparison, and future
          booking support.
        </p>
      </header>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {places.map((place) => (
          <DiscoveryPlaceCard key={place.slug} place={place} />
        ))}
      </div>
    </main>
  );
}

function DiscoveryPlaceDetail({
  place,
}: {
  place: NonNullable<ReturnType<typeof getDiscoveryPlaceBySlug>>;
}) {
  const nearby = getRelatedPlaces(place.nearbyPlaceSlugs);
  const relatedGuides = place.relatedGuideSlugs
    .map(getGuideBySlug)
    .filter((guide): guide is NonNullable<ReturnType<typeof getGuideBySlug>> =>
      Boolean(guide)
    );
  const primaryCtaUrl =
    place.ctaUrl ?? place.bookingUrl ?? place.websiteUrl ?? place.mapUrl;

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd data={discoveryPlaceJsonLd(place)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Places", path: "/places" },
          { name: place.name, path: `/places/${place.slug}` },
        ])}
      />
      <article className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent">
            {PLACE_TYPE_LABELS[place.type]} / {place.neighborhood}
          </p>
          <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
            {place.name}
          </h1>
          <p className="mt-5 text-xl leading-8 text-text-muted">
            {place.summary}
          </p>
          <figure className="mt-8">
            <TonalFrame
              src={place.image}
              alt={place.imageAlt}
              ratio="aspect-[16/10]"
              sizes="(max-width: 1024px) 100vw, 760px"
              priority
              branded
            />
            {place.sample && (
              <figcaption className="mt-3 text-xs leading-relaxed text-text-muted">
                Sample editorial listing. Verify address, booking, and official
                details before publication.
              </figcaption>
            )}
          </figure>

          <section className="mt-10">
            <h2 className="font-serif text-3xl">Editorial overview</h2>
            <p className="mt-4 leading-8 text-text-muted">{place.overview}</p>
          </section>

          <TwoColumnList title="Why go" items={place.whyGo} />
          <TwoColumnList title="Best for" items={place.bestFor} />
          <TwoColumnList
            title="Signature services"
            items={place.signatureServices}
          />
          <TwoColumnList title="Practical tips" items={place.practicalTips} />

          {nearby.length > 0 && (
            <section className="mt-14">
              <SectionHeading title="Nearby places" eyebrow="Keep exploring" />
              <div className="grid gap-8 md:grid-cols-2">
                {nearby.map((nearbyPlace) => (
                  <DiscoveryPlaceCard
                    key={nearbyPlace.slug}
                    place={nearbyPlace}
                  />
                ))}
              </div>
            </section>
          )}

          {relatedGuides.length > 0 && (
            <section className="mt-14">
              <SectionHeading title="Related guides" eyebrow="Plan better" />
              <div className="grid gap-8 md:grid-cols-2">
                {relatedGuides.map((guide) => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit border-y border-soft-gray py-6 lg:sticky lg:top-24">
          <dl className="space-y-4 text-sm">
            <InfoRow label="Neighborhood" value={place.neighborhood} />
            <InfoRow label="Type" value={PLACE_TYPE_LABELS[place.type]} />
            <InfoRow label="Price" value={place.priceRange} />
            <InfoRow
              label="English"
              value={
                place.englishAvailable === true
                  ? "Available"
                  : place.englishAvailable === false
                    ? "Korean only"
                    : "Unknown"
              }
            />
            <InfoRow label="Address" value={place.address ?? "To verify"} />
            <InfoRow
              label="Opening hours"
              value={place.openingHours ?? "To verify"}
            />
            <InfoRow label="Last verified" value={place.lastVerified} />
          </dl>
          {primaryCtaUrl ? (
            <a
              href={primaryCtaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block rounded-full border border-text px-5 py-3 text-center text-xs uppercase tracking-label transition-colors duration-medium ease-editorial hover:bg-text hover:text-bg"
            >
              {place.ctaLabel}
            </a>
          ) : (
            <p className="mt-6 text-xs leading-5 text-text-muted">
              Booking and map links are pending verification.
            </p>
          )}
          <p className="mt-5 text-xs leading-5 text-text-muted">
            Inclusion is editorial and selective. Paid placement, if present in
            the future, will be disclosed clearly.
          </p>
        </aside>
      </article>
    </main>
  );
}

function TwoColumnList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-10 border-t border-soft-gray pt-8">
      <h2 className="font-serif text-3xl">{title}</h2>
      <ul className="mt-4 grid gap-3 text-sm leading-6 text-text-muted md:grid-cols-2">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-label text-text-muted">
        {label}
      </dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
