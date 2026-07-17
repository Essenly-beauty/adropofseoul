# A Drop of Seoul — Editorial Research & Writing Agents Design Spec (V2)

**Date:** 2026-07-17
**Status:** Draft (architecture) — top-level design, precedes implementation plans
**Owner:** jj@whatap.io (solo builder / editor)

> Elaborates the deferred **Sub-project C. Hip-spot discovery automation** promised
> in `2026-07-09-content-strategy-design.md`, and builds directly on the V2 "AI
> Editorial OS" seams reserved in `2026-06-29-admin-cms-design.md` §7.
> This is the **architecture** for the region-based place-research agent and the
> guide-writing agent. It defines the whole-system shape and phasing; each Track
> below gets its own implementation plan afterward.

## 1. Goal

Let the solo editor go from **"cover Seongsu"** to a **human-finishable draft**
with the machine doing the legwork — never the judgment:

1. A **research agent** discovers candidate Seoul hip-spots for a given area
   (지역), backed by real, cited sources, and files them as `place_candidates`
   for **human approval** in the admin.
2. A **writing agent** turns an approved set of places in an area into a
   `guides` article **draft** — in the house voice, with `[[ NOTE ]]` first-hand
   slots, internal links, SEO fields, and an FAQ block — that a human then
   finishes before publish.

**Non-negotiable framing (inherited from the content strategy):** Google
penalizes _scaled content abuse_. Every agent output is a **scaffold, not a
publication**. Two hard human gates — candidate approval and draft finishing —
sit between the model and the live site. The agent **never publishes** and
**never fabricates first-hand experience**; it leaves `[[ NOTE ]]` slots for the
human to fill. This is a force-multiplier for E-E-A-T, not a content farm.

## 2. Scope

**In scope (this architecture spec):**

- The end-to-end data flow: `area → research run → place candidates → human
approval → published place → guide draft → human finish → publish`.
- The data model deltas (all **additive**, per §7 rules): `place_candidates`,
  `research_runs`, and the post brief/research/AI-review fields + status enum
  extension.
- The agent runtime layer: where agent code lives, how it is triggered (Cron +
  manual), structured-output contract, prompt versioning, cost/rate caps.
- The two human-gate surfaces in the admin (candidate review; draft finish).
- The new runtime dependency decision (AI SDK via Vercel AI Gateway) and its
  blast-radius containment.
- Phasing into three implementation plans (§9).

**Out of scope (explicitly):**

- Instagram / TikTok ingest. No clean public API; scraping breaks ToS and is
  unreliable. Excluded by decision, not omission (see §3).
- Auto-publish of anything, ever.
- Affiliate link wiring (own spec, `content-strategy` Sub-project D).
- Social repurposing generation (the §7 "Repurpose" seam — separate).
- Fully autonomous multi-area scheduling tuning; V2 ships manual + a single
  simple cron, tuned later.

**Hard prerequisite:** the **Admin CMS CRUD core (Plan 3,
`2026-06-29-admin-cms-crud.md`) must be implemented first.** Both human gates
are admin surfaces, and the writing agent writes through the admin service
layer's `toRow` mapper. Plan 3 is currently _planned-only_ (only the `/admin`
auth shell exists). This spec assumes Plan 3 has landed; §9 sequences it.

## 3. Confirmed decisions

- **Isolate candidates from live data.** Research output lands in a **separate
  `place_candidates` table**, never directly in `places`. Low-confidence or
  spammy discoveries can't leak to the public site. Approval **promotes** a
  candidate into a real `places` draft via the existing admin `create` path.
- **Two hard human gates.** (1) Candidate approve/reject. (2) Draft finish (all
  `[[ NOTE ]]` resolved) before publish. Neither is skippable.
- **Sources over sizzle.** Every candidate stores its source URLs + extracted
  evidence. A candidate with no verifiable source is invalid. This is the
  E-E-A-T and fact-check backbone.
- **Sources: Reddit API + web search only.** Official Reddit API (ToS-clean) and
  general web research. No IG/TikTok.
- **Additive-only schema.** Follows §7 rule 2 — new tables + `ALTER TYPE ... ADD
VALUE`, one `toRow` mapper per entity. No rewrites of Plan 3 code.
- **AI SDK via Vercel AI Gateway**, scoped to the agent layer (§5.1). This is the
  first LLM/AI dependency in the repo; contained so the rest of the app stays
  dependency-stable, matching the "no new runtime deps" grain of Plans 1–3
  everywhere _except_ the agent modules.
- **Structured output, not free text.** Agents return schema-validated objects
  (candidate lists, draft fields), so parsing is a validation step, not string
  scraping.

## 4. Data flow (whole system)

