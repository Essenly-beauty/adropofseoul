import { describe, it, expect, vi } from "vitest";
import { createRun, finishRun, listRecentRuns, mapRunRow } from "./runs";
import { fakeClient } from "../_fake-supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
const mocked = createClient as ReturnType<typeof vi.fn>;

const row = {
  id: "r1",
  agent: "research",
  area: "Seongsu",
  status: "done",
  source_config: { sources: ["reddit"] },
  prompt_version: "research-v1",
  counts: { found: 8, kept: 5, dropped: 3 },
  token_cost: 1234,
  error: null,
  started_at: "2026-07-17T00:00:00Z",
  finished_at: "2026-07-17T00:01:00Z",
};

describe("mapRunRow", () => {
  it("maps snake_case to camelCase", () => {
    const r = mapRunRow(row as never);
    expect(r.promptVersion).toBe("research-v1");
    expect(r.tokenCost).toBe(1234);
    expect(r.counts).toEqual({ found: 8, kept: 5, dropped: 3 });
    expect(r.finishedAt).toBe("2026-07-17T00:01:00Z");
  });
});

describe("createRun", () => {
  it("returns ok with the new id", async () => {
    mocked.mockResolvedValue(fakeClient({ data: { id: "r1" }, error: null }));
    const r = await createRun({
      agent: "research",
      area: "Seongsu",
      sourceConfig: null,
      promptVersion: "research-v1",
    });
    expect(r).toEqual({ ok: true, id: "r1" });
  });
});

describe("finishRun", () => {
  it("returns ok on success", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    const r = await finishRun("r1", {
      status: "done",
      counts: { found: 1, kept: 1, dropped: 0 },
      tokenCost: 10,
    });
    expect(r).toEqual({ ok: true });
  });
  it("surfaces errors", async () => {
    mocked.mockResolvedValue(
      fakeClient({ data: null, error: { code: "500", message: "boom" } })
    );
    const r = await finishRun("r1", { status: "error", error: "boom" });
    expect(r).toEqual({ ok: false, code: "500", message: "boom" });
  });
});

describe("listRecentRuns", () => {
  it("maps rows and tolerates empty", async () => {
    mocked.mockResolvedValue(fakeClient({ data: [row], error: null }));
    expect((await listRecentRuns())[0].area).toBe("Seongsu");
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    expect(await listRecentRuns()).toEqual([]);
  });
});
