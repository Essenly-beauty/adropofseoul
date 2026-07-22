# Seongsu purpose-based guide — design spec

Date: 2026-07-21
Status: awaiting user review
Scope: phase (a) of the neighborhood × purpose data strategy. Phase (b) — additional neighborhoods (Hongdae, Myeongdong, Cheongdam, wildcard Euljiro/Hannam) — is out of scope here but this design must be reusable for it.

## 1. Context

Research (2026-07-21) confirmed that foreign visitors come to Seongsu for **shopping, flagships, cafés, and brand workshops** — 95%+ of foreign card spending there is apparel/cosmetics retail — while beauty _services_ (personal color, hair, spa) cluster in Hongdae/Gangnam/Myeongdong. Our current 94-place dataset (Klook-sourced, bookable-only) contains **zero** shops or cafés, so the Seongsu hub cannot yet show what people actually visit Seongsu for.

Decisions already made with the user:

- (a) Seongsu restructure first, then (b) other neighborhoods.
- **Pop-up stores excluded** from this scope entirely (no DB rows, no popup content format yet).
- Curation scale: **~25–35 places total** for Seongsu, editorial quality over coverage.
- **Include** a small "beauty services on the rise" section (nails/hair/personal color — a content gap: strong in Seongsu, nearly invisible on OTAs).

## 2. Goals / non-goals

Goals:

1. Seed curated, legally-clean Seongsu places across the missing purpose layers: shops/flagships, cafés, plus rising beauty services.
2. Restructure the Seongsu hub (`/around-seoul/seongsu`) into purpose-based sections backed by the places DB.
3. Keep every mechanism neighborhood-generic so (b) is config + data, not new code.

Non-goals:

- Pop-up stores (excluded by decision).
- New DB columns (coordinates, hours, `active_until`) — not needed for this scope.
- 공공데이터 (LOCALDATA) bulk import — that belongs to (b), where service categories per neighborhood need enumeration.
- Republishing third-party reviews or ratings — standing legal constraint. New entries carry `rating = null`; only the existing Klook-sourced rows keep their imported figures.

## 3. Data layer

**No schema change.** The `place_category` enum already has `shop` and `cafe`; the `places` table and `/places` filters already support area + category.

### 3.1 New curated entries (~20–25 new rows, joining ~10 existing Seongsu rows)

Added to the existing two-file structure and seeded with the existing script (`data/adropofseoul_places.json` + `data/places-curation.en.json` → `scripts/seed-places.mjs`):

- **Shops & flagships** (`category: shop`): Olive Young N Seongsu, Amore Seongsu, Tamburins Seongsu, Nonfiction Seongsu, TIRTIR/fwee/Amuse/Torriden flagship spaces (verify each), Musinsa Seongsu, Ader Error Seongsu, LCDC Seoul, EQL Grove, Matin Kim Seongsu. `service_detail` distinguishes "K-beauty flagship" vs "Fashion flagship / select shop".
- **Cafés** (`category: cafe`): 4–6 anchors (Onion Seongsu, Daelim Changgo, Center Coffee, Mesh Coffee + verify current standing).
- **Beauty services on the rise**: In The Pink, damppeum, CCL Color Lab (`personal_color`); 5x5 Nail Studio, Dakyo Nail Seongsu (`nail_lash`); FUSS Seongsu (`head_spa`); SOONSIKI Seongsu (`salon`) — 5–8 rows.
- Existing Seongsu rows (argyol, Mariem, The Foret, perfume/makeup classes…) stay as the Experiences/Services backbone.

### 3.2 Sourcing & verification rules

- First-party sources only: official site, official Instagram, brand press pages. No scraped Naver/Google/Kakao content; map links (`naver_map_url`, `google_map_url`) are plain deep links, which is fine.
- Every new entry enters with `verified: false` in the source JSON → `is_published = false` (existing seed-script behavior). Publication requires a per-venue check: currently operating, address, official links live. Pop-up/temporary spaces discovered during verification (e.g. Dior Seongsu) are dropped, not seeded.
- `area` is normalized to exactly `"Seongsu"` for all Seongsu rows (sub-locality detail stays in `address`). This is required because the hub links to `/places?area=Seongsu` with an exact-match filter, and current source data has variants (성수/서울숲, 성수/왕십리). Migration note: the two existing rows with variant areas get re-normalized in the same seed run (upsert on slug).

## 4. Seongsu hub page

`app/around-seoul/[neighborhood]/page.tsx` gains a purpose-based directory between the map and the guides grid, driven by config — not Seongsu-specific code.

### 4.1 Taxonomy extension (`lib/taxonomy.ts`)

```ts
export type NeighborhoodSection = {
  title: string; // "Shop the flagships"
  blurb?: string;
  categories: string[]; // place_category values
  entryType?: "place" | "experience";
};
// Neighborhood gains: sections?: NeighborhoodSection[]
```

Seongsu config (order = editorial priority, matching what visitors come for):

1. **Shop the flagships** — `shop`
2. **Warehouse cafés** — `cafe`
3. **Make something: classes & workshops** — `perfume`, `makeup`, `cooking_class` (entryType `experience`)
4. **Beauty services on the rise** — `personal_color`, `nail_lash`, `salon`, `head_spa`, `spa`, `facial` (entryType `place`)

### 4.2 Rendering

- The page fetches published places for the neighborhood (`listPlaces` filtered by `area === n.label`) once, groups client-side-free (server component) into sections; sections with zero places don't render.
- Cards reuse the existing `PlaceCard`. Each section footer links to the pre-filtered directory (`/places?area=Seongsu&type=shop` etc.).
- Existing pieces (map, guides grid, waitlist) stay; the lede copy is updated to reflect the purpose framing (flagships/cafés/workshops first).
- Neighborhoods without `sections` render exactly as today — (b)-ready, zero regression for `common`.

## 5. Phase (b) forward-compatibility

- New neighborhoods = a `Neighborhood` entry with `sections` + curated rows with matching `area`. No page code changes.
- 공공데이터 인허가 import (Hongdae nails/PC, Myeongdong spa, Cheongdam hair) plugs in later as a _candidate generator_ feeding the same two-JSON curation flow — it never writes to the DB directly, preserving the human-verification gate.

## 6. Testing & verification

- `node scripts/seed-places.mjs --sql /tmp/preview.sql` dry-run; inspect generated SQL before applying (existing backup-before-write convention).
- Unit-light: taxonomy section-grouping helper gets a small test (grouping, empty-section omission, entryType filter).
- Manual: `/around-seoul/seongsu` renders all four sections with seeded data; `/places?area=Seongsu` filter still works; `common` neighborhood page unchanged.
- Existing app build + tests pass (`npm run build`, existing test suites).

## 7. Risks

- **Venue churn**: Seongsu turnover is high; mitigated by the verification gate and small N.
- **Area normalization** touches two existing published rows — verify the upsert doesn't unpublish or orphan them.
- `types/database.types.ts` is stale (missing newer enum values/columns); regenerate via `npm run db:types` before touching typed queries.
