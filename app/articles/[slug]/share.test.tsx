import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ArticlePage, { generateMetadata } from "./page";
import { SHOPPING_ARTICLES } from "@/lib/articles/shopping";
import { GUIDES } from "@/lib/seongsu/guides";
import { PILLARS } from "@/lib/articles/pillars";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_SHARE_IMAGE } from "@/lib/social-image";
import type { Post } from "@/services/types";

const { getPostBySlug } = vi.hoisted(() => ({ getPostBySlug: vi.fn() }));
vi.mock("@/services/posts", () => ({ getPostBySlug }));
vi.mock("@/services/editorial", () => ({
  listEditorialPosts: vi.fn().mockResolvedValue([]),
}));
// The unrelated signup form uses React server-action hooks.
vi.mock("@/components/seongsu/WaitlistForm", () => ({
  WaitlistForm: () => null,
}));

afterEach(cleanup);

async function expectSharedImage(slug: string, expected: string) {
  render(await ArticlePage({ params: { slug } }));
  fireEvent.click(screen.getByRole("button", { name: "Share" }));
  const href = screen
    .getByRole("menuitem", { name: "Pinterest" })
    .getAttribute("href")!;
  const params = new URL(href).searchParams;
  expect(params.get("media")).toBe(expected);
  expect(params.get("url")).toBe(
    `${SITE_URL}/articles/${slug}?utm_source=share&utm_medium=pinterest`
  );
  const metadata = await generateMetadata({ params: { slug } });
  expect(metadata.openGraph).toMatchObject({ images: [{ url: expected }] });
}

describe("article Pinterest images", () => {
  it.each([...SHOPPING_ARTICLES, ...GUIDES, ...PILLARS])(
    "$slug shares its hero, matching the link preview",
    async ({ slug, heroImage }) => {
      expect(heroImage).toBeTruthy();
      await expectSharedImage(slug, new URL(heroImage!, `${SITE_URL}/`).href);
    }
  );

  it.each([
    ["/images/articles/story.jpg", `${SITE_URL}/images/articles/story.jpg`],
    [
      "https://cdn.example.com/story.jpg?version=2&size=large",
      "https://cdn.example.com/story.jpg?version=2&size=large",
    ],
    [null, DEFAULT_SHARE_IMAGE.url],
  ])(
    "database article preserves its image or fallback: %s",
    async (image, expected) => {
      getPostBySlug.mockResolvedValue({
        id: "test-story",
        slug: "test-story",
        title: "Test story",
        subtitle: null,
        excerpt: null,
        author: null,
        seoTitle: null,
        metaDescription: null,
        category: "shopping",
        tags: [],
        body: "A short story.",
        featuredImage: image,
        publishedAt: "2026-09-01T00:00:00Z",
      } satisfies Post);
      await expectSharedImage("test-story", expected!);
    }
  );
});
