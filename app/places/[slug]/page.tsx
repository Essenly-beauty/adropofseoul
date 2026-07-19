import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlaceBySlug } from "@/services/places";
import { Prose } from "@/components/editorial/Prose";
import { JsonLd } from "@/components/editorial/JsonLd";
import { localBusinessJsonLd, breadcrumbJsonLd, canonical } from "@/lib/seo";
import { PLACE_TYPE_LABELS } from "@/lib/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const place = await getPlaceBySlug(params.slug);
  if (!place) return { title: "Not found" };
  return {
    title: place.name,
    description: place.shortDescription ?? undefined,
    alternates: { canonical: canonical(`/places/${place.slug}`) },
    openGraph: {
      title: place.name,
      description: place.shortDescription ?? undefined,
      images: place.images[0] ? [place.images[0]] : undefined,
    },
  };
}

const LINKS: {
  key:
    | "googleMapUrl"
    | "naverMapUrl"
    | "bookingUrl"
    | "instagramUrl"
    | "websiteUrl";
  label: string;
}[] = [
  // Map links are name-based searches, not verified pins — always opened in a
  // new tab so readers can cross-check without losing the directory.
  { key: "googleMapUrl", label: "Google Maps" },
  { key: "naverMapUrl", label: "Naver Map" },
  { key: "bookingUrl", label: "Book" },
  { key: "websiteUrl", label: "Website" },
  { key: "instagramUrl", label: "Instagram" },
];

export default async function PlacePage({
  params,
}: {
  params: { slug: string };
}) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={localBusinessJsonLd(place)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Places", path: "/places" },
          { name: place.name, path: `/places/${place.slug}` },
        ])}
      />
      <p className="text-xs uppercase tracking-widest text-accent">
        {PLACE_TYPE_LABELS[place.category] ?? place.category.replace(/_/g, " ")}
        {place.entryType === "experience" ? " · Experience" : ""}
        {place.area ? ` · ${place.area}` : ""}
      </p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">{place.name}</h1>
      {place.nameKr && <p className="mt-2 text-text-muted">{place.nameKr}</p>}
      {place.rating != null && (
        <p className="mt-2 text-sm text-text-muted">
          ★ {place.rating.toFixed(1)}
          {place.reviewCount != null && ` · ${place.reviewCount} reviews`}
        </p>
      )}
      {place.shortDescription && (
        <p className="mt-3 text-xl text-text-muted">{place.shortDescription}</p>
      )}

      {place.whyWeLikeIt && (
        <div className="mt-6 rounded-lg bg-muted-pink/40 p-4">
          <p className="text-sm font-medium">Why we like it</p>
          <p className="mt-1 text-sm text-text-muted">{place.whyWeLikeIt}</p>
        </div>
      )}

      {place.longDescription && (
        <div className="mt-8">
          <Prose markdown={place.longDescription} />
        </div>
      )}

      <dl className="mt-8 space-y-1 text-sm">
        {place.address && (
          <div className="flex gap-2">
            <dt className="text-text-muted">Address</dt>
            <dd>{place.address}</dd>
          </div>
        )}
        {place.bestFor && (
          <div className="flex gap-2">
            <dt className="text-text-muted">Best for</dt>
            <dd>{place.bestFor}</dd>
          </div>
        )}
        {place.priceRange && (
          <div className="flex gap-2">
            <dt className="text-text-muted">Price</dt>
            <dd>{place.priceRange}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        {LINKS.filter((l) => place[l.key]).map((l) => (
          <a
            key={l.key}
            href={place[l.key] as string}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-soft-gray px-4 py-2 text-sm hover:border-accent"
          >
            {l.label}
          </a>
        ))}
      </div>
    </main>
  );
}
