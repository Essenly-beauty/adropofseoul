import { describe, expect, it } from "vitest";
import { scoreSkinProfileV1 } from "./profile-v1";
import {
  recommendSkinProductsV1,
  SKIN_PREVIEW_PRODUCTS_V1,
} from "./recommendation-v1";

const base = {
  skin_balance: "combination",
  post_cleanse: "varies",
  primary_goal: "hydration",
  secondary_goals: ["soothing"],
  reactivity: "sometimes",
  finish: "lightweight",
  routine_focus: "serum",
  routine_complexity: "balanced",
};

describe("Skin Profile v1", () => {
  it("returns explainable traits from complete answers", () => {
    const result = scoreSkinProfileV1(base);
    expect(result).toMatchObject({
      profileSlug: "sensitive-comfort",
      tendency: "combination",
      primaryConcern: "hydration",
      sensitiveConsideration: true,
    });
    expect(result?.traits).toContain("lightweight");
  });

  it("does not invent a result from incomplete answers", () => {
    expect(scoreSkinProfileV1({ skin_balance: "dry" })).toBeNull();
  });

  it("recommends only approved products in the requested routine step", () => {
    const profile = scoreSkinProfileV1(base);
    expect(profile).not.toBeNull();
    const recommendations = recommendSkinProductsV1(profile!, 3);
    expect(recommendations).toHaveLength(3);
    expect(recommendations.map((r) => r.productId)).not.toContain("P00172");
    expect(recommendations.map((r) => r.productId)).not.toContain("P00348");
    expect(
      recommendations.every(
        (r) =>
          SKIN_PREVIEW_PRODUCTS_V1.find((p) => p.productId === r.productId)
            ?.routineStep === "serum"
      )
    ).toBe(true);
    expect(recommendations[0].reasonCodes).toContain("PRIMARY_CONCERN_MATCH");
  });

  it("is deterministic", () => {
    const profile = scoreSkinProfileV1(base)!;
    expect(recommendSkinProductsV1(profile)).toEqual(
      recommendSkinProductsV1(profile)
    );
  });
});
