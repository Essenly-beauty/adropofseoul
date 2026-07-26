// Runtime validators for the Beauty Profile data model (Essenly Phase 1).
//
// TypeScript types are not trusted at the boundary (docs/01 §3, docs/07 §5):
// every value that reaches a mutation is validated here against the canonical
// enums and per-question-type response shapes. Keep this dependency-free and in
// the plain style of lib/validation.ts.

export const PROFILE_DOMAINS = ["skin", "hair"] as const;
export type ProfileDomainValue = (typeof PROFILE_DOMAINS)[number];

export const QUESTION_TYPES = [
  "single_select",
  "multi_select",
  "scale",
  "text",
  "info",
] as const;
export type QuestionTypeValue = (typeof QUESTION_TYPES)[number];

export const ATTEMPT_STATUSES = [
  "in_progress",
  "completed",
  "abandoned",
  "invalidated",
] as const;

export const CONSENT_TYPES = ["terms", "privacy", "marketing"] as const;

export function isProfileDomain(v: unknown): v is ProfileDomainValue {
  return (
    typeof v === "string" && (PROFILE_DOMAINS as readonly string[]).includes(v)
  );
}

export function isQuestionType(v: unknown): v is QuestionTypeValue {
  return (
    typeof v === "string" && (QUESTION_TYPES as readonly string[]).includes(v)
  );
}

export function isConsentType(v: unknown): boolean {
  return (
    typeof v === "string" && (CONSENT_TYPES as readonly string[]).includes(v)
  );
}

// Guardrails for free text so a response can never bloat storage or logs.
export const MAX_TEXT_LENGTH = 500;
export const MAX_MULTI_SELECT = 24;

/**
 * Validate a quiz response against its question type and the option keys the
 * question actually allows. `allowedOptionKeys` is the canonical set from the
 * quiz definition; an empty set is treated as "no option constraint" (text/scale).
 * Returns a discriminated result so callers can map to a controlled error code.
 */
export function validateResponse(
  questionType: string,
  response: unknown,
  allowedOptionKeys: readonly string[] = []
): { ok: true } | { ok: false; error: string } {
  const allowed = new Set(allowedOptionKeys);
  const optionAllowed = (k: unknown) => typeof k === "string" && allowed.has(k);

  switch (questionType) {
    case "single_select": {
      // A select question with no options is malformed — deny rather than
      // silently accept any string.
      if (allowed.size === 0) return { ok: false, error: "INVALID_QUESTION" };
      if (!optionAllowed(response))
        return { ok: false, error: "INVALID_RESPONSE" };
      return { ok: true };
    }
    case "multi_select": {
      if (allowed.size === 0) return { ok: false, error: "INVALID_QUESTION" };
      if (!Array.isArray(response))
        return { ok: false, error: "INVALID_RESPONSE" };
      if (response.length > MAX_MULTI_SELECT)
        return { ok: false, error: "INVALID_RESPONSE" };
      if (!response.every(optionAllowed))
        return { ok: false, error: "INVALID_RESPONSE" };
      if (new Set(response).size !== response.length)
        return { ok: false, error: "INVALID_RESPONSE" };
      return { ok: true };
    }
    case "scale": {
      if (typeof response !== "number" || !Number.isFinite(response))
        return { ok: false, error: "INVALID_RESPONSE" };
      return { ok: true };
    }
    case "text": {
      if (typeof response !== "string")
        return { ok: false, error: "INVALID_RESPONSE" };
      if (response.length > MAX_TEXT_LENGTH)
        return { ok: false, error: "INVALID_RESPONSE" };
      return { ok: true };
    }
    case "info": {
      // Informational steps carry no answer.
      return { ok: true };
    }
    default:
      return { ok: false, error: "INVALID_QUESTION" };
  }
}
