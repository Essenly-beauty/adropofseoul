// Version 1 of the Hair Profile quiz (WS-06). 14 closed questions, no info step
// and no free text, scoring into the six archetypes in ./profiles via ./scoring.
//
// Option `key` and `value` are identical and are the canonical codes; labels are
// display-only and never stored or scored. Copy is observational and educational
// on purpose — nothing here names or implies a diagnosed condition (WS-06).
// [PRODUCT/MEDICAL REVIEW REQUIRED before this ships]
//
// The shape mirrors the DB tables, so the same definition can later be seeded as
// quiz_definitions version 1. See the design spec §3 for the question inventory.

import type {
  QuizDefinition,
  QuizQuestionDef,
} from "@/lib/profile/quiz-definition";

export const HAIR_QUIZ_SECTIONS = [
  "natural_hair",
  "scalp",
  "hair_behavior",
  "damage_styling",
  "environment",
  "concern_goal",
] as const;

export type HairQuizSection = (typeof HAIR_QUIZ_SECTIONS)[number];

/** Option key and value_code are the same string for every hair option. */
function opts(pairs: [string, string][]) {
  return pairs.map(([key, label]) => ({ key, value: key, label }));
}

function single(
  key: string,
  sectionKey: HairQuizSection,
  content: string,
  pairs: [string, string][],
  helpText?: string
): QuizQuestionDef {
  return {
    key,
    type: "single_select",
    content,
    helpText,
    sectionKey,
    isRequired: true,
    allowsMultiple: false,
    options: opts(pairs),
  };
}

function multi(
  key: string,
  sectionKey: HairQuizSection,
  content: string,
  pairs: [string, string][]
): QuizQuestionDef {
  return {
    key,
    type: "multi_select",
    content,
    helpText: "Select all that apply.",
    sectionKey,
    isRequired: true,
    allowsMultiple: true,
    // "None" cannot be combined with a concern or a service.
    validation: { exclusiveOptionKeys: ["none"] },
    options: opts(pairs),
  };
}

