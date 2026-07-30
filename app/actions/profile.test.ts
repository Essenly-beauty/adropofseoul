import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Database } from "@/types/database.types";
import { hashToken as realHashToken } from "@/lib/profile/anon-token";
import { HAIR_QUIZ } from "@/lib/haircare/quiz";

// --- Mocks (real modules never load: sidesteps server-only + next/headers) ---

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
  hasServiceRoleKey: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/lib/profile/anon-identity", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/profile/anon-token")
  >("@/lib/profile/anon-token");
  return {
    hashToken: actual.hashToken,
    ANON_TTL_MS: actual.ANON_TTL_MS,
    ensureAnonToken: vi.fn(),
    readAnonToken: vi.fn(),
  };
});

vi.mock("@/lib/profile/quiz-repo", () => ({
  ensureIdentityRow: vi.fn(),
  findIdentityByHash: vi.fn(),
  touchIdentityExpiry: vi.fn(async () => {}),
  findActiveDefinitionRow: vi.fn(),
  findDefinitionRowById: vi.fn(),
  findQuestionRows: vi.fn(),
  findOptionRows: vi.fn(),
  findInProgressAttempt: vi.fn(),
  findAttemptByIdempotencyKey: vi.fn(),
  insertAttempt: vi.fn(),
  findOwnedAttempt: vi.fn(),
  upsertResponse: vi.fn(async () => {}),
  touchAttempt: vi.fn(async () => {}),
  casCompleteAttempt: vi.fn(),
  insertSnapshot: vi.fn(),
  findSnapshotByAttempt: vi.fn(),
  findAnsweredQuestionIds: vi.fn(),
  findResponsesByAttempt: vi.fn(),
}));

import * as admin from "@/lib/supabase/admin";
import * as anon from "@/lib/profile/anon-identity";
import * as repo from "@/lib/profile/quiz-repo";
import {
  getActiveQuizDefinition,
  startQuizAttempt,
  saveQuizResponse,
  updateQuizProgress,
  completeQuizAttempt,
  getQuizAttempt,
} from "./profile";

// --- Fixtures (mirror the placeholder hair quiz) ---------------------------

const ATTEMPT_ID = "11111111-1111-4111-8111-111111111111";
const IDENTITY = {
  id: "id-1",
  expiresAt: new Date(Date.now() + 1_000_000).toISOString(),
};

type DefRow = Database["public"]["Tables"]["quiz_definitions"]["Row"];
type QuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type OptionRow = Database["public"]["Tables"]["quiz_options"]["Row"];
type AttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];

const DEF: DefRow = {
  id: "def-1",
  quiz_key: "hair",
  version: 0,
  status: "active",
  locale_strategy: "single",
  title_key: "Hair Profile",
  description_key: null,
  published_at: null,
  retired_at: null,
  created_at: "2026-07-27T00:00:00Z",
  updated_at: "2026-07-27T00:00:00Z",
};

const baseQ = (over: Partial<QuestionRow>): QuestionRow => ({
  id: "q",
  quiz_definition_id: "def-1",
  question_key: "k",
  question_type: "single_select",
  section_key: null,
  position: 0,
  is_required: true,
  allows_multiple: false,
  validation_json: null,
  display_logic_json: null,
  content_key: null,
  help_text_key: null,
  created_at: "2026-07-27T00:00:00Z",
  updated_at: "2026-07-27T00:00:00Z",
  ...over,
});

const QUESTIONS: QuestionRow[] = [
  baseQ({
    id: "q-intro",
    question_key: "intro",
    question_type: "info",
    position: 0,
    is_required: false,
  }),
  baseQ({ id: "q-wash", question_key: "wash_frequency", position: 1 }),
  baseQ({
    id: "q-concerns",
    question_key: "concerns",
    question_type: "multi_select",
    allows_multiple: true,
    position: 2,
  }),
  baseQ({
    id: "q-heat",
    question_key: "heat",
    question_type: "scale",
    position: 3,
    validation_json: { min: 0, max: 5 },
  }),
  baseQ({ id: "q-goal", question_key: "goal", position: 4 }),
];

