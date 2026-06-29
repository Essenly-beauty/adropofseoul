# A Drop of Seoul — MVP Design Spec

**Date:** 2026-06-29
**Status:** Approved (brainstorming) — pending implementation plan

## Vision

A Drop of Seoul is an English-language editorial media website curating Korean
beauty, haircare, head spas, salons, wellness rituals, and Seoul lifestyle
places for a global audience. The MVP is a beautiful, fast, scalable editorial
website backed by a focused CMS — the technical foundation for a future beauty
& wellness platform (booking, affiliate marketplace, community).

It is **not** a blog. The aesthetic and architecture target a premium
international editorial publication.

This is a **brand-new, fully independent product**. It reuses the Essenly
(`seoul-beauty-guide`) repo only as a *technical starter* for tooling — no
Essenly application code, branding, routes, assets, business logic, or git
history carries over.

---

## 1. Scaffolding & Repo Setup

**Approach: clean-room port** (not a copy-and-delete).

- New directory `/Users/jj_whatap/up/adropofseoul`, sibling to
  `seoul-beauty-guide`. Fresh `git init` on `main` — **no Essenly git history**.
- Create a **new GitHub repository named `adropofseoul`** and push the initial
  commit.
- **Port only the technical skeleton** from Essenly (rewriting where branded):
  - Config/tooling: `next.config.js`, `tsconfig.json`, `postcss.config.mjs`,
    `.eslintrc.json`, `.prettierrc`, `.lintstagedrc`, `.husky/`,
    `vitest.config.ts`, `.gitignore`.
  - Supabase client/middleware pattern: `lib/supabase/*`, `middleware.ts`.
  - `package.json` dependency set + scripts, **minus Essenly-only deps**
    (`stripe`, `next-pwa`, kit/booking/matching logic).
- **Rewrite from scratch** with the A Drop of Seoul brand: `tailwind.config.ts`,
  `app/globals.css`, all routes, all components, all `lib` business logic, and
  the entire Supabase schema/migrations/seed.
- **Do not carry over:** `DESIGN.md`, `CONTEXT.md`, `TODOS.md`, Essenly
  `CLAUDE.md`, `mockups/`, `public/` assets, and all Essenly business logic
  (`oliveyoung`, `kit`, `booking`, `matching`, `stripe`, `feature-flags`,
  `profile-completion`).

*Alternative considered:* fresh `create-next-app` + add deps manually — cleaner
baseline but slower and discards Essenly's already-tuned Supabase-SSR +
husky/vitest setup. Rejected in favor of the port.

---

## 2. Tech Stack & Project Structure

Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 · Supabase
(Postgres + Auth + Storage) · Vercel-ready deployment.

```
app/
  (public)/            # home, articles, category, places, picks, about, contact, privacy
  admin/               # protected CMS (route group with its own layout)
  api/                 # route handlers (newsletter signup, etc.)
  sitemap.ts
  robots.ts
components/
  ui/                  # shared primitives (Button, Card, Input, Chip, ...)
  editorial/           # public-site components (Hero, ArticleCard, PlaceCard, ...)
  admin/               # CMS components (forms, MediaPicker, MarkdownEditor, ...)
lib/
  supabase/            # browser + server clients, middleware session helper
  seo.ts               # metadata + JSON-LD helpers
  markdown.ts          # markdown -> sanitized HTML
  i18n/                # admin dictionary (en/ko)
services/              # data-access functions: posts, places, products, media
types/                 # shared TS types + generated database.types.ts
supabase/
  schema.sql
  migrations/
  seed.sql
public/
styles/
```

Design for isolation: each `services/*` module is the single data-access
boundary for its table (typed in, typed out); components never query Supabase
directly. SEO helpers and the markdown pipeline are pure, independently
testable units.

---

## 3. Data Model (Supabase / Postgres)

All tables have **Row Level Security**: public `SELECT` limited to published
rows; all writes restricted to allowlisted admin users. UUID primary keys,
`created_at`/`updated_at` timestamps.

### posts
title · slug (unique) · subtitle · excerpt · body (markdown text) ·
category (enum) · tags (text[]) · featured_image · gallery_images (jsonb) ·
author · seo_title · meta_description · status (`draft` | `published`) ·
published_at · related_places (uuid[]) · related_products (uuid[]) ·
**social fields** (instagram_caption, threads_post, x_post, pinterest_title,
pinterest_description) — *stored from day one, surfaced in admin in P2*.

### places
name · slug (unique) · category (enum: `head_spa` | `salon` | `cafe` |
`clinic` | `shop` | `wellness`) · area · address · short_description ·
long_description · why_we_like_it · best_for · price_range · instagram_url ·
naver_map_url · google_map_url · booking_url · contact_email · contact_phone ·
languages (text[]) · images (jsonb) · partnership_status (enum: `none` |
`contacted` | `interested` | `partner`) · notes.

### products
name · brand · slug (unique) · category · description · price · image ·
affiliate_url · where_to_buy · best_for · ingredients · rating ·
disclosure_required (bool).

