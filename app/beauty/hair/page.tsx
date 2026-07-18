import type { Metadata } from "next";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { BeautyTabs } from "@/components/editorial/BeautyTabs";
import { canonical } from "@/lib/seo";
import type { Post } from "@/services/types";

export const metadata: Metadata = {
  title: "Hair",
  description:
    "Korean hair and scalp care — salons, treatments, and routines worth the flight.",
  alternates: { canonical: canonical("/beauty/hair") },
};

export const dynamic = "force-dynamic";

export default async function BeautyHairPage() {
  let posts: Post[] = [];
  try {
    posts = await listPublishedPosts({ limit: 96, category: "hair" });
  } catch (err) {
    console.error("beauty/hair: posts fetch failed", err);
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Beauty" eyebrow="The Journal" />
      <BeautyTabs active="hair" />
      {posts.length === 0 ? (
        <p className="text-text-muted">
          No hair stories yet — check back soon.
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