const baseO = (over: Partial<OptionRow>): OptionRow => ({
  id: "o",
  question_id: "q",
  option_key: "k",
  position: 0,
  content_key: null,
  value_code: "v",
  metadata_json: null,
  created_at: "2026-07-27T00:00:00Z",
  updated_at: "2026-07-27T00:00:00Z",
  ...over,
});

const OPTIONS: OptionRow[] = [
  baseO({
    id: "o-daily",
    question_id: "q-wash",
    option_key: "daily",
    value_code: "daily",
    position: 0,
  }),
  baseO({
    id: "o-alt",
    question_id: "q-wash",
    option_key: "alt",
    value_code: "every_other_day",
    position: 1,
  }),
  baseO({
    id: "o-frizz",
    question_id: "q-concerns",
    option_key: "frizz",
    value_code: "frizz",
    position: 0,
  }),
  baseO({
    id: "o-flat",
    question_id: "q-concerns",
    option_key: "flat",
    value_code: "lacks_volume",
    position: 1,
  }),
  baseO({
    id: "o-shine",
    question_id: "q-goal",
    option_key: "shine",
    value_code: "shine",
    position: 0,
  }),
  baseO({
    id: "o-volume",
    question_id: "q-goal",
    option_key: "volume",
    value_code: "volume",
    position: 1,
  }),
];

const attempt = (over: Partial<AttemptRow> = {}): AttemptRow => ({
  id: ATTEMPT_ID,
  quiz_definition_id: "def-1",
  anonymous_identity_id: IDENTITY.id,
  user_id: null,
  status: "in_progress",
  started_at: new Date(Date.now() - 120_000).toISOString(),
  last_saved_at: new Date(Date.now() - 60_000).toISOString(),
  completed_at: null,
  current_step: 1,
  source_context: "hub",
  idempotency_key: "k",
  created_at: "2026-07-27T00:00:00Z",
  updated_at: "2026-07-27T00:00:00Z",
  ...over,
});

/** Program the definition-load path (used by save/progress/complete/get). */
function programDefinitionLoad() {
  vi.mocked(repo.findDefinitionRowById).mockResolvedValue(DEF);
  vi.mocked(repo.findQuestionRows).mockResolvedValue(QUESTIONS);
  vi.mocked(repo.findOptionRows).mockResolvedValue(OPTIONS);
}

// --- The real v1 hair definition, generated from HAIR_QUIZ ------------------
// Completion scores for real now, so its tests need the real definition. Built
// from the definition itself, so adding a question can't silently skip it here.

const V1_DEF: DefRow = { ...DEF, version: 1 };

const V1_QUESTIONS: QuestionRow[] = HAIR_QUIZ.questions.map((q, i) =>
  baseQ({
    id: `q-${q.key}`,
    question_key: q.key,
    question_type: q.type,
    section_key: q.sectionKey ?? null,
    position: i,
    is_required: q.isRequired,
    allows_multiple: q.allowsMultiple,
    content_key: q.content,
    help_text_key: q.helpText ?? null,
    validation_json: (q.validation ?? null) as QuestionRow["validation_json"],
  })
);

const V1_OPTIONS: OptionRow[] = HAIR_QUIZ.questions.flatMap((q) =>
  q.options.map((o, j) =>
    baseO({
      id: `o-${q.key}-${o.key}`,
      question_id: `q-${q.key}`,
      option_key: o.key,
      position: j,
      content_key: o.label,
      value_code: o.value,
    })
  )
);

/** A complete sheet that scores to Hidden Wave, as stored value codes. */
const HIDDEN_WAVE_ANSWERS: Record<string, string | string[]> = {
  natural_pattern: "loose_wave",
  strand_thickness: "fine",
  density: "low",
  hair_length: "shoulder_collarbone",
  scalp_oiliness_onset: "two_plus_days",
  scalp_concerns: ["none"],
  wash_frequency: "every_other_day",
  product_response: "varies",
  dry_time: "average",
  humidity_response: "waves_appear",
  chemical_history: ["none"],
  heat_frequency: "rarely",
  ends_condition: "smooth",
  environment: ["none"],
  primary_concern: "curl_definition",
  desired_result: "defined_texture",
};

