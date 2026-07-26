import type { Metadata } from "next";
import { listProducts } from "@/services/products";
import { listPublishedPosts } from "@/services/posts";
import { ProductCard } from "@/components/editorial/ProductCard";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { SectionTabs } from "@/components/editorial/SectionTabs";
import { canonical } from "@/lib/seo";
import { SKINCARE_TABS, isPick } from "@/lib/taxonomy";
import type { Post } from "@/services/types";

export const metadata: Metadata = {
  title: "Picks",
  description:
    "Korean skincare and hair products we recommend, plus our reviews and comparisons.",
  alternates: { canonical: canonical("/skincare/picks") },
};

export const dynamic = "force-dynamic";

export default async function SkincarePicksPage() {
  let products: Awaited<ReturnType<typeof listProducts>> = [];
  let beautyPosts: Post[] = [];
  try {
    [products, beautyPosts] = await Promise.all([
      listProducts({ limit: 96 }),
      listPublishedPosts({ limit: 96, category: "beauty" }),
    ]);
  } catch (err) {
    console.error("skincare/picks: fetch failed", err);
  }
  const reviews = beautyPosts.filter((p) => isPick(p));

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Picks" eyebrow="What we love" />
      <SectionTabs
        label="Skincare sections"
        tabs={SKINCARE_TABS}
        active="picks"
      />

      {products.length === 0 && reviews.length === 0 ? (
        <p className="text-text-muted">No picks yet — check back soon.</p>
      ) : (
        <div className="space-y-14">
          {products.length > 0 && (
            <section>
              <h2 className="mb-5 font-serif text-2xl">Products we love</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {reviews.length > 0 && (
            <section>
              <h2 className="mb-5 font-serif text-2xl">
                Reviews &amp; comparisons
              </h2>
              <div className="grid gap-8 md:grid-cols-3">
                {reviews.map((p) => (
                  <ArticleCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
