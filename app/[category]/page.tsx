import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, CATEGORY_SLUGS } from "@/lib/categories";
import { listPublishedPosts } from "@/services/posts";
import { listGuidePosts } from "@/lib/seongsu/assets";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";
import type { Post } from "@/services/types";

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const cat = getCategoryBySlug(params.category);
  if (!cat) return { title: "Not found" };
  return {
    title: cat.label,
    description: `${cat.label} stories from A Drop of Seoul.`,
    alternates: { canonical: canonical(`/${cat.slug}`) },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const dbPosts = await listPublishedPosts({
    limit: 48,
    category: cat.enumValue,
  });
  // Include any code-defined guides that belong to this category.
  const guidePosts = listGuidePosts({ category: cat.enumValue });
  const guideSlugs = new Set(guidePosts.map((g) => g.slug));
  const posts: Post[] = [
    ...guidePosts,
    ...dbPosts.filter((p) => !guideSlugs.has(p.slug)),
  ].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title={cat.label} eyebrow="Category" />
      {posts.length === 0 ? (
        <p className="text-text-muted">
          No {cat.label.toLowerCase()} stories yet — check back soon.
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
