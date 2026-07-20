import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
import { toRow, listAllProducts, createProduct } from "./products";
import type { ProductWriteInput } from "@/lib/admin/products";

const input: ProductWriteInput = {
  name: "Snail Mucin Essence",
  brand: "COSRX",
  slug: "snail-mucin-essence",
  category: "essence",
  description: null,
  price: "$16",
  image: "https://a.com/1.jpg",
  affiliateUrl: "https://aff.co/x",
  whereToBuy: "Amazon",
  bestFor: "dry skin",
  ingredients: "Snail Secretion Filtrate",
  rating: 4.5,
  disclosureRequired: true,
  isPublished: true,
};

describe("toRow", () => {
  it("maps camelCase input to snake_case columns incl slug", () => {
    const row = toRow(input, { includeSlug: true });
    expect(row.name).toBe("Snail Mucin Essence");
    expect(row.affiliate_url).toBe("https://aff.co/x");
    expect(row.where_to_buy).toBe("Amazon");
    expect(row.best_for).toBe("dry skin");
    expect(row.disclosure_required).toBe(true);
    expect(row.is_published).toBe(true);
    expect(row.slug).toBe("snail-mucin-essence");
  });
  it("omits slug when includeSlug is false (edit)", () => {
    const row = toRow(input, { includeSlug: false });
    expect("slug" in row).toBe(false);
  });
});

describe("listAllProducts", () => {
  beforeEach(() => vi.clearAllMocks());
  it("queries products ordered by updated_at desc", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          name: "A",
          brand: null,
          slug: "a",
          category: null,
          description: null,
          price: null,
          image: null,
          affiliate_url: null,
          where_to_buy: null,
          best_for: null,
          ingredients: null,
          rating: null,
          disclosure_required: false,
          is_published: false,
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
      error: null,
    });
    const select = vi.fn(() => ({ order }));
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: () => ({ select }),
    });
    const rows = await listAllProducts();
    expect(rows).toHaveLength(1);
    expect(rows[0].isPublished).toBe(false);
    expect(rows[0].updatedAt).toBe("2026-01-01T00:00:00Z");
    expect(order).toHaveBeenCalledWith("updated_at", { ascending: false });
  });
});

describe("createProduct", () => {
  beforeEach(() => vi.clearAllMocks());
  it("inserts and returns the new id", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: "new" }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: () => ({ insert }),
    });
    const res = await createProduct(input);
    expect(res.id).toBe("new");
    expect(insert).toHaveBeenCalledOnce();
  });
});
