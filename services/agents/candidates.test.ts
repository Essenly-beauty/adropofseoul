import { describe, it, expect, vi } from "vitest";
import {
  insertCandidates,
  listCandidatesByStatus,
  setCandidateStatus,
  isLegalTransition,
  mapCandidateRow,
} from "./candidates";
import { fakeClient } from "../_fake-supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
const mocked = createClient as ReturnType<typeof vi.fn>;

const row = {
  id: "c1",
  run_id: "r1",
  name: "Sool Loft",
  area: "Seongsu",
  category_guess: "head_spa",
  why_notable: "recommended",
  source_urls: ["https://example.com"],
  evidence: { quote: "great" },
  confidence: 0.8,
  dedupe_key: "sool-loft|seongsu",
  status: "new",
  promoted_place_id: null,
  created_at: "2026-07-17T00:00:00Z",
  updated_at: "2026-07-17T00:00:00Z",
};

const candidate = {
  name: "Sool Loft",
  area: "Seongsu",
  categoryGuess: "head_spa",
  whyNotable: "recommended",
  sourceUrls: ["https://example.com"],
  evidenceQuote: "great",
  confidence: 0.8,
  imageUrls: [],
};

describe("mapCandidateRow", () => {
  it("maps snake_case to camelCase", () => {
    const c = mapCandidateRow(row as never);
    expect(c.dedupeKey).toBe("sool-loft|seongsu");
    expect(c.sourceUrls).toEqual(["https://example.com"]);
    expect(c.status).toBe("new");
  });
});

describe("isLegalTransition", () => {
  it("allows the review flow", () => {
    expect(isLegalTransition("new", "reviewing")).toBe(true);
    expect(isLegalTransition("new", "approved")).toBe(true);
    expect(isLegalTransition("new", "rejected")).toBe(true);
    expect(isLegalTransition("reviewing", "approved")).toBe(true);
    expect(isLegalTransition("approved", "promoted")).toBe(true);
  });
  it("blocks illegal jumps", () => {
    expect(isLegalTransition("new", "promoted")).toBe(false);
    expect(isLegalTransition("rejected", "approved")).toBe(false);
    expect(isLegalTransition("promoted", "new")).toBe(false);
  });
});

describe("insertCandidates", () => {
  it("returns inserted count and the new row ids", async () => {
    mocked.mockResolvedValue(fakeClient({ data: { id: "c1" }, error: null }));
    const r = await insertCandidates("r1", [candidate]);
    expect(r).toEqual({ ok: true, inserted: 1, ids: ["c1"] });
  });
  it("skips duplicates with a null id slot", async () => {
    mocked.mockResolvedValue(
      fakeClient({ data: null, error: { code: "23505", message: "dup" } })
    );
    const r = await insertCandidates("r1", [candidate]);
    expect(r).toEqual({ ok: true, inserted: 0, ids: [null] });
  });
  it("surfaces non-unique-violation errors", async () => {
    mocked.mockResolvedValue(
      fakeClient({ data: null, error: { code: "500", message: "boom" } })
    );
    const r = await insertCandidates("r1", [candidate]);
    expect(r.ok).toBe(false);
  });
});

describe("listCandidatesByStatus / setCandidateStatus", () => {
  it("lists mapped candidates", async () => {
    mocked.mockResolvedValue(fakeClient({ data: [row], error: null }));
    const list = await listCandidatesByStatus("new");
    expect(list[0].name).toBe("Sool Loft");
  });
  it("rejects an illegal transition without touching the DB", async () => {
    const client = fakeClient({
      data: { ...row, status: "rejected" },
      error: null,
    });
    mocked.mockResolvedValue(client);
    const r = await setCandidateStatus("c1", "approved");
    expect(r.ok).toBe(false);
    expect(client.calls).not.toContain("update");
  });
  it("applies a legal transition", async () => {
    mocked.mockResolvedValue(fakeClient({ data: row, error: null }));
    const r = await setCandidateStatus("c1", "approved");
    expect(r).toEqual({ ok: true });
  });
});
