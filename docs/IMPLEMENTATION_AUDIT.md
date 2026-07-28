# Implementation Audit (M0)

**Status:** Audit only — no production behavior changed.
**Repo:** `Essenly-beauty/adropofseoul` (A Drop of Seoul)
**Prepared by:** Claude Code, per `docs/CLAUDE_CODE_START_PROMPT.md`
**Branch at audit time:** `main` @ latest (post IA-restructure + Essenly docs)

---

## 1. Executive summary

A Drop of Seoul is a **Next.js 14 App Router / Supabase / Tailwind** editorial site, live on Vercel (`adropofseoul.vercel.app`, `main` → production). It is mature on the **editorial + directory** side (posts, places directory, ingredient dictionary, Seongsu guides, an admin CRUD editor, share/OG, SEO, 186 passing tests) and has **no consumer-account, quiz, profile, recommendation, consent, or analytics infrastructure** yet.

Two facts make Phase 1 unusually low-risk to start:

1. **The information architecture already matches `docs/04`.** A restructure landed this session: the GNB is now **Skincare / Haircare / Wellness / Seoul / Stories / About + a profile CTA** — the exact conceptual GNB the spec recommends. No IA fight is needed.
2. **A profile surface already exists in spirit.** `/hair-profile` is a live landing with six code-defined hair profiles (`lib/haircare/profiles.ts`). It is a _static chooser_, not a quiz, but it establishes the entry point, naming tension, and design language for WS-01/WS-02.

The Phase 1 build is therefore **additive**: a quiz framework, anonymous identity, profile/attempt/consent data model, results, consumer signup + linking, Beauty Passport, and analytics. The existing admin auth (Supabase Auth + `is_admin()` RLS) is a good pattern to extend for consumer accounts.

**Biggest decisions for the founder** (Section 11): the "Beauty Profile (Skin + Hair)" vs the just-shipped "My Hair Profile (hair only)" naming; the analytics provider (none installed); and confirming Supabase Auth for consumer signup.

**Recommendation:** approve **M1 (foundation + data model + anonymous identity + feature flags)** as the first batch — fully additive, behind flags, no UI or route change — after resolving the naming decision, which affects routes.

---

## 2. Current architecture

| Area              | Finding                                                                                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework         | **Next.js 14.2.35**, App Router, React 18, TypeScript 5 (strict)                                                                                                                                      |
| Package manager   | npm (`package-lock.json`; scripts npm/npx)                                                                                                                                                            |
| Styling           | **Tailwind 3.4** + `@tailwindcss/typography`; custom editorial tokens                                                                                                                                 |
| Content rendering | `react-markdown` + `remark-gfm` + `rehype-sanitize` (`components/editorial/Prose.tsx`)                                                                                                                |
| Database          | **Supabase Postgres**, migrations in `supabase/migrations/` via Supabase CLI                                                                                                                          |
| Data access       | `@supabase/ssr` + `@supabase/supabase-js`; server client in `lib/supabase/server.ts`; browser client `lib/supabase/client.ts`; session refresh in root `middleware.ts` → `lib/supabase/middleware.ts` |
| Auth              | **Supabase Auth** (email/password), SSR cookie sessions. **Admin only today.**                                                                                                                        |
| Testing           | **Vitest 4** + Testing Library + jsdom; **45 test files / 186 tests** passing                                                                                                                         |
| Lint/format       | ESLint (`eslint-config-next`), Prettier, **husky + lint-staged** pre-commit                                                                                                                           |
| Deployment        | **Vercel**, git-integrated; `main` → production, preview per branch/PR; `next.config.js` redirects + `images.remotePatterns`                                                                          |
| Analytics         | **None installed** (no PostHog/Plausible/GA/Segment/Vercel Analytics)                                                                                                                                 |
| Email/CRM         | **DB capture only** — `newsletter_subscribers` + `waitlist_subscribers`; no external ESP                                                                                                              |
| Generated types   | `types/database.types.ts` (via `npm run db:types`)                                                                                                                                                    |

