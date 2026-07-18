// Beauty domain vocabularies for the ingredient dictionary: skin types,
// concerns, and ingredient functions, with value → display-label helpers.
// (Ported from the ingredient-encyclopedia branch, where this lived in a
// pre-restructure lib/taxonomy.ts; the site IA now owns that filename.)

export type Term = { value: string; label: string };

export const SKIN_TYPES: Term[] = [
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
  { value: "normal", label: "Normal" },
  { value: "acne_prone", label: "Acne-Prone" },
];

export const CONCERNS: Term[] = [
  { value: "acne", label: "Acne" },
  { value: "aging", label: "Aging" },
  { value: "hyperpigmentation", label: "Hyperpigmentation" },
  { value: "redness", label: "Redness" },
  { value: "dryness", label: "Dryness" },
  { value: "dullness", label: "Dullness" },
  { value: "texture", label: "Texture" },
  { value: "pores", label: "Pores" },
  { value: "barrier", label: "Barrier" },
];

export const INGREDIENT_FUNCTIONS: Term[] = [
  { value: "humectant", label: "Humectant" },
  { value: "emollient", label: "Emollient" },
  { value: "occlusive", label: "Occlusive" },
  { value: "antioxidant", label: "Antioxidant" },
  { value: "exfoliant", label: "Exfoliant" },
  { value: "brightening", label: "Brightening" },
  { value: "soothing", label: "Soothing" },
  { value: "barrier_support", label: "Barrier Support" },
  { value: "sebum_control", label: "Sebum Control" },
  { value: "anti_aging", label: "Anti-Aging" },
];

function labeler(terms: Term[]): (value: string) => string {
  const m = new Map(terms.map((t) => [t.value, t.label]));
  return (value: string) => m.get(value) ?? value;
}

export const skinTypeLabel = labeler(SKIN_TYPES);
export const concernLabel = labeler(CONCERNS);
export const functionLabel = labeler(INGREDIENT_FUNCTIONS);

export const SKIN_TYPE_VALUES = SKIN_TYPES.map((t) => t.value);
export const CONCERN_VALUES = CONCERNS.map((t) => t.value);
export const FUNCTION_VALUES = INGREDIENT_FUNCTIONS.map((t) => t.value);
