# A Drop of Seoul — Ingredient Encyclopedia (MVP) Design

**Date:** 2026-07-10
**Status:** Approved (brainstorming) — pending implementation plan
**Part of:** the platform vision ([[adropofseoul-platform-vision]]) — this is the
first sub-project: a normalized ingredient dictionary that also seeds the future
Essenly skin-type ↔ ingredient ↔ product DB.

## Intent

Build an English K-beauty **ingredient dictionary**: original, factual entries
for the actives people search ("what is niacinamide", "snail mucin benefits",
"centella for redness"), organized by function and skin-type/concern fit. Public
pages + a normalized data model. Benchmark Hwahae's _concept_ only — write all
copy originally; never copy Hwahae's text or scores.

**Chosen scope (this spec):** design the full normalized model now; implement
the **ingredient dictionary** first (public `/ingredients` pages + a 30–50 entry
seed + linkage to existing products). Ingredient suitability is expressed as
**editorial prose + skin-type/concern tags — no numeric safety/comedogenic
scores** (EWG-style scoring carries copyright + scientific-controversy risk).

## Data model (Supabase — new migration `0003`)

### `ingredients`

- `id uuid pk`, `slug text unique not null`
- `name text not null` (display, e.g. "Niacinamide")
- `inci_name text` (e.g. "Niacinamide")
- `also_known_as text[]` (e.g. {"Vitamin B3","Nicotinamide"})
- `functions text[]` — controlled vocabulary (see taxonomy)
- `summary text` (one-liner for cards/meta)
- `description text` (markdown — original editorial: what it is, how it works)
- `benefits text` (markdown or short list)
- `good_for_skin_types text[]` — from the skin-type vocabulary
- `targets_concerns text[]` — from the concern vocabulary
- `caution text` (markdown — honest "may not suit / use with care" prose; no score)
- `seo_title text`, `meta_description text`
- `status text` default `'draft'` (`draft` | `published`)
- `created_at`, `updated_at timestamptz`

### `product_ingredients` (join — designed now, populated incrementally)

- `product_id uuid → products(id) on delete cascade`
- `ingredient_id uuid → ingredients(id) on delete cascade`
- `is_key boolean default false` (hero/marketed ingredient)
- `position int` (order on the INCI label, nullable)
- primary key `(product_id, ingredient_id)`

### RLS (match existing tables)

- Public `SELECT` on `ingredients` limited to `status = 'published'`.
- Public `SELECT` on `product_ingredients` allowed (join rows are not sensitive).
- All writes restricted to the admin allowlist (service role / authed admin),
  mirroring the posts/places/products policies.

### Indexes

- `ingredients(slug)` unique; GIN on `functions`, `good_for_skin_types`,
  `targets_concerns` for filter queries; `product_ingredients(ingredient_id)`.

## Taxonomy (`lib/taxonomy.ts` — TS constants, same pattern as `lib/categories.ts`)

- **skin types:** `oily · dry · combination · sensitive · normal · acne_prone`
- **concerns:** `acne · aging · hyperpigmentation · redness · dryness · dullness · texture · pores · barrier`
- **ingredient functions:** `humectant · emollient · occlusive · antioxidant · exfoliant · brightening · soothing · barrier-support · sebum-control · anti-aging`

Each as an array of `{ value, label }` with a `label(value)` helper. Stored in
DB as `text[]`; validated in-app against these vocabularies. Using arrays +
constants (not Postgres enums) keeps it extensible for Essenly without migration
churn. Values are documented as the canonical vocabulary the Essenly DB reuses.

## Data access (`services/ingredients.ts`)

Typed like the existing services (browser/server Supabase client, `React.cache`
wrapped `getBySlug`, published-only for public reads):

- `listIngredients(opts?: { limit?; skinType?; func? }): Promise<Ingredient[]>`
- `getIngredientBySlug(slug): Promise<Ingredient | null>`
- `listProductsForIngredient(ingredientId): Promise<Product[]>`

New `Ingredient` type in `services/types.ts`; regenerate
`types/database.types.ts` after the migration is applied.

## Public pages

- **`/ingredients`** — index: eyebrow + heading, an `AreaFilter`-style chip row
  to filter by function and/or skin type (server-filtered via search params,
  same pattern as `/places`), then a Monocle-style labeled list / card grid of
  ingredients (reuse `Eyebrow`, editorial cards, hairlines). Empty-state guard.
  `force-dynamic`. Canonical + metadata.
- **`/ingredients/[slug]`** — detail: name + INCI + also-known-as; function
  chips; summary; `Prose`-rendered `description`; benefits; **good-for** skin-type
  and concern chips; the honest `caution` note; a "Found in" list of products
  (via `product_ingredients`, shown when non-empty); related ingredients (shared
  function/concern); an FAQ block; `notFound()` on unknown slug; `force-dynamic`.
- **SEO:** `DefinedTerm` JSON-LD per ingredient (+ `DefinedTermSet` on the index)
  — strong for glossary search. Add a `definedTerm` helper to `lib/seo.ts`
  alongside the existing JSON-LD helpers. Internal links: articles ↔ ingredients
  ↔ products (e.g. the serums article links to relevant ingredient pages).
- **Nav:** add "Ingredients" to `lib/nav.ts`; it renders in `SiteHeader` and
  `SiteFooter` automatically.

## Content entry (no admin CRUD yet)

Admin ingredient CRUD belongs to the later CMS sub-project. For this MVP, seed
like the articles were: structured source files under `content/ingredients/`
(one markdown-with-frontmatter file per ingredient, frontmatter mapping to the
`ingredients` columns) → an idempotent upsert insert script (mirroring the
posts inserter) → DB. AI-drafted originally, editor-reviewed.

**Legality:** ingredient facts (INCI, function, general mechanism/benefits) are
factual and written from scratch; do NOT copy Hwahae/INCIDecoder/EWG text or
scores. Cite general scientific consensus in plain language.

## Scope

**In:** migration `0003` (ingredients + product_ingredients + RLS + indexes),
`lib/taxonomy.ts`, `services/ingredients.ts` + `Ingredient` type + regenerated
DB types, `/ingredients` index (with filter) + `/ingredients/[slug]` detail,
`DefinedTerm` JSON-LD, nav entry, a seed-file format + insert script, and an
initial batch of 30–50 seeded ingredients. Tests for taxonomy helpers, service
(fake client), and the new components/pages per existing patterns.

**Out:** click-to-translate/i18n, ingredient CRUD admin UI, full product-page
ingredient-breakdown redesign (the join is created; product→ingredient display
is a follow-up), editorial ratings & review synthesis (sub-project 1), community
UGC (sub-project 3).

## Testing / done

- Existing suite stays green; add tests for `lib/taxonomy.ts` label/validate,
  `services/ingredients.ts` (fake client, published-only + bounded queries),
  ingredient card/chip components, and the DefinedTerm JSON-LD helper.
- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` green.
- Migration applies cleanly to the live Supabase project; seed script upserts
  the initial ingredients; `/ingredients` and a sample detail render published
  data live.
