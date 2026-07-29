// Turns a scored hair quiz into the two things the result screen shows besides
// the profile itself: the snapshot tags, and why this result (spec §4.6–§4.7).
//
// Both are derived from the answers and the scoring signals — nothing is
// hardcoded per archetype, so an explanation cannot contradict the score.

import { hairOptionLabel } from "./quiz";
import {
  ARCHETYPE_SLUG,
  type HairArchetypeCode,
  type HairQuizResponses,
  type HairQuizScore,
} from "./scoring";

export type HairResultExplanation = {
  /** Short chips describing what the user told us. */
  tags: string[];
  /** Option labels that contributed most to the winning archetype. */
  reasons: string[];
  /** True when an answer warrants pointing at professional evaluation. */
  advisory: boolean;
};

/** Questions that become snapshot tags, in display order. */
const TAG_QUESTIONS = [
  "natural_pattern",
  "strand_thickness",
  "density",
  "desired_result",
] as const;

// Short tag copy, keyed by question and option. Deliberately keyed by BOTH:
// `medium` means "Medium strands" for one question and "Medium density" for
// another. An option with no entry here produces no tag.
const TAG_LABELS: Record<string, Record<string, string>> = {
  natural_pattern: {
    straight: "Straight",
    loose_wave: "Loose wave",
    defined_wave_curl: "Defined wave / curl",
    tight_curl_coil: "Tight curl / coil",
    unknown_treated: "Pattern obscured by treatment",
  },
  strand_thickness: {
    fine: "Fine strands",
    medium: "Medium strands",
    coarse: "Coarse strands",
  },
  density: {
    low: "Low density",
    medium: "Medium density",
    high: "High density",
  },
  desired_result: {
    light_fresh: "Goal: Light & fresh",
    volume: "Goal: Volume",
    glass_hair: "Goal: Glass hair",
    soft_controlled: "Goal: Soft & controlled",
    defined_texture: "Goal: Defined texture",
    stronger_look: "Goal: Stronger-looking hair",
  },
};

/** Scalp answers that raise the professional-evaluation advisory (§4.6). */
const ADVISORY_CONCERNS = [
  "itching",
  "flaking",
  "redness_stinging",
  "bumps",
  "hair_loss_concern",
];
const ADVISORY_PRIMARY = ["sensitive_scalp", "hair_loss"];

const SENSITIVE_TAG = "Sensitive scalp consideration";
const MAX_REASONS = 4;

function codeFor(profileSlug: string | null): HairArchetypeCode | null {
  const found = (Object.keys(ARCHETYPE_SLUG) as HairArchetypeCode[]).find(
    (code) => ARCHETYPE_SLUG[code] === profileSlug
  );
  return found ?? null;
}

export function explainHairResult(
  responses: HairQuizResponses,
  score: HairQuizScore
): HairResultExplanation {
  const concerns = Array.isArray(responses.scalp_concerns)
    ? responses.scalp_concerns.filter((c): c is string => typeof c === "string")
    : [];
  const primary =
    typeof responses.primary_concern === "string"
      ? responses.primary_concern
      : null;

  const advisory =
    concerns.some((c) => ADVISORY_CONCERNS.includes(c)) ||
    (primary !== null && ADVISORY_PRIMARY.includes(primary));

  const code = codeFor(score.profileSlug);
  if (code === null) return { tags: [], reasons: [], advisory };

  const tags: string[] = [];
  for (const questionKey of TAG_QUESTIONS) {
    const answer = responses[questionKey];
    if (typeof answer !== "string") continue;
    const tag = TAG_LABELS[questionKey]?.[answer];
    if (tag) tags.push(tag);
  }
  if (concerns.some((c) => ADVISORY_CONCERNS.includes(c)))
    tags.push(SENSITIVE_TAG);

  // Heaviest contributions to the winner first; one reason per answer.
  const reasons: string[] = [];
  const seen = new Set<string>();
  const contributing = score.signals
    .filter((s) => s.code === code)
    .sort((a, b) => b.weight - a.weight);
  for (const signal of contributing) {
    const label = hairOptionLabel(signal.questionKey, signal.optionKey);
    if (seen.has(label)) continue;
    seen.add(label);
    reasons.push(label);
    if (reasons.length === MAX_REASONS) break;
  }

  return { tags, reasons, advisory };
}
