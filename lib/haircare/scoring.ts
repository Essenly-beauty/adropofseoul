// Hair Profile quiz scoring (design spec §4). Pure and synchronous: answers in,
// archetype out, plus the signals that got it there.
//
// The two-letter codes are the review shorthand from the spec; ARCHETYPE_SLUG
// maps them to the profile slugs in ./profiles. Tables are keyed by question KEY
// (never by position) so reordering a question cannot silently change a result.
//
// These weights are editorial judgment, not clinical evidence.
// [PRODUCT/MEDICAL REVIEW REQUIRED before this ships]

export type HairArchetypeCode = "LB" | "DG" | "OD" | "HW" | "MC" | "TF";

/** Tie-break priority: the first code with the highest score wins (§4.5). */
const CODE_ORDER: HairArchetypeCode[] = ["LB", "DG", "OD", "HW", "MC", "TF"];

export const ARCHETYPE_SLUG: Record<HairArchetypeCode, string> = {
  LB: "lightweight-balancer",
  DG: "dense-glass-seeker",
  OD: "oily-scalp-dry-ends",
  HW: "hidden-wave",
  MC: "moisture-seeking-curl",
  TF: "treated-fragile",
};

export type HairQuizResponses = Record<
  string,
  string | string[] | number | null | undefined
>;

export type HairScoreSignal = {
  questionKey: string;
  optionKey: string;
  code: HairArchetypeCode;
  weight: number;
};

export type HairQuizScore = {
  /** Winning profile slug, or null when there is not enough signal. */
  profileSlug: string | null;
  scores: Record<HairArchetypeCode, number>;
  signals: HairScoreSignal[];
  lowSignal: boolean;
};

type Weights = Partial<Record<HairArchetypeCode, number>>;

// --- §4.1 single-select weights -------------------------------------------
// Options omitted here contribute nothing (unknown / average / varies /
// every_other_day / rarely, and the two advisory concerns handled in §4.6).
const SINGLE_WEIGHTS: Record<string, Record<string, Weights>> = {
  natural_pattern: {
    straight: { LB: 1, DG: 2 },
    loose_wave: { DG: 1, HW: 4, MC: 1 },
    defined_wave_curl: { HW: 2, MC: 4 },
    tight_curl_coil: { MC: 6 },
    unknown_treated: { TF: 3 },
  },
  strand_thickness: {
    fine: { LB: 5, OD: 1, HW: 1, TF: 1 },
    medium: { LB: 1, DG: 1, MC: 1 },
    coarse: { DG: 5, MC: 2 },
  },
  density: {
    low: { LB: 2 },
    medium: { DG: 1 },
    high: { DG: 4, OD: 1, HW: 1, MC: 1 },
  },
  scalp_oiliness_onset: {
    hours: { LB: 2, OD: 5 },
    next_day: { LB: 1, OD: 3 },
    two_plus_days: { MC: 1 },
    rarely_oily: { DG: 1, MC: 2, TF: 1 },
  },
  wash_frequency: {
    multiple_daily: { LB: 1, OD: 2, TF: 1 },
    daily: { LB: 1, OD: 1 },
    three_plus_days: { MC: 1 },
  },
  product_response: {
    weighed_down: { LB: 6, OD: 2, HW: 1 },
    balanced: { DG: 1 },
    still_dry: { DG: 3, OD: 1, HW: 1, MC: 3, TF: 2 },
    sits_on_surface: { LB: 2, DG: 1 },
  },
  dry_time: {
    very_fast: { LB: 1, TF: 1 },
    slow: { DG: 2, HW: 1, MC: 1 },
    mixed: { OD: 2, TF: 1 },
  },
  humidity_response: {
    little_change: { DG: 1 },
    falls_flat: { LB: 3, HW: 1 },
    frizzes: { DG: 3, HW: 3, MC: 1, TF: 1 },
    waves_appear: { HW: 6, MC: 2 },
    expands_tangles: { DG: 1, HW: 1, MC: 4, TF: 2 },
  },
  heat_frequency: {
    one_two_week: { TF: 1 },
    three_five_week: { TF: 3 },
    almost_daily: { TF: 5 },
    dryer_only: { DG: 1, TF: 1 },
  },
  ends_condition: {
    smooth: { DG: 1 },
    slightly_dry: { DG: 2, OD: 2, MC: 1, TF: 2 },
    split_breaking: { OD: 2, MC: 1, TF: 7 },
    tangled: { DG: 1, OD: 1, HW: 1, MC: 3, TF: 4 },
    rough_dull: { DG: 3, OD: 2, MC: 2, TF: 5 },
  },
  primary_concern: {
    oily_scalp: { OD: 5 },
    flatness: { LB: 5 },
    dryness: { DG: 2, MC: 3, TF: 2 },
    frizz: { DG: 3, HW: 3, MC: 2 },
    breakage: { TF: 6 },
    tangling: { MC: 3, TF: 3 },
    lack_shine: { DG: 4 },
    curl_definition: { HW: 2, MC: 5 },
    // sensitive_scalp and hair_loss carry no weight on purpose — §4.6.
  },
  desired_result: {
    light_fresh: { LB: 2, OD: 1 },
    volume: { LB: 3 },
    glass_hair: { LB: 1, DG: 2 },
    soft_controlled: { DG: 2, TF: 1 },
    defined_texture: { HW: 2, MC: 3 },
    stronger_look: { TF: 2 },
  },
};

