import { describe, it, expect, vi, beforeEach } from "vitest";
import { runWriter, type WriterDeps } from "./writer";

vi.mock("./runs", () => ({
  createRun: vi.fn(),
  finishRun: vi.fn(),
}));
vi.mock("@/services/admin/places", () => ({
  listAllPlaces: vi.fn(),
}));
vi.mock("@/services/admin/posts", () => ({
  listAllPosts: vi.fn(),
  createPost: vi.fn(),
}));

import { createRun, finishRun } from "./runs";
import { listAllPlaces } from "@/services/admin/places";
import { listAllPosts, createPost } from "@/services/admin/posts";

const mockCreateRun = createRun as ReturnType<typeof vi.fn>;
const mockFinishRun = finishRun as ReturnType<typeof vi.fn>;
const mockPlaces = listAllPlaces as ReturnType<typeof vi.fn>;
const mockPosts = listAllPosts as ReturnType<typeof vi.fn>;
const mockCreatePost = createPost as ReturnType<typeof vi.fn>;

const place = {
  id: "pl1",
  name: "Sool Loft",
  nameKr: "술로프트",
  slug: "sool-loft",
  category: "head_spa",
  area: "Seongsu",
  address: null,
  geoLat: null,
  geoLng: null,
  priceMinKrw: 50000,
  priceMaxKrw: 120000,
  bookingChannel: "naver",
  depositPolicy: null,
  editorialStatus: "sample",
  lastVerifiedAt: null,
  shortDescription: null,
  longDescription: null,
  whyWeLikeIt: "calm scalp ritual",
  bestFor: "first-timers",
  priceRange: "₩₩",
  instagramUrl: null,
  naverMapUrl: null,
  googleMapUrl: null,
  bookingUrl: null,
  contactEmail: null,
  contactPhone: null,
  languages: ["en"],
  isPublished: false,
  notes: null,
  updatedAt: "2026-07-17T00:00:00Z",
};

const publishedPost = {
  id: "po1",
  title: "Head Spa First-Timer Guide",
  slug: "head-spa-first-timer",
  status: "published",
  updatedAt: "2026-07-01T00:00:00Z",
};

const draft = {
  title: "Where to Go in Seongsu",
  slug: "seongsu-beauty-guide",
  subtitle: "A slow beauty afternoon",
  excerpt: "Our picks in Seongsu.",
  bodyMarkdown:
    "## Quick answer\n" + "[[ NOTE: editor observation ]]\n" + "x".repeat(300),
  tags: ["seongsu"],
  seoTitle: "Seongsu Beauty Guide",
  metaDescription:
    "A field-tested guide to Seongsu's head spas, salons, and calm cafes — picked by the A Drop of Seoul editorial team with booking tips.",
};

function deps(overrides: Partial<WriterDeps> = {}): WriterDeps {
  return { write: vi.fn().mockResolvedValue(draft), ...overrides };
}

function arm() {
  mockCreateRun.mockResolvedValue({ ok: true, id: "run9" });
  mockFinishRun.mockResolvedValue({ ok: true });
  mockPlaces.mockResolvedValue([place, { ...place, id: "x", area: "Hannam" }]);
  mockPosts.mockResolvedValue([
    publishedPost,
    { ...publishedPost, id: "d", status: "draft" },
  ]);
  mockCreatePost.mockResolvedValue({ ok: true, id: "post1" });
}

describe("runWriter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("drafts a guides post from the area's places and finishes the run", async () => {
    arm();
    const d = deps();
    const result = await runWriter({ area: "Seongsu" }, d);

    expect(result).toEqual({ ok: true, runId: "run9", postId: "post1" });
    // Prompt contains the area places, not other areas.
    const prompt = (d.write as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(prompt).toContain("Sool Loft");
    expect(prompt).not.toContain("Hannam —");
    // Persisted as an unpublished guides draft in the house shape.
    expect(mockCreatePost).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "draft",
        category: "guides",
        title: draft.title,
        body: draft.bodyMarkdown,
        author: "A Drop of Seoul Editorial Team",
      })
    );
    expect(mockFinishRun).toHaveBeenCalledWith(
      "run9",
      expect.objectContaining({ status: "done" })
    );
  });

  it("only offers PUBLISHED posts as internal-link candidates", async () => {
    arm();
    const d = deps();
    await runWriter({ area: "Seongsu" }, d);
    const prompt = (d.write as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(prompt).toContain("head-spa-first-timer");
  });

  it("fails without calling the model when the area has no places", async () => {
    arm();
    mockPlaces.mockResolvedValue([]);
    const d = deps();
    const result = await runWriter({ area: "Nowhere" }, d);
    expect(result.ok).toBe(false);
    expect(d.write).not.toHaveBeenCalled();
    expect(mockCreateRun).not.toHaveBeenCalled();
  });

  it("marks the run as error when the model call fails", async () => {
    arm();
    const d = deps({
      write: vi.fn().mockRejectedValue(new Error("model down")),
    });
    const result = await runWriter({ area: "Seongsu" }, d);
    expect(result.ok).toBe(false);
    expect(mockCreatePost).not.toHaveBeenCalled();
    expect(mockFinishRun).toHaveBeenCalledWith(
      "run9",
      expect.objectContaining({ status: "error", error: "model down" })
    );
  });

  it("retries with a suffixed slug when the slug is taken", async () => {
    arm();
    mockCreatePost
      .mockResolvedValueOnce({ ok: false, code: "23505", message: "dup" })
      .mockResolvedValueOnce({ ok: true, id: "post2" });
    const result = await runWriter({ area: "Seongsu" }, deps());
    expect(result).toEqual({ ok: true, runId: "run9", postId: "post2" });
    const second = mockCreatePost.mock.calls[1][0];
    expect(second.slug).not.toBe(draft.slug);
    expect(second.slug).toContain(draft.slug);
  });
});
