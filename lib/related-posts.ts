import type { Post } from "@/services/types";

export function rankRelatedPosts(
  current: Post,
  candidates: Post[],
  limit = 3
): Post[] {
  const currentTags = new Set(current.tags.map((tag) => tag.toLowerCase()));
  return candidates
    .filter((post) => post.slug !== current.slug)
    .map((post) => ({
      post,
      score:
        (post.category === current.category ? 10 : 0) +
        post.tags.filter((tag) => currentTags.has(tag.toLowerCase())).length *
          3,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.post.publishedAt ?? "").localeCompare(a.post.publishedAt ?? "")
    )
    .slice(0, limit)
    .map(({ post }) => post);
}
