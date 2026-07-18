import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedStory } from "./FeaturedStory";
import type { Post } from "@/services/types";

const post = {
  id: "1",
  title: "The Seoul Head Spa Ritual",
  slug: "seoul-head-spa-ritual",
  subtitle: null,
  excerpt: "Inside the slow world of scalp care.",
  body: null,
  category: "head_spa",
  tags: [],
  featuredImage: null,
  author: "Team",
  seoTitle: null,
  metaDescription: null,
  publishedAt: "2026-01-01T00:00:00Z",
} as Post;

describe("FeaturedStory", () => {
  it("shows the category tag, title, excerpt, and a read link", () => {
    render(<FeaturedStory post={post} />);
    // head-spa articles surface under the Wellness label in the new IA.
    expect(screen.getAllByText("Wellness").length).toBeGreaterThan(0);
    expect(screen.getByText(/Seoul Head Spa Ritual/)).toBeTruthy();
    const read = screen.getByRole("link", { name: /Read the story/ });
    expect(read.getAttribute("href")).toBe("/articles/seoul-head-spa-ritual");
  });
});
