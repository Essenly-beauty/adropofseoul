// Typed Beauty Profile quiz funnel events (docs/06 §3). Thin wrappers over
// track() so call sites can't misname an event or attach a raw answer: every
// property here is controlled taxonomy — the domain, the version, the question
// KEY (never its answer), integer indices/counts, and server-computed buckets.
//
// The provider is registered client-side (PostHog, later); until then track()
// is a safe no-op. Never call these with a value_code, label, free text, or the
// anon token/hash — assertSafeProps in ./index also blocks those keys (H13).

import { track } from "./index";

export type ProfileDomain = "skin" | "hair";
export type AuthState = "anonymous" | "authenticated";

type QuizBase = {
  domain: ProfileDomain;
  quizVersion: number;
};

/** Fired once when a NEW attempt is created (never on the resume branch). */
export function profileQuizStarted(
  p: QuizBase & { entrySource: string; authState?: AuthState }
): void {
  track("profile_quiz_started", {
    profile_domain: p.domain,
    quiz_version: p.quizVersion,
    entry_source: p.entrySource,
    auth_state: p.authState ?? "anonymous",
  });
}

/** Fired on mount of the first/resumed step and every step transition. */
export function profileQuizStepViewed(
  p: QuizBase & { stepKey: string; stepIndex: number }
): void {
  track("profile_quiz_step_viewed", {
    profile_domain: p.domain,
    quiz_version: p.quizVersion,
    step_key: p.stepKey,
    step_index: p.stepIndex,
  });
}

/** Fired after a step's answer is successfully saved. */
export function profileQuizStepCompleted(
  p: QuizBase & {
    stepKey: string;
    stepIndex: number;
    validationErrorCount: number;
  }
): void {
  track("profile_quiz_step_completed", {
    profile_domain: p.domain,
    quiz_version: p.quizVersion,
    step_key: p.stepKey,
    step_index: p.stepIndex,
    validation_error_count: p.validationErrorCount,
  });
}

/** Fired once when the quiz mounts against a pre-existing in-progress attempt. */
export function profileQuizResumed(
  p: QuizBase & { resumeAgeBucket: string; authState?: AuthState }
): void {
  track("profile_quiz_resumed", {
    profile_domain: p.domain,
    quiz_version: p.quizVersion,
    resume_age_bucket: p.resumeAgeBucket,
    auth_state: p.authState ?? "anonymous",
  });
}

/** Fired once when completion succeeds for the FIRST time (not on replay). */
export function profileQuizCompleted(
  p: QuizBase & { durationBucket: string; authState?: AuthState }
): void {
  track("profile_quiz_completed", {
    profile_domain: p.domain,
    quiz_version: p.quizVersion,
    duration_bucket: p.durationBucket,
    auth_state: p.authState ?? "anonymous",
  });
}