```
                       ┌─────────────── manual "Run research (area)" button
                       │                 or Vercel Cron (scheduled)
                       ▼
   area  ──►  RESEARCH AGENT  ──►  place_candidates  ──►  [HUMAN GATE 1]
             (Reddit + web,        (status=new,            approve │ reject
              LLM extract,          sources, evidence,        │
              dedupe, score)        confidence)               ▼ promote
                                                          places (draft, is_published=false)
                                                              │  editor curates / publishes places
                                                              ▼
   area + approved places ──►  WRITING AGENT  ──►  posts (status=draft, category=guides,
                              (house voice,          [[ NOTE ]] slots, internal links,
                               NOTE slots, SEO,        seo fields, FAQ)
                               FAQ, links)                 │
                                                           ▼
                                                    AI REVIEW AGENT (scores vs anti-AI-tells
                                                       + SEO checklist; suggests links)
                                                           │
                                                           ▼
                                                    [HUMAN GATE 2] finish NOTEs → editor review → publish
```

Each `research run` is one row in `research_runs` for observability, cost
accounting, and idempotency (re-running an area does not duplicate candidates).

## 5. Architecture

### 5.1 Agent runtime — `lib/agents/` + `services/agents/`

- **`lib/agents/`** — pure, testable pieces: prompt templates (versioned as
  string builders), output **schemas**, dedupe + confidence scoring, source
  normalization. No I/O; unit-tested like `lib/validation.ts`.
- **`services/agents/`** — orchestration with I/O: calls the model, reads/writes
  Supabase (server client), Reddit/web fetch. One module per agent:
  `research.ts`, `writer.ts`, `review.ts`.
- **Model access:** AI SDK (`ai`) through **Vercel AI Gateway** using
  `generateObject` (structured) / `generateText`. Default model a Claude tier via
  the gateway's `"anthropic/…"` string; configurable per agent. Schema library
  (zod) is introduced **only inside `lib/agents/`** for `generateObject` schemas —
  it does not spread to the hand-rolled `lib/validation.ts` / `lib/admin/validate.ts`.
- **Prompt versioning:** each agent prompt carries a version string stored on the
  run/output row, so a prompt change is traceable to the content it produced.
- **Guardrails baked into prompts:** the writing agent is instructed to _insert
  `[[ NOTE ]]` slots wherever first-hand experience, a price, a reaction, or an
  opinion is required_ — and to never invent them. The anti-AI-tells checklist
  from the content strategy is encoded as explicit constraints.

### 5.2 Research agent — `services/agents/research.ts`

Input: `{ area, sources?, limit? }`. Steps:

1. **Gather** — Reddit API queries (area + beauty/spot terms) + web search;
   collect posts/threads/pages with URLs.
2. **Extract** — `generateObject` over gathered text → array of candidate spots
   `{ name, category guess, area, why_notable, source_urls[], evidence_quote,
confidence }`.
3. **Dedupe** — against existing `places` (name+area fuzzy) and prior
   `place_candidates` (a stable `dedupe_key`). Known spots are dropped or merged.
4. **Persist** — surviving candidates → `place_candidates` (status `new`), linked
   to the `research_runs` row. Counts + errors recorded on the run.

Cost/rate caps: a per-run token budget and a max-candidates cap; the run stops
and records a partial result rather than running unbounded. Anything dropped is
**logged on the run** (no silent truncation).

### 5.3 Human gate 1 — admin candidate review

New admin surface under the Plan 3 shell (`app/admin/candidates/`):

- List of `place_candidates` grouped by area, newest run first: name, category
  guess, confidence, source count, status badge.
- Detail view shows the **sources (clickable) + evidence quotes** — the reviewer
  verifies before acting.
- Actions (server actions): **Approve** → promotes to a `places` draft
  (`is_published=false`) via the admin `places.create` path, candidate marked
  `promoted`; **Reject** (with optional reason) → `rejected`; **Edit** the
  candidate fields before promoting.
- Uses the reserved right-hand edit-page panel pattern from §7 rule 3.

### 5.4 Writing agent — `services/agents/writer.ts`

Input: `{ area, placeIds[] }` (approved/published places in the area). Steps:

1. Load the place rows + a few related published posts (for internal-link
   candidates) via the admin `listAll()`.
2. `generateObject` → a post draft object matching the `posts` input type:
   `{ title, slug, subtitle, excerpt, body(markdown), category='guides', tags,
seo_title, meta_description, featured_image=null, brief{...} }`, where `body`
   contains `[[ NOTE ]]` slots, an FAQ block, and inline links to the place
   entries + ≥2 articles.
3. Persist via the admin `posts.create` mapper → status **`draft`** (or
   `ai_review` if §5.5 runs inline). Never `published`.

The agent **must not** claim to have visited anywhere. First-person experience,
prices, reactions, and the "honest negative" are all `[[ NOTE ]]` slots for the
human, matching the content-strategy authorship model.

### 5.5 AI review agent — `services/agents/review.ts`

Given a draft, scores it against the **anti-AI-tells checklist** and **SEO
framework** from the content strategy (throat-clearing intro? ≥1 number/place per
section? honest negative present? seo_title/meta length? ≥2 internal links?),
returns scores + concrete suggestions, and computes **internal-link suggestions**
from `listAll()`. Rendered in the reserved edit-page side panel (§7). Advisory
only — it never blocks or auto-edits.

### 5.6 Triggers — Cron + manual