Design tokens (`tailwind.config`): `accent #B78B62` / `accent-hover #A2774F`, `soft-gray #E8E2DA`, `porcelain #F2EDE5`, serif `var(--font-serif)`/Georgia, `max-w-content 72rem`, plus `text` / `text-muted` / `bg`. This is the calm, editorial, warm system `docs/00 §14` and `docs/05` call for — reuse it; do not introduce a second design system.

---

## 3. Existing product and route map

**Public editorial (post-restructure):**

```text
/                         home (hero, featured, category index, Hair Profile CTA band, directory, picks, newsletter)
/skincare  /skincare/picks
/haircare  /haircare/profiles/[slug]        six static hair profiles
/wellness
/seoul
  /seoul/places  /seoul/places/[slug]  /seoul/places/[slug]/og
  /seoul/neighborhoods  /seoul/neighborhoods/[neighborhood]  /seoul/neighborhoods/common
/stories                 unified feed with section filter
/hair-profile            static profile chooser (quiz "coming soon")
/ingredients  /ingredients/[slug]
/articles/[slug]         all article detail (posts + code guides/pillars)
/about  /contact  /privacy  /terms
/sitemap.xml  /robots.txt
```

**Admin (Supabase-auth gated):** `/admin`, `/admin/login`, `/admin/posts(/new,/[id])`, `/admin/places(/new,/[id])`, `/admin/products(/new,/[id])`.

**GNB:** Skincare / Haircare / Wellness / Seoul / Stories / About + **"My Hair Profile"** pill CTA. Legacy `/beauty`, `/places`, `/around-seoul`, `/articles`, `/hair`, `/head-spa` all **308-redirect** to new homes (`next.config.js`).

**Alignment with `docs/04`:** the recommended GNB (Skincare/Haircare/Wellness/Seoul/Stories/About + profile CTA) is **already implemented**. The spec's `/beauty-profile/{skin,hair}` route family does **not** exist yet; today's `/hair-profile` is the hair-only precursor (see §6 naming gap).

---

## 4. Reusable assets / components

**Directly reusable for Phase 1 (in `components/editorial/`):**

- `SectionHeading`, `Eyebrow`, `SectionTabs` — hub/section chrome
- `Prose` (sanitized markdown), `TonalFrame` (branded image frame), `Reveal` (scroll reveal)
- `ArticleCard`, `PlaceCard`, `ProductCard`, `IngredientCard` — recommendation card patterns → basis for `RecommendationCard`
- `Stars`, `TagChips`, `TermFilter` — small primitives
- `NewsletterForm` (uses `useFormState` + server action) — the pattern for quiz/consent forms
- `ShareButtons` / `ShareIcons`, `JsonLd`, `SiteHeader` / `SiteFooter`
- **`lib/haircare/profiles.ts` + `/hair-profile`** — the profile card + landing pattern to extend into the Beauty Profile hub + result pages
- `components/admin/*` (`PlaceForm`, field primitives) — the pattern for any quiz-definition admin later

**Reusable lib:** `lib/taxonomy.ts` (sections + `sectionForCategory` mapping — the seed of editorial personalization), `lib/validation.ts`, `lib/slug.ts`, `lib/seo.ts` (canonical, breadcrumb, JSON-LD), `lib/react-cache.ts`, `lib/site.ts`.

**Gap:** no `QuizShell`, `QuestionRenderer`, `ProfileResultSummary`, `PassportProfileCard`, `ConsentFields`, `BeautyProfileEntryCard` (spec `docs/05 §2`). All net-new, built on the existing primitives.

---

## 5. Existing data / auth model

**Tables** (Supabase Postgres): `posts`, `places`, `products`, `media`, `ingredients`, `product_ingredients`, `newsletter_subscribers`, `waitlist_subscribers`.
**Enums:** `post_status`, `post_category`, `place_category`, `partnership_status`, `place_entry_type`.
**Migrations:** `0001_init` → `0002_rls` → `0003–0005` (remote placeholders) → `0006_waitlist` → `ingredients` → `places_directory` → `seed_places_directory` → `admin_claim_rls`.

