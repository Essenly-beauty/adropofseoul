import { describe, it, expect, vi } from "vitest";
import {
  mapAdminPlaceRow,
  getPlaceById,
  createPlace,
  placeCounts,
} from "./places";
import { fakeClient } from "../_fake-supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
const mocked = createClient as ReturnType<typeof vi.fn>;

const row = {
  id: "x1",
  name: "Sool Loft",
  slug: "sool-loft",
  category: "head_spa",
  area: "Seongsu",
  address: null,
  short_description: "x",
  long_description: null,
  why_we_like_it: null,
  best_for: null,
  price_range: null,
  instagram_url: null,
  naver_map_url: null,
  google_map_url: null,
  booking_url: null,
  contact_email: null,
  contact_phone: null,
  languages: ["en"],
  is_published: true,
  notes: null,
  updated_at: "2026-01-01T00:00:00Z",
};

describe("mapAdminPlaceRow", () => {
  it("maps row incl. isPublished + updatedAt", () => {
    const p = mapAdminPlaceRow(row as never);
    expect(p.name).toBe("Sool Loft");
    expect(p.isPublished).toBe(true);
    expect(p.languages).toEqual(["en"]);
    expect(p.updatedAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("getPlaceById", () => {
  it("returns null when missing", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    expect(await getPlaceById("nope")).toBeNull();
  });
});

describe("createPlace", () => {
  it("returns ok with id", async () => {
    mocked.mockResolvedValue(fakeClient({ data: { id: "x1" }, error: null }));
    const r = await createPlace({} as never);
    expect(r).toEqual({ ok: true, id: "x1" });
  });
});

describe("placeCounts", () => {
  it("derives hidden = total - live", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null, count: 3 }));
    expect(await placeCounts()).toEqual({ total: 3, live: 3, hidden: 0 });
  });
});
