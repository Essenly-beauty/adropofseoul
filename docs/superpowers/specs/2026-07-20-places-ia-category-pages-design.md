# Places IA: Lean Nav + Real Category Pages

**Date:** 2026-07-20
**Status:** Approved (design)
**Branch:** feat/beauty-content-expansion

## Problem

The Places section needs to expose its categories without bloating the primary
navigation, and the `/places` hub should work as a real directory that slices by
type and neighborhood.

Context: only four place types exist today (`hair-salon`, `head-spa`, `skin-clinic`,
`beauty-store`), defined once in `lib/discovery.ts` via the `PlaceType` union. The
live Vercel site is a stale build (shows an older, different nav); this design targets
the current `feat/beauty-content-expansion` code, which is what ships next.

### Correction after code review

An earlier draft assumed category routes like `/places/hair-salons` 404'd and needed
new pages. **That is false.** `app/places/[slug]/page.tsx` is a hybrid route that
already handles category pages: `PLACE_TYPE_BY_ROUTE` (lines 29-34) detects a type
route and renders `PlaceTypePage` (line 141) with correct SEO metadata, canonical,
breadcrumb + ItemList JSON-LD, and `generateStaticParams` (line 82) that emits the 4
type routes plus every place slug. So real, indexable category pages **already exist
and work**. The hybrid route is kept as-is (decision: not worth the URL churn to split).

This shrinks the actual work to two items: the nav "All Places →" link and a
neighborhood filter on the hub.

## Chosen Direction

**Lean nav + strong `/places` hub, with real (indexable) category pages for types.**

- The nav stays short: 4 types + an "All Places →" link. Depth lives on the pages,
  not the menu, so category growth never lengthens the menu.
- Type categories get **real routes** (`/places/[type]`) for SEO — aligned with the
  AdSense/content monetization direction. Neighborhood slicing stays a lightweight
  on-page filter for now (no dedicated routes yet).

## URL Structure (unchanged — already in place)

```
/places                       → hub (all places + type links + neighborhood filter)
/places/hair-salons           → category page (hybrid [slug] route, already works)
/places/head-spas             → category page
/places/skin-clinics          → category page
/places/beauty-stores         → category page
/places/<place-slug>          → individual place (same hybrid route)
```

No route changes. The hybrid `app/places/[slug]/page.tsx` stays as the single owner
of both category and detail pages.

## Work Items

### 1. Nav — add "All Places →"

- File: `lib/nav.ts`
- Add an `{ label: "All Places →", href: "/places" }` entry to the Places dropdown
  `items` (after the four type links). Keep the four type links unchanged.
- No change to `SiteHeader.tsx` (data-driven).

### 2. Hub — neighborhood filter

- New file: `components/editorial/PlacesDirectory.tsx` (client component).
  - Props: `places: Place[]`.
  - Derives the distinct neighborhood list from `places` (stable order of first
    appearance), plus an "All" option.
  - Renders a neighborhood chip row + a card grid of `DiscoveryPlaceCard`, filtered
    by the selected neighborhood via `useState`. "All" shows everything.
- File: `app/places/page.tsx`
  - Replace the static `PLACES.map(...)` grid (lines 79-86) with `<PlacesDirectory
places={PLACES} />`. The type filter pills (links to category pages) and the
    JSON-LD stay in the server page.

## Out of Scope (YAGNI)

- New category routes / route restructuring — already handled by the hybrid route.
- Neighborhood-specific routes (`/places/seongsu`) — defer until data justifies it.
- Additional facets (price range, English-available) as routes or nav items.
- Fixing the stale live deploy — separate concern; shipping this branch resolves it.
- Any redesign of `SiteHeader.tsx` structure.

## Testing

- Nav: Places dropdown exposes the four type links plus "All Places →" → `/places`
  (extend `SiteHeader.test.tsx`).
- `PlacesDirectory`: renders all places by default; selecting a neighborhood chip
  narrows the grid to that neighborhood; "All" resets it (new component test).
- Follow existing test patterns (e.g. `SiteHeader.test.tsx`, `ArticleCard.test.tsx`).
