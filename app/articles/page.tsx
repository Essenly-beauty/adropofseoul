import type { Metadata } from "next";
import { listPublishedPosts } from "@/services/posts";
import { listGuidePosts } from "@/lib/seongsu/assets";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";
import type { Post } from "@/services/types";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Guides and stories on Korean beauty, hair, head spas, and Seoul.",
  alternates: { canonical: canonical("/articles") },
};

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  let dbPosts: Post[] = [];
  try {
    dbPosts = await listPublishedPosts({ limit: 48 });
  } catch (err) {
    console.error("articles: posts fetch failed", err);
  }
  // Merge in the code-defined Seongsu guides, deduped by slug, newest first.
  const guideSlugs = new Set(listGuidePosts().map((g) => g.slug));
  const posts: Post[] = [
    ...listGuidePosts(),
    ...dbPosts.filter((p) => !guideSlugs.has(p.slug)),
  ].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Stories" eyebrow="The Journal" />
      {posts.length === 0 ? (
        <p className="text-text-muted">
          No stories published yet — check back soon.
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
