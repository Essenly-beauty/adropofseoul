import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { JsonLd } from "@/components/editorial/JsonLd";
import { NeighborhoodDirectory } from "@/components/around-seoul/NeighborhoodDirectory";
import { breadcrumbJsonLd, canonical } from "@/lib/seo";
import {
  getNeighborhood,
  neighborhoodAreas,
  regionForGuide,
} from "@/lib/taxonomy";
import { listPublishedPosts } from "@/services/posts";
import { listGuidePosts } from "@/lib/seongsu/assets";
import { listPlaces } from "@/services/places";
import { SeongsuMap } from "@/components/seongsu/SeongsuMap";
import { WaitlistForm } from "@/components/seongsu/WaitlistForm";
import type { Post, Place } from "@/services/types";

// Rendered on demand: the hub pulls DB `guides` posts (via cookies), so it can't
// be statically prerendered. `notFound()` still guards unknown neighborhoods.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { neighborhood: string };
}): Promise<Metadata> {
  const n = getNeighborhood(params.neighborhood);
  if (!n) return { title: "Not found" };
  const title = `${n.label} — Around Seoul`;
  return {
    title,
    description: n.lede ?? n.blurb,
    alternates: { canonical: canonical(`/around-seoul/${n.slug}`) },
    openGraph: {
      title,
      description: n.lede ?? n.blurb,
      type: "website",
      url: canonical(`/around-seoul/${n.slug}`),
    },
  };
}

// All guides for a neighborhood: DB `guides` posts + code-defined guides,
// deduped by slug, filtered to this region, newest first.
async function neighborhoodPosts(slug: string): Promise<Post[]> {
  let db: Post[] = [];
  try {
    db = await listPublishedPosts({ limit: 96, category: "guides" });
  } catch (err) {
    console.error("around-seoul: guides fetch failed", err);
  }
  const seen = new Set<string>();
  return [...listGuidePosts(), ...db]
    .filter((p) => {
      if (seen.has(p.slug)) return false;
      seen.add(p.slug);
      return regionForGuide(p) === slug;
    })
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

// Published places for the hub's purpose sections; hubs render fine without.
// limit 200 matches /places; revisit if any hub's row count approaches it.
async function neighborhoodPlaces(areas: string[]): Promise<Place[]> {
  try {
    return await listPlaces({ limit: 200, areas });
  } catch (err) {
    console.error("around-seoul: places fetch failed", err);
    return [];
  }
}

export default async function NeighborhoodPage({
  params,
}: {
  params: { neighborhood: string };
}) {
  const n = getNeighborhood(params.neighborhood);
  if (!n) notFound();

  const posts = await neighborhoodPosts(n.slug);
  const places = n.sections?.length
    ? await neighborhoodPlaces(neighborhoodAreas(n))
    : [];

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Around Seoul", path: "/around-seoul" },
          { name: n.label, path: `/around-seoul/${n.slug}` },
        ])}
      />

      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-accent">
          Around Seoul · Neighborhood
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">
          {n.heading ?? n.label}
        </h1>
        <p className="mt-4 text-lg text-text-muted">{n.lede ?? n.blurb}</p>
      </header>

      {n.hasMap && <SeongsuMap course={1} className="mx-auto max-w-3xl" />}

      <NeighborhoodDirectory neighborhood={n} places={places} />

      {posts.length > 0 && (
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <ArticleCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {n.slug === "seongsu" && (
        <div className="mx-auto mt-6 max-w-3xl">
          <WaitlistForm
            source="seongsu-series"
            heading="Want us to run this walk with you?"
            body="We're building small-group Seongsu guides that run exactly these routes — beauty flagships and local tables, no tourist traps."
            button="Join the waitlist"
          />
        </div>
      )}

      <aside className="mt-16 border-t border-soft-gray pt-8">
        <p className="text-text-muted">
          Looking for a specific spot in {n.label}?{" "}
          <Link
            href={
              n.areas
                ? "/places"
                : `/places?area=${encodeURIComponent(n.label)}`
            }
            className="text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
          >
            Browse the {n.label} directory →
          </Link>
        </p>
      </aside>
    </main>
  );
}
