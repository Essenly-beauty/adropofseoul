import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, CATEGORY_SLUGS } from "@/lib/categories";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";

export function generateStaticParams() {
  return CATEGORY_SLUGS.filter((category) => category !== "beauty").map(
    (category) => ({ category })
  );
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

  const posts = await listPublishedPosts({
    limit: 48,
    category: cat.enumValue,
  });
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
