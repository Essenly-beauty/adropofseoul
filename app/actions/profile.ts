"use server";

// Anonymous, server-authoritative persistence for the Beauty Profile quiz
// (Essenly Phase 1, M2b-2). Logical contract: docs/07 §2. Threat model:
// docs/adr/0001. Every guard here maps to a hazard from the M2b-2 design pass.
//
// Cross-cutting invariants (never weaken):
//  * Ownership of an anonymous attempt is proven ONLY by hashing the ados_anon
//    cookie and matching anonymous_identities — never a client-supplied id (H1/H3).
//  * Anonymous rows are RLS-locked, so writes go through the service-role admin
//    client; we fail closed when no real key is configured (H17).
//  * The feature flag is re-checked here because server actions are independent
//    endpoints — a page notFound() does not protect them (H4).
//  * Responses store the canonical value_code, not the display option_key (H11).
//  * A completed attempt is immutable; completion is a compare-and-set (H5/H9).

import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ensureAnonToken,
  readAnonToken,
  hashToken,
  ANON_TTL_MS,
} from "@/lib/profile/anon-identity";
import {
  isProfileDomain,
  validateResponse,
  type ProfileDomainValue,
} from "@/lib/profile/validation";
import { isFlagEnabled, type ProfileFlag } from "@/lib/profile/flags";
import { normalizeSourceContext } from "@/lib/profile/source-context";
import { durationBucketFromMs } from "@/lib/analytics/duration";
import { buildHairSnapshot, readHairSnapshot } from "@/lib/haircare/snapshot";
import type { HairResultExplanation } from "@/lib/haircare/explain";
import { buildSkinSnapshot, readSkinSnapshot } from "@/lib/skincare/snapshot";
import type { SkinProfileV1Result } from "@/lib/skincare/profile-v1";
import {
  mapQuizDefinition,
  hydrateResponses,
  type LoadedQuizDefinition,
} from "@/lib/profile/quiz-mapper";
import type { QuizDefinition } from "@/lib/profile/quiz-definition";
import {
  fail,
  ok,
  type ActionResult,
  type ProfileErrorCode,
} from "@/lib/profile/errors";
import type { Json, Database } from "@/types/database.types";
import * as repo from "@/lib/profile/quiz-repo";

type AttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_IDEMPOTENCY_KEY = 200;

// The client may pass an idempotency key on save/complete (docs/07 §2). Its
// idempotency is provided structurally (upsert / CAS + one-snapshot-per-attempt),
// so we don't persist it — but we still reject a malformed one (docs/07 §5).
function badOptionalIdempotencyKey(key: unknown): boolean {
  return (
    key !== undefined &&
    (typeof key !== "string" ||
      key.length === 0 ||
      key.length > MAX_IDEMPOTENCY_KEY)
  );
}

function quizFlagForDomain(domain: ProfileDomainValue): ProfileFlag {
  return domain === "hair" ? "hair_profile" : "skin_profile";
}

/**
 * Leave a server-side breadcrumb when persistence is unavailable, then fail as
 * usual. The quiz falls back to client-only scoring in this case, which is
 * invisible to the user *and*, until this existed, invisible to the operator —
 * a missing env var and a flag that's off produced identical silence.
 *
 * Codes only: never an answer, a token, or a row id. Server logs are not
 * returned to the client, but they are still not a place for user data.
 */
function logUnavailable(
  action: string,
  code: Extract<ProfileErrorCode, "FEATURE_DISABLED" | "INTERNAL_ERROR">
) {
  console.warn(`[profile] ${action}: persistence unavailable (${code})`);
  return fail(code);
}

function safePersistenceError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 240);
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const code = typeof record.code === "string" ? record.code : "no-code";
    const message =
      typeof record.message === "string" ? record.message : "no-message";
    return `${code}: ${message}`.slice(0, 240);
  }
  return "unknown";
}

function expiryISO(): string {
  return new Date(Date.now() + ANON_TTL_MS).toISOString();
}

function isExpired(expiresAtISO: string): boolean {
  const t = Date.parse(expiresAtISO);
  return Number.isFinite(t) && t < Date.now();
}

