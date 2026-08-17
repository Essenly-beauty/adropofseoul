import type {
  QuizDefinition,
  QuizQuestionDef,
} from "@/lib/profile/quiz-definition";

export type SkinTrait =
  | "dry"
  | "oily"
  | "combination"
  | "balanced"
  | "hydration"
  | "soothing"
  | "texture"
  | "pores"
  | "excess_sebum"
  | "brightening"
  | "slow_aging"
  | "lightweight"
  | "rich"
  | "sensitive_consideration";

export type SkinRoutineFocus = "cleanser" | "serum" | "moisturizer" | "open";

export type SkinProfileV1Result = {
  profileSlug:
    | "hydration-seeker"
    | "sensitive-comfort"
    | "oil-water-balancer"
    | "texture-reset"
    | "steady-radiance"
    | "balanced-basics";
  tendency: SkinTrait;
  primaryConcern: SkinTrait;
  secondaryConcerns: SkinTrait[];
  finishPreference: "lightweight" | "balanced" | "rich" | "open";
  routineFocus: SkinRoutineFocus;
  sensitiveConsideration: boolean;
  traits: SkinTrait[];
};

export type SkinProfileV1Responses = Record<
  string,
  string | string[] | number | null
>;

const opts = (pairs: [string, string][]) =>
  pairs.map(([key, label]) => ({ key, value: key, label }));

function single(
  key: string,
  sectionKey: string,
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

export const SKIN_PROFILE_V1: QuizDefinition = {
  quizKey: "skin",
  version: 1,
  title: "Skin Profile",
  description:
    "Eight short questions about how your skin feels and what you want from your routine. Educational, not a diagnosis.",
  questions: [
    single("skin_balance", "tendency", "By midday, your skin usually feels…", [
      ["dry", "Dry or tight across most areas"],
      ["combination", "Oilier in some areas, drier in others"],
      ["oily", "Shiny or oily across most areas"],
      ["balanced", "Mostly comfortable and balanced"],
      ["unsure", "It changes or I’m not sure"],
    ]),
    single(
      "post_cleanse",
      "tendency",
      "Soon after cleansing, your skin feels…",
      [
        ["tight", "Tight or uncomfortable"],
        ["comfortable", "Comfortable"],
        ["oily_soon", "Comfortable, then oily quite quickly"],
        ["varies", "It depends on the cleanser or season"],
      ]
    ),
    single(
      "primary_goal",
      "goals",
      "What matters most in your routine right now?",
      [
        ["hydration", "More hydration and less tightness"],
        ["soothing", "A calmer, more comfortable feel"],
        ["texture", "Smoother-looking texture"],
        ["pores", "The appearance of pores"],
        ["excess_sebum", "Managing excess shine"],
        ["brightening", "A more even, radiant look"],
        ["slow_aging", "Steady long-term care"],
      ]
    ),
    {
      key: "secondary_goals",
      type: "multi_select",
      content: "Anything else you would like your routine to support?",
      helpText: "Choose any that matter, or choose none.",
      sectionKey: "goals",
      isRequired: true,
      allowsMultiple: true,
      validation: { exclusiveOptionKeys: ["none"] },
      options: opts([
        ["hydration", "Hydration"],
        ["soothing", "Comfort and soothing"],
        ["texture", "Texture"],
        ["pores", "Pore appearance"],
        ["excess_sebum", "Excess shine"],
        ["brightening", "Radiance"],
        ["slow_aging", "Long-term care"],
        ["none", "Nothing else for now"],
      ]),
    },
    single(
      "reactivity",
      "comfort",
      "How often does your skin react unexpectedly?",
      [
        ["often", "Often — new products can feel uncomfortable"],
        ["sometimes", "Sometimes"],
        ["rarely", "Rarely"],
        ["unsure", "I’m not sure"],
      ],
      "This describes your experience; it does not diagnose sensitive skin."
    ),
    single("finish", "preferences", "Which finish do you usually prefer?", [
      ["lightweight", "Light and fast-absorbing"],
      ["balanced", "Comfortable, somewhere in the middle"],
      ["rich", "Rich and cushioning"],
      ["open", "No preference yet"],
    ]),
    single(
      "routine_focus",
      "preferences",
      "Where would you most like help choosing?",
      [
        ["cleanser", "Cleanser"],
        ["serum", "Essence or serum"],
        ["moisturizer", "Moisturizer"],
        ["open", "Show me the best starting point"],
      ]
    ),
    single("routine_complexity", "preferences", "Your ideal routine feels…", [
      ["minimal", "Minimal — just the essentials"],
      ["balanced", "Balanced — a few purposeful steps"],
      ["layered", "Layered — I enjoy several steps"],
      ["unsure", "I’m still figuring that out"],
    ]),
  ],
};

function one(responses: SkinProfileV1Responses, key: string): string {
  const value = responses[key];
  return typeof value === "string" ? value : "";
}

export function scoreSkinProfileV1(
  responses: SkinProfileV1Responses
): SkinProfileV1Result | null {
  const required = SKIN_PROFILE_V1.questions.map((q) => q.key);
  if (required.some((key) => responses[key] == null)) return null;

  const balance = one(responses, "skin_balance");
  const postCleanse = one(responses, "post_cleanse");
  const tendency: SkinTrait =
    balance === "unsure"
      ? postCleanse === "tight"
        ? "dry"
        : postCleanse === "oily_soon"
          ? "oily"
          : "balanced"
      : (balance as SkinTrait);
  const primaryConcern = one(responses, "primary_goal") as SkinTrait;
  const rawSecondary = responses.secondary_goals;
  const secondaryConcerns = (
    Array.isArray(rawSecondary) ? rawSecondary : []
  ).filter(
    (value) => value !== "none" && value !== primaryConcern
  ) as SkinTrait[];
  const sensitiveConsideration = ["often", "sometimes"].includes(
    one(responses, "reactivity")
  );
  const finishPreference = one(
    responses,
    "finish"
  ) as SkinProfileV1Result["finishPreference"];
  const routineFocus = one(responses, "routine_focus") as SkinRoutineFocus;

  let profileSlug: SkinProfileV1Result["profileSlug"] = "balanced-basics";
  if (
    sensitiveConsideration &&
    ["hydration", "soothing"].includes(primaryConcern)
  )
    profileSlug = "sensitive-comfort";
  else if (
    ["oily", "combination"].includes(tendency) &&
    ["pores", "excess_sebum"].includes(primaryConcern)
  )
    profileSlug = "oil-water-balancer";
  else if (primaryConcern === "texture") profileSlug = "texture-reset";
  else if (["brightening", "slow_aging"].includes(primaryConcern))
    profileSlug = "steady-radiance";
  else if (primaryConcern === "hydration" || tendency === "dry")
    profileSlug = "hydration-seeker";

  const traits = Array.from(
    new Set<SkinTrait>([
      tendency,
      primaryConcern,
      ...secondaryConcerns,
      ...(finishPreference === "lightweight" || finishPreference === "rich"
        ? [finishPreference]
        : []),
      ...(sensitiveConsideration ? ["sensitive_consideration" as const] : []),
    ])
  );

  return {
    profileSlug,
    tendency,
    primaryConcern,
    secondaryConcerns,
    finishPreference,
    routineFocus,
    sensitiveConsideration,
    traits,
  };
}
