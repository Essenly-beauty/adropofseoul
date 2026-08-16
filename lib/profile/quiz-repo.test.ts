import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// quiz-repo imports "server-only"; vitest.config aliases it to an empty module.
import {
  findOwnedAttempt,
  findInProgressAttempt,
  touchAttempt,
  casCompleteAttempt,
  ensureIdentityRow,
  upsertResponse,
  findActiveDefinitionRow,
  insertAttempt,
} from "./quiz-repo";

// Minimal chainable Supabase stub. Records every method call per `.from()` so a
// test can assert the exact query predicates the repo builds — the owner-fold
// (.eq('anonymous_identity_id', …)) and status CAS (.eq('status','in_progress'))
// that ARE the H1/H9 enforcement mechanism (fully mocked in the action tests).
type Result = { data: unknown; error: unknown };
type Call = {
  table: string;
  chain: { fn: string; args: unknown[] }[];
  result: Result;
};

function makeSupabase(results: Record<string, Result | Result[]>) {
  const calls: Call[] = [];
  let current: Call;
  const builder: Record<string, (...a: unknown[]) => unknown> = {};
  const chain = [
    "select",
    "insert",
    "upsert",
    "update",
    "eq",
    "in",
    "order",
    "limit",
  ];
  const terminal = ["single", "maybeSingle"];
  for (const m of chain)
    builder[m] = (...args: unknown[]) => {
      current.chain.push({ fn: m, args });
      return builder;
    };
  for (const m of terminal)
    builder[m] = (...args: unknown[]) => {
      current.chain.push({ fn: m, args });
      return Promise.resolve(current.result);
    };
  (builder as { then?: unknown }).then = (
    res: (v: Result) => unknown,
    rej?: (e: unknown) => unknown
  ) => Promise.resolve(current.result).then(res, rej);

  const client = {
    from(table: string) {
      const q = results[table];
      const result = Array.isArray(q)
        ? (q.shift() ?? { data: null, error: null })
        : (q ?? { data: null, error: null });
      current = { table, chain: [], result };
      calls.push(current);
      return builder;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

const chainOf = (calls: Call[], table: string) =>
  calls.find((c) => c.table === table)?.chain ?? [];
const hasEq = (
  chain: { fn: string; args: unknown[] }[],
  col: string,
  val: unknown
) => chain.some((c) => c.fn === "eq" && c.args[0] === col && c.args[1] === val);
const opOf = (chain: { fn: string; args: unknown[] }[], fn: string) =>
  chain.find((c) => c.fn === fn);

describe("quiz-repo attempt ownership predicates (H1)", () => {
  it("findOwnedAttempt folds BOTH the attempt id and the owner id into the query", async () => {
    const { client, calls } = makeSupabase({
      quiz_attempts: { data: { id: "a1" }, error: null },
    });
    const row = await findOwnedAttempt(client, "a1", "id-9");
    const chain = chainOf(calls, "quiz_attempts");
    expect(hasEq(chain, "id", "a1")).toBe(true);
    expect(hasEq(chain, "anonymous_identity_id", "id-9")).toBe(true);
    expect(row).toEqual({ id: "a1" });
  });

  it("findInProgressAttempt scopes to owner + definition + in_progress", async () => {
    const { client, calls } = makeSupabase({
      quiz_attempts: { data: null, error: null },
    });
    await findInProgressAttempt(client, "id-9", "def-1");
    const chain = chainOf(calls, "quiz_attempts");
    expect(hasEq(chain, "anonymous_identity_id", "id-9")).toBe(true);
    expect(hasEq(chain, "quiz_definition_id", "def-1")).toBe(true);
    expect(hasEq(chain, "status", "in_progress")).toBe(true);
  });

  it("touchAttempt re-asserts owner + in_progress at write time", async () => {
    const { client, calls } = makeSupabase({
      quiz_attempts: { data: null, error: null },
    });
    await touchAttempt(client, "a1", "id-9", { currentStep: 3 });
    const chain = chainOf(calls, "quiz_attempts");
    const update = opOf(chain, "update")!.args[0] as Record<string, unknown>;
    expect(update.current_step).toBe(3);
    expect(typeof update.last_saved_at).toBe("string");
    expect(hasEq(chain, "id", "a1")).toBe(true);
    expect(hasEq(chain, "anonymous_identity_id", "id-9")).toBe(true);
    expect(hasEq(chain, "status", "in_progress")).toBe(true);
  });
});

describe("quiz-repo compare-and-set completion (H9)", () => {
  it("only flips in_progress → completed, scoped to the owner, and reports the winner", async () => {
    const won = makeSupabase({
      quiz_attempts: { data: [{ id: "a1" }], error: null },
    });
    expect(await casCompleteAttempt(won.client, "a1", "id-9")).toBe(true);
    const chain = chainOf(won.calls, "quiz_attempts");
    const update = opOf(chain, "update")!.args[0] as Record<string, unknown>;
    expect(update.status).toBe("completed");
    expect(typeof update.completed_at).toBe("string");
    expect(hasEq(chain, "id", "a1")).toBe(true);
    expect(hasEq(chain, "anonymous_identity_id", "id-9")).toBe(true);
    expect(hasEq(chain, "status", "in_progress")).toBe(true);
  });

  it("reports a loss when the conditional update matches zero rows", async () => {
    const lost = makeSupabase({ quiz_attempts: { data: [], error: null } });
    expect(await casCompleteAttempt(lost.client, "a1", "id-9")).toBe(false);
  });
});

describe("quiz-repo upsert conflict targets", () => {
  it("ensureIdentityRow upserts on token_hash and slides expiry forward (H16)", async () => {
    const { client, calls } = makeSupabase({
      anonymous_identities: {
        data: { id: "id-9", expires_at: "2030-01-01" },
        error: null,
      },
    });
    const res = await ensureIdentityRow(client, "hash-x", "2030-01-01");
    expect(res).toEqual({ id: "id-9", expiresAt: "2030-01-01" });
    const chain = chainOf(calls, "anonymous_identities");
    const upsert = opOf(chain, "upsert")!;
    expect((upsert.args[0] as Record<string, unknown>).token_hash).toBe(
      "hash-x"
    );
    expect((upsert.args[0] as Record<string, unknown>).expires_at).toBe(
      "2030-01-01"
    );
    expect(upsert.args[1]).toEqual({ onConflict: "token_hash" });
  });

  it("upsertResponse upserts on (quiz_attempt_id, question_id) — back-edit overwrites (H11)", async () => {
    const { client, calls } = makeSupabase({
      quiz_responses: { data: null, error: null },
    });
    await upsertResponse(client, "a1", "q1", "every_other_day");
    const upsert = opOf(chainOf(calls, "quiz_responses"), "upsert")!;
    expect(upsert.args[0]).toMatchObject({
      quiz_attempt_id: "a1",
      question_id: "q1",
      response_json: "every_other_day",
    });
    expect(upsert.args[1]).toEqual({
      onConflict: "quiz_attempt_id,question_id",
    });
  });
});

describe("quiz-repo definition + attempt creation", () => {
  it("findActiveDefinitionRow filters active and takes the highest version", async () => {
    const { client, calls } = makeSupabase({
      quiz_definitions: { data: { id: "def" }, error: null },
    });
    await findActiveDefinitionRow(client, "hair");
    const chain = chainOf(calls, "quiz_definitions");
    expect(hasEq(chain, "quiz_key", "hair")).toBe(true);
    expect(hasEq(chain, "status", "active")).toBe(true);
    const order = opOf(chain, "order")!;
    expect(order.args[0]).toBe("version");
    expect((order.args[1] as { ascending: boolean }).ascending).toBe(false);
  });

  it("insertAttempt returns created=true on a fresh insert", async () => {
    const { client } = makeSupabase({
      quiz_attempts: {
        data: { id: "a1", anonymous_identity_id: "id-9" },
        error: null,
      },
    });
    const res = await insertAttempt(client, {
      definitionId: "def-1",
      identityId: "id-9",
      sourceContext: "hub",
      idempotencyKey: "k",
    });
    expect(res.created).toBe(true);
    expect(res.attempt.id).toBe("a1");
  });

  it("insertAttempt re-selects the existing row (created=false) on a 23505 collision (H2/H8)", async () => {
    const { client } = makeSupabase({
      quiz_attempts: [
        { data: null, error: { code: "23505" } },
        { data: { id: "a1", anonymous_identity_id: "id-9" }, error: null },
      ],
    });
    const res = await insertAttempt(client, {
      definitionId: "def-1",
      identityId: "id-9",
      sourceContext: "hub",
      idempotencyKey: "k",
    });
    expect(res.created).toBe(false);
    expect(res.attempt.id).toBe("a1");
  });
});
