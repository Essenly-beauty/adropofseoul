import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedPosts } from "@/services/posts";
import { listGuidePosts } from "@/lib/seongsu/assets";
import { listPillarPosts } from "@/lib/articles/assets";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { buildPageMetadata } from "@/lib/seo";
import { sectionForCategory } from "@/lib/taxonomy";
import type { Post } from "@/services/types";

export const metadata: Metadata = buildPageMetadata({
  title: "Stories",
  description:
    "Every latest story from A Drop of Seoul in one place — skincare, haircare, wellness, and Seoul.",
  path: "/stories",
});

export const dynamic = "force-dynamic";

// Stories is a unified feed, not an independent category — a filter narrows the
// same list to a single section.
const FILTERS = [
  { key: "all", label: "All" },
  { key: "skincare", label: "Skincare" },
  { key: "haircare", label: "Haircare" },
  { key: "wellness", label: "Wellness" },
  { key: "seoul", label: "A Local's Seoul" },
] as const;

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  let dbPosts: Post[] = [];
  try {
    dbPosts = await listPublishedPosts({ limit: 96 });
  } catch (err) {
    console.error("stories: posts fetch failed", err);
  }
  // Merge in the code-defined guides + pillar articles, deduped, newest first.
  const codePosts = [...listGuidePosts(), ...listPillarPosts()];
  const codeSlugs = new Set(codePosts.map((p) => p.slug));
  const all: Post[] = [
    ...codePosts,
    ...dbPosts.filter((p) => !codeSlugs.has(p.slug)),
  ].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));

  const active = FILTERS.some((f) => f.key === searchParams.filter)
    ? (searchParams.filter as string)
    : "all";
  const posts =
    active === "all"
      ? all
      : all.filter((p) => sectionForCategory(p.category).slug === active);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Stories" eyebrow="The Journal" />
      <p className="-mt-2 mb-8 max-w-2xl text-text-muted">
        Every latest story in one place. Filter by what you came for.
      </p>
      <nav aria-label="Filter stories" className="mb-10 flex flex-wrap gap-2.5">
        {FILTERS.map((f) => {
          const isActive = f.key === active;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/stories" : `/stories?filter=${f.key}`}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-label transition-colors duration-medium ease-editorial ${
                isActive
                  ? "border-text bg-text text-bg"
                  : "border-soft-gray text-text-muted hover:border-accent hover:text-text"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>
      {posts.length === 0 ? (
        <p className="text-text-muted">
          No stories here yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {posts.map((p) => (
            <ArticleCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </main>
  );
}
