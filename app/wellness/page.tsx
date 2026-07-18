import type { Metadata } from "next";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";
import { WELLNESS_CATEGORIES } from "@/lib/taxonomy";
import type { Post } from "@/services/types";

export const metadata: Metadata = {
  title: "Wellness",
  description:
    "Bathhouses, head spas, and the quieter side of Seoul — the rituals worth slowing down for.",
  alternates: { canonical: canonical("/wellness") },
};

export const dynamic = "force-dynamic";

export default async function WellnessPage() {
  let posts: Post[] = [];
  try {
    posts = await listPublishedPosts({
      limit: 96,
      categories: WELLNESS_CATEGORIES,
    });
  } catch (err) {
    console.error("wellness: posts fetch failed", err);
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Wellness" eyebrow="The Journal" />
      {posts.length === 0 ? (
        <p className="text-text-muted">
          No wellness stories yet — check back soon.
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
