import type { Metadata } from "next";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { BeautyTabs } from "@/components/editorial/BeautyTabs";
import { canonical } from "@/lib/seo";
import type { Post } from "@/services/types";

export const metadata: Metadata = {
  title: "Beauty",
  description:
    "K-beauty routines, serums, and the science of glass skin — tips and columns from A Drop of Seoul.",
  alternates: { canonical: canonical("/beauty") },
};

export const dynamic = "force-dynamic";

export default async function BeautyPage() {
  // The All tab is the superset of editorial beauty articles (skincare + hair).
  // Skincare / Hair / Picks tabs slice it; Ingredients is the dictionary.
  let posts: Post[] = [];
  try {
    posts = await listPublishedPosts({
      limit: 96,
      categories: ["beauty", "hair"],
    });
  } catch (err) {
    console.error("beauty: posts fetch failed", err);
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Beauty" eyebrow="The Journal" />
      <BeautyTabs active="all" />
      {posts.length === 0 ? (
        <p className="text-text-muted">
          No beauty stories yet — check back soon.
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