### media
storage_path · alt_text (**required**) · caption · folder · width · height ·
created_at. Backed by a Supabase Storage bucket `media`.

### newsletter_subscribers
email (unique) · created_at. Simple capture only; no ESP integration in P0.

**Enums:** post category, place category, partnership_status, post status.

**Deferred to P2:** `partners` (CRM table), dashboard aggregate views, admin
social-content workspace. Social fields live on `posts` now to avoid later
migration churn.

**Language:** public content is **English-only** (single-language columns).
KR/EN dual fields and AI translation are explicit future scope and are *not*
pre-provisioned, to keep the schema lean.

---

## 4. Public Routes

| Route | Purpose |
|---|---|
| `/` | Home: hero + tagline, featured story, category cards, latest stories grid, Seoul places preview, weekly picks, newsletter signup, footer |
| `/articles` | Article listing, paginated |
| `/articles/[slug]` | Article detail — JSON-LD Article, related places/products |
| `/[category]` | Category pages: Beauty, Hair, Head Spa, Places, Guides, Picks |
| `/places` | Places directory — filter by category / area |
| `/places/[slug]` | Place detail — JSON-LD LocalBusiness, map + booking links (conditional on non-null URLs) |
| `/picks` | Products / affiliate picks (disclosure shown when required) |
| `/about` | About |
| `/contact` | Contact |
| `/privacy` | Privacy policy |

**Primary nav:** Home · Beauty · Hair · Places · Head Spa · Guides · Picks · About.
(Site-wide Search is P2 — see §8 — and is intentionally absent from P0 nav.)

All listing queries are paginated/limited (no unbounded `select *`). Detail
routes return `notFound()` for unknown or unpublished slugs.

---

## 5. Admin CMS (`/admin`)

- **Auth:** Supabase Auth (email/password). `/admin` gated by middleware +
  an **email allowlist via env var `ADMIN_EMAILS`** (comma-separated). One
  admin account seeded. Non-allowlisted authenticated users are rejected.
- **Pages:** Dashboard (P0: draft/published counts + recent activity) · Posts
  (list + create/edit) · Places (list + create/edit) · Products (list +
  create/edit) · Media Library · Settings.
- **Body editing:** **Markdown textarea with live preview**. Stored as markdown;
  rendered to **sanitized** HTML on the public site.
- **Media Library:** drag-and-drop upload to the Supabase Storage `media`
  bucket, required alt text, search/folder organization, select as featured or
  gallery image from within post/place forms.
- **Admin i18n:** simple dictionary-based toggle (`en` / `ko`) for *interface
  labels, buttons, menus, form labels, helper text only*. Selection stored in
  `localStorage`; default `en`. Public website content remains English.
- Forms: loading/disabled state on submit (no double-submit), inline
  validation, slug uniqueness handling.

---

## 6. SEO

Dynamic per-page metadata · Open Graph · Twitter cards · canonical URLs ·
clean slugs · `robots.txt` · dynamic `sitemap.xml` · JSON-LD Article (posts) ·
JSON-LD LocalBusiness (places) · breadcrumbs · server components for content
pages. Lighthouse target 90+ via image optimization (`next/image`), lazy
loading, and code splitting.

---

## 7. Design System

Replaces Essenly branding entirely. From the project spec:

| Token | Value |
|---|---|
| Background | `#FAF8F4` |
| Text | `#1C1C1C` |
| Accent | `#B78B62` |
| Soft gray | `#E8E2DA` |
| Muted pink | `#E9D6CF` |

- **Headings:** Cormorant Garamond (warm, editorial).
- **Body / UI:** Inter.
- Both loaded via `next/font`.
- Direction: minimal, editorial, warm, premium-not-luxury — large photography,
  generous whitespace, mobile-first responsive (desktop / tablet / mobile).

---

## 8. Phasing

**P0 (this build):**
scaffold + new GitHub repo · Supabase schema/migrations/seed + RLS · public
editorial site (all routes in §4) · core CMS (Posts, Places, Products, Media
Library) · Supabase Auth + email allowlist · SEO suite · admin en/ko i18n ·
deploy-ready for Vercel.

**P2 (later, separate spec/plan cycles):**
Partner CRM · dashboard analytics · admin social-content workspace · newsletter
ESP integration · KR/EN bilingual content + AI translation · search across
posts/places/products · future booking platform.

---

## Confirmed Decisions

- Fully independent repo `adropofseoul`, fresh git history; Essenly reused only
  as a technical starter (clean-room port of tooling).
- P0 = public site + core CMS (Posts/Places/Products/Media); CRM, social
  workspace, dashboard analytics deferred to P2.
- Body content authored as **Markdown**.
- Admin access via **allowlisted Supabase users** (env `ADMIN_EMAILS`).
- Headings = **Cormorant Garamond** (Playfair Display was the alternative).
- Admin allowlist via **env var** (DB `admins` table was the alternative).
- **English-only** content columns now (KR columns not pre-provisioned).
