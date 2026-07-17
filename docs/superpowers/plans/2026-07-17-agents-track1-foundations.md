# Editorial Agents — Track 1: Foundations Implementation Plan

> **For agentic workers:** Implement task-by-task with checkbox (`- [ ]`) tracking.
> TDD for all pure logic. No live LLM/Reddit calls in tests.

**Goal:** Lay the data model, AI SDK wiring, and pure-logic foundations for the
research/writing agents — everything Track 2 (research agent + candidate review
UI) and Track 3 (writing agent + AI review) build on. After this plan, the repo
can call a model through Vercel AI Gateway with schema-validated output, and the
`place_candidates` / `research_runs` tables exist with typed admin services.

**Spec:** `docs/superpowers/specs/2026-07-17-editorial-research-agents-design.md`
**Prerequisite:** Admin CMS CRUD (PR `feat/admin-cms-crud`) merged.

**Tech stack additions (first LLM deps in the repo, contained per spec §5.1):**
`ai` (AI SDK, Vercel AI Gateway provider is built in) + `zod` (schemas for
`generateObject`). Both used ONLY inside `lib/agents/` + `services/agents/`.
`zod` must not spread into `lib/validation.ts` / `lib/admin/validate.ts`.

## Global Constraints

- **Additive-only schema** (spec §6): new tables + `ALTER TYPE ... ADD VALUE`.
  No modification of existing columns. Public read services untouched.
- **Status logic stays in `lib/admin/workflow.ts`** — extending POST_STATUSES
  happens there and only there (admin-cms spec §7 rule 1).
- **No network in tests:** the model client and Supabase client are injected /
  mocked; fixtures cover model output parsing.
- **`place_candidates` is never read by public services.** RLS `for all to
authenticated` (same posture as CMS spec §4.1 — app-layer allowlist is the
  real gate).
- **Env:** `AI_GATEWAY_API_KEY` (Vercel AI Gateway). Absent key → agents module
  throws a clear config error at call time; nothing else in the app is affected.
- Commit trailer: `Co-Authored-By: Claude <noreply@anthropic.com>` (per repo convention).

## File Structure

```
supabase/migrations/0003_research_agents.sql   # NEW: tables + enum values + RLS
types/database.types.ts                        # REGENERATE after migration
lib/admin/workflow.ts                          # MODIFY: extend POST_STATUSES additively
lib/agents/
  model.ts                                     # NEW: gateway client factory (injectable)
  schemas.ts                                   # NEW: zod schemas (candidate, run config, draft)
  prompts.ts                                   # NEW: versioned prompt builders (research v1)
  dedupe.ts  dedupe.test.ts                    # NEW: dedupe_key + fuzzy match (pure, TDD)
  score.ts   score.test.ts                     # NEW: confidence scoring (pure, TDD)
services/agents/
  types.ts                                     # NEW: ResearchRun, PlaceCandidate + inputs
  runs.ts    runs.test.ts                      # NEW: research_runs CRUD (fake-supabase)
  candidates.ts  candidates.test.ts            # NEW: place_candidates CRUD + status transitions
```

---

### Task 1: Migration 0003 — research_runs, place_candidates, post fields, enum values

**Files:** create `supabase/migrations/0003_research_agents.sql`

