// Hair Profile quiz scoring (design spec §4). Pure and synchronous: answers in,
// archetype out, plus the signals that got it there.
//
// The two-letter codes are the review shorthand from the spec; ARCHETYPE_SLUG
// maps them to the profile slugs in ./profiles. Tables are keyed by question KEY
// (never by position) so reordering a question cannot silently change a result.
//
// These weights are editorial judgment, not clinical evidence.
// [PRODUCT/MEDICAL REVIEW REQUIRED before this ships]

/**
 * Scoring algorithm version, tracked separately from the question-set version so
 * past responses can be re-segmented when the weights change (data schema §0.2,
 * §10). Bump this whenever a weight, override, or tie-break rule changes.
 */
export const SCORING_VERSION = "score-1.0.0";

export type HairArchetypeCode = "LB" | "DG" | "OD" | "HW" | "MC" | "TF";

/** Which forced rule decided the winner, if any (data schema §4). */
export type HairOverride =
  "none" | "severe_damage" | "hidden_wave" | "tight_curl_protected";

/**
 * `scalp_concerns` values classified as health-adjacent (data schema §5). Kept
 * here so the result flag, the advisory, and any future brand-sharing exclusion
 * all read one list instead of three copies.
 */
export const SENSITIVE_SCALP_SYMPTOMS = [
  "itching",
  "flaking",
  "redness_stinging",
  "bumps",
];

/** Additionally sensitive, and additionally advisory-raising: hair loss. */
export const SENSITIVE_HAIR_LOSS_CONCERN = "hair_loss_concern";

/** `primary_concern` values classified as health-adjacent (data schema §5). */
export const SENSITIVE_PRIMARY_CONCERNS = ["sensitive_scalp", "hair_loss"];

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
  /** Winning code, or null when lowSignal. */
  winner: HairArchetypeCode | null;
  /** Highest-scoring code other than the winner — the hybrid-segment partner. */
  runnerUp: HairArchetypeCode | null;
  /**
   * Winner's score minus the runner-up's. Small = hybrid segment. **Can be
   * negative**: an override can hand the result to a code that did not top the
   * score, and a negative margin is exactly the signal that it did.
   */
  margin: number;
  /** True when the top score was shared and insertion order decided it. */
  tieBreakUsed: boolean;
  /** Chemical damage before the cap — preserves the heavy-damage signal. */
  tfChemicalRaw: number;
  /** Which forced rule decided the winner. */
  overrideApplied: HairOverride;
  /** A health-adjacent scalp symptom was selected (data schema §4, §5). */
  sensitiveScalpFlag: boolean;
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

// --- §4.2b environment (multi) --------------------------------------------
// Scoped to what Q9 (humidity_response) can't tell us: humidity is already
// covered behaviourally there, so this carries water hardness, climate dryness,
// airborne buildup, and chlorine/salt exposure. Weights stay modest — where you
// live shouldn't outweigh what your hair actually does.
const ENVIRONMENT_WEIGHTS: Record<string, Weights> = {
  hard_water: { LB: 2, DG: 1 }, // mineral residue reads as buildup and dullness
  dry_climate: { DG: 1, MC: 2, TF: 1 },
  cold_winter: { DG: 1, MC: 1, TF: 1 }, // indoor heating dries the lengths
  high_pollution: { OD: 2 }, // scalp buildup between washes
  frequent_swimming: { TF: 3 }, // chlorine and salt are real cuticle damage
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

/** Lengths at which a slow air-dry says nothing about thickness or density. */
const LONG_LENGTHS = ["mid_back", "waist_or_longer"];

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

  // Long hair air-dries slowly whatever its thickness or density, so the
  // `dry_time: slow` weights would otherwise read length as body (§4.4).
  const longHair = LONG_LENGTHS.includes(asSingle(responses.hair_length) ?? "");

  for (const [questionKey, table] of Object.entries(SINGLE_WEIGHTS)) {
    const answer = asSingle(responses[questionKey]);
    if (!answer) continue;
    if (questionKey === "dry_time" && answer === "slow" && longHair) continue;
    const weights = table[answer];
    if (weights) apply(questionKey, answer, weights);
  }

  for (const factor of asMulti(responses.environment)) {
    const weights = ENVIRONMENT_WEIGHTS[factor];
    if (weights) apply("environment", factor, weights);
  }

  const concerns = asMulti(responses.scalp_concerns);
  for (const concern of concerns) {
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

  const sensitiveScalpFlag = concerns.some((c) =>
    SENSITIVE_SCALP_SYMPTOMS.includes(c)
  );

  // --- §4.5 winner selection ---
  const best = CODE_ORDER.reduce((a, b) => (scores[b] > scores[a] ? b : a));
  if (scores[best] === 0)
    return {
      profileSlug: null,
      scores,
      signals,
      lowSignal: true,
      winner: null,
      runnerUp: null,
      margin: 0,
      tieBreakUsed: false,
      tfChemicalRaw: rawDamage,
      overrideApplied: "none",
      sensitiveScalpFlag,
    };

  const severe =
    scores.TF >= 13 ||
    (services.includes("bleach") && ends === "split_breaking") ||
    (services.some((s) => s !== "none") &&
      heat === "almost_daily" &&
      ends !== "smooth");

  let winner = best;
  let overrideApplied: HairOverride = "none";
  if (pattern === "tight_curl_coil") {
    // Coily hair keeps its pattern routine unless damage clearly dominates.
    if (severe && scores.TF >= scores.MC + 4) {
      winner = "TF";
      overrideApplied = "severe_damage";
    } else {
      winner = "MC";
      overrideApplied = "tight_curl_protected";
    }
  } else if (severe) {
    winner = "TF";
    overrideApplied = "severe_damage";
  } else if (pattern === "loose_wave" && humidity === "waves_appear") {
    winner = "HW";
    overrideApplied = "hidden_wave";
  }

  // Ranked by score, ties keeping CODE_ORDER (Array.prototype.sort is stable).
  const ranked = [...CODE_ORDER].sort((a, b) => scores[b] - scores[a]);
  const runnerUp = ranked.find((c) => c !== winner) ?? null;
  const tiedAtTop =
    CODE_ORDER.filter((c) => scores[c] === scores[best]).length > 1;

  return {
    profileSlug: ARCHETYPE_SLUG[winner],
    scores,
    signals,
    lowSignal: false,
    winner,
    runnerUp,
    margin: runnerUp ? scores[winner] - scores[runnerUp] : 0,
    // Only meaningful when the tie actually decided the outcome — an override
    // that stepped in makes the shared top score irrelevant.
    tieBreakUsed: tiedAtTop && winner === best,
    tfChemicalRaw: rawDamage,
    overrideApplied,
    sensitiveScalpFlag,
  };
}
