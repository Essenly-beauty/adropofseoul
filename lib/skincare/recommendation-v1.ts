import type { SkinProfileV1Result, SkinTrait } from "./profile-v1";

export type PreviewProduct = {
  productId: string;
  slug: string;
  routineStep: "cleanser" | "serum" | "moisturizer" | "body_moisturizer";
  tendencies: SkinTrait[];
  concerns: SkinTrait[];
  finishes: Array<"lightweight" | "balanced" | "rich">;
  sensitiveConsideration: boolean;
  cautions: string[];
  status: "approved" | "needs_review" | "excluded_face_scope";
};

// Product identity and commerce remain in the catalog. This overlay contains
// only reviewed recommendation traits for the first eight Picks.
export const SKIN_PREVIEW_PRODUCTS_V1: PreviewProduct[] = [
  {
    productId: "P00249",
    slug: "torriden-dive-in-serum-50ml",
    routineStep: "serum",
    tendencies: [],
    concerns: ["hydration"],
    finishes: ["lightweight"],
    sensitiveConsideration: false,
    cautions: [],
    status: "approved",
  },
  {
    productId: "P00075",
    slug: "anua-pdrn-hyaluronic-capsule-100-serum-30ml",
    routineStep: "serum",
    tendencies: [],
    concerns: ["hydration"],
    finishes: ["lightweight"],
    sensitiveConsideration: false,
    cautions: ["SALMON_DERIVED_PDRN"],
    status: "approved",
  },
  {
    productId: "P00256",
    slug: "beplain-mung-bean-ph-balanced-cleansing-foam-80ml",
    routineStep: "cleanser",
    tendencies: ["dry", "oily", "combination", "balanced"],
    concerns: [],
    finishes: ["balanced"],
    sensitiveConsideration: true,
    cautions: [],
    status: "approved",
  },
  {
    productId: "P00097",
    slug: "aestura-atobarrier-365-cream-80ml",
    routineStep: "moisturizer",
    tendencies: ["dry"],
    concerns: ["hydration"],
    finishes: ["rich"],
    sensitiveConsideration: true,
    cautions: [],
    status: "approved",
  },
  {
    productId: "P00017",
    slug: "s-nature-aqua-squalane-moisturizing-cream-60ml",
    routineStep: "moisturizer",
    tendencies: ["dry", "combination"],
    concerns: ["hydration"],
    finishes: ["balanced"],
    sensitiveConsideration: false,
    cautions: ["LIMITED_FINISH_EVIDENCE"],
    status: "approved",
  },
  {
    productId: "P00262",
    slug: "mixsoon-bean-essence-50ml",
    routineStep: "serum",
    tendencies: [],
    concerns: ["hydration", "texture"],
    finishes: ["lightweight"],
    sensitiveConsideration: true,
    cautions: ["EXFOLIATION_METHOD_REVIEW"],
    status: "approved",
  },
  {
    productId: "P00172",
    slug: "dr-g-red-blemish-clear-soothing-cream-70ml",
    routineStep: "moisturizer",
    tendencies: [],
    concerns: ["soothing"],
    finishes: [],
    sensitiveConsideration: true,
    cautions: ["TEXTURE_REVIEW_REQUIRED"],
    status: "needs_review",
  },
  {
    productId: "P00348",
    slug: "illiyoon-ceramide-ato-concentrate-cream-150ml",
    routineStep: "body_moisturizer",
    tendencies: [],
    concerns: [],
    finishes: ["rich"],
    sensitiveConsideration: false,
    cautions: ["FACE_SCOPE_NOT_VERIFIED"],
    status: "excluded_face_scope",
  },
];

export type SkinProductRecommendation = {
  productId: string;
  matchLevel: "strong" | "good" | "consider";
  internalScore: number;
  reasonCodes: string[];
  cautionCodes: string[];
};

export function recommendSkinProductsV1(
  profile: SkinProfileV1Result,
  limit = 3
): SkinProductRecommendation[] {
  return SKIN_PREVIEW_PRODUCTS_V1.filter((p) => p.status === "approved")
    .filter(
      (p) =>
        profile.routineFocus === "open" ||
        p.routineStep === profile.routineFocus
    )
    .map((product) => {
      let score = 30;
      const reasons = ["ROUTINE_STEP_MATCH"];
      if (product.concerns.includes(profile.primaryConcern)) {
        score += 25;
        reasons.push("PRIMARY_CONCERN_MATCH");
      }
      if (profile.secondaryConcerns.some((c) => product.concerns.includes(c))) {
        score += 10;
        reasons.push("SECONDARY_CONCERN_MATCH");
      }
      if (product.tendencies.includes(profile.tendency)) {
        score += 15;
        reasons.push("SKIN_TENDENCY_MATCH");
      }
      if (
        profile.finishPreference !== "open" &&
        profile.finishPreference !== "balanced" &&
        product.finishes.includes(profile.finishPreference)
      ) {
        score += 10;
        reasons.push("TEXTURE_PREFERENCE_MATCH");
      }
      if (profile.sensitiveConsideration && product.sensitiveConsideration) {
        score += 10;
        reasons.push("SENSITIVE_CONSIDERATION");
      }
      if (
        profile.sensitiveConsideration &&
        product.cautions.includes("EXFOLIATION_METHOD_REVIEW")
      )
        score -= 20;

      return {
        productId: product.productId,
        matchLevel: score >= 70 ? "strong" : score >= 50 ? "good" : "consider",
        internalScore: score,
        reasonCodes: reasons,
        cautionCodes: product.cautions,
      } satisfies SkinProductRecommendation;
    })
    .sort(
      (a, b) =>
        b.internalScore - a.internalScore ||
        a.productId.localeCompare(b.productId)
    )
    .slice(0, limit);
}
