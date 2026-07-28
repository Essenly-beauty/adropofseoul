import type { Metadata } from "next";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { SectionTabs } from "@/components/editorial/SectionTabs";
import { canonical } from "@/lib/seo";
import { SKINCARE_TABS, isPick } from "@/lib/taxonomy";
import type { Post } from "@/services/types";

export const metadata: Metadata = {
  title: "Skincare",
  description:
    "Understand Korean skincare beyond trends — from routines and ingredients to treatments and aftercare.",
  alternates: { canonical: canonical("/skincare") },
};

export const dynamic = "force-dynamic";

export default async function SkincarePage() {
  let posts: Post[] = [];
  try {
    posts = await listPublishedPosts({ limit: 96, category: "beauty" });
  } catch (err) {
    console.error("skincare: posts fetch failed", err);
  }
  // Skincare = routine / actives / treatment articles; review-type "Picks"
  // live under their own tab.
  const articles = posts.filter((p) => !isPick(p));

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Skincare" eyebrow="The Journal" />
      <p className="-mt-2 mb-8 max-w-2xl text-text-muted">
        Korean skincare beyond trends — routines, ingredients, treatments, and
        the aftercare that holds it all together.
      </p>
      <SectionTabs
        label="Skincare sections"
        tabs={SKINCARE_TABS}
        active="skincare"
      />
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