function resumeAgeBucket(lastSavedISO: string): string {
  const delta = Date.now() - Date.parse(lastSavedISO);
  if (!Number.isFinite(delta) || delta < 0) return "under_1h";
  const h = delta / 3_600_000;
  if (h < 1) return "under_1h";
  if (h < 24) return "1_24h";
  if (h < 24 * 7) return "1_7d";
  return "over_7d";
}

function durationBucket(startISO: string): string {
  return durationBucketFromMs(Date.now() - Date.parse(startISO));
}

/** Load the stamped definition (bypasses RLS so retired/draft is visible). */
async function loadDefinitionIndex(
  admin: ReturnType<typeof createAdminClient>,
  definitionId: string
): Promise<LoadedQuizDefinition | null> {
  const def = await repo.findDefinitionRowById(admin, definitionId);
  if (!def) return null;
  const questions = await repo.findQuestionRows(admin, definitionId);
  const options = await repo.findOptionRows(
    admin,
    questions.map((q) => q.id)
  );
  return mapQuizDefinition(def, questions, options);
}

/** Resolve the caller's existing anonymous identity from the cookie (read-only). */
async function resolveIdentity(
  admin: ReturnType<typeof createAdminClient>
): Promise<{ id: string; expiresAt: string } | null> {
  const token = await readAnonToken();
  if (!token) return null;
  return repo.findIdentityByHash(admin, hashToken(token));
}

// Map a validated, option-key-based response to the canonical value_code(s) we
// persist. Selects store value_code; scale stores the number; text stores text.
function toCanonicalResponse(
  question: LoadedQuizDefinition["questionByKey"][string],
  response: unknown
): Json {
  if (question.type === "single_select") {
    return question.optionKeyToValue[response as string];
  }
  if (question.type === "multi_select") {
    return (response as string[]).map((k) => question.optionKeyToValue[k]);
  }
  if (question.type === "scale") return response as number;
  return response as string; // text
}

/**
 * Score the stored responses and persist the result, exactly once per attempt.
 *
 * The result is derived from `quiz_responses` — never from anything the client
 * sent with the completion call.
 *
 * Callers invoke this on the CAS winner, the CAS loser, and the already-completed
 * replay path, and it recovers on the unique violation (23505), so a completion
 * that flipped the status but lost the snapshot write is repaired rather than
 * bricking the attempt (H5; finding: CAS-before-insert brick).
 *
 * Snapshot scoring dispatches from the attempt's stamped quiz domain, so the
 * client cannot choose a scorer or profile domain.
 */
