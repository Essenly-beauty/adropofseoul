import { describe, it, expect, vi } from "vitest";
import {
  mapAdminPostRow,
  getPostById,
  createPost,
  updatePost,
  removePost,
} from "./posts";
import { fakeClient } from "../_fake-supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
const mocked = createClient as ReturnType<typeof vi.fn>;

const row = {
  id: "p1",
  title: "Hello",
  slug: "hello",
  subtitle: null,
  excerpt: null,
  body: "## hi",
  category: "beauty",
  tags: ["k"],
  featured_image: null,
  author: "Team",
  seo_title: null,
  meta_description: null,
  status: "draft",
  published_at: null,
  updated_at: "2026-01-01T00:00:00Z",
};

const input = {
  title: "Hello",
  slug: "hello",
  subtitle: null,
  excerpt: null,
  body: "## hi",
  category: "beauty",
  tags: ["k"],
  featuredImage: null,
  author: "Team",
  seoTitle: null,
  metaDescription: null,
  status: "draft",
  publishedAt: null,
};

describe("mapAdminPostRow", () => {
  it("maps snake_case row to camelCase AdminPost incl. status + updatedAt", () => {
    const p = mapAdminPostRow(row as never);
    expect(p.id).toBe("p1");
    expect(p.featuredImage).toBeNull();
    expect(p.status).toBe("draft");
    expect(p.updatedAt).toBe("2026-01-01T00:00:00Z");
    expect(p.tags).toEqual(["k"]);
  });
});

describe("getPostById", () => {
  it("returns null when not found", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    expect(await getPostById("nope")).toBeNull();
  });
  it("maps a found row", async () => {
    mocked.mockResolvedValue(fakeClient({ data: row, error: null }));
    expect((await getPostById("p1"))?.slug).toBe("hello");
  });
});

describe("createPost", () => {
  it("returns ok with the new id", async () => {
    mocked.mockResolvedValue(fakeClient({ data: { id: "p1" }, error: null }));
    expect(await createPost(input as never)).toEqual({ ok: true, id: "p1" });
  });
  it("surfaces a unique-violation code", async () => {
    mocked.mockResolvedValue(
      fakeClient({ data: null, error: { code: "23505", message: "dup" } })
    );
    const r = await createPost(input as never);
    expect(r).toEqual({ ok: false, code: "23505", message: "dup" });
  });
});

describe("updatePost / removePost", () => {
  it("update returns ok on no error", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    expect(await updatePost("p1", input as never)).toEqual({ ok: true });
  });
  it("remove surfaces an error message", async () => {
    mocked.mockResolvedValue(
      fakeClient({ data: null, error: { code: "500", message: "boom" } })
    );
    expect(await removePost("p1")).toEqual({
      ok: false,
      code: "500",
      message: "boom",
    });
  });
});
