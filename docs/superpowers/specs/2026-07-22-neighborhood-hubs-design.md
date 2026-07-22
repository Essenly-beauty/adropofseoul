# Neighborhood hubs phase (b) — Hongdae, Myeongdong, Gangnam & Cheongdam

Date: 2026-07-22
Status: user-approved direction (통합 Gangnam & Cheongdam 허브; existing data only)
Depends on: phase (a) (`2026-07-21-seongsu-purpose-guide-design.md`), merged into branch `feat/seongsu-purpose-guide` (PR #15).

## 1. Goal

Add three purpose-based neighborhood hubs using ONLY existing published place data (no new venue research this phase): Hongdae (19+ places), Myeongdong (18), and a combined Gangnam & Cheongdam (25: Cheongdam 11, Gangnam 9, Apgujeong 4, Garosugil 1). Section design follows the validated neighborhood × purpose research: Hongdae = personal color/nails/budget hair, Myeongdong = spa/facial/walk-in services, Gangnam-Cheongdam = K-pop hair & makeup/head spa/premium.

Non-goals: new venue curation, 공공데이터 candidate generator (phase c), course maps for new neighborhoods (`hasMap` stays false), Euljiro/Hannam (no data yet).

## 2. Design

### 2.1 Multi-area neighborhoods (`lib/taxonomy.ts`)

`Neighborhood` gains `areas?: string[]` — the place `area` values belonging to this hub. Helper `neighborhoodAreas(n)` returns `n.areas ?? [n.label]`. `/places` directory filtering is untouched (still exact single-area).

### 2.2 New neighborhood configs

Three new `AROUND_SEOUL_NEIGHBORHOODS` entries (slug / label / areas):

- `hongdae` / "Hongdae" / `["Hongdae", "Yeonnam"]` — sections: Personal color & makeup [personal_color, makeup] · Nails & lashes [nail_lash] · Hair salons [salon] · Perfume workshops [perfume, experience] · Spa & skin [spa, facial, clinic]
- `myeongdong` / "Myeongdong" / (single area) — sections: Spa & massage [spa] · Facial & skincare [facial] · Hair & makeup [salon, makeup] · Personal color [personal_color]
- `gangnam-cheongdam` / "Gangnam & Cheongdam" / `["Gangnam", "Cheongdam", "Apgujeong", "Garosugil"]` — sections: K-pop hair & makeup [salon, makeup] · Head spa & massage [head_spa, spa] · Personal color [personal_color] · Classes & workshops [perfume, cooking_class, experience] · Nails & clinics [nail_lash, clinic]

Landing cards, GNB nav, and sitemap derive from the array automatically — no changes needed there. Guides posts attach via existing `region:<slug>` tags; hubs render fine with zero posts.

### 2.3 Service + page

- `listPlaces` gains `areas?: string[]` (`.in("area", ...)`); fetch limit on the hub raised to 200 (matches `/places`), with a comment noting the truncation risk reviewed in phase (a).
- Hub page passes `neighborhoodAreas(n)`.
- **Multi-area link caveat**: `/places?area=` is exact-match, so for multi-area hubs the label ("Gangnam & Cheongdam") is not a valid area. `NeighborhoodDirectory` section-footer links and the hub's bottom directory link drop the `area` param for multi-area neighborhoods (keep `type`/`kind` where applicable).

### 2.4 Config safety (from phase (a) final review)

A test asserts every configured section category is a key of `PLACE_TYPE_LABELS`, so a typo'd category in a future config fails CI instead of silently rendering an invisible section.

## 3. Editorial copy

Written in the plan verbatim (lede + blurb + section blurbs per neighborhood), grounded in the 2026-07-21 research; original writing, no third-party review content.

## 4. Testing & verification

- Taxonomy tests: new config assertions, `neighborhoodAreas` fallback, category-key validity sweep across all neighborhoods.
- `npm run typecheck` / `test` / `build`; rendered-page check of the three new hubs + `/around-seoul` landing (4 cards) against the live DB.

## 5. Delivery

Stacked branch `feat/neighborhood-hubs` off `feat/seongsu-purpose-guide`; PR with base `feat/seongsu-purpose-guide` (auto-retargets to main when #15 merges).
