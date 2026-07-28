// Controlled, machine-readable error codes for the Beauty Profile server
// contract (docs/07 §3). Returned to the client as stable tokens; user-facing
// copy is mapped separately in the UI. Never leak internal detail (row ids,
// SQL, raw answers) through these.

export const PROFILE_ERROR_CODES = [
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "ATTEMPT_NOT_FOUND",
  "ATTEMPT_EXPIRED",
  "ATTEMPT_ALREADY_COMPLETED",
  "QUIZ_VERSION_RETIRED",
  "INVALID_QUESTION",
  "INVALID_RESPONSE",
  "MISSING_REQUIRED_RESPONSE",
  "IDENTITY_LINK_CONFLICT",
  "IDENTITY_LINK_RETRYABLE",
  "FEATURE_DISABLED",
  "RATE_LIMITED",
  "VALIDATION_FAILED",
  "INTERNAL_ERROR",
] as const;

export type ProfileErrorCode = (typeof PROFILE_ERROR_CODES)[number];

/** Discriminated result any profile action returns. */
export type ActionResult<T> =
  ({ ok: true } & T) | { ok: false; error: ProfileErrorCode };

/** Build a failure result. */
export function fail(error: ProfileErrorCode): {
  ok: false;
  error: ProfileErrorCode;
} {
  return { ok: false, error };
}

/** Build a success result. */
export function ok<T extends object>(value: T): { ok: true } & T {
  return { ok: true, ...value };
}
