# DB-backed Hair Profile Result Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a completed Hair Profile survive a refresh — seed the real quiz as
`quiz_definitions` v1, write the scored archetype into `profile_snapshots`, and
serve it from a durable owner-scoped result URL.

**Architecture:** The scoring module stays the single source of truth and is now
called on the server too, over responses rehydrated from `quiz_responses`. The
public quiz keeps running client-side and bootstraps an anonymous attempt in
parallel; when persistence is available it completes server-side and redirects to
the durable result, and when it isn't (no service key, flag off) it falls back to
the in-page result. The `hair_profile` flag stops being a visibility gate and
becomes the **persistence** switch — flag off degrades, it no longer 404s.

**Tech Stack:** Next.js 14 App Router server actions, Supabase (service-role
admin client), TypeScript, Vitest + jsdom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-07-28-hair-profile-quiz-design.md` — §4.8
(the result columns being persisted), §10 (this follow-up's scope), §12 item 2
(map onto the existing tables, don't add the draft's).

## Global Constraints

- Repo: `/Users/jj_whatap/up/adropofseoul-seongsu`. Branch: `feat/hair-result-persistence` off `main`.
- **No schema migration.** `profile_snapshots` already has `profile_code`,
  `rule_set_version`, `profile_version`, `traits_json`, `goals_json`,
  `summary_json`, `confidence_json`. Verified against `types/database.types.ts`.
- **Do not `db push`.** `supabase/migrations/README.md` documents live drift;
  pushing risks silently reverting a production RLS fix. The quiz definition is
  **data, not schema** — it goes in through a service-role REST seed script, the
  established pattern in `scripts/seed-*.mjs`.
- Ownership is always proven from the anon cookie hash server-side, never from an
  id in the URL (`docs/adr/0001`). A snapshot the caller doesn't own → 404, and
  the response must not disclose that it exists.
- Analytics carry the domain, quiz version, question **key**, integer
  indices/counts and bucket strings only — never an answer, label, or free text.
  `assertSafeProps` throws otherwise.
- Result and quiz routes stay `noindex, nofollow`.
- `npm run typecheck && npm test && npm run lint` before each commit. Husky +
  lint-staged run prettier on commit; let it reformat.
- Node is v26 and runs `.ts` files directly (native type stripping), which is why
  the seed script can import `HAIR_QUIZ` instead of restating it. Verified.

## File Structure

| File                                                 | Responsibility                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `scripts/seed-hair-quiz.ts`                          | _(create)_ upsert `HAIR_QUIZ` as v1 via service-role REST; retire other active hair versions         |
| `lib/profile/quiz-mapper.ts`                         | _(modify)_ extract `hydrateResponses` — value_code → option key, one implementation                  |
| `lib/haircare/snapshot.ts`                           | _(create)_ pure: score + explanation → `profile_snapshots` insert shape                              |
| `app/actions/profile.ts`                             | _(modify)_ real snapshot on completion; add `getProfileSnapshot`; flush-then-complete                |
| `app/beauty-profile/hair/result/[snapshot]/page.tsx` | _(create)_ durable owner-scoped result, noindex                                                      |
| `components/editorial/HairQuizClient.tsx`            | _(modify)_ bootstrap an attempt, save through it, redirect on completion, fall back when unavailable |
| `app/haircare/profiles/[slug]/page.tsx`              | _(modify)_ render the `routine` added in the last PR                                                 |

---

### Task 1: Seed the real quiz as `quiz_definitions` v1

**Files:**

- Create: `scripts/seed-hair-quiz.ts`
- Test: none (a one-shot operational script; correctness is verified by reading
  the rows back in Step 4, and by Task 2–6's tests running against the seeded row)

**Interfaces:**

- Consumes: `HAIR_QUIZ` from `lib/haircare/quiz.ts`.
- Produces: an `active` `quiz_definitions` row with `quiz_key='hair'`,
  `version=1`, its 16 `quiz_questions` and their `quiz_options`; every other
  active hair version retired. Tasks 4–6 read this through the existing
  `findActiveDefinitionRow`.

- [ ] **Step 1: Write the seed script**

Create `scripts/seed-hair-quiz.ts`. It mirrors `scripts/seed-ingredients.mjs`'s
env handling, and imports the definition rather than restating it — the v0 SQL
seed had to transcribe every question by hand, which is exactly how a definition
and its seed drift apart.

```ts
// Upserts HAIR_QUIZ into quiz_definitions/questions/options as the active
// version 1, and retires any other active hair version.
//
// Usage: node scripts/seed-hair-quiz.ts        (reads .env.local)
//        node scripts/seed-hair-quiz.ts --dry  (print what would be written)
//
// This is DATA, not schema — it deliberately does not go through a migration.
// supabase/migrations/README.md forbids a blind `db push` against the live
// drift, and the quiz definition needs no DDL.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { HAIR_QUIZ } from "../lib/haircare/quiz.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function env(key: string): string {
  if (process.env[key]) return process.env[key] as string;
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split(
    "\n"
  )) {
    if (line.startsWith(key + "="))
      return line
        .slice(key.length + 1)
        .trim()
        .replace(/^"|"$/g, "");
  }
  throw new Error("missing " + key);
}

const URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SRK = env("SUPABASE_SERVICE_ROLE_KEY");
const DRY = process.argv.includes("--dry");

