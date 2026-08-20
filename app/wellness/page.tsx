import type { Metadata } from "next";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { buildPageMetadata } from "@/lib/seo";
import { WELLNESS_CATEGORIES } from "@/lib/taxonomy";
import type { Post } from "@/services/types";

export const metadata: Metadata = buildPageMetadata({
  title: "Wellness",
  description:
    "Bathhouses, head spas, and the quieter side of Seoul — the rituals worth slowing down for.",
  path: "/wellness",
});

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
      <SectionHeading title="Wellness" eyebrow="The Journal" as="h1" />
      <p className="-mt-2 mb-8 max-w-2xl text-text-muted">
        The rituals, spaces, and practices that shape everyday well-being in
        Korea — bathhouses, saunas, head spas, and slower days.
      </p>
      {posts.length === 0 ? (
        <p className="text-text-muted">
          No wellness stories are available in this view.
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
