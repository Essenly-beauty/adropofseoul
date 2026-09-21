import { describe, it, expect, vi } from "vitest";
import type { Post } from "./types";
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("@/services/posts", () => ({ listAllPublishedPosts: vi.fn() }));
import { mergeEditorialPosts } from "./editorial";

describe("unified editorial catalog", () => {
  it("retains renderer precedence, deduplicates before sorting, and does not truncate", () => {
    const rows = Array.from(
      { length: 120 },
      (_, i) =>
        ({
          slug: `post-${i}`,
          id: `db-${i}`,
          publishedAt: "2026-09-01",
        }) as Post
    );
    const code = [
      { slug: "post-0", id: "code", publishedAt: "2026-09-20" },
    ] as Post[];
    const result = mergeEditorialPosts(rows, code);
    expect(result).toHaveLength(120);
    expect(result[0].id).toBe("code");
    expect(result.filter((p) => p.slug === "post-0")).toHaveLength(1);
  });
});