- [ ] **Step 1:** Write the migration:
  - `research_runs`: `id uuid pk default gen_random_uuid()`, `agent text not null
check (agent in ('research','writer'))`, `area text not null`, `status text
not null default 'running' check (status in ('running','done','error'))`,
    `source_config jsonb`, `prompt_version text not null`, `counts jsonb`,
    `token_cost integer`, `error text`, `started_at timestamptz not null default
now()`, `finished_at timestamptz`.
  - `place_candidates`: `id uuid pk`, `run_id uuid references research_runs`,
    `name text not null`, `area text not null`, `category_guess place_category`,
    `why_notable text`, `source_urls jsonb not null`, `evidence jsonb`,
    `confidence numeric`, `dedupe_key text unique not null`, `status text not
null default 'new' check (status in
('new','reviewing','approved','rejected','promoted'))`,
    `promoted_place_id uuid references places`, `created_at/updated_at
timestamptz default now()` + the repo's existing `updated_at` trigger
    pattern from 0001.
  - Post workflow enum (additive): `ALTER TYPE post_status ADD VALUE IF NOT
EXISTS 'research'; ... 'ai_review'; ... 'ready'; ... 'archived';`
  - Posts additive columns: `ALTER TABLE posts ADD COLUMN IF NOT EXISTS brief
jsonb, ADD COLUMN IF NOT EXISTS research jsonb, ADD COLUMN IF NOT EXISTS
ai_review jsonb;`
  - RLS: enable on both new tables; `for select/insert/update/delete to
authenticated` (mirror 0002 style). NO anon access.
- [ ] **Step 2:** `npm run db:push` against the project (or document in
      PROVISIONING.md if deferred to the provisioning pass), then `npm run db:types`
      to regenerate `types/database.types.ts`.
- [ ] **Step 3:** Commit: `feat(agents): migration 0003 — research_runs, place_candidates, post workflow fields`

### Task 2: Extend the status workflow (additive)

**Files:** modify `lib/admin/workflow.ts` + `lib/admin/workflow.test.ts`

- [ ] **Step 1 (test first):** extend the workflow test — `POST_STATUSES` now
      `["draft","research","ai_review","ready","published","archived"]`; `isLive`
      still true ONLY for `published`; labels ("Research", "AI Review", "Ready",
      "Archived"). Run → FAIL.
- [ ] **Step 2:** Extend `POST_STATUSES` in `workflow.ts`. `LIVE_STATUSES`
      unchanged. Run → PASS. (StatusField and all UI pick this up automatically —
      that was the seam.)
- [ ] **Step 3:** Full suite + typecheck. Verify no public-service behavior
      change (public queries filter `status = 'published'`, untouched).
- [ ] **Step 4:** Commit: `feat(agents): extend post workflow statuses (additive, spec §7 seam)`

### Task 3: Install AI SDK + model factory

**Files:** `package.json`, create `lib/agents/model.ts`

- [ ] **Step 1:** `npm install ai zod`
- [ ] **Step 2:** `lib/agents/model.ts` — a small factory so orchestration code
      never imports `ai` directly and tests can inject a fake:

```ts
import { gateway } from "ai";

export const DEFAULT_RESEARCH_MODEL = "anthropic/claude-sonnet-5";

export function getModel(id: string = DEFAULT_RESEARCH_MODEL) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      "AI_GATEWAY_API_KEY is not set — agent features are unavailable."
    );
  }
  return gateway(id);
}
```

(Exact gateway import per current AI SDK docs at implementation time; keep the
factory shape.)

- [ ] **Step 3:** Typecheck + build (tree-shaking keeps `ai` out of public-page
      bundles; verify with build output). Commit:
      `feat(agents): AI SDK + Vercel AI Gateway model factory`

### Task 4: Zod schemas + versioned prompt builders

**Files:** create `lib/agents/schemas.ts`, `lib/agents/prompts.ts` (+ a small test)

- [ ] **Step 1:** `schemas.ts` — `CandidateSchema` (name, area, categoryGuess,
      whyNotable, sourceUrls min 1, evidenceQuote, confidence 0–1),
      `CandidateListSchema`, `RunConfigSchema`. Source-or-invalid is enforced HERE
      (`sourceUrls: z.array(z.string().url()).min(1)`).
- [ ] **Step 2:** `prompts.ts` — `RESEARCH_PROMPT_VERSION = "research-v1"` and
      `buildResearchExtractPrompt({ area, gathered })` returning the extraction
      prompt: cite sources verbatim, no invented places, confidence rubric, max-N
      candidates.
