# CLAUDE.md — A Drop of Seoul / Essenly

Guidance for developers and AI agents working in this repo. Keep changes scoped;
prefer the local conventions below over generic best practices.

## Stack

- **Next.js 14.2 App Router**, React 18, TypeScript 5 (strict). Package manager: **npm**.
- **Tailwind 3.4** + `@tailwindcss/typography`. Editorial design tokens live in
  `tailwind.config` — `accent` (#B78B62 / hover #A2774F), `soft-gray`, `porcelain`,
  serif `var(--font-serif)`, `max-w-content` (72rem), `text` / `text-muted` / `bg`.
  Reuse these; do not introduce a second design system.
- **Supabase** (Postgres + Auth + Storage) via `@supabase/ssr`. Server client
  `lib/supabase/server.ts` (anon key + user session), service-role client
  `lib/supabase/admin.ts` (`server-only`, trusted server actions only).
- **Vercel** — `main` deploys to production; every branch/PR gets a preview.
- Markdown content: `react-markdown` + `remark-gfm` + `rehype-sanitize` (`Prose`).

## Commands

```bash
npm run dev         # local dev server
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run test        # vitest run (197 tests)
npm run lint        # next lint
npm run db:push     # apply migrations to the linked remote  (see caveat below)
npm run db:types    # regenerate types/database.types.ts from the remote schema
```

Pre-commit runs Prettier + ESLint via husky/lint-staged. Keep tests green;
add tests beside new logic (`*.test.ts` / `*.test.tsx`).

## Product & IA

Editorial-first publication. Top nav: **Skincare / Haircare / Wellness / Seoul /
Stories / About**, plus a **My Hair Profile** CTA. The GNB is a presentation-layer
mapping over a stable DB `category` enum (`lib/taxonomy.ts` → `sectionForCategory`) —
re-homing content is a code change, not a data migration. Articles live at
`/articles/[slug]` regardless of section; legacy section URLs 308-redirect
(`next.config.js`). Places directory is under `/seoul/places`.

Content model is hybrid: Supabase `posts` / `places` / `ingredients` / `products`
(+ an admin CRUD editor under `/admin`, gated by Supabase Auth `is_admin()` /
`ADMIN_EMAILS`), plus code-defined Seongsu guides (`lib/seongsu`) and pillars
(`lib/articles`), plus seed markdown in `content/`.

## Database & migrations — READ BEFORE `db push`

The remote DB and `supabase/migrations/` have **known history drift**: several
migrations were applied to the remote out-of-band without local files, and one
local file (`20260721150000_admin_claim_rls.sql`) is not recorded on the remote.

- `supabase db push` will print **"Remote migration versions not found in local
  migrations directory."** — this is the known drift, not a broken migration.
- **Do not blind-`db push`.** It would re-run `admin_claim_rls`, which could
  silently revert live RLS policies if a later migration refined them.
- To apply a new **additive** migration in the meantime, run its SQL once via the
  Supabase dashboard SQL editor (safe — it only `CREATE`s new objects), then
  optionally `supabase migration repair --status applied <version>`.
- Full details, the exact drifted versions, and the `db pull` reconciliation
  procedure are in **`supabase/migrations/README.md`**.

RLS model: content tables are public-read / admin-all via `public.is_admin()`
(`app_metadata.role = 'admin'`). New per-user tables must be owner-scoped
(`user_id = auth.uid()`); anonymous/pre-signup rows are service-role-only with
ownership proven from a server cookie (see `lib/profile/` and `docs/adr/0001`).

## Docs

Product + Phase 1 build specs live in `docs/` (start at `docs/README.md`;
`docs/IMPLEMENTATION_AUDIT.md` is the current repo/architecture map). Brand names
are distinct and must not be merged in code or copy: **A Drop of Seoul** (the
publication), **My Seoul Drop** (personalized saves), **adropof** (future product
brand), **Essenly Inc.** (company).