/** Definition load + stored responses for the real v1 quiz. */
function programHairV1Load() {
  vi.mocked(repo.findDefinitionRowById).mockResolvedValue(V1_DEF);
  vi.mocked(repo.findQuestionRows).mockResolvedValue(V1_QUESTIONS);
  vi.mocked(repo.findOptionRows).mockResolvedValue(V1_OPTIONS);
  vi.mocked(repo.findResponsesByAttempt).mockResolvedValue(
    Object.entries(HIDDEN_WAVE_ANSWERS).map(([key, value]) => ({
      questionId: `q-${key}`,
      responseJson: value,
    }))
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_FLAG_HAIR_PROFILE = "1";
  vi.mocked(admin.hasServiceRoleKey).mockReturnValue(true);
  vi.mocked(anon.ensureAnonToken).mockResolvedValue({
    token: "tok",
    tokenHash: "hash-tok",
    issued: true,
  });
  vi.mocked(anon.readAnonToken).mockResolvedValue("tok");
  vi.mocked(repo.findIdentityByHash).mockResolvedValue(IDENTITY);
  vi.mocked(repo.ensureIdentityRow).mockResolvedValue(IDENTITY);
});

// ===========================================================================
// getActiveQuizDefinition
// ===========================================================================
describe("getActiveQuizDefinition", () => {
  it("returns the client definition (no internal UUIDs) for an active quiz", async () => {
    vi.mocked(repo.findActiveDefinitionRow).mockResolvedValue(DEF);
    vi.mocked(repo.findQuestionRows).mockResolvedValue(QUESTIONS);
    vi.mocked(repo.findOptionRows).mockResolvedValue(OPTIONS);
    const res = await getActiveQuizDefinition("hair");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.definition.quizKey).toBe("hair");
      expect(res.definition.questions.map((q) => q.key)).toEqual([
        "intro",
        "wash_frequency",
        "concerns",
        "heat",
        "goal",
      ]);
      expect(JSON.stringify(res.definition)).not.toContain("q-wash");
    }
  });

  it("rejects an invalid domain and never touches the DB", async () => {
    const res = await getActiveQuizDefinition("nails");
    expect(res).toEqual({ ok: false, error: "VALIDATION_FAILED" });
    expect(repo.findActiveDefinitionRow).not.toHaveBeenCalled();
  });

  it("returns FEATURE_DISABLED when the flag is off", async () => {
    delete process.env.NEXT_PUBLIC_FLAG_HAIR_PROFILE;
    const res = await getActiveQuizDefinition("hair");
    expect(res).toEqual({ ok: false, error: "FEATURE_DISABLED" });
    expect(repo.findActiveDefinitionRow).not.toHaveBeenCalled();
  });

  it("returns QUIZ_VERSION_RETIRED when no active definition exists", async () => {
    vi.mocked(repo.findActiveDefinitionRow).mockResolvedValue(null);
    const res = await getActiveQuizDefinition("hair");
    expect(res).toEqual({ ok: false, error: "QUIZ_VERSION_RETIRED" });
  });
});

