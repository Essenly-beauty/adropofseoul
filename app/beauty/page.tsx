import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import {
  DiscoveryPlaceCard,
  GuideCard,
} from "@/components/editorial/DiscoveryCards";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { BEAUTY_SECTIONS } from "@/lib/beauty";
import { GUIDES, PLACES } from "@/lib/discovery";
import { canonical } from "@/lib/seo";
import { listPublishedPosts } from "@/services/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Korean Beauty Discovery",
  description:
    "Skincare, hair, scalp care, treatments, products, and Seoul beauty places organized for international visitors.",
  alternates: { canonical: canonical("/beauty") },
};

export default async function BeautyPage() {
  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    posts = await listPublishedPosts({ limit: 6, category: "beauty" });
  } catch (err) {
    console.error("beauty: posts fetch failed", err);
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">Beauty</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
          Korean beauty, organized for discovery.
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-muted">
          Skincare, hair, scalp care, and treatments with a clear path from
          editorial story to guide, directory, place detail, and booking or
          product context when it helps.
        </p>
      </header>

      <section className="mt-12">
        <SectionHeading title="Beauty Categories" eyebrow="Explore" />
        <div className="grid gap-px overflow-hidden border-y border-soft-gray bg-soft-gray md:grid-cols-2 lg:grid-cols-5">
          {BEAUTY_SECTIONS.map((section) => (
            <Link
              key={section.slug}
              href={section.href}
              className="group bg-bg p-6 transition-colors duration-medium ease-editorial hover:bg-porcelain"
            >
              <p className="text-[11px] uppercase tracking-label text-accent">
                {section.eyebrow}
              </p>
              <h2 className="mt-2 font-serif text-2xl transition-colors duration-medium ease-editorial group-hover:text-accent">
                {section.label}
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                {section.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading title="Featured guides" eyebrow="Plan" href="/guides" />
        <div className="grid gap-8 md:grid-cols-3">
          {GUIDES.slice(0, 3).map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          title="Featured places"
          eyebrow="Directory"
          href="/places"
        />
        <div className="grid gap-8 md:grid-cols-3">
          {PLACES.filter((place) => place.featured)
            .slice(0, 3)
            .map((place) => (
              <DiscoveryPlaceCard key={place.slug} place={place} />
            ))}
        </div>
      </section>

      {posts.length > 0 && (
        <section className="mt-14">
          <SectionHeading
            title="Latest beauty stories"
            eyebrow="Magazine"
            href="/articles"
          />
          <div className="grid gap-8 md:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
