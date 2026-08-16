# Next task — M2b: Quiz framework + anonymous persistence

**Status:** Ready to start. **Owner:** next dev / Claude Code session.
**Prereq (hard):** a **real `SUPABASE_SERVICE_ROLE_KEY`** in `.env.local`
(currently a placeholder) — anonymous quiz writes go through the service-role
client, so end-to-end verification needs it locally, or verify on a Vercel
preview where the key is set.

Read first: `docs/01_PHASE1_BUILD_SPEC.md` (WS-03, WS-04, WS-07 result comes
later in M3), `docs/03_DATABASE_SCHEMA.md`, `docs/05_COMPONENT_GUIDELINES.md`
(§2 QuizShell/QuestionRenderer), `docs/07_API_SPEC.md` (§2 operations, §3 error
codes, §4 idempotency), `docs/06_ANALYTICS_EVENTS.md`, `docs/adr/0001`.

## Setting `SUPABASE_SERVICE_ROLE_KEY` (the prereq, step by step)

This key **bypasses RLS** — treat it as a master secret. Never commit it, never
expose it to the client, never paste it into chat/PRs/logs.

1. **Get it:** Supabase dashboard → project **adropofseoul** → **Project
   Settings → API** → copy the **`service_role`** (secret) key. Supabase is
   migrating key formats, so it may appear as a legacy JWT (`eyJ…`) or a new
   secret key (`sb_secret_…`) — either works for server admin use. Do **not**
   use the `anon` key (that's already `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
2. **Local:** in `.env.local`, replace the placeholder value:
   `SUPABASE_SERVICE_ROLE_KEY=<the real key>` — keep the name exactly (no
   `NEXT_PUBLIC_` prefix, or it leaks to the browser). `.env.local` is
   gitignored, so it won't be committed. Restart `npm run dev` after editing.
3. **Vercel (for preview/prod runtime):** Project → Settings → Environment
   Variables → add `SUPABASE_SERVICE_ROLE_KEY` (Production + Preview, mark
   Sensitive), or `vercel env add SUPABASE_SERVICE_ROLE_KEY production`. Redeploy
   to apply. It's likely NOT set yet (nothing used it before M1).
4. **Verify safely:** `hasServiceRoleKey()` in `lib/supabase/admin.ts` returns
   true once it's not the `your-…` placeholder. Don't print the key.
5. **Not needed for `db push`** — migrations use the Supabase CLI login, not this
   key. This key is for the app's runtime admin client (anonymous quiz writes)
   and the REST seed script. If it ever leaks, rotate it in Supabase → API.

## Already done (do NOT redo)

- **M1 (merged, applied to prod):** data model + RLS live — `quiz_definitions/
questions/options`, `quiz_attempts/responses`, `profile_snapshots`,
  `user_current_profiles`, `anonymous_identities`, `identity_links`,
  `consent_documents/records`. Types in `types/database.types.ts`.
  - `lib/supabase/admin.ts` — service-role client (`server-only`, `hasServiceRoleKey()`).
  - `lib/profile/anon-token.ts` + `anon-identity.ts` — opaque HTTP-only cookie,
    SHA-256 hash stored, `ensureAnonToken()` / `readAnonToken()`.
  - `lib/profile/flags.ts` — `NEXT_PUBLIC_FLAG_*` (default OFF): `skin_profile`,
    `hair_profile`, `beauty_profile`, …
  - `lib/profile/validation.ts` — `validateResponse(type, response, allowedKeys)`.
  - `lib/analytics/index.ts` — provider-agnostic `track`/`identify` (no-op until a
    provider is registered; has a raw-answer/PII guard).
- **M2a (merged):** `/beauty-profile` hub, `/beauty-profile/hair` (six profiles),
  `/beauty-profile/skin` (coming soon), 308 from `/hair-profile`, nav CTA
  "My Beauty Profile". Design tokens + card patterns in `components/editorial/`.

## M2b scope (WS-03 + WS-04)

Build the reusable quiz **framework** end-to-end with a **placeholder** quiz
definition (NOT the final Skin/Hair questions — that's M3, and copy/taxonomy
needs product + medical review). Prove: start → answer → autosave → refresh →
resume → complete, **anonymously** (no signup), server-authoritative.

### Server (server actions, `app/actions/profile.ts` or similar)

Follow `docs/07 §2`. Idempotent where noted (`docs/07 §4`); validate every
mutation server-side (`docs/07 §5`); controlled error codes (`docs/07 §3`).

- `getActiveQuizDefinition(domain)` — active definition + questions/options (anon-key OK; RLS already allows active read).
- `startQuizAttempt(domain, sourceContext, idempotencyKey)` — ensure anon identity (`ensureAnonToken` → upsert `anonymous_identities` by `token_hash` via **admin client**), create `quiz_attempts` row. Return opaque attemptId.
- `saveQuizResponse(attemptId, questionKey, response, idempotencyKey)` — verify anon ownership (cookie hash → attempt.anonymous_identity_id) server-side; `validateResponse` against the question type + allowed option keys; upsert `quiz_responses`.
- `updateQuizProgress(attemptId, currentStep)`.
- `completeQuizAttempt(attemptId, idempotencyKey)` — transactional: validate required responses, mark completed, (M3 will add snapshot/result — for M2b a placeholder deterministic result is fine). Repeated calls return the same result.
  All anonymous reads/writes use `lib/supabase/admin.ts`; ownership is proven from
  the cookie hash, never a client-provided id (`docs/adr/0001`).

### Data (quiz definition seed)

Seed a **placeholder** `quiz_definitions` (+ questions/options) row, `status='active'`,
so the framework has something to render. Options must carry canonical
`value_code`, not labels. A new additive migration OR a seed script — **note
the migration drift** in `supabase/migrations/README.md`: don't blind
`db push`; apply additive SQL via the dashboard or the transient-placeholder
path used for `20260726205322`.

### UI (`components/editorial/`, per `docs/05 §2`)

- `QuizShell` — title/context, progress ("Step N of M"), question slot, back/next,
  autosave status, error + recoverable states, exit behavior.
- `QuestionRenderer` — renders by versioned `question_type`
  (`single_select` radio, `multi_select` checkbox, `scale`, `text`, `info`), not
  hardcoded per route. Fieldset/legend, labels, keyboard + SR support (`docs/05 §7`).
- Routes: `app/beauty-profile/[domain]/quiz/[attempt]/page.tsx` (+ a `start`
  entry). Gate the live quiz behind the `hair_profile` / `beauty_profile` flag so
  the current chooser stays default until the engine is ready.

### Analytics

Wire the funnel events from `docs/06` (`profile_quiz_started/step_viewed/
step_completed/resumed/completed`) through `lib/analytics`. **Never** send raw
answers/free text. (Provider still deferred; the adapter no-ops.)

## Acceptance criteria (from WS-03/WS-04)

- Anonymous completion works with no account.
- Refresh does not lose persisted progress; back preserves answers.
- A malformed request can't submit an invalid question id/option (server rejects).
- Quiz version stored with each attempt; completed attempt immutable (updates =
  new attempt/snapshot).
- Signup after result retains the result **(M5 — not this task)**; two browsers
  don't merge; a client can't attach another anon id.
- Keyboard-only completion; SR announces progress/errors.
- No raw answers in analytics; no personal data in URLs/metadata; result routes
  will be noindex (M3/M7).

## Verify

`npm run typecheck && npm test && npm run lint`; then with a real service key,
drive an anonymous attempt on a preview/local: start → save → refresh → resume →
complete. Then `/code-review` + `/security-review` (focus: anon ownership proof,
idempotency, RLS/service-role usage). Ship as its own PR.

## Guardrails

- Flags default OFF; the live `/beauty-profile/hair` chooser stays the default
  until the quiz engine is flagged on.
- New migration? Read `supabase/migrations/README.md` (known drift; don't blind push).
- ~~**Launch checklist (separate):** apply `admin_claim_rls` to prod + stamp the
  admin claim BEFORE enabling public signup~~ — **done.** Verified live 2026-07-31:
  `is_admin()` exists on prod and `scripts/verify-rls.mjs` reports ALL PASS. See
  the 2026-07-31 update in `docs/adr/0001`. Re-run that script immediately before
  enabling signup, since it is a point-in-time check.

## Start

```bash
git checkout main && git pull
git checkout -b feat/beauty-profile-m2b-quiz
# set SUPABASE_SERVICE_ROLE_KEY in .env.local first
```