- [ ] **Step 3 (test):** parse a fixture of model output through
      `CandidateListSchema` (valid passes; missing sourceUrls fails); prompt builder
      contains the area, the version string, and the no-fabrication constraint.
- [ ] **Step 4:** Commit: `feat(agents): candidate schemas + versioned research prompts (TDD)`

### Task 5: Dedupe + confidence scoring (pure, TDD)

**Files:** create `lib/agents/dedupe.ts`, `dedupe.test.ts`, `score.ts`, `score.test.ts`

- [ ] **Step 1 (tests first):**
  - `dedupeKey(name, area)` — normalized (lowercase, NFKD, strip punctuation/
    spaces): `"Sool Loft" + "Seongsu"` ≡ `"sool-loft|seongsu"`; same key for
    `"SOOL  LOFT."`.
  - `isNearDuplicate(a, b)` — true for case/punctuation variants and containment
    ("Sool Loft Head Spa" vs "Sool Loft") in the same area; false across areas.
  - `filterNewCandidates(candidates, existingKeys)` — drops dupes, keeps order.
  - `combinedConfidence({ modelConfidence, sourceCount, hasEvidence })` — more
    independent sources ⇒ higher; no evidence quote ⇒ capped below approval
    threshold; output clamped 0–1.
- [ ] **Step 2:** Implement both modules (reuse `slugify` from `lib/slug.ts` for
      normalization). Run → PASS.
- [ ] **Step 3:** Commit: `feat(agents): dedupe + confidence scoring (TDD)`

### Task 6: Agent services — runs + candidates CRUD

**Files:** create `services/agents/types.ts`, `runs.ts`, `runs.test.ts`,
`candidates.ts`, `candidates.test.ts`

- [ ] **Step 1:** `types.ts` — `ResearchRun`, `ResearchRunInput`,
      `PlaceCandidate`, `PlaceCandidateInput`, reuse `WriteResult` from
      `services/admin/types`.
- [ ] **Step 2 (tests first, fake-supabase):**
  - `runs.ts`: `createRun(input)` → id; `finishRun(id, {status, counts,
tokenCost, error?})`; `listRecentRuns()`.
  - `candidates.ts`: `insertCandidates(runId, candidates[])` (maps camelCase →
    snake_case via one `toRow`; unique-violation on `dedupe_key` skips, not
    fails); `listCandidatesByStatus(status)`; `setCandidateStatus(id, status,
promotedPlaceId?)` guarding legal transitions (`new→reviewing/approved/
rejected`, `approved→promoted`; illegal → `{ok:false}`).
- [ ] **Step 3:** Implement both using the server Supabase client, same grain as
      `services/admin/*`. Run → PASS; full suite + typecheck + build.
- [ ] **Step 4:** Commit: `feat(agents): research run + place candidate services (TDD)`

### Task 7: Docs touch-up

- [ ] Update `docs/PROVISIONING.md`: applying 0003 + setting `AI_GATEWAY_API_KEY`
      (Vercel env + `.env.local`). Mark Track 1 done in the spec's §9 table.
- [ ] Commit: `docs(agents): provisioning notes for migration 0003 + gateway key`

---

## Definition of Done (Track 1)

- Migration 0003 applied; `database.types.ts` regenerated; RLS on new tables.
- `POST_STATUSES` extended additively; `isLive` semantics unchanged; suite green.
- `ai` + `zod` installed, contained to `lib/agents/` + `services/agents/`;
  missing `AI_GATEWAY_API_KEY` fails loudly only inside the agents module.
- Schemas enforce source-or-invalid; prompts versioned (`research-v1`).
- Dedupe/scoring pure functions unit-tested; candidate/run services tested
  against the fake client; no network in CI.
- `npm run test && npm run typecheck && npm run build` green.

**Next:** Track 2 — research agent orchestration (`services/agents/research.ts`:
Reddit API + web gather → extract → dedupe → persist) + admin `candidates/`
review surface with approve→promote, plus the manual trigger and one Vercel Cron.
