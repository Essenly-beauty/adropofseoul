import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
import { toRow, listAllPosts, createPost } from "./posts";
import type { PostWriteInput } from "@/lib/admin/posts";

const input: PostWriteInput = {
  title: "Test Post",
  slug: "test-post",
  subtitle: "A subtitle",
  excerpt: null,
  body: null,
  category: "beauty",
  tags: ["kbeauty"],
  featuredImage: "https://a.com/1.jpg",
  author: "Jane",
  seoTitle: null,
  metaDescription: null,
  status: "draft",
  publishedAt: null,
};

describe("toRow", () => {
  it("maps camelCase input to snake_case columns incl slug", () => {
    const row = toRow(input, { includeSlug: true });
    expect(row.title).toBe("Test Post");
    expect(row.featured_image).toBe("https://a.com/1.jpg");
    expect(row.seo_title).toBeNull();
    expect(row.meta_description).toBeNull();
    expect(row.status).toBe("draft");
    expect(row.slug).toBe("test-post");
  });
  it("omits slug when includeSlug is false (edit)", () => {
    const row = toRow(input, { includeSlug: false });
    expect("slug" in row).toBe(false);
  });
  it("auto-stamps published_at when status is published and publishedAt is empty", () => {
    const row = toRow({ ...input, status: "published" }, { includeSlug: true });
    expect(typeof row.published_at).toBe("string");
  });
  it("passes publishedAt through when already set", () => {
    const row = toRow(
      { ...input, status: "published", publishedAt: "2026-01-01T00:00:00Z" },
      { includeSlug: true }
    );
    expect(row.published_at).toBe("2026-01-01T00:00:00Z");
  });
  it("leaves published_at null when status is draft", () => {
    const row = toRow(input, { includeSlug: true });
    expect(row.published_at).toBeNull();
  });
});

describe("listAllPosts", () => {
  beforeEach(() => vi.clearAllMocks());
  it("queries posts ordered by updated_at desc", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          title: "A",
          slug: "a",
          subtitle: null,
          excerpt: null,
          body: null,
          category: "beauty",
          tags: [],
          featured_image: null,
          author: null,
          seo_title: null,
          meta_description: null,
          published_at: null,
          status: "draft",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
      error: null,
    });
    const select = vi.fn(() => ({ order }));
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: () => ({ select }),
    });
    const rows = await listAllPosts();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("draft");
    expect(rows[0].updatedAt).toBe("2026-01-01T00:00:00Z");
    expect(order).toHaveBeenCalledWith("updated_at", { ascending: false });
  });
});

describe("createPost", () => {
  beforeEach(() => vi.clearAllMocks());
  it("inserts and returns the new id", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: "new" }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: () => ({ insert }),
    });
    const res = await createPost(input);
    expect(res.id).toBe("new");
    expect(insert).toHaveBeenCalledOnce();
  });
});
