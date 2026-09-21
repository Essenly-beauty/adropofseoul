import {
  keywordsForPost,
  topicForPost,
  sectionForPost,
} from "@/lib/editorial-taxonomy";
import type { Post } from "@/services/types";

export function rankRelatedPosts(
  current: Post,
  candidates: Post[],
  limit = 3
): Post[] {
  const currentTags = new Set(keywordsForPost(current).map((k) => k.key));
  return candidates
    .filter((post) => post.slug !== current.slug)
    .map((post) => ({
      post,
      score:
        (topicForPost(post).key === topicForPost(current).key ? 4 : 0) +
        (sectionForPost(post).slug === sectionForPost(current).slug ? 1 : 0) +
        keywordsForPost(post).filter((k) => currentTags.has(k.key)).length * 8,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.post.publishedAt ?? "").localeCompare(a.post.publishedAt ?? "")
    )
    .slice(0, limit)
    .map(({ post }) => post);
}
