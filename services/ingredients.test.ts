import { describe, it, expect, vi } from "vitest";
import {
  mapIngredientRow,
  listIngredients,
  getIngredientBySlug,
} from "./ingredients";
import { fakeClient } from "./_fake-supabase";

const row = {
  id: "1",
  slug: "niacinamide",
  name: "Niacinamide",
  inci_name: "Niacinamide",
  also_known_as: ["Vitamin B3"],
  functions: ["brightening", "sebum_control"],
  summary: "A versatile vitamin B3 derivative.",
  description: "## What it is\n\nNiacinamide...",
  benefits: "Brightens, balances oil.",
  good_for_skin_types: ["oily", "acne_prone"],
  targets_concerns: ["hyperpigmentation", "pores"],
  caution: null,
  seo_title: null,
  meta_description: null,
};

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";

describe("mapIngredientRow", () => {
  it("maps snake_case to camelCase with array defaults", () => {
    const ing = mapIngredientRow(row as never);
    expect(ing.inciName).toBe("Niacinamide");
    expect(ing.alsoKnownAs).toEqual(["Vitamin B3"]);
    expect(ing.goodForSkinTypes).toEqual(["oily", "acne_prone"]);
  });
});

describe("listIngredients", () => {
  it("returns mapped rows and issues a bounded query", async () => {
    const theFake = fakeClient({ data: [row], error: null });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(theFake);
    const result = await listIngredients();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("niacinamide");
    expect(theFake.calls).toContain("limit");
  });
  it("filters by skin type via contains", async () => {
    const theFake = fakeClient({ data: [row], error: null });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(theFake);
    await listIngredients({ skinType: "oily" });
    expect(theFake.calls).toContain("contains");
  });
});

describe("getIngredientBySlug", () => {
  it("returns null when not found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: null, error: null })
    );
    expect(await getIngredientBySlug("nope")).toBeNull();
  });
});