- **Manual:** buttons in admin ("Run research for area X", "Draft guide for area
  X from these places"). Primary path for V2.
- **Scheduled:** a single Vercel Cron (`vercel.ts` `crons`) hitting a gated route
  that runs research for a rotating area, files candidates for later review.
  Deliberately conservative; tuning deferred.
- All agent-invoking routes are behind the `isAllowedAdmin` gate (or a cron
  secret for the scheduled path).

## 6. Data model touchpoints (all additive)

New migration `0003_research_agents.sql` (0001/0002 exist today):

- **`research_runs`** — `id, agent ('research'|'writer'), area, status
('running'|'done'|'error'), source_config jsonb, prompt_version, counts jsonb
(found/kept/dropped), token_cost int, error text, started_at, finished_at`.
- **`place_candidates`** — `id, run_id (fk), name, area, category_guess
(place_category), why_notable, source_urls jsonb, evidence jsonb, confidence
numeric, dedupe_key text unique, status ('new'|'reviewing'|'approved'|
'rejected'|'promoted'), promoted_place_id (fk places, nullable), created_at,
updated_at`. RLS: `for all to authenticated` (same posture as §4.1 of the CMS
  spec — app-layer allowlist is the real gate). Never read by public services.
- **`posts` additions** (per §7 seams): `brief jsonb` (angle, target keyword,
  audience, outline), `research jsonb` (sources, notes, quotes), `ai_review jsonb`
  (scores, suggestions), and `ALTER TYPE post_status ADD VALUE 'research',
'ai_review', 'ready', 'archived'` extending the workflow — all routed through
  `lib/admin/workflow.ts`, no scattered string checks.

Public read services (`services/posts.ts`, `services/places.ts`) are **untouched**
and continue to filter on published status; candidates are invisible to them.

## 7. Safety, cost & quality

- **Human gates are structural**, not policy — a candidate can only reach the
  public site by an editor's Approve action, and a draft by the finish + publish
  flow. There is no code path from an agent to a published row.
- **Source-or-invalid:** candidates without a source URL are rejected at extract
  time.
- **Cost caps:** per-run token budget + max candidates; overruns stop cleanly and
  log what was dropped.
- **Idempotency:** `dedupe_key` prevents duplicate candidates across re-runs.
- **Traceability:** every candidate/draft links to its `research_runs` row and
  `prompt_version`.
- **Spam-policy alignment:** output volume is naturally gated by the human finish
  step; the agent produces scaffolds, humans produce publications.

## 8. Testing strategy

- **Unit (TDD):** dedupe + confidence scoring, prompt builders (assert
  constraints/versions present), schema parsing of a fixed model-output fixture,
  source normalization. All pure, no network.
- **Agent calls mocked in CI** — the model client is injected; tests assert
  orchestration (persist shape, status transitions, dedupe), not model quality.
  No live LLM/Reddit calls in CI.
- **Component (Testing Library):** candidate review list/detail; approve→promote
  action shape; AI-review panel rendering.
- **Build:** `npm run test && npm run typecheck && npm run build` green.
- **Live smoke (manual checklist):** run research for one area against real
  sources → verify candidates appear with sources → approve one → confirm it
  becomes a `places` draft → run the writer over 3 approved places → confirm a
  `guides` draft with `[[ NOTE ]]` slots + internal links appears, unpublished.

## 9. Phasing → implementation plans

This architecture splits into three plans, each landing independently:

| Plan                                           | Scope                                                                                                                                                                                                                         | Depends on         |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **(pre) Admin CMS CRUD**                       | `2026-06-29-admin-cms-crud.md` — must ship first                                                                                                                                                                              | Plans 1–2 (done)   |
| **Track 1 — Foundations** ✅ done (2026-07-17) | `0003` migration (`research_runs`, `place_candidates`, post brief/research/ai_review + status enum); AI SDK + Vercel AI Gateway wiring in `lib/agents/`; `services/agents/` skeleton + schemas; dedupe/scoring pure fns (TDD) | Admin CMS          |
| **Track 2 — Research + Gate 1**                | `services/agents/research.ts` (Reddit + web + extract + dedupe + persist); admin `candidates/` review surface + approve/reject/promote actions; manual trigger; one Vercel Cron                                               | Track 1            |
| **Track 3 — Writing + AI review**              | `services/agents/writer.ts` (area+places → guide draft with NOTE slots/links/FAQ/SEO); `review.ts` + edit-page AI-review panel; manual trigger                                                                                | Track 2, Admin CMS |

## 10. Definition of done (this spec)

- Whole-system data flow (§4) and each agent's contract (§5) agreed.
- Additive data model (§6) confirmed against §7 seams — no Plan 3 rewrites.
- AI SDK / Vercel AI Gateway dependency decision recorded and blast-radius
  contained to `lib/agents/` + `services/agents/`.
- Two human gates confirmed non-skippable; no agent→published path exists.
- Phasing (§9) accepted, with Admin CMS as the named prerequisite.

**Next:** write the **Track 1 — Foundations** implementation plan
(`docs/superpowers/plans/`), assuming Admin CMS CRUD has landed.