export const HAIR_QUIZ: QuizDefinition = {
  quizKey: "hair",
  version: 1,
  title: "Hair Profile",
  description:
    "Fourteen short questions about your hair, scalp, and routine. Educational, not a medical diagnosis.",
  questions: [
    single(
      "natural_pattern",
      "natural_hair",
      "When your hair air-dries without styling products, what does it naturally do?",
      [
        ["straight", "Falls almost completely straight"],
        ["loose_wave", "Forms loose S-shaped bends"],
        ["defined_wave_curl", "Forms defined waves or ringlets"],
        ["tight_curl_coil", "Forms tight curls or coils"],
        ["unknown_treated", "I am not sure because of chemical treatments"],
      ],
      "Choose the closest overall pattern. Different parts of your hair may behave differently."
    ),
    single(
      "strand_thickness",
      "natural_hair",
      "How does a single strand of your hair feel between your fingers?",
      [
        ["fine", "I can barely feel it"],
        [
          "medium",
          "I can feel it, but it does not seem especially fine or coarse",
        ],
        ["coarse", "It feels substantial, firm, or wiry"],
        ["unknown", "I am not sure"],
      ]
    ),
    single(
      "density",
      "natural_hair",
      "How would you describe the overall amount of hair on your scalp?",
      [
        ["low", "My scalp is easily visible or my ponytail feels small"],
        ["medium", "Somewhere in the middle"],
        ["high", "My hair feels dense, heavy, or forms a thick ponytail"],
        ["unknown", "I am not sure"],
      ]
    ),
    single(
      "hair_length",
      "natural_hair",
      "How long is your hair right now?",
      [
        ["above_shoulder", "Above the shoulders"],
        ["shoulder_collarbone", "Shoulder to collarbone"],
        ["mid_back", "Past the collarbone, to mid-back"],
        ["waist_or_longer", "Waist-length or longer"],
      ],
      "Length changes how long hair takes to dry, so this keeps that answer from being read as thickness."
    ),
    single(
      "scalp_oiliness_onset",
      "scalp",
      "How soon does your scalp begin to look or feel oily after washing?",
      [
        ["hours", "Within several hours"],
        ["next_day", "By the next day"],
        ["two_plus_days", "After two or more days"],
        ["rarely_oily", "It rarely feels oily and may feel dry"],
      ]
    ),
    multi(
      "scalp_concerns",
      "scalp",
      "Which scalp concerns do you experience regularly?",
      [
        ["none", "None"],
        ["itching", "Itching"],
        ["flaking", "Flaking or visible dandruff"],
        ["redness_stinging", "Redness, stinging, or burning"],
        ["odor", "Odor soon after washing"],
        ["bumps", "Bumps or tender spots"],
        ["oiliness", "Excess oiliness"],
        ["tightness_dryness", "Tightness or dryness"],
        ["hair_loss_concern", "Hair loss concern"],
      ]
    ),
    single(
      "wash_frequency",
      "scalp",
      "How often do you usually wash your hair?",
      [
        ["multiple_daily", "More than once a day"],
        ["daily", "Daily"],
        ["every_other_day", "Every other day"],
        ["three_plus_days", "Every three days or less often"],
      ]
    ),
    single(
      "product_response",
      "hair_behavior",
      "What usually happens when you apply conditioner, masks, or hair oil?",
      [
        ["weighed_down", "My hair gets weighed down or oily easily"],
        ["balanced", "It feels soft and balanced"],
        ["still_dry", "It still feels dry or frizzy"],
        ["sits_on_surface", "Products seem to sit on the surface"],
        ["varies", "It depends on the product"],
      ]
    ),
    single(
      "dry_time",
      "hair_behavior",
      "How long does your hair usually take to air-dry?",
      [
        ["very_fast", "It dries very quickly"],
        ["average", "An average amount of time"],
        ["slow", "It takes a long time"],
        ["mixed", "My roots dry quickly, but my ends stay wet"],
        ["unknown", "I am not sure"],
      ]
    ),
    single(
      "humidity_response",
      "hair_behavior",
      "What happens to your hair in humid weather?",
      [
        ["little_change", "Very little changes"],
        ["falls_flat", "It falls flat or loses volume"],
        ["frizzes", "It becomes frizzy or develops flyaways"],
        ["waves_appear", "Waves or curls become more visible"],
        [
          "expands_tangles",
          "It expands, tangles, or becomes difficult to control",
        ],
      ]
    ),
    multi(
      "chemical_history",
      "damage_styling",
      "Which chemical services have you had in the past 12 months?",
      [
        ["color", "Hair color"],
        ["bleach", "Bleach or highlights"],
        ["perm", "Perm"],
        ["straightening", "Chemical straightening or magic straight perm"],
        ["keratin_smoothing", "Keratin or smoothing treatment"],
        ["none", "None"],
      ]
    ),
    single(
      "heat_frequency",
      "damage_styling",
      "How often do you use heat tools?",
      [
        ["rarely", "Rarely"],
        ["one_two_week", "1–2 times a week"],
        ["three_five_week", "3–5 times a week"],
        ["almost_daily", "Almost daily"],
        ["dryer_only", "I mostly use a blow-dryer"],
      ]
    ),
    single(
      "ends_condition",
      "damage_styling",
      "How do your mid-lengths and ends currently feel?",
      [
        ["smooth", "Smooth and manageable"],
        ["slightly_dry", "Slightly dry"],
        ["split_breaking", "Split, snapping, or breaking"],
        ["tangled", "Frequently tangled"],
        ["rough_dull", "Rough, dull, or noticeably different from my roots"],
      ]
    ),
    multi(
      "environment",
      "environment",
      "Does anything here describe where you live or swim?",
      [
        ["hard_water", "Hard water or noticeable mineral residue"],
        ["dry_climate", "Dry climate for much of the year"],
        ["cold_winter", "Long, cold winters with indoor heating"],
        ["high_pollution", "High air pollution or fine dust"],
        ["frequent_swimming", "Chlorinated pool or seawater regularly"],
        ["none", "None of these"],
      ]
    ),
    single(
      "primary_concern",
      "concern_goal",
      "What would you most like to improve first?",
      [
        ["oily_scalp", "Oily scalp"],
        ["flatness", "Flatness or lack of volume"],
        ["dryness", "Dryness"],
        ["frizz", "Frizz"],
        ["breakage", "Breakage or split ends"],
        ["tangling", "Tangling"],
        ["lack_shine", "Lack of shine"],
        ["curl_definition", "Wave or curl definition"],
        ["sensitive_scalp", "Sensitive or uncomfortable scalp"],
        ["hair_loss", "Hair loss concern"],
      ]
    ),
    single(
      "desired_result",
      "concern_goal",
      "What result are you hoping for most?",
      [
        ["light_fresh", "Light, fresh hair"],
        ["volume", "More volume"],
        ["glass_hair", "Smooth, reflective glass hair"],
        ["soft_controlled", "Soft, controlled hair"],
        ["defined_texture", "Defined waves or curls"],
        ["stronger_look", "Stronger, healthier-looking hair"],
      ]
    ),
  ],
};

const LABELS: Record<string, Record<string, string>> = Object.fromEntries(
  HAIR_QUIZ.questions.map((q) => [
    q.key,
    Object.fromEntries(q.options.map((o) => [o.key, o.label])),
  ])
);

/** Display label for an answered option; falls back to the raw key. */
export function hairOptionLabel(
  questionKey: string,
  optionKey: string
): string {
  return LABELS[questionKey]?.[optionKey] ?? optionKey;
}
