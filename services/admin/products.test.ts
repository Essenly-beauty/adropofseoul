import { describe, it, expect, vi } from "vitest";
import { mapAdminProductRow, getProductById, createProduct } from "./products";
import { fakeClient } from "../_fake-supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
const mocked = createClient as ReturnType<typeof vi.fn>;

const row = {
  id: "r1",
  name: "Rice Toner",
  brand: "Beauty of Joseon",
  slug: "boj-rice-toner",
  category: "toner",
  description: "milky",
  price: "$17",
  image: null,
  affiliate_url: null,
  where_to_buy: null,
  best_for: "dull skin",
  ingredients: null,
  rating: null,
  disclosure_required: true,
  is_published: true,
  updated_at: "2026-01-01T00:00:00Z",
};

describe("mapAdminProductRow", () => {
  it("maps row incl. disclosureRequired + isPublished", () => {
    const p = mapAdminProductRow(row as never);
    expect(p.brand).toBe("Beauty of Joseon");
    expect(p.disclosureRequired).toBe(true);
    expect(p.isPublished).toBe(true);
    expect(p.updatedAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("getProductById", () => {
  it("returns null when missing", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    expect(await getProductById("nope")).toBeNull();
  });
});

describe("createProduct", () => {
  it("returns ok with id", async () => {
    mocked.mockResolvedValue(fakeClient({ data: { id: "r1" }, error: null }));
    expect(await createProduct({} as never)).toEqual({ ok: true, id: "r1" });
  });
});