// --- §4.2 scalp_concerns (multi) ------------------------------------------
const SCALP_CONCERN_WEIGHTS: Record<string, Weights> = {
  oiliness: { OD: 3, LB: 1 },
  tightness_dryness: { MC: 2, DG: 1, TF: 1 },
  odor: { OD: 1 },
  // itching / flaking / redness_stinging / bumps / hair_loss_concern: advisory
  // only (§4.6) — see explain.ts.
};

// --- §4.3 chemical_history (multi) ----------------------------------------
const CHEMICAL_DAMAGE: Record<string, number> = {
  color: 2,
  bleach: 6,
  perm: 3,
  straightening: 4,
  keratin_smoothing: 2,
};
const CHEMICAL_DAMAGE_CAP = 10;

const DRY_OR_DAMAGED_ENDS = [
  "slightly_dry",
  "split_breaking",
  "tangled",
  "rough_dull",
];

function asSingle(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function asMulti(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

export function scoreHairQuiz(responses: HairQuizResponses): HairQuizScore {
  const scores: Record<HairArchetypeCode, number> = {
    LB: 0,
    DG: 0,
    OD: 0,
    HW: 0,
    MC: 0,
    TF: 0,
  };
  const signals: HairScoreSignal[] = [];

  function apply(questionKey: string, optionKey: string, weights: Weights) {
    for (const code of CODE_ORDER) {
      const weight = weights[code];
      if (!weight) continue;
      scores[code] += weight;
      signals.push({ questionKey, optionKey, code, weight });
    }
  }

  for (const [questionKey, table] of Object.entries(SINGLE_WEIGHTS)) {
    const answer = asSingle(responses[questionKey]);
    if (!answer) continue;
    const weights = table[answer];
    if (weights) apply(questionKey, answer, weights);
  }

  for (const concern of asMulti(responses.scalp_concerns)) {
    const weights = SCALP_CONCERN_WEIGHTS[concern];
    if (weights) apply("scalp_concerns", concern, weights);
  }

  // Damage sums across services, then caps — so four services can't blow past
  // every override threshold. Signals stay per-service (pre-cap) so the
  // explanation can name what the user actually selected.
  const services = asMulti(responses.chemical_history);
  let rawDamage = 0;
  for (const service of services) {
    const weight = CHEMICAL_DAMAGE[service];
    if (!weight) continue;
    rawDamage += weight;
    signals.push({
      questionKey: "chemical_history",
      optionKey: service,
      code: "TF",
      weight,
    });
  }
  scores.TF += Math.min(rawDamage, CHEMICAL_DAMAGE_CAP);

  // --- §4.4 combination rules ---
  const pattern = asSingle(responses.natural_pattern);
  const humidity = asSingle(responses.humidity_response);
  const onset = asSingle(responses.scalp_oiliness_onset);
  const ends = asSingle(responses.ends_condition);
  const heat = asSingle(responses.heat_frequency);

  if (
    (pattern === "loose_wave" || pattern === "defined_wave_curl") &&
    (humidity === "waves_appear" || humidity === "frizzes")
  ) {
    apply("humidity_response", humidity, { HW: 3 });
  }
  if (
    (onset === "hours" || onset === "next_day") &&
    ends !== null &&
    DRY_OR_DAMAGED_ENDS.includes(ends)
  ) {
    apply("ends_condition", ends, { OD: 4 });
  }

  // --- §4.5 winner selection ---
  const best = CODE_ORDER.reduce((a, b) => (scores[b] > scores[a] ? b : a));
  if (scores[best] === 0)
    return { profileSlug: null, scores, signals, lowSignal: true };

  const severe =
    scores.TF >= 13 ||
    (services.includes("bleach") && ends === "split_breaking") ||
    (services.some((s) => s !== "none") &&
      heat === "almost_daily" &&
      ends !== "smooth");

  let winner = best;
  if (pattern === "tight_curl_coil") {
    // Coily hair keeps its pattern routine unless damage clearly dominates.
    winner = severe && scores.TF >= scores.MC + 4 ? "TF" : "MC";
  } else if (severe) {
    winner = "TF";
  } else if (pattern === "loose_wave" && humidity === "waves_appear") {
    winner = "HW";
  }

  return {
    profileSlug: ARCHETYPE_SLUG[winner],
    scores,
    signals,
    lowSignal: false,
  };
}
