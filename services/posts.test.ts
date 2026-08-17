import { describe, it, expect, vi } from "vitest";
import { mapPostRow, getPostBySlug, listPublishedPosts } from "./posts";
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

vi.mock("@/lib/supabase/public", () => ({
  createClient: vi.fn(),
}));
import { createClient } from "@/lib/supabase/public";

describe("mapPostRow", () => {
  it("maps snake_case row to camelCase Post", () => {
    const post = mapPostRow(row as never);
    expect(post.featuredImage).toBe("img.jpg");
    expect(post.tags).toEqual(["k-beauty"]);
  });

  it("uses the local Myeongdong vs Seongsu thumbnail when the post has no image", () => {
    const post = mapPostRow({
      ...row,
      slug: "myeongdong-vs-seongsu-beauty-shopping",
      featured_image: null,
    } as never);

    expect(post.featuredImage).toBe(
      "/images/articles/myeongdong-vs-seongsu-beauty-shopping.png"
    );
  });

  it("uses the local thumbnail when featured_image is an empty string", () => {
    const post = mapPostRow({
      ...row,
      slug: "myeongdong-vs-seongsu-beauty-shopping",
      featured_image: "",
    } as never);

    expect(post.featuredImage).toBe(
      "/images/articles/myeongdong-vs-seongsu-beauty-shopping.png"
    );
  });

  it("uses the dedicated thumbnail for Seongsu Beauty Spots", () => {
    const post = mapPostRow({
      ...row,
      slug: "seongsu-beauty-spots",
      featured_image: "",
    } as never);

    expect(post.featuredImage).toBe(
      "/images/articles/seongsu-beauty-spots.png"
    );
  });

  it("replaces a stale CMS image with the dedicated local thumbnail", () => {
    const post = mapPostRow({
      ...row,
      slug: "seongsu-beauty-spots",
      featured_image: "/images/seongsu/seongsu-beauty-and-bites.jpg",
    } as never);

    expect(post.featuredImage).toBe(
      "/images/articles/seongsu-beauty-spots.png"
    );
  });

  it.each([
    "five-k-beauty-serums",
    "gangnam-beauty-day",
    "glass-skin-without-10-steps",
    "hannam-afternoon-local-guide",
    "k-beauty-is-changing",
    "korean-beauty-brands-to-start-with",
    "korean-fragrance-seoul",
    "korean-hair-brands-worth-knowing",
    "korean-hair-scalp-care-routine",
    "korean-head-spa-first-timer-guide",
    "korean-hair-masks-worth-buying",
    "korean-haircare-fine-frizzy-hair",
    "korean-haircare-where-to-start",
    "korean-phrases-for-beauty-shopping",
    "korean-3-step-skincare-routine",
    "korean-5-step-morning-skincare-routine",
    "korean-barrier-repair-routine",
    "korean-clinic-to-home-skincare",
    "korean-post-treatment-recovery-skincare-routine",
    "korean-skip-care-explained",
    "korean-skin-texture-meaning",
    "korean-skincare-brands-on-our-radar",
    "korean-skincare-labels-explained",
    "korean-skincare-30s-slow-aging-routine",
    "korean-summer-cooling-skincare-routine",
    "new-generation-korean-beauty-brands",
    "people-shaping-seoul-beauty",
    "seoul-holistic-beauty-shift",
    "seoul-scalp-care-culture",
    "the-drop-list-august-2026",
    "toner-pads-as-mini-masks",
    "what-makes-a-brand-feel-seoul",
    "what-to-buy-at-olive-young",
    "where-to-shop-k-beauty-beyond-olive-young",
    "sunscreen-as-skincare-korean-routine",
  ])("uses a local Stories thumbnail for %s", (slug) => {
    const post = mapPostRow({
      ...row,
      slug,
      featured_image: "",
    } as never);

    expect(post.featuredImage).toBe(`/images/articles/${slug}.png`);
  });
});

describe("listPublishedPosts", () => {
  it("returns mapped rows and records a .limit() call", async () => {
    const theFake = fakeClient({ data: [row], error: null });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(theFake);
    const result = await listPublishedPosts();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("hello");
    expect(result[0].featuredImage).toBe("img.jpg");
    expect(theFake.calls).toContain("limit");
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
