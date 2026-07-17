import { describe, it, expect, vi, beforeEach } from "vitest";
import { runResearch, type ResearchDeps } from "./research";
import type { Candidate } from "@/lib/agents/schemas";

// The pipeline's persistence layer is mocked module-level; gather/extract are
// injected per-test. No network, no DB.
vi.mock("./runs", () => ({
  createRun: vi.fn(),
  finishRun: vi.fn(),
}));
vi.mock("./candidates", () => ({
  insertCandidates: vi.fn(),
  listCandidateKeysForArea: vi.fn(),
}));
vi.mock("./places-keys", () => ({
  listPlaceKeysForArea: vi.fn(),
}));

import { createRun, finishRun } from "./runs";
import { insertCandidates, listCandidateKeysForArea } from "./candidates";
import { listPlaceKeysForArea } from "./places-keys";

const mockCreateRun = createRun as ReturnType<typeof vi.fn>;
const mockFinishRun = finishRun as ReturnType<typeof vi.fn>;
const mockInsert = insertCandidates as ReturnType<typeof vi.fn>;
const mockCandKeys = listCandidateKeysForArea as ReturnType<typeof vi.fn>;
const mockPlaceKeys = listPlaceKeysForArea as ReturnType<typeof vi.fn>;

function candidate(name: string): Candidate {
  return {
    name,
    area: "Seongsu",
    categoryGuess: "head_spa",
    whyNotable: "recommended repeatedly",
    sourceUrls: ["https://www.reddit.com/r/seoul/1", "https://blog.example"],
    evidenceQuote: "the best head spa",
    confidence: 0.8,
  };
}

function deps(overrides: Partial<ResearchDeps> = {}): ResearchDeps {
  return {
    gather: vi.fn().mockResolvedValue("[1] https://src\nsome gathered text"),
    extract: vi
      .fn()
      .mockResolvedValue({ candidates: [candidate("Sool Loft")] }),
    ...overrides,
  };
}

function armPersistence() {
  mockCreateRun.mockResolvedValue({ ok: true, id: "run1" });
  mockFinishRun.mockResolvedValue({ ok: true });
  mockInsert.mockResolvedValue({ ok: true, inserted: 1 });
  mockCandKeys.mockResolvedValue(new Set<string>());
  mockPlaceKeys.mockResolvedValue(new Set<string>());
}

describe("runResearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("happy path: persists candidates and finishes the run with counts", async () => {
    armPersistence();
    const d = deps();
    const result = await runResearch({ area: "Seongsu", limit: 10 }, d);

    expect(result.ok).toBe(true);
    expect(mockCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({ agent: "research", area: "Seongsu" })
    );
    expect(mockInsert).toHaveBeenCalledWith("run1", [
      expect.objectContaining({ name: "Sool Loft" }),
    ]);
    expect(mockFinishRun).toHaveBeenCalledWith(
      "run1",
      expect.objectContaining({
        status: "done",
        counts: expect.objectContaining({ extracted: 1, kept: 1, dropped: 0 }),
      })
    );
  });

  it("re-scores model confidence with corroboration signals before persisting", async () => {
    armPersistence();
    await runResearch({ area: "Seongsu", limit: 10 }, deps());
    const persisted = mockInsert.mock.calls[0][1][0];
    // 2 sources + evidence: combined differs from the raw model confidence.
    expect(persisted.confidence).not.toBe(0.8);
    expect(persisted.confidence).toBeGreaterThan(0);
    expect(persisted.confidence).toBeLessThanOrEqual(1);
  });

  it("drops candidates already known (existing candidate or place keys)", async () => {
    armPersistence();
    mockCandKeys.mockResolvedValue(new Set(["sool-loft|seongsu"]));
    await runResearch({ area: "Seongsu", limit: 10 }, deps());
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockFinishRun).toHaveBeenCalledWith(
      "run1",
      expect.objectContaining({
        status: "done",
        counts: expect.objectContaining({ kept: 0, dropped: 1 }),
      })
    );
  });

  it("marks the run as error and inserts nothing when extract throws", async () => {
    armPersistence();
    const d = deps({
      extract: vi.fn().mockRejectedValue(new Error("model exploded")),
    });
    const result = await runResearch({ area: "Seongsu", limit: 10 }, d);
    expect(result.ok).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockFinishRun).toHaveBeenCalledWith(
      "run1",
      expect.objectContaining({ status: "error", error: "model exploded" })
    );
  });

  it("fails fast when the run row cannot be created", async () => {
    armPersistence();
    mockCreateRun.mockResolvedValue({ ok: false, code: "500", message: "db" });
    const d = deps();
    const result = await runResearch({ area: "Seongsu", limit: 10 }, d);
    expect(result.ok).toBe(false);
    expect(d.gather).not.toHaveBeenCalled();
  });
});
