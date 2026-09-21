import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorialArchive } from "./EditorialArchive";
import type { Post } from "@/services/types";
const posts = Array.from(
  { length: 30 },
  (_, i) =>
    ({
      id: String(i),
      slug: `serum-${i}`,
      title: `Serum ${i}`,
      category: "beauty",
      tags: ["keyword:olive-young"],
      featuredImage: null,
      body: null,
    }) as Post
);
describe("editorial archive navigation", () => {
  it("preserves section, keyword and search when paging through all results", () => {
    render(
      <EditorialArchive
        title="All Stories"
        description=""
        posts={posts}
        basePath="/stories"
        searchParams={{
          filter: "beauty",
          keyword: "olive-young",
          q: "Serum",
          page: "2",
        }}
      />
    );
    expect(screen.getByText("30 stories · Newest first")).toBeTruthy();
    expect(screen.getByText("Serum 24")).toBeTruthy();
    expect(screen.queryByText("Serum 0")).toBeNull();
    const previous = screen
      .getByRole("link", { name: "← Previous" })
      .getAttribute("href")!;
    const params = new URL(previous, "https://example.com").searchParams;
    expect(Object.fromEntries(params)).toEqual({
      filter: "beauty",
      keyword: "olive-young",
      q: "Serum",
      page: "1",
    });
  });
  it("offers a reset for an unknown keyword instead of an empty dead end", () => {
    render(
      <EditorialArchive
        title="All Stories"
        description=""
        posts={posts}
        basePath="/stories"
        searchParams={{ keyword: "unknown" }}
      />
    );
    expect(
      screen.getByRole("link", { name: "Clear filters" }).getAttribute("href")
    ).toBe("/stories");
  });
});
