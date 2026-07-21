import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlaceBySlug } from "@/services/places";
import { JsonLd } from "@/components/editorial/JsonLd";
import { Stars } from "@/components/editorial/Stars";
import { localBusinessJsonLd, breadcrumbJsonLd, canonical } from "@/lib/seo";
import { PLACE_TYPE_EMOJI, PLACE_TYPE_LABELS } from "@/lib/taxonomy";
import { ShareButtons } from "@/components/editorial/ShareButtons";
import { placeShareImage } from "@/lib/og";

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
      images: [placeShareImage(place)],
    },
    twitter: {
      card: "summary_large_image",
      images: [placeShareImage(place)],
    },
  };
}

const LINKS: {
  key: "googleMapUrl" | "naverMapUrl" | "bookingUrl" | "websiteUrl";
  label: string;
}[] = [
  // Map links are name-based searches, not verified pins — always opened in a
  // new tab so readers can cross-check without losing the directory.
  { key: "googleMapUrl", label: "Google Maps →" },
  { key: "naverMapUrl", label: "네이버 지도 →" },
  { key: "bookingUrl", label: "Book →" },
  { key: "websiteUrl", label: "Website →" },
];

function instagramHandle(url: string): string {
  return url.replace(/\/+$/, "").split("/").pop() ?? url;
}

// One emoji-labelled fact row; renders nothing when the datum was not
// collected for this place. Mirrors the Seongsu course-stop card idiom.
function Field({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex gap-2 text-sm">
      <span aria-hidden className="select-none">
        {icon}
      </span>
      <span className="text-text-muted">
        <span className="font-medium text-text">{label}:</span> {value}
      </span>
    </div>
  );
}

export default async function PlacePage({
  params,
}: {
  params: { slug: string };
}) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) notFound();

  const service =
    place.serviceDetail ??
    PLACE_TYPE_LABELS[place.category] ??
    place.category.replace(/_/g, " ");
  const verdict = place.whyWeLikeIt ?? place.shortDescription;
  const about = place.longDescription
    ?.split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <JsonLd data={localBusinessJsonLd(place)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Places", path: "/places" },
          { name: place.name, path: `/places/${place.slug}` },
        ])}
      />

      <Link
        href="/places"
        className="text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
      >
        ← Seoul Directory
      </Link>

      <article className="mt-4 rounded-lg border border-soft-gray bg-porcelain/40 p-5 md:p-7">
        <p className="text-[11px] uppercase tracking-label text-text-muted">
          {PLACE_TYPE_LABELS[place.category] ??
            place.category.replace(/_/g, " ")}
          {place.entryType === "experience" ? " · Experience" : ""}
          {place.area ? ` · ${place.area}` : ""}
        </p>
        <h1 className="mt-1 font-serif text-2xl leading-tight md:text-3xl">
          {place.name}{" "}
          {place.nameKr && (
            <span className="text-lg text-text-muted">{place.nameKr}</span>
          )}
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {place.rating != null && (
            <>
              <Stars rating={place.rating} />{" "}
              <span className="font-semibold text-text">
                {place.rating.toFixed(1)}
              </span>
              {place.reviewCount != null && (
                <> ({place.reviewCount.toLocaleString()})</>
              )}{" "}
              ·{" "}
            </>
          )}
          <span aria-hidden>{PLACE_TYPE_EMOJI[place.category]}</span> {service}
        </p>

        {verdict && (
          <p className="mt-4 border-l-2 border-accent pl-3 text-[15px] italic text-text">
            {verdict}
          </p>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Field icon="📍" label="Neighborhood" value={place.area} />
          <Field icon="👍" label="Best for" value={place.bestFor} />
          <Field icon="💰" label="Price" value={place.priceRange} />
          <Field
            icon="📷"
            label="Instagram"
            value={
              place.instagramUrl ? (
                <a
                  href={place.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
                >
                  @{instagramHandle(place.instagramUrl)}
                </a>
              ) : null
            }
          />
          <Field icon="🧭" label="Address" value={place.address} />
        </div>

        {about && about.length > 0 && (
          <div className="mt-4 space-y-2 text-sm leading-relaxed text-text-muted">
            <p>
              <span className="font-medium text-text">About: </span>
              {about[0]}
            </p>
            {about.slice(1).map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {LINKS.filter((l) => place[l.key]).map((l) => (
            <a
              key={l.key}
              href={place[l.key] as string}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-text px-4 py-1.5 text-xs font-medium uppercase tracking-label transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
            >
              {l.label}
            </a>
          ))}
        </div>

        <ShareButtons
          path={`/places/${place.slug}`}
          title={`${place.name} — A Drop of Seoul`}
          imageUrl={placeShareImage(place)}
          className="mt-5"
        />
      </article>
    </main>
  );
}
