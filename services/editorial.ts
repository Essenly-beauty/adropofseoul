import "server-only";
import { cache } from "react";
import { listAllPublishedPosts } from "@/services/posts";
import { listGuidePosts } from "@/lib/seongsu/assets";
import { listPillarPosts } from "@/lib/articles/assets";
import { listShoppingPosts } from "@/lib/articles/shopping";
import type { Post } from "@/services/types";

/** Match article-route precedence, deduplicate, then sort before filtering. */
export function mergeEditorialPosts(db: Post[], code: Post[]): Post[] {
  const seen = new Set<string>();
  return [...code, ...db]
    .filter((post) => {
      if (seen.has(post.slug)) return false;
      seen.add(post.slug);
      return true;
    })
    .sort(
      (a, b) =>
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") ||
        a.slug.localeCompare(b.slug)
    );
}

export const listEditorialPosts = cache(async (): Promise<Post[]> => {
  const db = await listAllPublishedPosts();
  return mergeEditorialPosts(db, [
    ...listGuidePosts(),
    ...listPillarPosts(),
    ...listShoppingPosts(),
  ]);
});
