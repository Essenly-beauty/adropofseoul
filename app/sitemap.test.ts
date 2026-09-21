import { beforeEach, describe, expect, it, vi } from "vitest";
import sitemap, { revalidate } from "./sitemap";
import { listSitemapContent } from "@/services/sitemap";
import { SHOPPING_SITEMAP_ARTICLES } from "@/lib/articles/shopping-sitemap";

vi.mock("@/services/sitemap", () => ({ listSitemapContent: vi.fn() }));

beforeEach(() => {
  vi.mocked(listSitemapContent).mockResolvedValue({
    posts: [],
    places: [],
    ingredients: [],
  });
});

describe("public sitemap", () => {
  it("refreshes regularly and keeps the rendered article's metadata for duplicate slugs", async () => {
    const article = SHOPPING_SITEMAP_ARTICLES[0];
    vi.mocked(listSitemapContent).mockResolvedValue({
      posts: [
        {
          slug: article.slug,
          publishedAt: "2000-01-01",
          updatedAt: "2001-01-01",
        },
        {
          slug: "a-new-published-story",
          publishedAt: "2026-09-20",
          updatedAt: null,
        },
      ],
      places: [],
      ingredients: [],
    });
    const entries = await sitemap();
    expect(revalidate).toBe(3600);
    expect(new Set(entries.map((e) => e.url)).size).toBe(entries.length);
    expect(
      entries.find((e) => e.url.endsWith(`/articles/${article.slug}`))
        ?.lastModified
    ).toBe(article.publishedAt);
    expect(
      entries.some((e) => e.url.endsWith("/articles/a-new-published-story"))
    ).toBe(true);
    expect(
      entries.some(
        (e) =>
          e.url.includes("/admin") ||
          e.url.includes("/quiz") ||
          e.url.includes("?")
      )
    ).toBe(false);
  });

  it("does not publish a truncated successful sitemap when a source fails", async () => {
    vi.mocked(listSitemapContent).mockRejectedValue(
      new Error("temporary database outage")
    );
    await expect(sitemap()).rejects.toThrow("temporary database outage");
  });
});
