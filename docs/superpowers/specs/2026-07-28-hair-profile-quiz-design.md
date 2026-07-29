# Hair Profile quiz — design (M3, hair domain)

**Date:** 2026-07-28
**Status:** approved (design), pending implementation plan
**Workstreams:** WS-06 (Hair Profile quiz), WS-07 (results experience) — `docs/01_PHASE1_BUILD_SPEC.md`
**Depends on:** M2b quiz framework (PRs #20 → #21 → #22)

---

## 1. Why this exists

`/beauty-profile/hair` currently ships a **profile chooser**: six hair archetypes
as links, with copy that says the guided quiz is "coming soon". There is no quiz.

Two reasons:

1. The quiz framework (`QuizShell` / `QuestionRenderer`, anonymous persistence,
   quiz routes) sits on three **open, stacked PRs** — #20, #21, #22 — not yet on
   `main`.
2. Even those carry only `PLACEHOLDER_HAIR_QUIZ` — five throwaway questions,
   `version: 0`, behind the default-OFF `hair_profile` flag. `docs/NEXT_TASK_M2b.md`
   deliberately deferred the real hair questions and result logic to M3, because
   copy and taxonomy need product review.

This spec is that deferred work, for the hair domain only. The question set and
scoring model come from an approved editorial preview (14 questions, six result
archetypes) whose archetypes already map 1:1 onto `HAIR_PROFILES` in
`lib/haircare/profiles.ts`:

| Preview code | `HAIR_PROFILES` slug    |
| ------------ | ----------------------- |
| `LB`         | `lightweight-balancer`  |
| `DG`         | `dense-glass-seeker`    |
| `OD`         | `oily-scalp-dry-ends`   |
| `HW`         | `hidden-wave`           |
| `MC`         | `moisture-seeking-curl` |
| `TF`         | `treated-fragile`       |

## 2. Decisions

1. **Merge the stack, then branch off `main`.** #20 → #21 → #22 merge bottom-up
   into `main` first (verified conflict-free against `main` with
   `git merge-tree`), then this work branches from `main` as a normal PR. Merging
   is user-invisible: every quiz route in that stack is flag-gated OFF and
   noindex, and the seed migration is a file only (manual-apply pattern, see
   `supabase/migrations/README.md`). Stacking a fourth PR would only buy rebase cost.
2. **Client-only scoring now; DB persistence later.** The definition and scoring
   live in code and run in `QuizShell`'s existing no-server mode. The quiz works
   with no `SUPABASE_SERVICE_ROLE_KEY`, no seeded definition, no snapshot write.
3. **In-page result.** The result renders at the end of the quiz, where the
   answers are still in hand — so "why this result" and the profile snapshot are
   derived from the real responses rather than re-guessed from a slug. Trade-off
   accepted: a refresh loses the result. The DB follow-up promotes this to a
   durable `/result/[snapshot]` route.
4. **Public, not flag-gated.** The quiz becomes the primary entry on
   `/beauty-profile/hair`; the six-profile chooser is demoted to a secondary
   "already know your profile?" section. Client-only means nothing can leak
   through a missing flag. Quiz routes stay noindex.
5. **`routine` belongs on `HairProfile`.** The four-step routine is profile
   content, not result-screen content — `/haircare/profiles/<slug>` can render it
   too. Keeping a second copy for the result screen guarantees drift.

## 3. Question inventory

`HAIR_QUIZ: QuizDefinition` in `lib/haircare/quiz.ts` — `quizKey: "hair"`,
`version: 1`, 14 questions, all `isRequired: true`. Option `key` and `value` are
identical and are the canonical codes below; labels are display-only and never
stored. No `info` step and no free text: every question is answerable and closed.

| #   | key                    | type      | sectionKey       | option keys                                                                                                                           |
| --- | ---------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `natural_pattern`      | single    | `natural_hair`   | `straight`, `loose_wave`, `defined_wave_curl`, `tight_curl_coil`, `unknown_treated`                                                   |
| 2   | `strand_thickness`     | single    | `natural_hair`   | `fine`, `medium`, `coarse`, `unknown`                                                                                                 |
| 3   | `density`              | single    | `natural_hair`   | `low`, `medium`, `high`, `unknown`                                                                                                    |
| 4   | `scalp_oiliness_onset` | single    | `scalp`          | `hours`, `next_day`, `two_plus_days`, `rarely_oily`                                                                                   |
| 5   | `scalp_concerns`       | **multi** | `scalp`          | `none`*, `itching`, `flaking`, `redness_stinging`, `odor`, `bumps`, `oiliness`, `tightness_dryness`, `hair_loss_concern`              |
| 6   | `wash_frequency`       | single    | `scalp`          | `multiple_daily`, `daily`, `every_other_day`, `three_plus_days`                                                                       |
| 7   | `product_response`     | single    | `hair_behavior`  | `weighed_down`, `balanced`, `still_dry`, `sits_on_surface`, `varies`                                                                  |
| 8   | `dry_time`             | single    | `hair_behavior`  | `very_fast`, `average`, `slow`, `mixed`, `unknown`                                                                                    |
| 9   | `humidity_response`    | single    | `hair_behavior`  | `little_change`, `falls_flat`, `frizzes`, `waves_appear`, `expands_tangles`                                                           |
| 10  | `chemical_history`     | **multi** | `damage_styling` | `color`, `bleach`, `perm`, `straightening`, `keratin_smoothing`, `none`*                                                              |
| 11  | `heat_frequency`       | single    | `damage_styling` | `rarely`, `one_two_week`, `three_five_week`, `almost_daily`, `dryer_only`                                                             |
| 12  | `ends_condition`       | single    | `damage_styling` | `smooth`, `slightly_dry`, `split_breaking`, `tangled`, `rough_dull`                                                                   |
| 13  | `primary_concern`      | single    | `concern_goal`   | `oily_scalp`, `flatness`, `dryness`, `frizz`, `breakage`, `tangling`, `lack_shine`, `curl_definition`, `sensitive_scalp`, `hair_loss` |
| 14  | `desired_result`       | single    | `concern_goal`   | `light_fresh`, `volume`, `glass_hair`, `soft_controlled`, `defined_texture`, `stronger_look`                                          |

\* `none` is **exclusive**: selecting it clears the other options, and selecting
another option clears `none`. Declared per question as
`validation.exclusiveOptionKeys` (§5).

## 4. Scoring model

`lib/haircare/scoring.ts` — `scoreHairQuiz(responses)` →
`{ profileSlug: string | null, scores, signals, lowSignal }`. Pure, synchronous,
no I/O. Weights are keyed by **question key**, never by question index:
index-keyed tables break silently when a question is reordered.

### 4.1 Single-select weights

Options absent from this table contribute nothing: `unknown` (Q2, Q3, Q8),
`average`, `varies`, `every_other_day`, `rarely`, and the two `primary_concern`
options handled as advisory in §4.6.

| question               | option              | LB  | DG  | OD  | HW  | MC  | TF  |
| ---------------------- | ------------------- | --- | --- | --- | --- | --- | --- |
| `natural_pattern`      | `straight`          | 1   | 2   |     |     |     |     |
|                        | `loose_wave`        |     | 1   |     | 4   | 1   |     |
|                        | `defined_wave_curl` |     |     |     | 2   | 4   |     |
|                        | `tight_curl_coil`   |     |     |     |     | 6   |     |
|                        | `unknown_treated`   |     |     |     |     |     | 3   |
| `strand_thickness`     | `fine`              | 5   |     | 1   | 1   |     | 1   |
|                        | `medium`            | 1   | 1   |     |     | 1   |     |
|                        | `coarse`            |     | 5   |     |     | 2   |     |
| `density`              | `low`               | 2   |     |     |     |     |     |
|                        | `medium`            |     | 1   |     |     |     |     |
|                        | `high`              |     | 4   | 1   | 1   | 1   |     |
| `scalp_oiliness_onset` | `hours`             | 2   |     | 5   |     |     |     |
|                        | `next_day`          | 1   |     | 3   |     |     |     |
|                        | `two_plus_days`     |     |     |     |     | 1   |     |
|                        | `rarely_oily`       |     | 1   |     |     | 2   | 1   |
| `wash_frequency`       | `multiple_daily`    | 1   |     | 2   |     |     | 1   |
|                        | `daily`             | 1   |     | 1   |     |     |     |
|                        | `three_plus_days`   |     |     |     |     | 1   |     |
| `product_response`     | `weighed_down`      | 6   |     | 2   | 1   |     |     |
|                        | `balanced`          |     | 1   |     |     |     |     |
|                        | `still_dry`         |     | 3   | 1   | 1   | 3   | 2   |
|                        | `sits_on_surface`   | 2   | 1   |     |     |     |     |
| `dry_time`             | `very_fast`         | 1   |     |     |     |     | 1   |
|                        | `slow`              |     | 2   |     | 1   | 1   |     |
|                        | `mixed`             |     |     | 2   |     |     | 1   |
| `humidity_response`    | `little_change`     |     | 1   |     |     |     |     |
|                        | `falls_flat`        | 3   |     |     | 1   |     |     |
|                        | `frizzes`           |     | 3   |     | 3   | 1   | 1   |
|                        | `waves_appear`      |     |     |     | 6   | 2   |     |
|                        | `expands_tangles`   |     | 1   |     | 1   | 4   | 2   |
| `heat_frequency`       | `one_two_week`      |     |     |     |     |     | 1   |
|                        | `three_five_week`   |     |     |     |     |     | 3   |
|                        | `almost_daily`      |     |     |     |     |     | 5   |
|                        | `dryer_only`        |     | 1   |     |     |     | 1   |
| `ends_condition`       | `smooth`            |     | 1   |     |     |     |     |
|                        | `slightly_dry`      |     | 2   | 2   |     | 1   | 2   |
|                        | `split_breaking`    |     |     | 2   |     | 1   | 7   |
|                        | `tangled`           |     | 1   | 1   | 1   | 3   | 4   |
|                        | `rough_dull`        |     | 3   | 2   |     | 2   | 5   |
| `primary_concern`      | `oily_scalp`        |     |     | 5   |     |     |     |
|                        | `flatness`          | 5   |     |     |     |     |     |
|                        | `dryness`           |     | 2   |     |     | 3   | 2   |
|                        | `frizz`             |     | 3   |     | 3   | 2   |     |
|                        | `breakage`          |     |     |     |     |     | 6   |
|                        | `tangling`          |     |     |     |     | 3   | 3   |
|                        | `lack_shine`        |     | 4   |     |     |     |     |
|                        | `curl_definition`   |     |     |     | 2   | 5   |     |
| `desired_result`       | `light_fresh`       | 2   |     | 1   |     |     |     |
|                        | `volume`            | 3   |     |     |     |     |     |
|                        | `glass_hair`        | 1   | 2   |     |     |     |     |
|                        | `soft_controlled`   |     | 2   |     |     |     | 1   |
|                        | `defined_texture`   |     |     |     | 2   | 3   |     |
|                        | `stronger_look`     |     |     |     |     |     | 2   |

### 4.2 `scalp_concerns` (multi)

| selection                                                              | effect                          |
| ---------------------------------------------------------------------- | ------------------------------- |
| `oiliness`                                                             | OD +3, LB +1                    |
| `tightness_dryness`                                                    | MC +2, DG +1, TF +1             |
| `odor`                                                                 | OD +1                           |
| `itching`, `flaking`, `redness_stinging`, `bumps`, `hair_loss_concern` | no score — advisory only (§4.6) |
| `none`                                                                 | no score                        |

### 4.3 `chemical_history` (multi)

`color` 2, `bleach` 6, `perm` 3, `straightening` 4, `keratin_smoothing` 2.
Sum the selected values, **cap at 10**, add to TF. `none` contributes 0. The cap
stops someone with four services from being pushed past every override threshold.

### 4.4 Combination rules

- `natural_pattern` ∈ {`loose_wave`, `defined_wave_curl`} **and**
  `humidity_response` ∈ {`waves_appear`, `frizzes`} → HW +3.
- `scalp_oiliness_onset` ∈ {`hours`, `next_day`} **and** `ends_condition` ∈
  {`slightly_dry`, `split_breaking`, `tangled`, `rough_dull`} → OD +4.

### 4.5 Winner selection

1. Provisional winner = highest score. Ties break by fixed priority
   **LB → DG → OD → HW → MC → TF** (the preview relied on JS object insertion
   order for this; here it is an explicit array so it cannot drift).
2. `severe` is true when **any** of:
   - TF ≥ 13, or
   - `chemical_history` includes `bleach` **and** `ends_condition` is `split_breaking`, or
   - `chemical_history` has any service **and** `heat_frequency` is `almost_daily`
     **and** `ends_condition` is not `smooth`.
3. Overrides, in order:
   - `natural_pattern` is `tight_curl_coil` → `TF` if (`severe` and TF ≥ MC + 4), else `MC`.
     Coily hair keeps its pattern-appropriate routine unless damage clearly dominates.
   - else `severe` → `TF`. Current condition outranks natural pattern.
   - else `natural_pattern` is `loose_wave` **and** `humidity_response` is
     `waves_appear` → `HW`.
4. **Low signal (defensive).** Every `natural_pattern` option carries weight, so a
   complete sheet always scores above zero — an all-zero score is only reachable
   from partial or malformed input, not through the UI. In that case return
   `lowSignal: true` and `profileSlug: null` rather than letting the tie-break
   invent `LB`, and have the result screen fall back to a "not enough to place you
   yet" state pointing at the chooser. This keeps `scoreHairQuiz` safe to call with
   a subset of answers.

### 4.6 Advisory (not scoring)

`primary_concern` ∈ {`sensitive_scalp`, `hair_loss`}, or `scalp_concerns`
including `itching`, `flaking`, `redness_stinging`, `bumps`, or
`hair_loss_concern`, raises a **professional-evaluation advisory** on the result
screen alongside the standard limitation note. These answers deliberately carry
no archetype weight: assigning them one would mean inventing clinical logic,
which WS-06 forbids ("do not describe scalp conditions as diagnosed disease").
The advisory is the honest handling — the user's most important answer is
acknowledged rather than silently discarded.

### 4.7 Signals → "why this result"

Every applied weight records `{ questionKey, optionKey, archetype, weight }` in
`signals`. `lib/haircare/explain.ts` turns that into:

- **Snapshot tags:** the chosen `natural_pattern`, `strand_thickness`, `density`,
  and `desired_result` labels, plus "Sensitive scalp consideration" when §4.6 fires.
- **Why this result:** the 2–4 highest-weight signals for the winning archetype,
  rendered as "you said X → this points to Y". Derived from the scoring table, so
  the explanation cannot contradict the score.

## 5. Framework extensions

Three small, additive changes to the M2b framework. Existing preview and
server-backed paths behave identically when the new props are absent.

- `QuizShell` gains
  `renderResult?: (args: { responses: Responses; restart: () => void }) => ReactNode`.
  When present, completion renders it instead of the current interstitial. The
  `restart` callback is the same reset the built-in "Start over" button uses, so
  the result screen can offer a retake without reimplementing it.
- `QuizQuestionDef` gains `validation?: { min?: number; max?: number; exclusiveOptionKeys?: string[] }`,
  mirroring the existing `quiz_questions.validation_json` column, and
  `mapQuizDefinition` populates it from that column. Today the mapper reads
  `validation_json` only into the server-side `LoadedQuestion.scale`, so the
  client shape drops it; carrying `min`/`max` alongside `exclusiveOptionKeys`
  keeps one field faithful to one column instead of splitting it.
- `QuestionRenderer` honors `exclusiveOptionKeys` for `multi_select`: picking an
  exclusive option deselects the rest, picking any other deselects the exclusive one.
- `components/editorial/HairQuizClient.tsx` (`"use client"`) — **required**, not
  incidental: `renderResult` is a function prop and cannot be passed from the
  route's server component to a client component. This wrapper owns the client
  boundary — it emits `profile_quiz_started` once on mount, wires the step
  callbacks, and renders `QuizShell` with `HAIR_QUIZ` and a `renderResult` that
  scores the responses and returns `HairProfileResult`. It is the client-only twin
  of `QuizRunner` (which binds the server-backed attempt instead).

## 6. Result screen

`components/editorial/HairProfileResult.tsx`, presentational, receives the
scoring result plus the matching `HairProfile`. Sections map to WS-07:

| WS-07 section             | source                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------- |
| Result identity           | `profile.name`                                                                        |
| Summary                   | `profile.tagline`                                                                     |
| Why this result           | `explain.ts` (§4.7)                                                                   |
| Declared goals and traits | snapshot tags (§4.7)                                                                  |
| Guidance                  | three panels — `profile.care` (priorities), `profile.lookFor`, `profile.useCarefully` |
| Routine                   | `profile.routine` — four steps (new field, §7)                                        |
| Limitations               | standing medical note + §4.6 advisory when raised                                     |
| Recommended reading       | link to `/haircare/profiles/<slug>` (`pillarGuide` + `guides` live there)             |
| Retake                    | resets `QuizShell` to step 0                                                          |

When `lowSignal` is true there is no archetype to show, so the component renders
the fallback state from §4.5 step 4 — the chooser and the guides — instead of the
sections above.

WS-07 also lists a signup/save prompt. Signup is M5 and every related flag is
OFF, so it is **out of scope**; the DB follow-up adds it with the durable result.

## 7. Content addition

`HairProfile` gains `routine: { step: string; detail: string }[]` — four steps per
profile, from the approved preview (e.g. Lightweight Balancer: Wash / Condition /
Style / Reset). All six profiles must supply it; the type makes it required.
`/haircare/profiles/<slug>` may render it in a follow-up — this spec only adds the
data and consumes it on the result screen.

## 8. Routes, flags, analytics

- `app/beauty-profile/hair/quiz/page.tsx` — rewritten: no flag gate, `noindex`,
  renders `QuizShell` with `HAIR_QUIZ` and `renderResult`.
- `app/beauty-profile/hair/page.tsx` — "Start the quiz · about 2 minutes" becomes
  the primary CTA; the chooser drops to a secondary section; "coming soon" copy
  removed.
- `app/beauty-profile/hair/quiz/start/` and `quiz/[attempt]/` — **untouched**,
  still `hair_profile`-gated, still reading the DB `version: 0` placeholder. Two
  paths coexist deliberately: the public client quiz, and the dark server-backed
  engine awaiting its v1 seed.
- `PLACEHOLDER_HAIR_QUIZ` stays — it mirrors the seeded v0 row the server path
  loads. It is no longer referenced by any route.
- Analytics: `HairQuizClient` fires the existing `lib/analytics/events.ts` funnel —
  `profile_quiz_started` on mount, then `step_viewed` / `step_completed` /
  `completed` — with `domain: "hair"`, `quizVersion: 1`. `profile_quiz_resumed` is
  not emitted: nothing persists, so nothing resumes. No raw answers and no free
  text leave the client — this definition has no free-text question. Event field
  shapes are unchanged.

## 9. Testing

TDD; the scoring module is pure, so it is tested directly rather than through the UI.

- `lib/haircare/quiz.test.ts` — 14 questions; unique question keys; unique option
  keys per question; `key === value` for every option; `allowsMultiple` agrees
  with `type`; `sectionKey` ∈ the five known sections; `exclusiveOptionKeys`
  reference real options; `validateResponse` accepts every option and rejects an
  unknown key.
- `lib/haircare/scoring.test.ts` — each of the six archetypes reachable from a
  representative answer set; the TF ≥ 13 / bleach+split / services+daily-heat
  severe triggers; `tight_curl_coil` staying MC under moderate damage and
  flipping to TF at MC + 4; `loose_wave` + `waves_appear` → HW; the two
  combination rules; the chemical cap at 10; `lowSignal` on an all-`unknown`
  sheet; tie-break determinism; partial/missing responses do not throw.
- `lib/haircare/explain.test.ts` — tags reflect the answers; why-lines name the
  winning archetype's top signals; advisory fires for each §4.6 trigger.
- `components/editorial/QuestionRenderer.test.tsx` — exclusive-option behavior
  both directions.
- `components/editorial/QuizShell.test.tsx` — `renderResult` replaces the
  interstitial; absent prop keeps current behavior.
- `components/editorial/HairProfileResult.test.tsx` — renders identity, tags,
  three panels, four routine steps, guide link, retake; advisory shown only when
  raised; the `lowSignal` fallback state.
- `components/editorial/HairQuizClient.test.tsx` — `profile_quiz_started` fires
  once on mount (not per step), and completing the last step renders the result.

Verification: `npm run typecheck && npm test && npm run lint`, then a manual
keyboard-only walkthrough of all 14 steps to a result.

## 10. Out of scope (follow-up PR)

`quiz_definitions` v1 seed migration and the v0→v1 handoff; `profile_snapshots`
writing the real archetype; durable `/beauty-profile/hair/result/[snapshot]`;
signup/save prompt (M5); rendering `routine` on the profile landings; the Skin quiz.

## 11. Risks and required review

- **Product/medical review is required before this ships.** WS-06 states question
  copy and taxonomy need product approval. The implementation stays observational
  and educational — no diagnostic language, no condition named as disease — and
  keeps the standing disclaimer plus the §4.6 advisory. The weight tables in §4
  are the artifact to review.
- **The weights are editorial judgment, not clinical evidence.** They are captured
  here in full so they are reviewable and changeable in one place.
- **Version 1 is claimed by this definition.** When the DB seed follows, it must
  publish `version: 1` matching §3 exactly, and retire v0 — `docs/NEXT_TASK_M2b.md`
  warns that re-applying the v0 seed after v1 exists would demote v1 in production.
