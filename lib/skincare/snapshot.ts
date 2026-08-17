import type { Json } from "@/types/database.types";
import {
  scoreSkinProfileV1,
  type SkinProfileV1Responses,
  type SkinProfileV1Result,
} from "./profile-v1";

export const SKIN_SCORING_VERSION = "skin-score-1.0.0";
export const SKIN_LOW_SIGNAL_CODE = "low-signal";

export type SkinSnapshotFields = {
  profile_code: string;
  profile_version: number;
  rule_set_version: string;
  traits_json: Json;
  goals_json: Json;
  preferences_json: Json;
  summary_json: Json;
  confidence_json: Json;
};

export function buildSkinSnapshot(
  responses: SkinProfileV1Responses
): SkinSnapshotFields {
  const result = scoreSkinProfileV1(responses);
  return {
    profile_code: result?.profileSlug ?? SKIN_LOW_SIGNAL_CODE,
    profile_version: 1,
    rule_set_version: SKIN_SCORING_VERSION,
    traits_json: (result?.traits ?? []) as unknown as Json,
    goals_json: {
      primaryConcern: result?.primaryConcern ?? null,
      secondaryConcerns: result?.secondaryConcerns ?? [],
    } as unknown as Json,
    preferences_json: {
      finishPreference: result?.finishPreference ?? null,
      routineFocus: result?.routineFocus ?? null,
    } as unknown as Json,
    summary_json: {
      tendency: result?.tendency ?? null,
      sensitiveConsideration: result?.sensitiveConsideration ?? false,
    } as unknown as Json,
    confidence_json: { complete: result !== null } as unknown as Json,
  };
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function readSkinSnapshot(fields: {
  profile_code: string;
  traits_json: Json | null;
  goals_json: Json | null;
  preferences_json: Json | null;
  summary_json: Json | null;
}): SkinProfileV1Result | null {
  if (fields.profile_code === SKIN_LOW_SIGNAL_CODE) return null;
  const goals = record(fields.goals_json);
  const preferences = record(fields.preferences_json);
  const summary = record(fields.summary_json);
  if (
    typeof goals.primaryConcern !== "string" ||
    typeof preferences.finishPreference !== "string" ||
    typeof preferences.routineFocus !== "string" ||
    typeof summary.tendency !== "string"
  )
    return null;
  return {
    profileSlug: fields.profile_code as SkinProfileV1Result["profileSlug"],
    tendency: summary.tendency as SkinProfileV1Result["tendency"],
    primaryConcern:
      goals.primaryConcern as SkinProfileV1Result["primaryConcern"],
    secondaryConcerns: strings(
      goals.secondaryConcerns
    ) as SkinProfileV1Result["secondaryConcerns"],
    finishPreference:
      preferences.finishPreference as SkinProfileV1Result["finishPreference"],
    routineFocus:
      preferences.routineFocus as SkinProfileV1Result["routineFocus"],
    sensitiveConsideration: summary.sensitiveConsideration === true,
    traits: strings(fields.traits_json) as SkinProfileV1Result["traits"],
  };
}
