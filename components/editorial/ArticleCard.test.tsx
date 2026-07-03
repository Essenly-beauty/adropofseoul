import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticleCard } from "./ArticleCard";
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
  featuredImage:
    "https://images.unsplash.com/photo-1584467535330-73a3b3d519d6?w=600&h=400",
  author: "Team",
  seoTitle: null,
  metaDescription: null,
  publishedAt: "2026-01-01T00:00:00Z",
} as Post;

describe("ArticleCard", () => {
  it("links to the article and shows category, title + excerpt", () => {
    render(<ArticleCard post={post} />);
    const link = screen.getByRole("link", { name: /Seoul Head Spa Ritual/ });
    expect(link.getAttribute("href")).toBe("/articles/seoul-head-spa-ritual");
    expect(screen.getByText("Head Spa")).toBeTruthy();
    expect(screen.getByText(/slow world of scalp care/)).toBeTruthy();
  });
});
