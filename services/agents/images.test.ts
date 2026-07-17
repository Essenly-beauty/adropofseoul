import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mapImageRow,
  insertImageCandidates,
  listImagesForCandidate,
  setImageStatus,
} from "./images";
import { fakeClient } from "../_fake-supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
const mocked = createClient as ReturnType<typeof vi.fn>;

const row = {
  id: "i1",
  run_id: "r1",
  place_candidate_id: "c1",
  area: "Seongsu",
  url: "https://i.redd.it/photo1.jpg",
  source_url: "https://www.reddit.com/r/seoul/comments/abc123",
  source_type: "reddit",
  description: "storefront at dusk",
  suggested_use: "inline",
  license: "unverified",
  attribution: null,
  status: "new",
  created_at: "2026-07-17T00:00:00Z",
  updated_at: "2026-07-17T00:00:00Z",
};

const seed = {
  url: "https://i.redd.it/photo1.jpg",
  sourceUrl: "https://www.reddit.com/r/seoul/comments/abc123",
  sourceType: "reddit" as const,
  description: "storefront at dusk",
  suggestedUse: "inline" as const,
  license: "unverified" as const,
  attribution: null,
  area: "Seongsu",
};

describe("images service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mapImageRow maps snake_case incl. license and attribution", () => {
    const img = mapImageRow(row as never);
    expect(img.sourceUrl).toBe(row.source_url);
    expect(img.license).toBe("unverified");
    expect(img.placeCandidateId).toBe("c1");
  });

  it("insertImageCandidates counts inserts and skips duplicates (23505)", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    const r = await insertImageCandidates("r1", [seed]);
    expect(r).toEqual({ ok: true, inserted: 1 });

    mocked.mockResolvedValue(
      fakeClient({ data: null, error: { code: "23505", message: "dup" } })
    );
    const dup = await insertImageCandidates("r1", [seed]);
    expect(dup).toEqual({ ok: true, inserted: 0 });
  });

  it("insertImageCandidates surfaces non-duplicate errors", async () => {
    mocked.mockResolvedValue(
      fakeClient({ data: null, error: { code: "500", message: "boom" } })
    );
    const r = await insertImageCandidates("r1", [seed]);
    expect(r.ok).toBe(false);
  });

  it("listImagesForCandidate maps rows", async () => {
    mocked.mockResolvedValue(fakeClient({ data: [row], error: null }));
    const list = await listImagesForCandidate("c1");
    expect(list[0].url).toBe(row.url);
  });

  it("setImageStatus transitions a 'new' image", async () => {
    mocked.mockResolvedValue(
      fakeClient({ data: { status: "new" }, error: null })
    );
    expect(await setImageStatus("i1", "approved")).toEqual({ ok: true });
  });

  it("setImageStatus rejects a repeat transition and a missing row", async () => {
    mocked.mockResolvedValue(
      fakeClient({ data: { status: "approved" }, error: null })
    );
    const repeat = await setImageStatus("i1", "rejected");
    expect(repeat.ok).toBe(false);

    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    const missing = await setImageStatus("nope", "approved");
    expect(missing.ok).toBe(false);
  });
});
