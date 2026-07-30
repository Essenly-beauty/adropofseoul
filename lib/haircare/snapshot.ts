// Bridges the scorer and `profile_snapshots`. The draft data schema proposed new
// tables for this; the existing columns already fit (spec §12 item 2), so the
// mapping lives here instead of in a migration.
//
// The stored shape is deliberately the *derived* result, not the raw answers —
// answers live in quiz_responses and stay there.

import type { Json } from "@/types/database.types";
import {
  SCORING_VERSION,
  scoreHairQuiz,
  type HairQuizResponses,
} from "./scoring";
import { explainHairResult, type HairResultExplanation } from "./explain";

/** `profile_code` for a sheet that produced no usable signal. */
export const LOW_SIGNAL_CODE = "low-signal";

/** Must match the chip explain.ts appends for a health-adjacent symptom. */
const SENSITIVE_TAG = "Sensitive scalp consideration";

export type HairSnapshotFields = {
  profile_code: string;
  profile_version: number;
  rule_set_version: string;
  traits_json: Json;
  goals_json: Json;
  summary_json: Json;
  confidence_json: Json;
};

export function buildHairSnapshot(
  responses: HairQuizResponses
): HairSnapshotFields {
  const score = scoreHairQuiz(responses);
  const explanation = explainHairResult(responses, score);
  const primaryConcern =
    typeof responses.primary_concern === "string"
      ? responses.primary_concern
      : null;
  const desiredResult =
    typeof responses.desired_result === "string"
      ? responses.desired_result
      : null;

  return {
    profile_code: score.profileSlug ?? LOW_SIGNAL_CODE,
    profile_version: 1,
    rule_set_version: SCORING_VERSION,
    // The display chips, including the goal chip — `traits_json` is what the
    // result screen renders, while `goals_json` below keeps the machine-readable
    // codes for segmentation. Different consumers, not duplication.
    //
    // Minus the advisory chip: that one is re-derived on read from the advisory
    // flag, so storing it too would give it two sources.
    traits_json: explanation.tags.filter(
      (t) => t !== SENSITIVE_TAG
    ) as unknown as Json,
    goals_json: { primaryConcern, desiredResult } as unknown as Json,
    summary_json: {
      reasons: explanation.reasons,
      advisory: explanation.advisory,
      overrideApplied: score.overrideApplied,
      lowSignal: score.lowSignal,
    } as unknown as Json,
    confidence_json: {
      scores: score.scores,
      winner: score.winner,
      runnerUp: score.runnerUp,
      margin: score.margin,
      tieBreakUsed: score.tieBreakUsed,
      tfChemicalRaw: score.tfChemicalRaw,
      sensitiveScalpFlag: score.sensitiveScalpFlag,
    } as unknown as Json,
  };
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/**
 * Rebuild what the result screen renders from a stored snapshot. Tolerates null
 * or malformed json columns: a snapshot written by an older `rule_set_version`
 * must still render rather than throw.
 */
export function readHairSnapshot(fields: {
  profile_code: string;
  traits_json: Json | null;
  summary_json: Json | null;
  confidence_json: Json | null;
}): { profileSlug: string | null; explanation: HairResultExplanation } {
  const summary = asRecord(fields.summary_json);
  const advisory = summary.advisory === true;
  const tags = asStringArray(fields.traits_json);
  return {
    profileSlug:
      fields.profile_code === LOW_SIGNAL_CODE ? null : fields.profile_code,
    explanation: {
      tags: advisory ? [...tags, SENSITIVE_TAG] : tags,
      reasons: asStringArray(summary.reasons),
      advisory,
    },
  };
}
