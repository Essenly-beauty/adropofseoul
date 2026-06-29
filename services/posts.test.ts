import { describe, it, expect, vi } from "vitest";
import { mapPostRow, getPostBySlug } from "./posts";
import { fakeClient } from "./_fake-supabase";

const row = {
  id: "1",
  title: "Hello",
  slug: "hello",
  subtitle: null,
  excerpt: "x",
  body: "## hi",
  category: "beauty",
  tags: ["k-beauty"],
  featured_image: "img.jpg",
  author: "Team",
  seo_title: null,
  meta_description: null,
  published_at: "2026-01-01T00:00:00Z",
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
import { createClient } from "@/lib/supabase/server";

describe("mapPostRow", () => {
  it("maps snake_case row to camelCase Post", () => {
    const post = mapPostRow(row as never);
    expect(post.featuredImage).toBe("img.jpg");
    expect(post.tags).toEqual(["k-beauty"]);
  });
});

describe("getPostBySlug", () => {
  it("returns mapped post when found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: row, error: null })
    );
    const post = await getPostBySlug("hello");
    expect(post?.slug).toBe("hello");
  });
  it("returns null when not found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: null, error: null })
    );
    const post = await getPostBySlug("nope");
    expect(post).toBeNull();
  });
});
