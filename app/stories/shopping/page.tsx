import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { listShoppingPosts } from "@/lib/articles/shopping";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Seoul Shopping Guides",
  description:
    "Local Seoul shopping guides covering K-beauty, souvenirs, everyday finds, fashion and what’s actually worth bringing home.",
  path: "/stories/shopping",
});

export default function ShoppingStoriesPage() {
  const posts = listShoppingPosts();

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <nav aria-label="Breadcrumb" className="mb-8 text-xs text-text-muted">
        <Link href="/stories" className="hover:text-accent">
          Stories
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span aria-current="page">Shopping</span>
      </nav>
      <SectionHeading title="Shopping" eyebrow="Stories" />
      <p className="-mt-2 mb-12 max-w-2xl text-text-muted">
        What’s actually worth buying in Seoul — from K-beauty and local everyday
        finds to souvenirs, fashion and the things worth making room for in your
        suitcase.
      </p>
      <div className="grid gap-8 md:grid-cols-3">
        {posts.map((post) => (
          <ArticleCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
}
