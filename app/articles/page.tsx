import type { Metadata } from "next";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Guides and stories on Korean beauty, hair, head spas, and Seoul.",
  alternates: { canonical: canonical("/articles") },
};

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    posts = await listPublishedPosts({ limit: 48 });
  } catch (err) {
    console.error("articles: posts fetch failed", err);
  }
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
