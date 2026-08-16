import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Thin data-access layer for the Beauty Profile quiz (Essenly Phase 1, M2b-2).
//
// Every function is a single Supabase call — no business logic. The logic
// (ownership proof, idempotency, CAS, validation, error mapping) lives in
// app/actions/profile.ts and is unit-tested by mocking this module. This layer
// is verified live (gated on a real service key). Anonymous rows are RLS-locked,
// so all attempt/response/snapshot access takes the ADMIN client; the *owner's*
// identityId is folded into every attempt query so a bare attempt id can never
// be acted on alone (hazard H1).

type DefRow = Database["public"]["Tables"]["quiz_definitions"]["Row"];
type QuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type OptionRow = Database["public"]["Tables"]["quiz_options"]["Row"];
type AttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];
type SnapshotInsert =
  Database["public"]["Tables"]["profile_snapshots"]["Insert"];

type Client = SupabaseClient;

const nowISO = () => new Date().toISOString();

// --- Anonymous identity (admin only) --------------------------------------

/** Upsert the identity by token hash, sliding expiry forward (hazard H16). */
export async function ensureIdentityRow(
  admin: Client,
  tokenHash: string,
  expiresAtISO: string
): Promise<{ id: string; expiresAt: string }> {
  const { data, error } = await admin
    .from("anonymous_identities")
    .upsert(
      {
        token_hash: tokenHash,
        expires_at: expiresAtISO,
        last_seen_at: nowISO(),
      },
      { onConflict: "token_hash" }
    )
    .select("id, expires_at")
    .single();
  if (error || !data) throw error ?? new Error("ensureIdentityRow: no row");
  return { id: data.id, expiresAt: data.expires_at };
}

export async function findIdentityByHash(
  admin: Client,
  tokenHash: string
): Promise<{ id: string; expiresAt: string } | null> {
  const { data, error } = await admin
    .from("anonymous_identities")
    .select("id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, expiresAt: data.expires_at } : null;
}

/** Slide an identity's expiry + last-seen forward on legitimate activity. */
export async function touchIdentityExpiry(
  admin: Client,
  identityId: string,
  expiresAtISO: string
): Promise<void> {
  const { error } = await admin
    .from("anonymous_identities")
    .update({ expires_at: expiresAtISO, last_seen_at: nowISO() })
    .eq("id", identityId);
  if (error) throw error;
}

// --- Quiz definition reads (public content; anon-key client is fine) -------

export async function findActiveDefinitionRow(
  client: Client,
  domain: string
): Promise<DefRow | null> {
  const { data, error } = await client
    .from("quiz_definitions")
    .select("*")
    .eq("quiz_key", domain)
    .eq("status", "active")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as DefRow) ?? null;
}

export async function findDefinitionRowById(
  client: Client,
  id: string
): Promise<DefRow | null> {
  const { data, error } = await client
    .from("quiz_definitions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as DefRow) ?? null;
}

export async function findQuestionRows(
  client: Client,
  definitionId: string
): Promise<QuestionRow[]> {
  const { data, error } = await client
    .from("quiz_questions")
    .select("*")
    .eq("quiz_definition_id", definitionId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data as QuestionRow[]) ?? [];
}

export async function findOptionRows(
  client: Client,
  questionIds: string[]
): Promise<OptionRow[]> {
  if (questionIds.length === 0) return [];
  const { data, error } = await client
    .from("quiz_options")
    .select("*")
    .in("question_id", questionIds)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data as OptionRow[]) ?? [];
}

// --- Attempts (admin only; owner folded into every query) ------------------

export async function findInProgressAttempt(
  admin: Client,
  identityId: string,
  definitionId: string
): Promise<AttemptRow | null> {
  const { data, error } = await admin
    .from("quiz_attempts")
    .select("*")
    .eq("anonymous_identity_id", identityId)
    .eq("quiz_definition_id", definitionId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as AttemptRow) ?? null;
}

export async function findAttemptByIdempotencyKey(
  admin: Client,
  idempotencyKey: string
): Promise<AttemptRow | null> {
  const { data, error } = await admin
    .from("quiz_attempts")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (error) throw error;
  return (data as AttemptRow) ?? null;
}

/**
 * Insert a new attempt. On an idempotency-key unique collision (Postgres 23505),
 * re-select the existing row and return it with created=false — the CALLER must
 * still verify that row's owner (hazard H2).
 */
export async function insertAttempt(
  admin: Client,
  input: {
    definitionId: string;
    identityId: string;
    sourceContext: string;
    idempotencyKey: string;
  }
): Promise<{ attempt: AttemptRow; created: boolean }> {
  const { data, error } = await admin
    .from("quiz_attempts")
    .insert({
      quiz_definition_id: input.definitionId,
      anonymous_identity_id: input.identityId,
      status: "in_progress",
      source_context: input.sourceContext,
      idempotency_key: input.idempotencyKey,
    })
    .select("*")
    .single();
  if (!error && data) return { attempt: data as AttemptRow, created: true };
  if (error && error.code === "23505") {
    const existing = await findAttemptByIdempotencyKey(
      admin,
      input.idempotencyKey
    );
    if (existing) return { attempt: existing, created: false };
  }
  throw error ?? new Error("insertAttempt: no row");
}

