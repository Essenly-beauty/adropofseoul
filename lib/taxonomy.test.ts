import { describe, it, expect } from "vitest";
import {
  SKIN_TYPES,
  CONCERNS,
  INGREDIENT_FUNCTIONS,
  skinTypeLabel,
  concernLabel,
  functionLabel,
} from "./taxonomy";

describe("taxonomy", () => {
  it("has the documented vocabularies", () => {
    expect(SKIN_TYPES.map((t) => t.value)).toEqual([
      "oily",
      "dry",
      "combination",
      "sensitive",
      "normal",
      "acne_prone",
    ]);
    expect(CONCERNS.length).toBe(9);
    expect(INGREDIENT_FUNCTIONS.length).toBe(10);
  });
  it("labels values and falls back to the raw value", () => {
    expect(skinTypeLabel("acne_prone")).toBe("Acne-Prone");
    expect(concernLabel("hyperpigmentation")).toBe("Hyperpigmentation");
    expect(functionLabel("barrier_support")).toBe("Barrier Support");
    expect(skinTypeLabel("unknown")).toBe("unknown");
  });
});
