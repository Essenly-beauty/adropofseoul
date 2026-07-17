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
  name_kr: "술로프트",
  slug: "sool-loft",
  category: "head_spa",
  area: "Seongsu",
  address: null,
  geo_lat: 37.544,
  geo_lng: 127.055,
  price_min_krw: 50000,
  price_max_krw: 120000,
  booking_channel: "naver",
  deposit_policy: null,
  editorial_status: "sample",
  last_verified_at: null,
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
  it("maps booking-readiness fields", () => {
    const p = mapAdminPlaceRow(row as never);
    expect(p.nameKr).toBe("술로프트");
    expect(p.geoLat).toBe(37.544);
    expect(p.priceMaxKrw).toBe(120000);
    expect(p.bookingChannel).toBe("naver");
    expect(p.editorialStatus).toBe("sample");
    expect(p.lastVerifiedAt).toBeNull();
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
