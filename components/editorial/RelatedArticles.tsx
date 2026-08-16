"use client";

import Link from "next/link";
import type { Post } from "@/services/types";
import { ArticleCard } from "./ArticleCard";
import { relatedArticleClicked } from "@/lib/analytics/events";

export function RelatedArticles({
  source,
  posts,
}: {
  source: Post;
  posts: Post[];
}) {
  if (posts.length === 0) return null;
  return (
    <section
      className="mt-16 border-t border-soft-gray pt-10"
      aria-labelledby="related-heading"
    >
      <h2 id="related-heading" className="font-serif text-3xl">
        Related stories
      </h2>
      <div className="mt-6 grid gap-8 md:grid-cols-3">
        {posts.map((post, position) => (
          <div
            key={post.id}
            onClickCapture={(event) => {
              if ((event.target as HTMLElement).closest("a")) {
                relatedArticleClicked({
                  sourceSlug: source.slug,
                  targetSlug: post.slug,
                  position: position + 1,
                });
              }
            }}
          >
            <ArticleCard post={post} />
          </div>
        ))}
      </div>
      <Link
        href="/stories"
        className="mt-8 inline-block text-sm text-accent hover:text-accent-hover"
      >
        Browse all stories →
      </Link>
    </section>
  );
}