**Auth / RLS:**

- Supabase Auth, email/password, SSR cookie sessions (`@supabase/ssr`), root `middleware.ts` refreshes the session on every request.
- Authorization = `public.is_admin()` (reads `auth.jwt() -> app_metadata -> role = 'admin'`); content tables are **public-read, admin-all**. `ADMIN_EMAILS` env gates the admin sign-in action; the RLS claim is the real enforcement.
- **No consumer signup flow, no anonymous identity, no per-user owner-scoped RLS.**

**Absent (clean slate for Phase 1):** `anonymous_identities`, `identity_links`, `quiz_definitions/questions/options`, `quiz_attempts/responses`, `profile_snapshots`, `user_current_profiles`, `recommendation_sets/items`, `profile_content_mappings`, `consent_documents/records`, `saved_entities`, `user_goals/preferences`. → implement per `docs/03`, adapted (reuse `auth.users`; do not create a parallel `users` table).

---

## 6. Gap analysis against Phase 1

| Workstream (`docs/01`)          | State                  | Notes                                                                                                                                           |
| ------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-00 audit                     | **done**               | this document                                                                                                                                   |
| WS-01 entry points              | **partial**            | GNB profile CTA + `/hair-profile` exist; home has a _Hair_ Profile band, not a Skin+Hair _Beauty Profile_ module; contextual article CTA absent |
| WS-02 Beauty Profile hub        | **missing**            | only hair; need Skin + Hair hub                                                                                                                 |
| WS-03 quiz framework            | **missing**            | largest build; no quiz primitives                                                                                                               |
| WS-04 anonymous identity        | **missing**            | new cookie-based opaque ID + tables                                                                                                             |
| WS-05 Skin quiz                 | **missing**            | —                                                                                                                                               |
| WS-06 Hair quiz                 | **missing**            | current hair "profiles" are static editorial hubs, not a quiz                                                                                   |
| WS-07 results                   | **missing**            | —                                                                                                                                               |
| WS-08 signup + consent          | **missing (consumer)** | admin auth only; no consent tables                                                                                                              |
| WS-09 Beauty Passport           | **missing**            | —                                                                                                                                               |
| WS-10 editorial personalization | **missing**            | `sectionForCategory` is a seed; no profile→content mapping / reason codes                                                                       |
| WS-11 My Seoul Drop gateway     | **missing**            | `/seoul` is the directory; no saves/gateway; **[PRODUCT DECISION: is My Seoul Drop live / same repo?]**                                         |
| WS-12 newsletter                | **partial**            | DB capture works; missing `source_context`, consent versioning, ESP                                                                             |
| WS-13 analytics                 | **missing**            | **no provider installed [PRODUCT DECISION]**                                                                                                    |

**Naming gap (material, affects shipped IA):** the platform ships **"My Hair Profile"** (hair-only, `/hair-profile`, `/haircare/profiles/[slug]`). The spec (`docs/00 §6.3`, `docs/04 §8`) mandates **"Beauty Profile" = Skin Profile + Hair Profile**, with distinct names. Reconciliation is a founder decision (§11).

---

## 7. Security / privacy risks

