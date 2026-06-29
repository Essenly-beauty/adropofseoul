import { describe, it, expect, vi } from "vitest";
import { mapProductRow, getProductBySlug } from "./products";
import { fakeClient } from "./_fake-supabase";

const row = {
  id: "1",
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
  rating: 4.5,
  disclosure_required: true,
};

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";

describe("mapProductRow", () => {
  it("maps affiliate + disclosure fields", () => {
    const p = mapProductRow(row as never);
    expect(p.disclosureRequired).toBe(true);
    expect(p.rating).toBe(4.5);
  });
});

describe("getProductBySlug", () => {
  it("returns mapped product when found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: row, error: null })
    );
    expect((await getProductBySlug("boj-rice-toner"))?.brand).toBe(
      "Beauty of Joseon"
    );
  });
});
