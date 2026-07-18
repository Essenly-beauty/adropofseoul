import { describe, it, expect, vi, beforeEach } from "vitest";

const insertMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: () => ({ insert: insertMock }),
  })),
}));

import { joinWaitlist } from "./waitlist";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("joinWaitlist", () => {
  beforeEach(() => {
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  });

  it("rejects an invalid email without touching the DB", async () => {
    const res = await joinWaitlist(
      { ok: false, message: "" },
      form({ email: "nope", source: "seongsu-beauty-and-bites" })
    );
    expect(res.ok).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("inserts a valid signup tagged with its source", async () => {
    const res = await joinWaitlist(
      { ok: false, message: "" },
      form({ email: "reader@example.com", source: "seongsu-warehouse-cafes" })
    );
    expect(res.ok).toBe(true);
    expect(insertMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      source: "seongsu-warehouse-cafes",
    });
  });

  it("normalizes an unknown source to seongsu-series", async () => {
    await joinWaitlist(
      { ok: false, message: "" },
      form({ email: "reader@example.com", source: "spoofed" })
    );
    expect(insertMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      source: "seongsu-series",
    });
  });

  it("treats a duplicate (23505) as success", async () => {
    insertMock.mockResolvedValue({ error: { code: "23505" } });
    const res = await joinWaitlist(
      { ok: false, message: "" },
      form({ email: "reader@example.com", source: "seongsu-beauty-and-bites" })
    );
    expect(res.ok).toBe(true);
  });

  it("returns a friendly error on DB failure", async () => {
    insertMock.mockResolvedValue({ error: { code: "500" } });
    const res = await joinWaitlist(
      { ok: false, message: "" },
      form({ email: "reader@example.com", source: "seongsu-beauty-and-bites" })
    );
    expect(res.ok).toBe(false);
  });
});
