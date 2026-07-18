import type { Metadata } from "next";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { BeautyTabs } from "@/components/editorial/BeautyTabs";
import { canonical } from "@/lib/seo";
import { isPick } from "@/lib/taxonomy";
import type { Post } from "@/services/types";

export const metadata: Metadata = {
  title: "Skincare",
  description:
    "Korean skincare routines, actives, and honest advice — from 3-step mornings to barrier repair.",
  alternates: { canonical: canonical("/beauty/skincare") },
};

export const dynamic = "force-dynamic";

export default async function BeautySkincarePage() {
  let posts: Post[] = [];
  try {
    posts = await listPublishedPosts({ limit: 96, category: "beauty" });
  } catch (err) {
    console.error("beauty/skincare: posts fetch failed", err);
  }
  // Skincare = the routine/tips articles; review-type "Picks" live in their tab.
  const articles = posts.filter((p) => !isPick(p));

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Beauty" eyebrow="The Journal" />
      <BeautyTabs active="skincare" />
      {articles.length === 0 ? (
        <p className="text-text-muted">
          No skincare stories yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {articles.map((p) => (
            <ArticleCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </main>
  );
}