// ===========================================================================
// startQuizAttempt
// ===========================================================================
describe("startQuizAttempt", () => {
  beforeEach(() => {
    vi.mocked(repo.findActiveDefinitionRow).mockResolvedValue(DEF);
    vi.mocked(repo.findInProgressAttempt).mockResolvedValue(null);
    vi.mocked(repo.insertAttempt).mockResolvedValue({
      attempt: attempt(),
      created: true,
    });
  });

  it("creates a new attempt and stamps the active quiz version", async () => {
    const res = await startQuizAttempt("hair", "hub", "nonce-1");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.attemptId).toBe(ATTEMPT_ID);
      expect(res.quizVersion).toBe(0);
      expect(res.created).toBe(true);
    }
    // idempotency key is namespaced by owner (H2)
    expect(repo.insertAttempt).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        definitionId: "def-1",
        identityId: "id-1",
        sourceContext: "hub",
        idempotencyKey: realHashToken("id-1:nonce-1"),
      })
    );
  });

  it("resumes an existing in-progress attempt instead of creating a duplicate (H8)", async () => {
    vi.mocked(repo.findInProgressAttempt).mockResolvedValue(attempt());
    const res = await startQuizAttempt("hair", "hub", "nonce-1");
    expect(res.ok && res.created).toBe(false);
    if (res.ok) expect(res.resumeAgeBucket).toBeDefined();
    expect(repo.insertAttempt).not.toHaveBeenCalled();
  });

  it("normalizes a forged source_context to the allowlist default (H14)", async () => {
    await startQuizAttempt("hair", "evil'; drop--", "nonce-1");
    expect(repo.insertAttempt).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sourceContext: "direct" })
    );
  });

  it("never returns an attempt owned by another identity on idempotency collision (H2)", async () => {
    vi.mocked(repo.insertAttempt).mockResolvedValue({
      attempt: attempt({ anonymous_identity_id: "someone-else" }),
      created: false,
    });
    const res = await startQuizAttempt("hair", "hub", "nonce-1");
    expect(res).toEqual({ ok: false, error: "VALIDATION_FAILED" });
  });

  it("distinct cookies map to distinct identities — two browsers don't merge (H10)", async () => {
    vi.mocked(anon.ensureAnonToken).mockResolvedValue({
      token: "tokB",
      tokenHash: "hash-tokB",
      issued: true,
    });
    await startQuizAttempt("hair", "hub", "nonce-1");
    expect(repo.ensureIdentityRow).toHaveBeenCalledWith(
      expect.anything(),
      "hash-tokB",
      expect.any(String)
    );
  });

  it("rejects a missing/oversized idempotency key", async () => {
    expect(await startQuizAttempt("hair", "hub", "")).toEqual({
      ok: false,
      error: "VALIDATION_FAILED",
    });
    expect(await startQuizAttempt("hair", "hub", "x".repeat(201))).toEqual({
      ok: false,
      error: "VALIDATION_FAILED",
    });
  });

  it("fails closed (INTERNAL_ERROR) when no real service key is configured (H17)", async () => {
    vi.mocked(admin.hasServiceRoleKey).mockReturnValue(false);
    const res = await startQuizAttempt("hair", "hub", "nonce-1");
    expect(res).toEqual({ ok: false, error: "INTERNAL_ERROR" });
    expect(anon.ensureAnonToken).not.toHaveBeenCalled();
    expect(repo.ensureIdentityRow).not.toHaveBeenCalled();
  });

  it("re-enforces the flag server-side (H4)", async () => {
    delete process.env.NEXT_PUBLIC_FLAG_HAIR_PROFILE;
    const res = await startQuizAttempt("hair", "hub", "nonce-1");
    expect(res).toEqual({ ok: false, error: "FEATURE_DISABLED" });
    expect(anon.ensureAnonToken).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// saveQuizResponse
// ===========================================================================
describe("saveQuizResponse", () => {
  beforeEach(() => {
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(attempt());
    programDefinitionLoad();
  });

  it("stores the canonical value_code, not the option key (H11)", async () => {
    const res = await saveQuizResponse(ATTEMPT_ID, "wash_frequency", "alt");
    expect(res.ok).toBe(true);
    expect(repo.upsertResponse).toHaveBeenCalledWith(
      expect.anything(),
      ATTEMPT_ID,
      "q-wash",
      "every_other_day"
    );
    // validates against the attempt's STAMPED definition, not the active one (H7)
    expect(repo.findDefinitionRowById).toHaveBeenCalledWith(
      expect.anything(),
      "def-1"
    );
    expect(repo.touchAttempt).toHaveBeenCalled();
    expect(repo.touchIdentityExpiry).toHaveBeenCalled();
  });

  it("rejects an empty answer to a required multi-select", async () => {
    const res = await saveQuizResponse(ATTEMPT_ID, "concerns", []);
    expect(res).toEqual({ ok: false, error: "INVALID_RESPONSE" });
    expect(repo.upsertResponse).not.toHaveBeenCalled();
  });

  it("maps every selected key to its value_code for multi-select", async () => {
    await saveQuizResponse(ATTEMPT_ID, "concerns", ["frizz", "flat"]);
    expect(repo.upsertResponse).toHaveBeenCalledWith(
      expect.anything(),
      ATTEMPT_ID,
      "q-concerns",
      ["frizz", "lacks_volume"]
    );
  });

  it("proves ownership from the cookie hash, not the attempt id (H1)", async () => {
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(null);
    const res = await saveQuizResponse(ATTEMPT_ID, "wash_frequency", "alt");
    expect(res).toEqual({ ok: false, error: "ATTEMPT_NOT_FOUND" });
    expect(repo.findOwnedAttempt).toHaveBeenCalledWith(
      expect.anything(),
      ATTEMPT_ID,
      IDENTITY.id
    );
    expect(repo.upsertResponse).not.toHaveBeenCalled();
  });

  it("rejects when there is no anonymous cookie at all (FORBIDDEN)", async () => {
    vi.mocked(anon.readAnonToken).mockResolvedValue(null);
    const res = await saveQuizResponse(ATTEMPT_ID, "wash_frequency", "alt");
    expect(res).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(repo.findOwnedAttempt).not.toHaveBeenCalled();
  });

  it("rejects when the cookie has no matching identity (FORBIDDEN)", async () => {
    vi.mocked(repo.findIdentityByHash).mockResolvedValue(null);
    const res = await saveQuizResponse(ATTEMPT_ID, "wash_frequency", "alt");
    expect(res).toEqual({ ok: false, error: "FORBIDDEN" });
  });

  it("refuses to act on an attempt linked to a user via the anon path (H1)", async () => {
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(
      attempt({ user_id: "u-1" })
    );
    const res = await saveQuizResponse(ATTEMPT_ID, "wash_frequency", "alt");
    expect(res).toEqual({ ok: false, error: "FORBIDDEN" });
  });

  it("rejects writes to a completed attempt (H5)", async () => {
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(
      attempt({ status: "completed" })
    );
    const res = await saveQuizResponse(ATTEMPT_ID, "wash_frequency", "alt");
    expect(res).toEqual({ ok: false, error: "ATTEMPT_ALREADY_COMPLETED" });
    expect(repo.upsertResponse).not.toHaveBeenCalled();
  });

  it("rejects an expired identity (H16)", async () => {
    vi.mocked(repo.findIdentityByHash).mockResolvedValue({
      id: "id-1",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const res = await saveQuizResponse(ATTEMPT_ID, "wash_frequency", "alt");
    expect(res).toEqual({ ok: false, error: "ATTEMPT_EXPIRED" });
  });

  it("rejects an unknown question key (H6)", async () => {
    const res = await saveQuizResponse(ATTEMPT_ID, "not_a_question", "alt");
    expect(res).toEqual({ ok: false, error: "INVALID_QUESTION" });
  });

  it("rejects answering an info step", async () => {
    const res = await saveQuizResponse(ATTEMPT_ID, "intro", "anything");
    expect(res).toEqual({ ok: false, error: "INVALID_QUESTION" });
  });

  it("rejects an option key not in the question's allowed set (H6)", async () => {
    const res = await saveQuizResponse(
      ATTEMPT_ID,
      "wash_frequency",
      "not_an_option"
    );
    expect(res).toEqual({ ok: false, error: "INVALID_RESPONSE" });
  });

  it("enforces scale integer bounds beyond validateResponse", async () => {
    expect(await saveQuizResponse(ATTEMPT_ID, "heat", 9)).toEqual({
      ok: false,
      error: "INVALID_RESPONSE",
    });
    expect(await saveQuizResponse(ATTEMPT_ID, "heat", 2.5)).toEqual({
      ok: false,
      error: "INVALID_RESPONSE",
    });
    expect((await saveQuizResponse(ATTEMPT_ID, "heat", 3)).ok).toBe(true);
  });

  it("rejects when the stamped definition has been retired (H7)", async () => {
    vi.mocked(repo.findDefinitionRowById).mockResolvedValue({
      ...DEF,
      status: "retired",
    });
    const res = await saveQuizResponse(ATTEMPT_ID, "wash_frequency", "alt");
    expect(res).toEqual({ ok: false, error: "QUIZ_VERSION_RETIRED" });
  });

  it("rejects a non-UUID attempt id before any DB call", async () => {
    const res = await saveQuizResponse("not-a-uuid", "wash_frequency", "alt");
    expect(res).toEqual({ ok: false, error: "VALIDATION_FAILED" });
    expect(repo.findOwnedAttempt).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// updateQuizProgress
// ===========================================================================
describe("updateQuizProgress", () => {
  beforeEach(() => {
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(attempt());
    programDefinitionLoad();
  });

  it("persists an in-range step", async () => {
    const res = await updateQuizProgress(ATTEMPT_ID, 3);
    expect(res).toEqual({ ok: true, currentStep: 3 });
    expect(repo.touchAttempt).toHaveBeenCalledWith(
      expect.anything(),
      ATTEMPT_ID,
      IDENTITY.id,
      { currentStep: 3 }
    );
  });

  it("rejects an out-of-range step (H: don't trust arbitrary step)", async () => {
    expect(await updateQuizProgress(ATTEMPT_ID, 99)).toEqual({
      ok: false,
      error: "VALIDATION_FAILED",
    });
    expect(await updateQuizProgress(ATTEMPT_ID, -1)).toEqual({
      ok: false,
      error: "VALIDATION_FAILED",
    });
    expect(repo.touchAttempt).not.toHaveBeenCalled();
  });

  it("rejects a non-integer step", async () => {
    expect(await updateQuizProgress(ATTEMPT_ID, 2.4)).toEqual({
      ok: false,
      error: "VALIDATION_FAILED",
    });
  });

  it("rejects progress on a completed attempt", async () => {
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(
      attempt({ status: "completed" })
    );
    expect(await updateQuizProgress(ATTEMPT_ID, 2)).toEqual({
      ok: false,
      error: "ATTEMPT_ALREADY_COMPLETED",
    });
  });
});

// ===========================================================================
// completeQuizAttempt
// ===========================================================================
describe("completeQuizAttempt", () => {
  // Every v1 question is required and answerable, so completion needs them all.
  const allAnswered = V1_QUESTIONS.map((q) => q.id);

  beforeEach(() => {
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(attempt());
    programHairV1Load();
    vi.mocked(repo.findAnsweredQuestionIds).mockResolvedValue(allAnswered);
    vi.mocked(repo.casCompleteAttempt).mockResolvedValue(true);
    vi.mocked(repo.insertSnapshot).mockResolvedValue({ id: "snap-1" });
    vi.mocked(repo.findSnapshotByAttempt).mockResolvedValue(null);
  });

  it("writes the scored archetype, not a placeholder", async () => {
    const res = await completeQuizAttempt(ATTEMPT_ID);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.resultId).toBe("snap-1");
      expect(res.firstCompletion).toBe(true);
    }
    expect(repo.insertSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        quiz_attempt_id: ATTEMPT_ID,
        anonymous_identity_id: IDENTITY.id,
        user_id: null,
        profile_domain: "hair",
        profile_code: "hidden-wave",
        rule_set_version: "score-1.0.0",
      })
    );
    const row = vi.mocked(repo.insertSnapshot).mock.calls[0][1] as {
      profile_code: string;
      rule_set_version: string;
      traits_json: unknown;
    };
    expect(row.profile_code).not.toBe("placeholder");
    expect(row.rule_set_version).not.toBe("placeholder-0");
    expect(row.traits_json).toContain("Loose wave");
  });

  it("scores from the stored responses, not from the request", async () => {
    // Same attempt, different stored answers → a different archetype. Proves the
    // result comes from the database rather than anything a client sent.
    vi.mocked(repo.findResponsesByAttempt).mockResolvedValue(
      Object.entries({
        ...HIDDEN_WAVE_ANSWERS,
        chemical_history: ["bleach"],
        ends_condition: "split_breaking",
        primary_concern: "breakage",
      }).map(([key, value]) => ({
        questionId: `q-${key}`,
        responseJson: value,
      }))
    );
    await completeQuizAttempt(ATTEMPT_ID);
    expect(repo.insertSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ profile_code: "treated-fragile" })
    );
  });

  it("rejects completion when a required response is missing (H)", async () => {
    vi.mocked(repo.findAnsweredQuestionIds).mockResolvedValue([
      "q-wash",
      "q-concerns",
    ]);
    const res = await completeQuizAttempt(ATTEMPT_ID);
    expect(res).toEqual({ ok: false, error: "MISSING_REQUIRED_RESPONSE" });
    expect(repo.casCompleteAttempt).not.toHaveBeenCalled();
    expect(repo.insertSnapshot).not.toHaveBeenCalled();
  });

  it("is idempotent: a second complete returns the same snapshot, no re-insert (H5)", async () => {
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(
      attempt({ status: "completed" })
    );
    vi.mocked(repo.findSnapshotByAttempt).mockResolvedValue({ id: "snap-1" });
    const res = await completeQuizAttempt(ATTEMPT_ID);
    expect(res.ok && res.firstCompletion).toBe(false);
    if (res.ok) expect(res.resultId).toBe("snap-1");
    expect(repo.casCompleteAttempt).not.toHaveBeenCalled();
    expect(repo.insertSnapshot).not.toHaveBeenCalled();
  });

  it("loses the CAS race gracefully: returns the winner's snapshot, never bricks (H9)", async () => {
    // Winner already flipped status + inserted the snapshot; the loser's own
    // insert trips the unique backstop (23505) and re-selects the winner's row.
    vi.mocked(repo.casCompleteAttempt).mockResolvedValue(false);
    vi.mocked(repo.insertSnapshot).mockRejectedValue({ code: "23505" });
    vi.mocked(repo.findSnapshotByAttempt).mockResolvedValue({
      id: "snap-winner",
    });
    const res = await completeQuizAttempt(ATTEMPT_ID);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.resultId).toBe("snap-winner");
      expect(res.firstCompletion).toBe(false);
    }
  });

  it("recovers a completed attempt whose snapshot never got written (no brick)", async () => {
    // Prior completion flipped status→completed but the snapshot insert failed.
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(
      attempt({ status: "completed" })
    );
    vi.mocked(repo.findSnapshotByAttempt).mockResolvedValue(null);
    vi.mocked(repo.insertSnapshot).mockResolvedValue({ id: "snap-recovered" });
    const res = await completeQuizAttempt(ATTEMPT_ID);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.resultId).toBe("snap-recovered");
      expect(res.firstCompletion).toBe(false);
    }
    expect(repo.casCompleteAttempt).not.toHaveBeenCalled();
  });

  it("treats a unique-violation on snapshot insert as an existing result (backstop)", async () => {
    vi.mocked(repo.insertSnapshot).mockRejectedValue({ code: "23505" });
    vi.mocked(repo.findSnapshotByAttempt).mockResolvedValue({
      id: "snap-existing",
    });
    const res = await completeQuizAttempt(ATTEMPT_ID);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.resultId).toBe("snap-existing");
      expect(res.firstCompletion).toBe(false);
    }
  });

  it("rejects an expired identity before completing", async () => {
    vi.mocked(repo.findIdentityByHash).mockResolvedValue({
      id: "id-1",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(await completeQuizAttempt(ATTEMPT_ID)).toEqual({
      ok: false,
      error: "ATTEMPT_EXPIRED",
    });
  });

  it("rejects completing an attempt stamped to a retired version (H7)", async () => {
    vi.mocked(repo.findDefinitionRowById).mockResolvedValue({
      ...DEF,
      status: "retired",
    });
    expect(await completeQuizAttempt(ATTEMPT_ID)).toEqual({
      ok: false,
      error: "QUIZ_VERSION_RETIRED",
    });
    expect(repo.casCompleteAttempt).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// getQuizAttempt
// ===========================================================================
describe("getQuizAttempt", () => {
  beforeEach(() => {
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(attempt());
    programDefinitionLoad();
  });

  it("rehydrates stored value_codes back into option keys for the renderer (H12)", async () => {
    vi.mocked(repo.findResponsesByAttempt).mockResolvedValue([
      { questionId: "q-wash", responseJson: "every_other_day" },
      { questionId: "q-concerns", responseJson: ["frizz", "lacks_volume"] },
      { questionId: "q-heat", responseJson: 3 },
    ]);
    const res = await getQuizAttempt(ATTEMPT_ID);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.initialResponses).toEqual({
        wash_frequency: "alt",
        concerns: ["frizz", "flat"],
        heat: 3,
      });
      expect(res.currentStep).toBe(1);
    }
    expect(repo.findResponsesByAttempt).toHaveBeenCalledWith(
      expect.anything(),
      ATTEMPT_ID
    );
  });

  it("returns ATTEMPT_NOT_FOUND for an attempt the caller does not own", async () => {
    vi.mocked(repo.findOwnedAttempt).mockResolvedValue(null);
    expect(await getQuizAttempt(ATTEMPT_ID)).toEqual({
      ok: false,
      error: "ATTEMPT_NOT_FOUND",
    });
  });

  it("rejects resuming an attempt stamped to a retired version (H7)", async () => {
    vi.mocked(repo.findDefinitionRowById).mockResolvedValue({
      ...DEF,
      status: "retired",
    });
    expect(await getQuizAttempt(ATTEMPT_ID)).toEqual({
      ok: false,
      error: "QUIZ_VERSION_RETIRED",
    });
  });
});

// ===========================================================================
// Server-side guards on the non-start actions (H4 flag / H17 key / H16 expiry).
// The code carries these guards; these tests pin them so a regression can't
// silently ship a dark-feature or fail-open write path.
// ===========================================================================
describe("guards on save/progress/complete/get", () => {
  it("all return FEATURE_DISABLED when the flag is off, before any DB call (H4)", async () => {
    delete process.env.NEXT_PUBLIC_FLAG_HAIR_PROFILE;
    expect(await saveQuizResponse(ATTEMPT_ID, "wash_frequency", "alt")).toEqual(
      {
        ok: false,
        error: "FEATURE_DISABLED",
      }
    );
    expect(await updateQuizProgress(ATTEMPT_ID, 1)).toEqual({
      ok: false,
      error: "FEATURE_DISABLED",
    });
    expect(await completeQuizAttempt(ATTEMPT_ID)).toEqual({
      ok: false,
      error: "FEATURE_DISABLED",
    });
    expect(await getQuizAttempt(ATTEMPT_ID)).toEqual({
      ok: false,
      error: "FEATURE_DISABLED",
    });
    expect(repo.findOwnedAttempt).not.toHaveBeenCalled();
  });

  it("all fail closed (INTERNAL_ERROR) when no real service key is set (H17)", async () => {
    vi.mocked(admin.hasServiceRoleKey).mockReturnValue(false);
    expect(await saveQuizResponse(ATTEMPT_ID, "wash_frequency", "alt")).toEqual(
      {
        ok: false,
        error: "INTERNAL_ERROR",
      }
    );
    expect(await updateQuizProgress(ATTEMPT_ID, 1)).toEqual({
      ok: false,
      error: "INTERNAL_ERROR",
    });
    expect(await completeQuizAttempt(ATTEMPT_ID)).toEqual({
      ok: false,
      error: "INTERNAL_ERROR",
    });
    expect(await getQuizAttempt(ATTEMPT_ID)).toEqual({
      ok: false,
      error: "INTERNAL_ERROR",
    });
    expect(repo.findOwnedAttempt).not.toHaveBeenCalled();
  });

  it("progress and resume reject an expired identity (H16)", async () => {
    vi.mocked(repo.findIdentityByHash).mockResolvedValue({
      id: "id-1",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(await updateQuizProgress(ATTEMPT_ID, 1)).toEqual({
      ok: false,
      error: "ATTEMPT_EXPIRED",
    });
    expect(await getQuizAttempt(ATTEMPT_ID)).toEqual({
      ok: false,
      error: "ATTEMPT_EXPIRED",
    });
    expect(repo.findOwnedAttempt).not.toHaveBeenCalled();
  });
});