async function rest(
  path: string,
  init: { method: string; body?: unknown; prefer?: string }
) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method: init.method,
    headers: {
      apikey: SRK,
      Authorization: `Bearer ${SRK}`,
      "Content-Type": "application/json",
      Prefer: init.prefer ?? "return=representation",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  if (!res.ok)
    throw new Error(`${init.method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const answerable = HAIR_QUIZ.questions;
console.log(
  `hair quiz v${HAIR_QUIZ.version}: ${answerable.length} questions, ` +
    `${answerable.reduce((n, q) => n + q.options.length, 0)} options`
);
if (DRY) {
  for (const q of answerable)
    console.log(`  ${q.key} (${q.type}) — ${q.options.length} options`);
  process.exit(0);
}

// 1. Retire any other active hair version first: the schema uniques
// (quiz_key, version), not "one active per domain", so this is enforced here.
await rest(
  `quiz_definitions?quiz_key=eq.hair&status=eq.active&version=neq.${HAIR_QUIZ.version}`,
  {
    method: "PATCH",
    body: { status: "retired", retired_at: new Date().toISOString() },
    prefer: "return=minimal",
  }
);

// 2. Upsert the definition on (quiz_key, version).
const [def] = await rest("quiz_definitions?on_conflict=quiz_key,version", {
  method: "POST",
  body: [
    {
      quiz_key: HAIR_QUIZ.quizKey,
      version: HAIR_QUIZ.version,
      status: "active",
      locale_strategy: "single",
      title_key: HAIR_QUIZ.title,
      description_key: HAIR_QUIZ.description ?? null,
      published_at: new Date().toISOString(),
      retired_at: null,
    },
  ],
  prefer: "resolution=merge-duplicates,return=representation",
});
console.log("definition:", def.id);

// 3. Upsert questions on (quiz_definition_id, question_key), then their options
// on (question_id, option_key). Position comes from array order, so reordering
// the definition reorders the quiz without touching any key.
for (let i = 0; i < answerable.length; i++) {
  const q = answerable[i];
  const [row] = await rest(
    "quiz_questions?on_conflict=quiz_definition_id,question_key",
    {
      method: "POST",
      body: [
        {
          quiz_definition_id: def.id,
          question_key: q.key,
          question_type: q.type,
          section_key: q.sectionKey ?? null,
          position: i,
          is_required: q.isRequired,
          allows_multiple: q.allowsMultiple,
          content_key: q.content,
          help_text_key: q.helpText ?? null,
          validation_json: q.validation ?? null,
        },
      ],
      prefer: "resolution=merge-duplicates,return=representation",
    }
  );
  if (q.options.length > 0) {
    await rest("quiz_options?on_conflict=question_id,option_key", {
      method: "POST",
      body: q.options.map((o, j) => ({
        question_id: row.id,
        option_key: o.key,
        position: j,
        content_key: o.label,
        value_code: o.value,
      })),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  }
  console.log(`  ${q.key}: ${q.options.length} options`);
}

console.log("seeded hair quiz v" + HAIR_QUIZ.version);
```

- [ ] **Step 2: Dry-run it**

Run: `node scripts/seed-hair-quiz.ts --dry`
Expected: `hair quiz v1: 16 questions, 87 options`, then one line per question
key. No network calls. If the count is not 16, the definition and this plan have
diverged — stop and reconcile before writing anything.

- [ ] **Step 3: Seed for real**

Run: `node scripts/seed-hair-quiz.ts`
Expected: `definition: <uuid>`, 16 `<key>: N options` lines, `seeded hair quiz v1`.

- [ ] **Step 4: Verify the rows, and that v0 is retired**

```bash
node -e '
const fs=require("fs");
const env=k=>{for(const l of fs.readFileSync(".env.local","utf8").split("\n"))
  if(l.startsWith(k+"="))return l.slice(k.length+1).trim().replace(/^"|"$/g,"")};
const U=env("NEXT_PUBLIC_SUPABASE_URL"),K=env("SUPABASE_SERVICE_ROLE_KEY");
const h={apikey:K,Authorization:"Bearer "+K};
(async()=>{
  const defs=await (await fetch(U+"/rest/v1/quiz_definitions?quiz_key=eq.hair&select=version,status,title_key&order=version",{headers:h})).json();
  console.log("definitions:",defs);
  const active=defs.find(d=>d.status==="active");
  const qs=await (await fetch(U+"/rest/v1/quiz_questions?select=question_key,position,question_type&order=position&quiz_definition_id=eq."+
    (await (await fetch(U+"/rest/v1/quiz_definitions?quiz_key=eq.hair&version=eq."+active.version+"&select=id",{headers:h})).json())[0].id,{headers:h})).json();
  console.log("questions:",qs.length, qs.map(q=>q.question_key).join(","));
})()'
```

Expected: exactly one `status: "active"` row and it is `version: 1`; version 0 is
`retired`; 16 questions in definition order starting `natural_pattern`.

**If v0 still shows active**, the retire PATCH didn't match — do not proceed, the
server path would load the 5-question placeholder.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-hair-quiz.ts
git commit -m "feat(profile): seed the real hair quiz as quiz_definitions v1"
```

---

### Task 2: One implementation of response rehydration

`getQuizAttempt` already converts stored `value_code`s back to option keys inline.
The snapshot writer needs the identical conversion, so it moves to the mapper
rather than being written twice — two copies of a value↔key mapping is how a
scored answer and a displayed answer start disagreeing.

**Files:**

- Modify: `lib/profile/quiz-mapper.ts`
- Modify: `app/actions/profile.ts` (the `getQuizAttempt` body, ~lines 550–566)
- Test: `lib/profile/quiz-mapper.test.ts` (append)

**Interfaces:**

- Consumes: `LoadedQuizDefinition` (existing).
- Produces:
  `hydrateResponses(loaded: LoadedQuizDefinition, rows: { questionId: string; responseJson: unknown }[]): Record<string, string | string[] | number>`
  — keyed by question key, values as **option keys** (not value codes). Rows for
  unknown questions, and values of the wrong shape for their question type, are
  skipped. Task 4 consumes it.

- [ ] **Step 1: Write the failing test**

Append to `lib/profile/quiz-mapper.test.ts`, inside the existing
`describe("mapQuizDefinition")` so it reuses the `loaded` fixture:

```ts
it("hydrates stored value codes back into option keys", () => {
  const byKey = loaded.questionByKey;
  const hydrated = hydrateResponses(loaded, [
    { questionId: byKey.wash.id, responseJson: "every_other_day" },
    { questionId: byKey.concerns.id, responseJson: ["lacks_volume"] },
    { questionId: byKey.heat.id, responseJson: 3 },
  ]);
  // wash's option_key is "alt" while its value_code is "every_other_day".
  expect(hydrated).toEqual({ wash: "alt", concerns: ["flat"], heat: 3 });
});

it("skips rows it cannot place or whose shape is wrong for the type", () => {
  const byKey = loaded.questionByKey;
  const hydrated = hydrateResponses(loaded, [
    { questionId: "no-such-question", responseJson: "x" },
    { questionId: byKey.wash.id, responseJson: 42 }, // single_select wants a string
    { questionId: byKey.concerns.id, responseJson: "flat" }, // multi wants an array
    { questionId: byKey.heat.id, responseJson: "3" }, // scale wants a number
  ]);
  expect(hydrated).toEqual({});
});

it("passes through a value code with no matching option key", () => {
  const hydrated = hydrateResponses(loaded, [
    { questionId: loaded.questionByKey.wash.id, responseJson: "gone" },
  ]);
  expect(hydrated).toEqual({ wash: "gone" });
});
```

Add `hydrateResponses` to the file's import from `./quiz-mapper`.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/profile/quiz-mapper.test.ts`
Expected: FAIL — `hydrateResponses` is not exported.

- [ ] **Step 3: Add the helper to the mapper**

Append to `lib/profile/quiz-mapper.ts`:

```ts
/**
 * Stored responses → the client/scoring shape: keyed by question key, values as
 * option keys. `quiz_responses.response_json` holds canonical value codes, and
 * everything that reads answers back (resume hydration, server-side scoring)
 * needs the same conversion — so it lives here once.
 */
export function hydrateResponses(
  loaded: LoadedQuizDefinition,
  rows: { questionId: string; responseJson: unknown }[]
): Record<string, string | string[] | number> {
  const byId = new Map(
    Object.values(loaded.questionByKey).map((q) => [q.id, q])
  );
  const out: Record<string, string | string[] | number> = {};
  for (const row of rows) {
    const q = byId.get(row.questionId);
    if (!q) continue;
    const raw = row.responseJson;
    if (q.type === "single_select" && typeof raw === "string") {
      out[q.key] = q.valueToOptionKey[raw] ?? raw;
    } else if (q.type === "multi_select" && Array.isArray(raw)) {
      out[q.key] = raw.map(
        (v) => q.valueToOptionKey[v as string] ?? (v as string)
      );
    } else if (q.type === "scale" && typeof raw === "number") {
      out[q.key] = raw;
    } else if (q.type === "text" && typeof raw === "string") {
      out[q.key] = raw;
    }
  }
  return out;
}
```

- [ ] **Step 4: Use it in `getQuizAttempt`**

In `app/actions/profile.ts`, replace the inline hydration loop (the
`const initialResponses ... for (const row of stored) { ... }` block) with:

```ts
const stored = await repo.findResponsesByAttempt(admin, attemptId);
const initialResponses = hydrateResponses(loaded, stored);
```

Add `hydrateResponses` to the existing import from `@/lib/profile/quiz-mapper`.
Delete the now-unused `idToQuestion` map if nothing else in the function uses it
(check before deleting — lint will also flag it).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/profile app/actions && npm run typecheck && npm run lint`
Expected: PASS, including the pre-existing `getQuizAttempt` resume tests in
`app/actions/profile.test.ts` — they cover the behaviour you just moved, so a
green run there is the real proof the extraction was faithful.

- [ ] **Step 6: Commit**

```bash
git add lib/profile/quiz-mapper.ts lib/profile/quiz-mapper.test.ts app/actions/profile.ts
git commit -m "refactor(profile): one implementation of response rehydration"
```

---

### Task 3: Score → snapshot row

**Files:**

- Create: `lib/haircare/snapshot.ts`
- Test: `lib/haircare/snapshot.test.ts`

**Interfaces:**

- Consumes: `scoreHairQuiz`, `SCORING_VERSION`, `HairQuizScore`,
  `HairQuizResponses` from `./scoring`; `explainHairResult`,
  `HairResultExplanation` from `./explain`.
- Produces:
  - `type HairSnapshotFields = { profile_code: string; profile_version: number; rule_set_version: string; traits_json: Json; goals_json: Json; summary_json: Json; confidence_json: Json }`
  - `buildHairSnapshot(responses: HairQuizResponses): HairSnapshotFields`
  - `readHairSnapshot(fields: { profile_code: string; traits_json: Json | null; summary_json: Json | null; confidence_json: Json | null }): { profileSlug: string | null; explanation: HairResultExplanation }`
    — nullable on purpose: it reads DB rows, where those columns are nullable,
    not the non-null shape `buildHairSnapshot` writes.

  Task 4 writes with the first, Task 5 reads with the second. They are a
  round-trip pair and a test pins that.

- [ ] **Step 1: Write the failing test**

Create `lib/haircare/snapshot.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildHairSnapshot, readHairSnapshot } from "./snapshot";
import { SCORING_VERSION, type HairQuizResponses } from "./scoring";

function sheet(over: HairQuizResponses = {}): HairQuizResponses {
  return {
    natural_pattern: "loose_wave",
    strand_thickness: "fine",
    density: "low",
    hair_length: "shoulder_collarbone",
    environment: ["none"],
    scalp_oiliness_onset: "two_plus_days",
    scalp_concerns: ["none"],
    wash_frequency: "every_other_day",
    product_response: "varies",
    dry_time: "average",
    humidity_response: "waves_appear",
    chemical_history: ["none"],
    heat_frequency: "rarely",
    ends_condition: "smooth",
    primary_concern: "curl_definition",
    desired_result: "defined_texture",
    ...over,
  };
}

describe("buildHairSnapshot", () => {
  it("stores the archetype slug and the scoring version", () => {
    const s = buildHairSnapshot(sheet());
    expect(s.profile_code).toBe("hidden-wave");
    expect(s.rule_set_version).toBe(SCORING_VERSION);
    expect(s.profile_version).toBe(1);
  });

  it("stores the tags as traits and the goal as a declared goal", () => {
    const s = buildHairSnapshot(sheet());
    expect(s.traits_json).toEqual([
      "Loose wave",
      "Fine strands",
      "Low density",
    ]);
    expect(s.goals_json).toEqual({
      primaryConcern: "curl_definition",
      desiredResult: "defined_texture",
    });
  });

  it("stores the reasoning and the override in the summary", () => {
    const s = buildHairSnapshot(sheet()) as never as {
      summary_json: {
        reasons: string[];
        overrideApplied: string;
        advisory: boolean;
      };
    };
    expect(s.summary_json.reasons[0]).toBe(
      "Waves or curls become more visible"
    );
    expect(s.summary_json.overrideApplied).toBe("hidden_wave");
    expect(s.summary_json.advisory).toBe(false);
  });

  it("stores the segmentation numbers as confidence", () => {
    const s = buildHairSnapshot(
      sheet({ scalp_concerns: ["itching"] })
    ) as never as {
      confidence_json: {
        scores: Record<string, number>;
        margin: number;
        runnerUp: string | null;
        tieBreakUsed: boolean;
        tfChemicalRaw: number;
        sensitiveScalpFlag: boolean;
      };
    };
    expect(s.confidence_json.scores.HW).toBeGreaterThan(0);
    expect(typeof s.confidence_json.margin).toBe("number");
    expect(s.confidence_json.sensitiveScalpFlag).toBe(true);
  });

  it("stores a low-signal sheet without inventing an archetype", () => {
    const s = buildHairSnapshot({});
    expect(s.profile_code).toBe("low-signal");
    expect(s.traits_json).toEqual([]);
  });

  it("never puts a raw answer label in traits when the tag is unknown", () => {
    const s = buildHairSnapshot(sheet({ strand_thickness: "unknown" }));
    expect(s.traits_json).toEqual(["Loose wave", "Low density"]);
  });
});

describe("readHairSnapshot", () => {
  it("round-trips what the result screen needs", () => {
    const written = buildHairSnapshot(sheet({ scalp_concerns: ["itching"] }));
    const read = readHairSnapshot(written);
    expect(read.profileSlug).toBe("hidden-wave");
    expect(read.explanation.tags).toContain("Loose wave");
    expect(read.explanation.tags).toContain("Sensitive scalp consideration");
    expect(read.explanation.reasons[0]).toBe(
      "Waves or curls become more visible"
    );
    expect(read.explanation.advisory).toBe(true);
  });

  it("reads a low-signal snapshot back as no profile", () => {
    const read = readHairSnapshot(buildHairSnapshot({}));
    expect(read.profileSlug).toBe(null);
    expect(read.explanation.tags).toEqual([]);
    expect(read.explanation.reasons).toEqual([]);
  });

  it("survives a snapshot whose json columns are null or malformed", () => {
    const read = readHairSnapshot({
      profile_code: "hidden-wave",
      traits_json: null,
      summary_json: "not an object",
      confidence_json: null,
    });
    expect(read.profileSlug).toBe("hidden-wave");
    expect(read.explanation).toEqual({
      tags: [],
      reasons: [],
      advisory: false,
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/haircare/snapshot.test.ts`
Expected: FAIL — cannot resolve `./snapshot`.

- [ ] **Step 3: Write the module**

Create `lib/haircare/snapshot.ts`:

```ts
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
    // Tags minus the advisory chip — that one is re-derived on read from the
    // advisory flag, so storing it would give it two sources.
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/haircare && npm run typecheck`
Expected: PASS. If the `traits_json` assertion fails on the advisory case, check
that `SENSITIVE_TAG` here is character-identical to the one in `explain.ts` — the
round-trip depends on it.

- [ ] **Step 5: Commit**

```bash
git add lib/haircare/snapshot.ts lib/haircare/snapshot.test.ts
git commit -m "feat(haircare): map a scored quiz onto profile_snapshots columns"
```

---

### Task 4: Completion writes the real snapshot

**Files:**

- Modify: `app/actions/profile.ts` — replace `ensurePlaceholderSnapshot`
- Test: `app/actions/profile.test.ts` (modify the completion assertions)

**Interfaces:**

- Consumes: `hydrateResponses` (Task 2), `buildHairSnapshot` (Task 3),
  `repo.findResponsesByAttempt` / `repo.insertSnapshot` /
  `repo.findSnapshotByAttempt` (existing).
- Produces: `ensureHairSnapshot(admin, attemptId, identityId, loaded)` replacing
  the placeholder, same `{ id, inserted }` contract so both completion paths
  (first completion and idempotent replay) keep working unchanged.

- [ ] **Step 1: Write the failing test**

In `app/actions/profile.test.ts`, find the completion suite and add:

```ts
it("writes the scored archetype, not a placeholder", async () => {
  const { attemptId } = await startAndAnswerFullHairQuiz();
  const res = await completeQuizAttempt(attemptId);
  expect(res.ok).toBe(true);

  const snap = insertedSnapshots.at(-1)!;
  expect(snap.profile_code).toBe("hidden-wave");
  expect(snap.rule_set_version).toBe("score-1.0.0");
  expect(snap.profile_code).not.toBe("placeholder");
  expect(snap.rule_set_version).not.toBe("placeholder-0");
});

it("keeps completion idempotent — a replay returns the same snapshot id", async () => {
  const { attemptId } = await startAndAnswerFullHairQuiz();
  const first = await completeQuizAttempt(attemptId);
  const replay = await completeQuizAttempt(attemptId);
  expect(first.ok && replay.ok).toBe(true);
  if (first.ok && replay.ok) {
    expect(replay.resultId).toBe(first.resultId);
    expect(replay.firstCompletion).toBe(false);
  }
  expect(insertedSnapshots).toHaveLength(1);
});
```

This file already `vi.mock`s the whole of `@/lib/profile/quiz-repo`, so there is
no database and no capture array to add — the inserted row is just
`vi.mocked(repo.insertSnapshot).mock.calls[0][1]`. What the tests above need is a
v1 definition fixture and stored responses, both generated from `HAIR_QUIZ` so
they can't drift from it. Add next to the file's existing fixtures:

```ts
import { HAIR_QUIZ } from "@/lib/haircare/quiz";

/** DB rows for the real v1 definition, generated from the definition itself. */
function hairV1Rows() {
  const def: DefRow = { ...DEF, id: "def-v1", version: 1 };
  const questions: QuestionRow[] = HAIR_QUIZ.questions.map((q, i) => ({
    ...QUESTION_BASE,
    id: `q-${q.key}`,
    quiz_definition_id: def.id,
    question_key: q.key,
    question_type: q.type,
    section_key: q.sectionKey ?? null,
    position: i,
    is_required: q.isRequired,
    allows_multiple: q.allowsMultiple,
    content_key: q.content,
    validation_json: (q.validation ?? null) as never,
  }));
  const options: OptionRow[] = HAIR_QUIZ.questions.flatMap((q) =>
    q.options.map((o, j) => ({
      ...OPTION_BASE,
      id: `o-${q.key}-${o.key}`,
      question_id: `q-${q.key}`,
      option_key: o.key,
      position: j,
      content_key: o.label,
      value_code: o.value,
    }))
  );
  return { def, questions, options };
}

/** The hidden-wave sheet, as stored quiz_responses rows (value codes). */
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

/** Point the mocked repo at the v1 definition, a completable attempt, and answers. */
function arrangeCompletableHairAttempt() {
  const { def, questions, options } = hairV1Rows();
  vi.mocked(anon.readAnonToken).mockReturnValue("tok");
  vi.mocked(repo.findIdentityByHash).mockResolvedValue(IDENTITY as never);
  vi.mocked(repo.findDefinitionRowById).mockResolvedValue(def as never);
  vi.mocked(repo.findQuestionRows).mockResolvedValue(questions as never);
  vi.mocked(repo.findOptionRows).mockResolvedValue(options as never);
  vi.mocked(repo.findOwnedAttempt).mockResolvedValue({
    ...ATTEMPT,
    quiz_definition_id: def.id,
    status: "in_progress",
  } as never);
  vi.mocked(repo.findAnsweredQuestionIds).mockResolvedValue(
    questions.map((q) => q.id) as never
  );
  vi.mocked(repo.findResponsesByAttempt).mockResolvedValue(
    Object.entries(HIDDEN_WAVE_ANSWERS).map(([key, value]) => ({
      questionId: `q-${key}`,
      responseJson: value,
    })) as never
  );
  vi.mocked(repo.casCompleteAttempt).mockResolvedValue(true as never);
  vi.mocked(repo.insertSnapshot).mockResolvedValue({ id: "snap-1" } as never);
  vi.mocked(repo.findSnapshotByAttempt).mockResolvedValue(null as never);
}
```

`QUESTION_BASE`, `OPTION_BASE`, `ATTEMPT` and `DEF` are the fixture names already
in this file — reuse whatever they are actually called there rather than adding
parallel ones. Then the two tests read:

```ts
it("writes the scored archetype, not a placeholder", async () => {
  arrangeCompletableHairAttempt();
  const res = await completeQuizAttempt(ATTEMPT_ID);
  expect(res.ok).toBe(true);

  const row = vi.mocked(repo.insertSnapshot).mock.calls[0][1] as {
    profile_code: string;
    rule_set_version: string;
    traits_json: unknown;
  };
  expect(row.profile_code).toBe("hidden-wave");
  expect(row.rule_set_version).toBe("score-1.0.0");
  expect(row.traits_json).toContain("Loose wave");
});

it("keeps completion idempotent — a replay returns the same snapshot id", async () => {
  arrangeCompletableHairAttempt();
  const first = await completeQuizAttempt(ATTEMPT_ID);
  // Replay: the attempt is already completed and the snapshot exists.
  vi.mocked(repo.findOwnedAttempt).mockResolvedValue({
    ...ATTEMPT,
    quiz_definition_id: "def-v1",
    status: "completed",
  } as never);
  vi.mocked(repo.findSnapshotByAttempt).mockResolvedValue({
    id: "snap-1",
  } as never);
  const replay = await completeQuizAttempt(ATTEMPT_ID);
  expect(first.ok && replay.ok).toBe(true);
  if (first.ok && replay.ok) {
    expect(replay.resultId).toBe(first.resultId);
    expect(replay.firstCompletion).toBe(false);
  }
  expect(vi.mocked(repo.insertSnapshot)).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/actions/profile.test.ts`
Expected: FAIL — `profile_code` is `"placeholder"`.

- [ ] **Step 3: Replace the placeholder writer**

In `app/actions/profile.ts`, replace `ensurePlaceholderSnapshot` with:

```ts
/**
 * Score the stored responses and persist the result, exactly once per attempt.
 * Recovers on the unique violation so a completion that flipped the status but
 * lost the snapshot write is repaired rather than bricking the attempt (H5).
 */
async function ensureHairSnapshot(
  admin: ReturnType<typeof createAdminClient>,
  attemptId: string,
  identityId: string,
  loaded: LoadedQuizDefinition
): Promise<{ id: string; inserted: boolean }> {
  const stored = await repo.findResponsesByAttempt(admin, attemptId);
  const responses = hydrateResponses(loaded, stored);
  const fields = buildHairSnapshot(responses);
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
```

Then update both call sites in `completeQuizAttempt` — the replay branch and the
post-CAS branch — from
`ensurePlaceholderSnapshot(admin, attemptId, identity.id, loaded.quizKey)` to
`ensureHairSnapshot(admin, attemptId, identity.id, loaded)`.

Add the import: `import { buildHairSnapshot } from "@/lib/haircare/snapshot";`

Note the domain gate: this action is hair-only today (the flag check is
`hair_profile`). When the skin quiz lands, `ensureHairSnapshot` becomes a
dispatch on `loaded.quizKey` — leave a comment saying so rather than building the
dispatch now.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/actions lib && npm run typecheck && npm run lint`
Expected: PASS, including every pre-existing completion test (required-response
check, CAS, expiry, ownership).

- [ ] **Step 5: Commit**

```bash
git add app/actions/profile.ts app/actions/profile.test.ts
git commit -m "feat(profile): persist the scored archetype on completion"
```

---

### Task 5: `getProfileSnapshot` + the durable result route

**Files:**

- Modify: `app/actions/profile.ts` (add the action)
- Modify: `lib/profile/quiz-repo.ts` (add the owner-scoped read)
- Create: `app/beauty-profile/hair/result/[snapshot]/page.tsx`
- Test: `app/actions/profile.test.ts` (append)

**Interfaces:**

- Consumes: `readHairSnapshot` (Task 3), `resolveIdentity` (existing private
  helper in the action file).
- Produces:
  - `repo.findOwnedSnapshot(admin, snapshotId, identityId): Promise<SnapshotRow | null>`
  - `getProfileSnapshot(snapshotId: string): Promise<ActionResult<{ profileSlug: string | null; explanation: HairResultExplanation }>>`

  Task 6 redirects to the route that renders this.

- [ ] **Step 1: Write the failing test**

Append to the completion suite in `app/actions/profile.test.ts`:

```ts
const SNAPSHOT_ID = "33333333-3333-4333-8333-333333333333";

it("serves a snapshot to its owner", async () => {
  vi.mocked(anon.readAnonToken).mockReturnValue("tok");
  vi.mocked(repo.findIdentityByHash).mockResolvedValue(IDENTITY as never);
  vi.mocked(repo.findOwnedSnapshot).mockResolvedValue({
    profile_code: "hidden-wave",
    profile_domain: "hair",
    traits_json: ["Loose wave", "Fine strands"],
    summary_json: {
      reasons: ["Waves or curls become more visible"],
      advisory: false,
    },
    confidence_json: { margin: 4 },
  } as never);

  const res = await getProfileSnapshot(SNAPSHOT_ID);
  expect(res.ok).toBe(true);
  if (res.ok) {
    expect(res.profileSlug).toBe("hidden-wave");
    expect(res.explanation.tags).toContain("Loose wave");
    expect(res.explanation.reasons[0]).toBe(
      "Waves or curls become more visible"
    );
  }
});

it("does not disclose a snapshot the caller does not own", async () => {
  vi.mocked(anon.readAnonToken).mockReturnValue("tok");
  vi.mocked(repo.findIdentityByHash).mockResolvedValue(IDENTITY as never);
  // The repo read is identity-scoped, so a foreign snapshot comes back null —
  // the same answer as one that doesn't exist. Assert the codes are identical.
  vi.mocked(repo.findOwnedSnapshot).mockResolvedValue(null as never);
  const foreign = await getProfileSnapshot(SNAPSHOT_ID);

  vi.mocked(repo.findOwnedSnapshot).mockResolvedValue(null as never);
  const missing = await getProfileSnapshot(
    "44444444-4444-4444-8444-444444444444"
  );

  expect(foreign.ok).toBe(false);
  expect(missing.ok).toBe(false);
  if (!foreign.ok && !missing.ok) {
    expect(foreign.error).toBe("SNAPSHOT_NOT_FOUND");
    expect(foreign.error).toBe(missing.error);
  }
});

it("refuses a caller with no anonymous identity", async () => {
  vi.mocked(anon.readAnonToken).mockReturnValue(undefined as never);
  const res = await getProfileSnapshot(SNAPSHOT_ID);
  expect(res.ok).toBe(false);
  if (!res.ok) expect(res.error).toBe("SNAPSHOT_NOT_FOUND");
});

it("rejects a malformed snapshot id without touching the database", async () => {
  vi.mocked(repo.findOwnedSnapshot).mockClear();
  const res = await getProfileSnapshot("not-a-uuid");
  expect(res.ok).toBe(false);
  if (!res.ok) expect(res.error).toBe("VALIDATION_FAILED");
  expect(repo.findOwnedSnapshot).not.toHaveBeenCalled();
});
```

Add `findOwnedSnapshot: vi.fn(),` to the `vi.mock("@/lib/profile/quiz-repo", …)`
factory at the top of the file, and `getProfileSnapshot` to the import from
`./profile`.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/actions/profile.test.ts`
Expected: FAIL — `getProfileSnapshot` is not exported.

- [ ] **Step 3: Add the owner-scoped repo read**

Append to `lib/profile/quiz-repo.ts`:

```ts
/** A snapshot, only if this identity owns it. Ownership is never taken from the URL. */
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
```

- [ ] **Step 4: Add the error code**

In `lib/profile/errors.ts`, add `SNAPSHOT_NOT_FOUND` to the `ProfileErrorCode`
union alongside `ATTEMPT_NOT_FOUND`, following the existing shape of that file.

- [ ] **Step 5: Add the action**

Append to `app/actions/profile.ts`:

```ts
// ---------------------------------------------------------------------------
// getProfileSnapshot — owner-scoped durable result.
// ---------------------------------------------------------------------------
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
    if (!identity) return fail("SNAPSHOT_NOT_FOUND");

    const row = await repo.findOwnedSnapshot(admin, snapshotId, identity.id);
    // Not owned and not found are the same answer on purpose: a probing client
    // must not learn that an id exists (docs/adr/0001).
    if (!row) return fail("SNAPSHOT_NOT_FOUND");

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
```

Add the imports: `readHairSnapshot` from `@/lib/haircare/snapshot` and
`type HairResultExplanation` from `@/lib/haircare/explain`.

Note this action is **not** flag-gated: a result already written must stay
readable even if the persistence flag is later switched off.

- [ ] **Step 6: Add the route**

Create `app/beauty-profile/hair/result/[snapshot]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileSnapshot } from "@/app/actions/profile";
import { getHairProfile } from "@/lib/haircare/profiles";
import { HairResultView } from "@/components/editorial/HairResultView";

// The durable Hair Profile result. Ownership is proven from the anon cookie, so
// the id in the URL is not a capability — a snapshot someone else owns 404s and
// does not reveal that it exists. noindex: results are personal, not landings.
export const metadata: Metadata = {
  title: "Your Hair Profile",
  robots: { index: false, follow: false },
};

export default async function HairResultPage({
  params,
}: {
  params: { snapshot: string };
}) {
  const res = await getProfileSnapshot(params.snapshot);
  if (!res.ok) notFound();

  return (
    <main>
      <HairResultView
        profile={
          res.profileSlug ? (getHairProfile(res.profileSlug) ?? null) : null
        }
        explanation={res.explanation}
        retakeHref="/beauty-profile/hair/quiz"
      />
    </main>
  );
}
```

- [ ] **Step 7: Give the result screen a link-based retake**

`HairProfileResult` takes `onRetake: () => void`, which a server component can't
pass. Add a thin client wrapper `components/editorial/HairResultView.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { HairProfileResult } from "./HairProfileResult";
import type { HairProfile } from "@/lib/haircare/profiles";
import type { HairResultExplanation } from "@/lib/haircare/explain";

// Server components can't hand a function to a client component, so the durable
// result route wraps the presentational screen and turns Retake into navigation.
export function HairResultView({
  profile,
  explanation,
  retakeHref,
}: {
  profile: HairProfile | null;
  explanation: HairResultExplanation;
  retakeHref: string;
}) {
  const router = useRouter();
  return (
    <HairProfileResult
      profile={profile}
      explanation={explanation}
      onRetake={() => router.push(retakeHref)}
    />
  );
}
```

- [ ] **Step 8: Run tests and the build**

Run: `npx vitest run && npm run typecheck && npm run lint && npm run build`
Expected: all pass, and the build lists `/beauty-profile/hair/result/[snapshot]`
as a dynamic (`ƒ`) route.

- [ ] **Step 9: Commit**

```bash
git add lib/profile/quiz-repo.ts lib/profile/errors.ts app/actions/profile.ts app/actions/profile.test.ts app/beauty-profile/hair/result components/editorial/HairResultView.tsx
git commit -m "feat(profile): durable owner-scoped Hair Profile result route"
```

---

### Task 6: Unify the public quiz onto the persisted path, with fallback

The public quiz keeps rendering immediately and client-side. An attempt is
bootstrapped in parallel; if it lands, answers persist and completion redirects
to the durable result. If it doesn't — no service key, flag off, network failure
— the quiz behaves exactly as it does today. **The public page must never break
because persistence is unavailable.**

**Files:**

- Modify: `components/editorial/HairQuizClient.tsx`
- Test: `components/editorial/HairQuizClient.test.tsx`

**Interfaces:**

- Consumes: `startQuizAttempt`, `saveQuizResponse`, `completeQuizAttempt`
  (existing), `profileQuizStarted` / `profileQuizResumed` (existing).
- Produces: no new exports. `HairQuizClient` gains the two modes internally.

- [ ] **Step 1: Write the failing tests**

Add to `components/editorial/HairQuizClient.test.tsx`:

```tsx
vi.mock("@/app/actions/profile", () => ({
  startQuizAttempt: vi.fn(),
  saveQuizResponse: vi.fn().mockResolvedValue({ ok: true }),
  completeQuizAttempt: vi.fn(),
}));
const pushed: string[] = [];
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: (href: string) => pushed.push(href) }),
}));

import {
  startQuizAttempt,
  saveQuizResponse,
  completeQuizAttempt,
} from "@/app/actions/profile";

describe("HairQuizClient with persistence available", () => {
  beforeEach(() => {
    pushed.length = 0;
    vi.clearAllMocks();
    vi.mocked(startQuizAttempt).mockResolvedValue({
      ok: true,
      attemptId: "11111111-1111-4111-8111-111111111111",
      quizVersion: 1,
      status: "in_progress",
      created: true,
    } as never);
    vi.mocked(completeQuizAttempt).mockResolvedValue({
      ok: true,
      resultId: "22222222-2222-4222-8222-222222222222",
      status: "completed",
      firstCompletion: true,
      durationBucket: "under_1m",
    } as never);
  });

  it("renders the first question without waiting for the attempt", () => {
    render(<HairQuizClient />);
    expect(screen.getByText("Step 1 of 16")).toBeTruthy();
  });

  it("flushes every answer and redirects to the durable result", async () => {
    render(<HairQuizClient />);
    await act(async () => {}); // let the attempt bootstrap resolve
    completeQuiz(HIDDEN_WAVE);
    await waitFor(() => expect(completeQuizAttempt).toHaveBeenCalled());
    expect(
      vi.mocked(saveQuizResponse).mock.calls.length
    ).toBeGreaterThanOrEqual(16);
    await waitFor(() =>
      expect(pushed).toContain(
        "/beauty-profile/hair/result/22222222-2222-4222-8222-222222222222"
      )
    );
  });
});

describe("HairQuizClient without persistence", () => {
  beforeEach(() => {
    pushed.length = 0;
    vi.clearAllMocks();
    vi.mocked(startQuizAttempt).mockResolvedValue({
      ok: false,
      error: "FEATURE_DISABLED",
    } as never);
  });

  it("falls back to the in-page result and never navigates", async () => {
    render(<HairQuizClient />);
    await act(async () => {});
    completeQuiz(HIDDEN_WAVE);
    expect(
      screen.getByRole("heading", { level: 1, name: "The Hidden Wave" })
    ).toBeTruthy();
    expect(pushed).toEqual([]);
    expect(saveQuizResponse).not.toHaveBeenCalled();
  });

  it("still reports the quiz start exactly once", async () => {
    render(<HairQuizClient />);
    await act(async () => {});
    expect(profileQuizStarted).toHaveBeenCalledTimes(1);
  });
});
```

Import `act` and `waitFor` from `@testing-library/react` alongside the existing
imports.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run components/editorial/HairQuizClient.test.tsx`
Expected: FAIL — nothing calls `startQuizAttempt`, nothing navigates.

- [ ] **Step 3: Rewrite `HairQuizClient`**

Replace the `HairQuizClient` function in `components/editorial/HairQuizClient.tsx`
with this. `HairQuizResult` (the existing in-page result view) stays exactly as it
is — it becomes the fallback branch.

Note `onSaveResponse` always resolves `{ ok: true }`: `QuizShell` blocks the user
from advancing on a failed save, which is right for a server-only quiz but wrong
here — a persistence hiccup must not trap someone in a quiz that works fine
client-side. The flush in `HairQuizFinish` is the safety net.

```tsx
export function HairQuizClient() {
  const startedAt = useRef(Date.now());
  const reported = useRef(false);
  // A ref, not state: nothing renders off the attempt, and the quiz must not
  // re-render when it lands mid-question. null = client-only for this run.
  const attemptId = useRef<string | null>(null);
  const saved = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    profileQuizStarted({
      domain: DOMAIN,
      quizVersion: VERSION,
      entrySource: "hair_quiz_page",
    });
    // Bootstrapped in parallel with the user reading question 1. A failure is
    // not an error state — it means this run scores client-side and stays there.
    void startQuizAttempt(DOMAIN, "hair_quiz_page", makeNonce()).then((res) => {
      if (!res.ok) return;
      attemptId.current = res.attemptId;
      if (!res.created)
        profileQuizResumed({
          domain: DOMAIN,
          quizVersion: VERSION,
          resumeAgeBucket: res.resumeAgeBucket ?? "unknown",
        });
    });
  }, []);

  async function onSaveResponse(questionKey: string, value: QuizResponseValue) {
    const id = attemptId.current;
    if (id) {
      const res = await saveQuizResponse(id, questionKey, value);
      if (res.ok) saved.current.add(questionKey);
    }
    // Never block advancing on persistence — see the note above this code block.
    return { ok: true as const };
  }

  return (
    <QuizShell
      definition={HAIR_QUIZ}
      exitHref="/beauty-profile/hair"
      onSaveResponse={onSaveResponse}
      onStepView={(stepKey, stepIndex) =>
        profileQuizStepViewed({
          domain: DOMAIN,
          quizVersion: VERSION,
          stepKey,
          stepIndex,
        })
      }
      onStepCompleted={(stepKey, stepIndex, validationErrorCount) =>
        profileQuizStepCompleted({
          domain: DOMAIN,
          quizVersion: VERSION,
          stepKey,
          stepIndex,
          validationErrorCount,
        })
      }
      renderResult={({ responses, restart }) => (
        <HairQuizFinish
          responses={responses}
          startedAt={startedAt.current}
          attemptId={attemptId.current}
          savedKeys={saved.current}
          onRetake={restart}
        />
      )}
    />
  );
}
```

**Careful:** passing `onSaveResponse` makes `QuizShell` show its "Saving…"
indicator and its `serverBacked` label, which is what we want. It does **not**
make it call `onComplete` — that prop stays absent, so `renderResult` still owns
completion. Verify by running the QuizShell suite in Step 4; if a QuizShell test
about the final button label fails, the label logic
(`serverBacked || renderResult`) is already correct and the failure means
something else changed.

Then add `HairQuizFinish` to the same file:

```tsx
/**
 * Completion. With an attempt: flush any answer whose autosave didn't land (the
 * attempt may have arrived after the first steps), complete server-side, and
 * hand off to the durable result. Without one, or if any of that fails, render
 * the in-page result — the user always gets their profile.
 */
function HairQuizFinish({
  responses,
  startedAt,
  attemptId,
  savedKeys,
  onRetake,
}: {
  responses: Record<string, QuizResponseValue>;
  startedAt: number;
  attemptId: string | null;
  savedKeys: Set<string>;
  onRetake: () => void;
}) {
  const router = useRouter();
  const ran = useRef(false);
  const [fellBack, setFellBack] = useState(attemptId === null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (attemptId === null) return; // client-only: HairQuizResult renders below

    void (async () => {
      try {
        // upsertResponse is idempotent, so re-saving a landed answer is free.
        for (const [key, value] of Object.entries(responses)) {
          if (savedKeys.has(key)) continue;
          const r = await saveQuizResponse(attemptId, key, value);
          if (!r.ok) throw new Error(r.error);
        }
        const done = await completeQuizAttempt(attemptId);
        if (!done.ok) throw new Error(done.error);
        if (done.firstCompletion)
          profileQuizCompleted({
            domain: DOMAIN,
            quizVersion: VERSION,
            durationBucket: done.durationBucket ?? "unknown",
          });
        router.push(`/beauty-profile/hair/result/${done.resultId}`);
      } catch {
        setFellBack(true);
      }
    })();
  }, []);

  if (!fellBack) return <QuizResultPending />;
  return (
    <HairQuizResult
      responses={responses}
      startedAt={startedAt}
      onRetake={onRetake}
    />
  );
}
```

And a minimal pending state (it is on screen for one round-trip, so it must be
quiet, not a spinner-and-skeleton):

```tsx
function QuizResultPending() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:py-24" aria-live="polite">
      <p className="text-xs uppercase tracking-widest text-accent">
        Hair Profile
      </p>
      <h1 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
        Building your profile…
      </h1>
    </div>
  );
}
```

Add the imports this needs: `useState` from react, `useRouter` from
`next/navigation`, and `startQuizAttempt` / `saveQuizResponse` /
`completeQuizAttempt` from `@/app/actions/profile`, plus `profileQuizResumed`.
Copy `makeNonce` from `StartQuizButton.tsx` into a shared spot —
`lib/profile/nonce.ts` exporting `makeNonce()` — and import it in both, rather
than duplicating it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/editorial && npm run typecheck && npm run lint`
Expected: PASS — both new suites plus the four pre-existing HairQuizClient cases.
The pre-existing ones now run with `startQuizAttempt` mocked to fail, which is
the fallback path, so they should be unchanged.

- [ ] **Step 5: Retire the now-redundant entry**

`/beauty-profile/hair/quiz/start` existed only to create an attempt before the
runner. `/quiz` does that itself now. Delete
`app/beauty-profile/hair/quiz/start/page.tsx` and
`components/editorial/StartQuizButton.tsx` **plus its test**, and confirm nothing
else imports them:

```bash
grep -rn "StartQuizButton\|quiz/start" app components lib --include=*.ts --include=*.tsx
```

Expected: no hits outside the files being deleted. Keep
`app/beauty-profile/hair/quiz/[attempt]/page.tsx` — a resumed attempt link is
still a valid entry and it already renders `QuizRunner`.

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run && npm run typecheck && npm run lint && npm run build`
Expected: all pass; the build no longer lists `/beauty-profile/hair/quiz/start`.

```bash
git add -A
git commit -m "feat(profile): unify the public quiz onto the persisted path with fallback"
```

---

### Task 7: Render the routine on the profile landings, then verify end to end

**Files:**

- Modify: `app/haircare/profiles/[slug]/page.tsx`
- Test: manual (a static server component rendering data already covered by
  `lib/haircare/profiles.test.ts`)

**Interfaces:**

- Consumes: `HairProfile.routine` (added in the previous PR, currently unrendered
  outside the quiz result).
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Add the routine section**

Read `app/haircare/profiles/[slug]/page.tsx` and add, after the existing
`useCarefully` section and before the closing disclaimer, matching that file's
existing heading and list classes:

```tsx
<section className="mt-12">
  <h2 className="font-serif text-2xl">Build your routine</h2>
  <ol className="mt-4 grid gap-4 sm:grid-cols-2">
    {profile.routine.map((s) => (
      <li key={s.step} className="border-t border-soft-gray pt-3">
        <p className="text-[11px] uppercase tracking-label text-accent">
          {s.step}
        </p>
        <p className="mt-1 text-sm text-text-muted">{s.detail}</p>
      </li>
    ))}
  </ol>
</section>
```

- [ ] **Step 2: Full verification**

Run: `npm run typecheck && npm test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 3: Drive the real thing**

`npm run dev`, then with the `hair_profile` flag **on** in `.env.local`
(`NEXT_PUBLIC_FLAG_HAIR_PROFILE=1`):

1. `/beauty-profile/hair` → "Start the quiz".
2. Answer all 16 steps. **Refresh at step 8** — the attempt exists, so
   `/quiz` restarts at step 1 but the answers are already persisted; confirm the
   server has them (`quiz_responses` count for the attempt = 8).
3. Finish → you land on `/beauty-profile/hair/result/<uuid>`, not an in-page
   result. **Refresh it — the result is still there.** That is the whole point of
   this PR.
4. Open the same result URL in a different browser (or a private window) → 404.
5. Set `NEXT_PUBLIC_FLAG_HAIR_PROFILE=0`, restart, run the quiz again → it
   completes with the **in-page** result and no navigation. Nothing 404s.
6. `/haircare/profiles/hidden-wave` → the four routine steps render.

- [ ] **Step 4: Check the stored row**

```bash
node -e '
const fs=require("fs");
const env=k=>{for(const l of fs.readFileSync(".env.local","utf8").split("\n"))
  if(l.startsWith(k+"="))return l.slice(k.length+1).trim().replace(/^"|"$/g,"")};
const U=env("NEXT_PUBLIC_SUPABASE_URL"),K=env("SUPABASE_SERVICE_ROLE_KEY");
fetch(U+"/rest/v1/profile_snapshots?select=profile_code,rule_set_version,traits_json,summary_json,confidence_json&order=created_at.desc&limit=1",
  {headers:{apikey:K,Authorization:"Bearer "+K}}).then(r=>r.json()).then(r=>console.log(JSON.stringify(r[0],null,2)))'
```

Expected: `profile_code` is a real archetype slug (not `placeholder`),
`rule_set_version` is `score-1.0.0`, `traits_json` holds the tags,
`confidence_json` holds `scores` / `margin` / `runnerUp`.

- [ ] **Step 5: Commit, review, and open the PR**

```bash
git add app/haircare/profiles
git commit -m "feat(haircare): render the profile routine on its landing page"
```

Then `/code-review` and `/security-review` — focus the security pass on the
snapshot ownership proof, the not-owned-vs-not-found indistinguishability, and
that no answer text reaches analytics. Then push and open the PR.

---

## Out of scope (still)

The consent surface and the Essenly brand-sharing pipeline. Spec §12 records why
they can't ship before the data actually moves, and the consent draft itself
requires legal review first. Also still open: the skin quiz, and
`v_brand_aggregate` / `v_brand_rowlevel` / `v_brand_identifiable`.
