# ADR 0001 — Beauty Profile foundation (M1)

**Status:** Accepted (M1) · **Date:** 2026-07-26
**Context:** `docs/01 §WS-03/04`, `docs/03`, `docs/07`. Founder decisions of this
session: Beauty Profile = Skin + Hair (approved); consumer auth = extend
Supabase Auth (approved); analytics = thin adapter now, PostHog intended.

M1 lays the data + identity + flag foundation for the Beauty Profile. It is
additive and ships behind flags; no existing table, route, or screen changes.

## Decisions

1. **Anonymous identity is server-trusted via an HTTP-only cookie, DB stores only a hash.**
   The browser holds an opaque 32-byte `base64url` token in an HTTP-only,
   same-site=lax, secure (prod) cookie (`ados_anon`, 30-day TTL). The
   `anonymous_identities` row stores only the SHA-256 hash. Ownership of an
   anonymous attempt is proven by hashing the cookie server-side, never by any
   client-provided id (`lib/profile/anon-token.ts`, `lib/profile/anon-identity.ts`).

2. **Anonymous-owned rows are reachable only through the service-role client.**
   `anonymous_identities` / `identity_links` have RLS enabled with **no policies**
   → default-deny for the anon and authenticated keys. Anonymous quiz reads/writes
   go through trusted server actions using `lib/supabase/admin.ts` (service role,
   `server-only`), which enforces ownership from the cookie. Attempts/responses/
   snapshots/consent with `user_id = null` are likewise unreachable by the
   anon-key client.

3. **Authenticated rows are owner-scoped by RLS.** `user_id = auth.uid()` policies
   on attempts, responses (via parent attempt), snapshots (read), current profiles,
   and consent records. Staff/admin get **no** access to personal profile data by
   default (`docs/03 §12`). Active quiz definitions and consent documents are
   public-read; drafts are not.

4. **Completed attempts are immutable; profiles are snapshots.** A completed
   attempt produces one deterministic `profile_snapshots` row; `user_current_profiles`
   is a mutable pointer to the latest. History is never overwritten.

5. **Canonical values are separated from labels.** `quiz_options.value_code` is the
   stored canonical value; localized text lives behind `*_key` references. Enums
   (`profile_domain`, `quiz_status`, `quiz_question_type`, `attempt_status`,
   `consent_type`, `consent_status`) match the repo's existing enum convention.

6. **Feature flags default OFF** (`lib/profile/flags.ts`, `NEXT_PUBLIC_FLAG_*`), so an
   incomplete milestone never exposes broken navigation.

7. **Analytics behind a thin adapter** (`lib/analytics`) with a raw-answer/PII
   property guard; the concrete provider (PostHog intended) is wired before M3
   emits funnel events.

## Consequences / follow-ups

- **Migration not yet applied.** `supabase/migrations/20260726205322_beauty_profile_foundation.sql`
  is written but applied to the remote DB only on PR merge (`npx supabase db push`),
  then `npm run db:types` regenerates `types/database.types.ts`.
- **Local integration is limited** until a real `SUPABASE_SERVICE_ROLE_KEY` exists
  (`.env.local` holds a placeholder); anonymous DB paths are unit-tested at the
  pure-logic layer and verified end-to-end after the key + migration land.
- **Retention/cleanup** of abandoned anonymous attempts and deletion/export flows
  are `[LEGAL REVIEW REQUIRED]` (`docs/03 §14`) and implemented in a later milestone.
- Supersedes nothing; `docs/03` remains the logical target model this adapts.