- **New owner-scoped RLS is the crux.** Attempts, responses, snapshots, consent must be readable/writable only by their owner (anonymous-identity or `auth.uid()`), never public, never staff-by-default (`docs/03 §12`). Model after the existing `is_admin()` rigor but owner-scoped.
- **Anonymous identity must be server-trusted.** Opaque, HTTP-only, same-site cookie; store a **hash**, not the raw token; local storage is UX-only, never proof of ownership (`docs/01 WS-04`).
- **Result & Passport routes must be `noindex` + authorized**, with no personal answers in metadata/URLs (`docs/04 §6`, `docs/01 WS-07`). None exist yet, so this is greenfield to get right.
- **Analytics privacy:** when a provider is chosen, never send raw answers / free text / email (`docs/06`). No provider today = no current leak, but the taxonomy must bake this in from day one.
- **Ops gap:** `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is a **placeholder**; local seeding/migrations that need it won't run without a real key **[INTEGRATION CREDENTIAL REQUIRED]**. Not a production exposure (prod uses Vercel env), but it blocks local data ops.
- Newsletter action inserts email directly (fine); Phase 1 must separate optional marketing consent from account/privacy consent (`docs/00 §16`).

No critical vulnerabilities found in the current code; RLS + SSR session handling are sound.

---

## 8. Exact gstack command mapping

Discovered from the installed skills (this environment). Product docs outrank generic gstack advice (`docs/02 §1`). No repo `CLAUDE.md` skill-routing file exists; `.claude/settings.local.json` is present.

| Runbook role (`docs/02`) | Installed skill(s)                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Product / CEO review     | `/plan-ceo-review`, `/office-hours`                                                |
| Engineering plan review  | `/plan-eng-review`; `/autoplan` (runs CEO+design+eng+DX panel)                     |
| Design plan / review     | `/plan-design-review`, `/design-review`, `/design-consultation`, `/design-shotgun` |
| Spec authoring           | `/spec`                                                                            |
| Implementation           | normal editing + `/run` (drive app), `/verify` (exercise a change end-to-end)      |
| Code review              | `/code-review` (diff, effort-scaled), `/review` (PR), `/simplify`                  |
| Browser QA               | `/qa`, `/qa-only`, `/browse`                                                       |
| Security review          | `/security-review`, `/cso`                                                         |
| Ship / release           | `/ship`, `/land-and-deploy`                                                        |
| Investigate / debug      | `/investigate`                                                                     |
| Health / retro / docs    | `/health`, `/retro`, `/document-generate`, `/document-release`                     |

Recommended Phase 1 loop per milestone: `/spec` (if copy/taxonomy) → `/plan-eng-review` → implement → `/code-review` + `/security-review` → `/qa` → `/ship`.

---

## 9. Recommended milestones

Mirrors `docs/02 §4` / `docs/README §5`, adapted to this repo:

- **M1 — Foundation & data model** (additive migrations: anonymous identity, quiz definitions/questions/options, attempts/responses, profile snapshots, consent; validation types; anonymous-identity cookie; feature flags; tests). No UI/route change.
- **M2 — Beauty Profile hub + reusable quiz framework** (`/beauty-profile` hub with Skin + Hair cards; `QuizShell` / `QuestionRenderer`; placeholder seed quiz; autosave/resume; a11y). Reconcile `/hair-profile` naming.
- **M3 — Skin Profile** (placeholder question config + deterministic rules + result screen).
- **M4 — Hair Profile** (same framework; fold in the existing six hair profiles as result archetypes).
- **M5 — Consumer signup + identity linking** (extend Supabase Auth; consent capture; idempotent link).
- **M6 — Beauty Passport** (private, authorized; snapshots; history; empty states).
- **M7 — Editorial personalization + My Seoul Drop gateway** (profile→content mapping + reason codes; save-ready interfaces behind flags).
- **M8 — Analytics, a11y, QA, release** (event taxonomy `docs/06`; WCAG 2.2 AA; security review; rollback).

---

## 10. Proposed files to add/change for M1 and M2

**Not yet implemented — proposal for approval.**

**M1 (additive, flag-guarded, no UI change):**

```text
supabase/migrations/<ts>_beauty_profile_foundation.sql   # anonymous_identities, identity_links,
                                                         # quiz_definitions/questions/options,
                                                         # quiz_attempts/responses, profile_snapshots,
                                                         # user_current_profiles, consent_documents/records
                                                         # + owner-scoped RLS
