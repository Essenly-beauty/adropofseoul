import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IngredientCard } from "./IngredientCard";
import type { Ingredient } from "@/services/types";

const ing = {
  id: "1",
  slug: "niacinamide",
  name: "Niacinamide",
  inciName: "Niacinamide",
  alsoKnownAs: ["Vitamin B3"],
  functions: ["brightening"],
  summary: "A versatile vitamin B3 derivative.",
  description: null,
  benefits: null,
  goodForSkinTypes: ["oily"],
  targetsConcerns: ["pores"],
  caution: null,
  seoTitle: null,
  metaDescription: null,
} as Ingredient;

describe("IngredientCard", () => {
  it("links to the ingredient and shows name + summary + function", () => {
    render(<IngredientCard ingredient={ing} />);
    const link = screen.getByRole("link", { name: /Niacinamide/ });
    expect(link.getAttribute("href")).toBe("/ingredients/niacinamide");
    expect(screen.getByText(/vitamin B3 derivative/)).toBeTruthy();
    expect(screen.getAllByText("Brightening").length).toBeGreaterThan(0);
  });
});
