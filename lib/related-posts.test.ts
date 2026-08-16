import { describe, expect, it } from "vitest";
import { rankRelatedPosts } from "./related-posts";
import type { Post } from "@/services/types";

function post(slug: string, category: string, tags: string[]): Post {
  return {
    id: slug,
    slug,
    title: slug,
    category,
    tags,
    subtitle: null,
    excerpt: null,
    body: null,
    featuredImage: null,
    author: null,
    seoTitle: null,
    metaDescription: null,
    publishedAt: "2026-01-01",
  };
}

describe("rankRelatedPosts", () => {
  it("excludes the current article and prioritizes category plus shared tags", () => {
    const current = post("current", "beauty", ["olive young", "picks"]);
    const ranked = rankRelatedPosts(current, [
      current,
      post("other-category", "guides", ["olive young"]),
      post("same-category", "beauty", ["picks"]),
    ]);
    expect(ranked.map((item) => item.slug)).toEqual([
      "same-category",
      "other-category",
    ]);
  });
});