lib/profile/anon-identity.ts        # issue/read opaque httpOnly cookie; hash; server ownership check
lib/profile/flags.ts                # beauty_profile_enabled, skin/hair_profile_enabled, ... (safe defaults off)
lib/profile/schema.ts               # zod-free runtime validators (match existing lib/validation.ts style)
services/profile/*.ts               # attempts/responses/snapshots data access (RLS-scoped)
types/database.types.ts             # regenerated (npm run db:types)
+ *.test.ts for each                # anon identity, validators, flags, RLS ownership
```

**M2 (routes + framework; `/hair-profile` reconciliation pending §11 decision):**

```text
app/beauty-profile/page.tsx                     # hub: Skin + Hair cards, value, privacy, limitations
app/beauty-profile/[domain]/start/page.tsx
app/beauty-profile/[domain]/quiz/[attempt]/page.tsx
components/profile/{BeautyProfileEntryCard,QuizShell,QuestionRenderer,ConsentFields}.tsx
lib/profile/quiz-definition.ts                  # versioned definition loader + placeholder seed
app/actions/profile.ts                          # start/save/complete server actions (idempotent, validated)
next.config.js                                  # /hair-profile → /beauty-profile/hair (if renamed)
lib/nav.ts / SiteHeader                          # CTA label "My Hair Profile" → "My Beauty Profile" (if renamed)
+ a11y + unit tests
```

---

## 11. Assumptions and blockers (founder decisions)

1. **Beauty Profile naming vs shipped Hair Profile.** Spec: **Beauty Profile = Skin + Hair**. Live: **My Hair Profile** (hair only). **[PRODUCT DECISION]** — recommend introducing `/beauty-profile` (Skin + Hair) and 308-redirecting `/hair-profile → /beauty-profile/hair`, folding the six hair profiles in as hair result archetypes. Affects routes I just shipped, so I want a yes before touching them.
2. **Analytics provider.** None installed; `docs/06` needs one. **[PRODUCT DECISION]** — options: Vercel Analytics, PostHog, Plausible. Recommend a thin provider-agnostic event layer now, provider wired when chosen.
3. **Consumer auth.** Extend the existing **Supabase Auth** for consumer signup (reuse `auth.users`)? **[confirm]** — recommended (no new provider).
4. **My Seoul Drop.** Same repo / another domain / not live? `/seoul` is the directory today. **[PRODUCT DECISION]** — assume _not live_: build a flagged gateway + save-ready interfaces only.
5. **ESP for newsletter/marketing.** None. **[confirm]** — Phase 1 can stay DB-capture; add `source_context` + consent versioning now, wire an ESP later.
6. **Skin/Hair quiz taxonomy + copy + disclaimers.** **[PRODUCT / MEDICAL / LEGAL REVIEW REQUIRED]** — engineering builds the versioned framework with clearly-labeled placeholders; no invented medical claims or final taxonomy.
7. **Feature-flag mechanism.** None exists. **[confirm]** — propose a simple typed config module with env overrides and safe-off defaults.
8. **`SUPABASE_SERVICE_ROLE_KEY`.** Placeholder locally. **[INTEGRATION CREDENTIAL]** — needed for seeding/migrations from local or CI.

---

## 12. Clear recommendation for what can be implemented today

**Safe to implement now (additive, non-destructive, no UI/route change, flag-guarded):**

- **M1 — Foundation & data model**: the migrations + owner-scoped RLS, anonymous-identity cookie foundation, runtime validators, feature flags (default off), and tests. Nothing renders to users until a flag is turned on; no existing route, table, or behavior changes.

**Should wait for a founder decision before starting:**

- **M2** — because it creates `/beauty-profile` and may rename the live `/hair-profile` CTA/route (decision #1), and because the hub explains Skin **and** Hair (decision #1 + copy).
- Anything touching **analytics** (#2), **consumer auth** (#3), or **quiz copy/taxonomy** (#6).

**Per the runbook, I am stopping here for approval and have not implemented any feature code.** On approval, the first batch (M1) would run: write the migration, apply to a branch/preview DB, generate types, add validators + anon-identity + flags + tests, then `/code-review` + `/security-review` (RLS focus), and report — with production untouched behind flags.