async function ensureProfileSnapshot(
  admin: ReturnType<typeof createAdminClient>,
  attemptId: string,
  identityId: string,
  loaded: LoadedQuizDefinition
): Promise<{ id: string; inserted: boolean }> {
  const stored = await repo.findResponsesByAttempt(admin, attemptId);
  const responses = hydrateResponses(loaded, stored);
  const fields =
    loaded.quizKey === "hair"
      ? buildHairSnapshot(responses)
      : buildSkinSnapshot(responses);
  try {
    const snap = await repo.insertSnapshot(admin, {
      quiz_attempt_id: attemptId,
      anonymous_identity_id: identityId,
      user_id: null,
      profile_domain: loaded.quizKey,
      ...fields,
    });
    return { id: snap.id, inserted: true };
  } catch (e) {
    if ((e as { code?: string })?.code === "23505") {
      const existing = await repo.findSnapshotByAttempt(admin, attemptId);
      if (existing) return { id: existing.id, inserted: false };
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// getActiveQuizDefinition — public content, read-only (anon-key client).
// ---------------------------------------------------------------------------
export async function getActiveQuizDefinition(
  domain: string
): Promise<ActionResult<{ definition: QuizDefinition }>> {
  if (!isProfileDomain(domain)) return fail("VALIDATION_FAILED");
  if (!isFlagEnabled(quizFlagForDomain(domain)))
    return fail("FEATURE_DISABLED");
  try {
    const client = await createClient();
    const def = await repo.findActiveDefinitionRow(client, domain);
    if (!def) return fail("QUIZ_VERSION_RETIRED");
    const questions = await repo.findQuestionRows(client, def.id);
    const options = await repo.findOptionRows(
      client,
      questions.map((q) => q.id)
    );
    const loaded = mapQuizDefinition(def, questions, options);
    return ok({ definition: loaded.definition });
  } catch {
    return fail("INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// startQuizAttempt — ensure identity, resume-first, else create (idempotent).
// ---------------------------------------------------------------------------
export async function startQuizAttempt(
  domain: string,
  sourceContext: string | null,
  idempotencyKey: string
): Promise<
  ActionResult<{
    attemptId: string;
    quizVersion: number;
    status: string;
    created: boolean;
    resumeAgeBucket?: string;
  }>
> {
  if (!isProfileDomain(domain)) return fail("VALIDATION_FAILED");
  if (!isFlagEnabled(quizFlagForDomain(domain)))
    return logUnavailable("startQuizAttempt", "FEATURE_DISABLED");
  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length === 0 ||
    idempotencyKey.length > MAX_IDEMPOTENCY_KEY
  ) {
    return fail("VALIDATION_FAILED");
  }
  if (!hasServiceRoleKey())
    return logUnavailable("startQuizAttempt", "INTERNAL_ERROR");

  const source = normalizeSourceContext(sourceContext);
  try {
    const admin = createAdminClient();
    // ensureAnonToken writes the cookie → must run in a Server Action (this is one).
    const { tokenHash } = await ensureAnonToken();
    const identity = await repo.ensureIdentityRow(
      admin,
      tokenHash,
      expiryISO()
    );

    const def = await repo.findActiveDefinitionRow(admin, domain);
    if (!def) return fail("QUIZ_VERSION_RETIRED");

    // Resume-first: a live attempt for this identity+definition wins (H8).
    const existing = await repo.findInProgressAttempt(
      admin,
      identity.id,
      def.id
    );
    if (existing) {
      return ok({
        attemptId: existing.id,
        quizVersion: def.version,
        status: existing.status,
        created: false,
        resumeAgeBucket: resumeAgeBucket(existing.last_saved_at),
      });
    }

    // Namespace the idempotency key by owner so a foreign key can never collide
    // with, or return, another identity's attempt (H2).
    const namespacedKey = hashToken(`${identity.id}:${idempotencyKey}`);
    const { attempt, created } = await repo.insertAttempt(admin, {
      definitionId: def.id,
      identityId: identity.id,
      sourceContext: source,
      idempotencyKey: namespacedKey,
    });
    // Defense in depth: never hand back a row that isn't ours (H2).
    if (attempt.anonymous_identity_id !== identity.id) {
      return fail("VALIDATION_FAILED");
    }
    return ok({
      attemptId: attempt.id,
      quizVersion: def.version,
      status: attempt.status,
      created,
      resumeAgeBucket: created
        ? undefined
        : resumeAgeBucket(attempt.last_saved_at),
    });
  } catch (e) {
    // The client silently falls back from here, so the reason has to land
    // somewhere. Code/message only — no stack, no row ids, no answers.
    console.error(
      `[profile] startQuizAttempt threw: ${safePersistenceError(e)}`
    );
    return fail("INTERNAL_ERROR");
  }
}

// Shared ownership resolution for attempt-scoped ops. Returns the owned,
// non-expired, in-progress-eligible attempt or a controlled error.
async function loadOwnedInProgress(
  admin: ReturnType<typeof createAdminClient>,
  attemptId: string,
  identity: { id: string; expiresAt: string }
): Promise<
  { ok: true; attempt: AttemptRow } | { ok: false; error: ProfileErrorCode }
> {
  const attempt = await repo.findOwnedAttempt(admin, attemptId, identity.id);
  if (!attempt) return { ok: false, error: "ATTEMPT_NOT_FOUND" };
  // An attempt linked to a user is not reachable through the anonymous path (H1).
  if (attempt.user_id !== null) return { ok: false, error: "FORBIDDEN" };
  if (attempt.status === "completed")
    return { ok: false, error: "ATTEMPT_ALREADY_COMPLETED" };
  if (attempt.status !== "in_progress")
    return { ok: false, error: "VALIDATION_FAILED" };
  return { ok: true, attempt };
}

// ---------------------------------------------------------------------------
// saveQuizResponse — validate against the STAMPED version, store canonical value.
// ---------------------------------------------------------------------------
export async function saveQuizResponse(
  attemptId: string,
  questionKey: string,
  response: unknown,
  idempotencyKey?: string
): Promise<ActionResult<{ questionKey: string; status: string }>> {
  if (!isFlagEnabled("hair_profile") && !isFlagEnabled("skin_profile"))
    return fail("FEATURE_DISABLED");
  if (typeof attemptId !== "string" || !UUID_RE.test(attemptId))
    return fail("VALIDATION_FAILED");
  if (typeof questionKey !== "string" || questionKey.length === 0)
    return fail("VALIDATION_FAILED");
  if (badOptionalIdempotencyKey(idempotencyKey))
    return fail("VALIDATION_FAILED");
  if (!hasServiceRoleKey()) return fail("INTERNAL_ERROR");

  try {
    const admin = createAdminClient();
    const identity = await resolveIdentity(admin);
    if (!identity) return fail("FORBIDDEN"); // no cookie/identity → can't own anything
    if (isExpired(identity.expiresAt)) return fail("ATTEMPT_EXPIRED");

    const owned = await loadOwnedInProgress(admin, attemptId, identity);
    if (!owned.ok) return fail(owned.error);
    const attempt = owned.attempt;

    const loaded = await loadDefinitionIndex(admin, attempt.quiz_definition_id);
    if (!loaded) return fail("INTERNAL_ERROR");
    if (!isFlagEnabled(quizFlagForDomain(loaded.quizKey)))
      return fail("FEATURE_DISABLED");
    if (loaded.status === "retired") return fail("QUIZ_VERSION_RETIRED");

    // Resolve the question WITHIN the stamped definition (H6) — never trust the
    // key across versions, never load "all option keys".
    const question = loaded.questionByKey[questionKey];
    if (!question || question.type === "info") return fail("INVALID_QUESTION");

    const check = validateResponse(
      question.type,
      response,
      question.optionKeys
    );
    if (!check.ok) {
      return fail(
        check.error === "INVALID_QUESTION"
          ? "INVALID_QUESTION"
          : "INVALID_RESPONSE"
      );
    }
    // validateResponse accepts any finite number for scale; enforce the
    // question's declared integer bounds (gap in the shared validator).
    if (question.type === "scale") {
      const n = response as number;
      const { min, max } = question.scale ?? {
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      };
      if (!Number.isInteger(n) || n < min || n > max)
        return fail("INVALID_RESPONSE");
    }
    // validateResponse accepts an empty [] for multi_select and "" for text, and
    // completion's required check is presence-only — so a required question could
    // be "answered" with nothing. Reject that server-side.
    if (
      question.isRequired &&
      ((question.type === "multi_select" &&
        Array.isArray(response) &&
        response.length === 0) ||
        (question.type === "text" &&
          typeof response === "string" &&
          response.trim().length === 0))
    ) {
      return fail("INVALID_RESPONSE");
    }

    const canonical = toCanonicalResponse(question, response);
    await repo.upsertResponse(admin, attemptId, question.id, canonical);
    await repo.touchAttempt(admin, attemptId, identity.id);
    await repo.touchIdentityExpiry(admin, identity.id, expiryISO());
    return ok({ questionKey, status: "in_progress" });
  } catch {
    return fail("INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// updateQuizProgress — bounded step only.
// ---------------------------------------------------------------------------
export async function updateQuizProgress(
  attemptId: string,
  currentStep: number
): Promise<ActionResult<{ currentStep: number }>> {
  if (!isFlagEnabled("hair_profile") && !isFlagEnabled("skin_profile"))
    return fail("FEATURE_DISABLED");
  if (typeof attemptId !== "string" || !UUID_RE.test(attemptId))
    return fail("VALIDATION_FAILED");
  if (typeof currentStep !== "number" || !Number.isInteger(currentStep))
    return fail("VALIDATION_FAILED");
  if (!hasServiceRoleKey()) return fail("INTERNAL_ERROR");

  try {
    const admin = createAdminClient();
    const identity = await resolveIdentity(admin);
    if (!identity) return fail("FORBIDDEN");
    if (isExpired(identity.expiresAt)) return fail("ATTEMPT_EXPIRED");

    const owned = await loadOwnedInProgress(admin, attemptId, identity);
    if (!owned.ok) return fail(owned.error);
    const attempt = owned.attempt;

    const loaded = await loadDefinitionIndex(admin, attempt.quiz_definition_id);
    if (!loaded) return fail("INTERNAL_ERROR");
    if (!isFlagEnabled(quizFlagForDomain(loaded.quizKey)))
      return fail("FEATURE_DISABLED");
    const total = loaded.definition.questions.length;
    if (currentStep < 0 || currentStep > total)
      return fail("VALIDATION_FAILED");

    await repo.touchAttempt(admin, attemptId, identity.id, { currentStep });
    await repo.touchIdentityExpiry(admin, identity.id, expiryISO());
    return ok({ currentStep });
  } catch {
    return fail("INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// completeQuizAttempt — required check, CAS, one deterministic snapshot.
// ---------------------------------------------------------------------------
export async function completeQuizAttempt(
  attemptId: string,
  idempotencyKey?: string
): Promise<
  ActionResult<{
    resultId: string;
    status: string;
    firstCompletion: boolean;
    durationBucket?: string;
  }>
> {
  if (!isFlagEnabled("hair_profile") && !isFlagEnabled("skin_profile"))
    return fail("FEATURE_DISABLED");
  if (typeof attemptId !== "string" || !UUID_RE.test(attemptId))
    return fail("VALIDATION_FAILED");
  if (badOptionalIdempotencyKey(idempotencyKey))
    return fail("VALIDATION_FAILED");
  if (!hasServiceRoleKey()) return fail("INTERNAL_ERROR");

  try {
    const admin = createAdminClient();
    const identity = await resolveIdentity(admin);
    if (!identity) return fail("FORBIDDEN");
    if (isExpired(identity.expiresAt)) return fail("ATTEMPT_EXPIRED");

    const attempt = await repo.findOwnedAttempt(admin, attemptId, identity.id);
    if (!attempt) return fail("ATTEMPT_NOT_FOUND");
    if (attempt.user_id !== null) return fail("FORBIDDEN");

    // The stamped definition is needed both for the required-response check and
    // to know the profile_domain for the snapshot (also on the recovery paths).
    const loaded = await loadDefinitionIndex(admin, attempt.quiz_definition_id);
    if (!loaded) return fail("INTERNAL_ERROR");
    if (!isFlagEnabled(quizFlagForDomain(loaded.quizKey)))
      return fail("FEATURE_DISABLED");

    // Idempotent replay: already completed → return the same snapshot (H5). If a
    // prior completion flipped the status but failed to write the snapshot, we
    // recover here by (re)creating it rather than bricking the attempt.
    if (attempt.status === "completed") {
      const snap = await repo.findSnapshotByAttempt(admin, attemptId);
      const id =
        snap?.id ??
        (await ensureProfileSnapshot(admin, attemptId, identity.id, loaded)).id;
      return ok({
        resultId: id,
        status: "completed",
        firstCompletion: false,
        durationBucket: durationBucket(attempt.started_at),
      });
    }
    if (attempt.status !== "in_progress") return fail("VALIDATION_FAILED");
    if (loaded.status === "retired") return fail("QUIZ_VERSION_RETIRED");

    // Every required, answerable question must have a response.
    const answered = new Set(
      await repo.findAnsweredQuestionIds(admin, attemptId)
    );
    const requiredIds = loaded.requiredAnswerableKeys.map(
      (k) => loaded.questionByKey[k].id
    );
    if (!requiredIds.every((id) => answered.has(id)))
      return fail("MISSING_REQUIRED_RESPONSE");

    // Compare-and-set the status first so no further responses can be saved (H9).
    const won = await repo.casCompleteAttempt(admin, attemptId, identity.id);
    // Whether we won or a concurrent completer did, ensure exactly one snapshot
    // exists (the unique backstop makes this safe) and return it. firstCompletion
    // is true only for the writer that actually created the snapshot.
    const ensured = await ensureProfileSnapshot(
      admin,
      attemptId,
      identity.id,
      loaded
    );
    await repo.touchIdentityExpiry(admin, identity.id, expiryISO());
    return ok({
      resultId: ensured.id,
      status: "completed",
      firstCompletion: won && ensured.inserted,
      durationBucket: durationBucket(attempt.started_at),
    });
  } catch {
    return fail("INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// getQuizAttempt — owner-scoped resume hydration (server is the authority, H12).
// ---------------------------------------------------------------------------
export async function getQuizAttempt(attemptId: string): Promise<
  ActionResult<{
    definition: QuizDefinition;
    attemptId: string;
    status: string;
    currentStep: number | null;
    initialResponses: Record<string, string | string[] | number>;
  }>
> {
  if (!isFlagEnabled("hair_profile") && !isFlagEnabled("skin_profile"))
    return fail("FEATURE_DISABLED");
  if (typeof attemptId !== "string" || !UUID_RE.test(attemptId))
    return fail("VALIDATION_FAILED");
  if (!hasServiceRoleKey()) return fail("INTERNAL_ERROR");

  try {
    const admin = createAdminClient();
    const identity = await resolveIdentity(admin);
    if (!identity) return fail("FORBIDDEN");
    if (isExpired(identity.expiresAt)) return fail("ATTEMPT_EXPIRED");

    const attempt = await repo.findOwnedAttempt(admin, attemptId, identity.id);
    if (!attempt) return fail("ATTEMPT_NOT_FOUND");
    if (attempt.user_id !== null) return fail("FORBIDDEN");

    const loaded = await loadDefinitionIndex(admin, attempt.quiz_definition_id);
    if (!loaded) return fail("INTERNAL_ERROR");
    if (!isFlagEnabled(quizFlagForDomain(loaded.quizKey)))
      return fail("FEATURE_DISABLED");
    if (loaded.status === "retired") return fail("QUIZ_VERSION_RETIRED");

    // Rehydrate stored canonical value_codes back into option keys the renderer
    // uses (owner already proven; never read client storage for this).
    const stored = await repo.findResponsesByAttempt(admin, attemptId);
    const initialResponses = hydrateResponses(loaded, stored);

    return ok({
      definition: loaded.definition,
      attemptId,
      status: attempt.status,
      currentStep: attempt.current_step,
      initialResponses,
    });
  } catch {
    return fail("INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// getProfileSnapshot — owner-scoped durable result.
// ---------------------------------------------------------------------------
// Deliberately NOT flag-gated: a result already written must stay readable even
// if the persistence flag is later switched off.
export async function getProfileSnapshot(snapshotId: string): Promise<
  ActionResult<{
    profileSlug: string | null;
    explanation: HairResultExplanation;
  }>
> {
  if (typeof snapshotId !== "string" || !UUID_RE.test(snapshotId))
    return fail("VALIDATION_FAILED");
  if (!hasServiceRoleKey()) return fail("INTERNAL_ERROR");

  try {
    const admin = createAdminClient();
    const identity = await resolveIdentity(admin);
    // No identity, not owned, and not found all answer the same way: a probing
    // client must not learn that an id exists (docs/adr/0001).
    if (!identity) return fail("SNAPSHOT_NOT_FOUND");

    const row = await repo.findOwnedSnapshot(admin, snapshotId, identity.id);
    if (!row) return fail("SNAPSHOT_NOT_FOUND");
    if (row.profile_domain !== "hair") return fail("SNAPSHOT_NOT_FOUND");

    const { profileSlug, explanation } = readHairSnapshot({
      profile_code: row.profile_code,
      traits_json: row.traits_json as Json,
      summary_json: row.summary_json as Json,
      confidence_json: row.confidence_json as Json,
    });
    return ok({ profileSlug, explanation });
  } catch {
    return fail("INTERNAL_ERROR");
  }
}

export async function getSkinProfileSnapshot(
  snapshotId: string
): Promise<ActionResult<{ profile: SkinProfileV1Result | null }>> {
  if (typeof snapshotId !== "string" || !UUID_RE.test(snapshotId))
    return fail("VALIDATION_FAILED");
  if (!hasServiceRoleKey()) return fail("INTERNAL_ERROR");
  try {
    const admin = createAdminClient();
    const identity = await resolveIdentity(admin);
    if (!identity) return fail("SNAPSHOT_NOT_FOUND");
    const row = await repo.findOwnedSnapshot(admin, snapshotId, identity.id);
    if (!row || row.profile_domain !== "skin")
      return fail("SNAPSHOT_NOT_FOUND");
    return ok({
      profile: readSkinSnapshot({
        profile_code: row.profile_code,
        traits_json: row.traits_json as Json,
        goals_json: row.goals_json as Json,
        preferences_json: row.preferences_json as Json,
        summary_json: row.summary_json as Json,
      }),
    });
  } catch {
    return fail("INTERNAL_ERROR");
  }
}