export async function findOwnedAttempt(
  admin: Client,
  attemptId: string,
  identityId: string
): Promise<AttemptRow | null> {
  const { data, error } = await admin
    .from("quiz_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("anonymous_identity_id", identityId)
    .maybeSingle();
  if (error) throw error;
  return (data as AttemptRow) ?? null;
}

// KNOWN LIMITATION (low, deferred to M3): the caller proves the attempt is
// in_progress by a prior read, but quiz_responses has no status column so this
// write is not itself guarded — a response could land in an attempt that a
// concurrent completeQuizAttempt just closed (TOCTOU). Benign under placeholder
// scoring (the snapshot is already frozen and unread); when M3 scoring reads
// responses, add a DB trigger rejecting response writes to non-in_progress
// attempts (additive migration, gated apply).
export async function upsertResponse(
  admin: Client,
  attemptId: string,
  questionId: string,
  responseJson: Database["public"]["Tables"]["quiz_responses"]["Insert"]["response_json"]
): Promise<void> {
  const { error } = await admin.from("quiz_responses").upsert(
    {
      quiz_attempt_id: attemptId,
      question_id: questionId,
      response_json: responseJson,
      answered_at: nowISO(),
    },
    { onConflict: "quiz_attempt_id,question_id" }
  );
  if (error) throw error;
}

/** Bump last_saved_at (and optionally current_step); owner + status re-asserted. */
export async function touchAttempt(
  admin: Client,
  attemptId: string,
  identityId: string,
  patch: { currentStep?: number } = {}
): Promise<void> {
  const update: Record<string, unknown> = { last_saved_at: nowISO() };
  if (patch.currentStep !== undefined) update.current_step = patch.currentStep;
  const { error } = await admin
    .from("quiz_attempts")
    .update(update)
    .eq("id", attemptId)
    .eq("anonymous_identity_id", identityId)
    .eq("status", "in_progress");
  if (error) throw error;
}

/**
 * Compare-and-set completion (hazard H9: no multi-statement txn in supabase-js).
 * Only flips in_progress → completed and returns whether THIS call won the race.
 */
export async function casCompleteAttempt(
  admin: Client,
  attemptId: string,
  identityId: string
): Promise<boolean> {
  const { data, error } = await admin
    .from("quiz_attempts")
    .update({ status: "completed", completed_at: nowISO() })
    .eq("id", attemptId)
    .eq("anonymous_identity_id", identityId)
    .eq("status", "in_progress")
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function insertSnapshot(
  admin: Client,
  row: SnapshotInsert
): Promise<{ id: string }> {
  const { data, error } = await admin
    .from("profile_snapshots")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("insertSnapshot: no row");
  return { id: data.id };
}

export async function findSnapshotByAttempt(
  admin: Client,
  attemptId: string
): Promise<{ id: string } | null> {
  const { data, error } = await admin
    .from("profile_snapshots")
    .select("id")
    .eq("quiz_attempt_id", attemptId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id } : null;
}

/** Question ids that already have a response for this attempt (completion check). */
export async function findAnsweredQuestionIds(
  admin: Client,
  attemptId: string
): Promise<string[]> {
  const { data, error } = await admin
    .from("quiz_responses")
    .select("question_id")
    .eq("quiz_attempt_id", attemptId);
  if (error) throw error;
  return (data ?? []).map((r) => r.question_id as string);
}

/** Stored responses for resume hydration (owner already proven by the caller). */
export async function findResponsesByAttempt(
  admin: Client,
  attemptId: string
): Promise<{ questionId: string; responseJson: unknown }[]> {
  const { data, error } = await admin
    .from("quiz_responses")
    .select("question_id, response_json")
    .eq("quiz_attempt_id", attemptId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    questionId: r.question_id as string,
    responseJson: r.response_json as unknown,
  }));
}

/**
 * A snapshot, only if this identity owns it. Ownership is never taken from the
 * URL: the id is a lookup key, not a capability (docs/adr/0001).
 */
export async function findOwnedSnapshot(
  admin: Client,
  snapshotId: string,
  identityId: string
): Promise<{
  profile_code: string;
  profile_domain: string;
  traits_json: unknown;
  summary_json: unknown;
  confidence_json: unknown;
} | null> {
  const { data, error } = await admin
    .from("profile_snapshots")
    .select(
      "profile_code, profile_domain, traits_json, summary_json, confidence_json"
    )
    .eq("id", snapshotId)
    .eq("anonymous_identity_id", identityId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}
