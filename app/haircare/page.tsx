import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { buildPageMetadata } from "@/lib/seo";
import { HAIRCARE_CATEGORIES } from "@/lib/taxonomy";
import { HAIR_PROFILES } from "@/lib/haircare/profiles";
import type { Post } from "@/services/types";

export const metadata: Metadata = buildPageMetadata({
  title: "Haircare",
  description:
    "Start with your hair, not a product. Understand your scalp, strands, damage level, and ideal routine through the lens of Korean hair care.",
  path: "/haircare",
});

export const dynamic = "force-dynamic";

export default async function HaircarePage() {
  let posts: Post[] = [];
  try {
    posts = await listPublishedPosts({
      limit: 96,
      categories: HAIRCARE_CATEGORIES,
    });
  } catch (err) {
    console.error("haircare: posts fetch failed", err);
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      {/* Hero — the section leads with diagnosis, not a product. */}
      <p className="text-xs uppercase tracking-widest text-accent">Haircare</p>
      <h1 className="mt-2 max-w-2xl font-serif text-4xl leading-tight md:text-5xl">
        Start with your hair, not a product.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-text-muted">
        Understand your scalp, strands, damage level, and ideal routine through
        the lens of Korean hair care.
      </p>
      <Link
        href="/beauty-profile/hair"
        className="mt-6 inline-block rounded-full border border-text px-5 py-2.5 text-[11px] uppercase tracking-label text-text transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent hover:text-bg"
      >
        Discover My Hair Profile →
      </Link>

      {/* Start With Your Profile — the six profiles. */}
      <section className="mt-16">
        <SectionHeading
          title="Start with your profile"
          eyebrow="Six profiles"
        />
        <p className="-mt-2 mb-8 max-w-2xl text-text-muted">
          Not sure where you belong? Take the two-minute Hair Profile test — or
          pick the one that sounds most like you.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {HAIR_PROFILES.map((p) => (
            <Link
              key={p.slug}
              href={`/haircare/profiles/${p.slug}`}
              className="group block rounded-lg border border-soft-gray p-5 transition-colors duration-medium ease-editorial hover:border-accent"
            >
              <h3 className="font-serif text-xl leading-snug transition-colors duration-medium ease-editorial group-hover:text-accent">
                {p.name}
              </h3>
              <p className="mt-2 text-sm text-text-muted">{p.tagline}</p>
              <span className="mt-4 inline-block text-[11px] uppercase tracking-label text-accent">
                Read the guide →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Scalp Care + Treatments anchors land here for the GNB dropdown. */}
      <section id="scalp-care" className="mt-16 scroll-mt-24">
        <SectionHeading title="Scalp care & treatments" eyebrow="Go deeper" />
        <p
          id="treatments"
          className="-mt-2 mb-8 max-w-2xl scroll-mt-24 text-text-muted"
        >
          Head spa, scalp health, treatments, and styling — the Korean approach,
          explained. Explore the{" "}
          <Link
            href="/ingredients"
            className="text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
          >
            ingredient dictionary
          </Link>{" "}
          or our{" "}
          <Link
            href="/skincare/picks"
            className="text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
          >
            product picks
          </Link>
          .
        </p>
        {posts.length === 0 ? (
          <p className="text-text-muted">
            Haircare stories are on the way — check back soon.
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {posts.map((p) => (
              <ArticleCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
