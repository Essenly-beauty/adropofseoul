# Places IA: Lean Nav + Real Category Pages

**Date:** 2026-07-20
**Status:** Approved (design)
**Branch:** feat/beauty-content-expansion

## Problem

The Places section needs to expose its categories without bloating the primary
navigation. Two related issues surfaced:

1. **Perceived menu bloat.** Reflecting every place category directly in the nav
   dropdown risks a long, unwieldy menu as the directory grows (type × neighborhood).
2. **Broken category links.** The nav dropdown and the `/places` hub already link to
   routes like `/places/hair-salons`, but those currently resolve against the
   individual-place dynamic route `app/places/[slug]/page.tsx`. There is **no real
   category page** — `hair-salons` is treated as a place slug and 404s.

Context: only four place types exist today (`hair-salon`, `head-spa`, `skin-clinic`,
`beauty-store`), defined once in `lib/discovery.ts` via the `PlaceType` union. The
live Vercel site is a stale build (shows an older, different nav); this design targets
the current `feat/beauty-content-expansion` code, which is what ships next.

## Chosen Direction

**Lean nav + strong `/places` hub, with real (indexable) category pages for types.**

- The nav stays short: 4 types + an "All Places →" link. Depth lives on the pages,
  not the menu, so category growth never lengthens the menu.
- Type categories get **real routes** (`/places/[type]`) for SEO — aligned with the
  AdSense/content monetization direction. Neighborhood slicing stays a lightweight
  on-page filter for now (no dedicated routes yet).

## URL Structure

```
/places                       → hub (all places + quick filters)
/places/[type]                → category page, e.g. /places/head-spas   (NEW, indexable)
/places/[type]/[slug]         → individual place, e.g. /places/head-spas/sool-loft-head-spa-seongsu
```

Moving individual places from `/places/[slug]` to `/places/[type]/[slug]`:

- Resolves the Next.js route conflict (can't have `/places/[type]` and `/places/[slug]`
  as siblings).
- Produces a clean SEO hierarchy where the URL reflects "category > place".
- Cheap now — only 8 sample places exist, so changing their URLs has negligible cost.

`PLACE_TYPE_ROUTES` in `lib/discovery.ts` already maps types to `/places/hair-salons`
etc., matching the pluralized `[type]` segment. Route params use these plural forms;
a small helper maps a `PlaceType` → route segment and back (or reuse existing maps).

## Work Items

### 1. Nav — keep it lean

- File: `lib/nav.ts`
- Add an `All Places →` entry to the Places dropdown `items`. Keep the four type
  links (already present, already pointing at `/places/<type>` routes).
- No change needed to `SiteHeader.tsx` (data-driven).

### 2. Category page (NEW)

- File: `app/places/[type]/page.tsx`
- For each of the 4 types:
  - Short intro copy per type (e.g. head spas → scalp care / deep relaxation).
  - Filtered list of `PLACES` where `place.type === type`, rendered with the
    existing `DiscoveryPlaceCard`.
  - SEO: `generateMetadata` with `title` like "Head Spas in Seoul", description,
    canonical; breadcrumb + `ItemList` JSON-LD (reuse `lib/seo.ts` helpers).
  - `generateStaticParams` returning the 4 route segments so pages are static.
  - Unknown `type` segment → `notFound()`.
- Intro copy lives in a small per-type map (in `lib/discovery.ts` alongside the
  existing label/route maps, or a new `PLACE_TYPE_INTRO` const).

### 3. Move individual place route

- Move `app/places/[slug]/page.tsx` → `app/places/[type]/[slug]/page.tsx`.
- Update its `generateStaticParams` to emit `{ type, slug }` pairs.
- Update `DiscoveryPlaceCard` (and any other place links) to build
  `/places/${typeRouteSegment(place.type)}/${place.slug}`.
- Update the `ItemList` JSON-LD paths on the hub to the new nested paths.
- Grep for any remaining `/places/${...slug}` links and fix.

### 4. Hub reinforcement

- File: `app/places/page.tsx`
- Type filter pills link to the real `/places/[type]` category pages (already the
  intent; verify hrefs resolve to the new pages).
- Add a **neighborhood quick filter** as a lightweight client-side control on the
  hub (chips derived from distinct `place.neighborhood` values; filters the visible
  card grid). No routing, no new pages.
  - This makes the hub the "real directory" that slices by type (via links) and
    neighborhood (via client filter) without expanding the menu.

## Out of Scope (YAGNI)

- Neighborhood-specific routes (`/places/seongsu`) — defer until data justifies it.
- Additional facets (price range, English-available) as routes or nav items.
- Fixing the stale live deploy — separate concern; shipping this branch resolves it.
- Any redesign of `SiteHeader.tsx` structure.

## Testing

- Category page renders only matching-type places; unknown type → 404.
- `generateStaticParams` produces 4 type pages and the correct `{type, slug}`
  set for individual places.
- Nav "All Places →" and each type link resolve to a real page (no 404).
- Individual place pages resolve at the new nested URL; no lingering `/places/[slug]`
  links.
- Neighborhood client filter narrows the hub grid correctly and "All" resets it.
- SEO: each category page emits unique title/canonical + valid JSON-LD.
- Follow existing test patterns (e.g. `SiteHeader.test.tsx`, `ArticleCard.test.tsx`).
