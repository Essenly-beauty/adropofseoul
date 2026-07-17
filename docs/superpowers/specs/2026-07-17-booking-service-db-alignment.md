# Booking-Service DB Alignment — Review & Decisions

**Date:** 2026-07-17
**Reviews:** `2026-07-17-content-strategy-service-db.md` §6 (에센리 예약 서비스
DB 스키마) against the live repo schema (migrations 0001–0004) and the agent
specs/plans.
**Driving goal:** research output (Track 2 pipeline) should accumulate directly
into a structure the future booking service can consume — capture now what is
expensive to retrofit later.

## Verdict summary

The plan's Place/Neighborhood model is adoptable **additively** on top of the
existing `places` table — no rewrite. The full service suite (Service/시술,
Booking, Editor, Review tables) is **deferred**: it models a product that does
not exist yet, and every part of it lands additively later. Adopting it now
would be speculative schema (YAGNI) with real CMS/UI carrying cost.

## Mapping: plan §6 → repo

### Place → `places` (adopt now, additive — migration 0005)

| Plan field                                     | Repo today                                           | Decision                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name_en                                        | `name`                                               | keep `name` as EN display name                                                                                                                                                                                                                                                                                                        |
| **name_kr**                                    | —                                                    | **ADD** `name_kr text` — bilingual identity is core booking-service data; research sources often carry it                                                                                                                                                                                                                             |
| place_type(enum)                               | `category` (place_category)                          | keep repo enum; plan's Hair Salon/Head Spa/Skin Clinic/Beauty Store ⊂ salon/head_spa/clinic/shop. `category_detail` deferred                                                                                                                                                                                                          |
| neighborhood_id                                | `area` (free text)                                   | **ADD** `neighborhoods` table + nullable `neighborhood_id` FK; `area` stays for display/dedupe (backfill later)                                                                                                                                                                                                                       |
| **geo_lat / geo_lng**                          | —                                                    | **ADD** — map/검증/서비스 연동의 기본값                                                                                                                                                                                                                                                                                               |
| **opening_hours(JSON)**                        | —                                                    | **ADD** `opening_hours jsonb` (column only; admin JSON editor is a Plan 4-class task)                                                                                                                                                                                                                                                 |
| price_tier                                     | `price_range` (free text)                            | keep free text for display; tier derivable later                                                                                                                                                                                                                                                                                      |
| **price_range_krw{min,max}**                   | —                                                    | **ADD** `price_min_krw int` / `price_max_krw int` (two int columns beat jsonb for querying/sorting)                                                                                                                                                                                                                                   |
| languages_supported[]                          | `languages text[]`                                   | already exists                                                                                                                                                                                                                                                                                                                        |
| **booking_channel(enum)**                      | `booking_url` only                                   | **ADD** `booking_channel text` check (naver/online/phone/instagram/walk_in)                                                                                                                                                                                                                                                           |
| **deposit_policy**                             | —                                                    | **ADD** `deposit_policy text`                                                                                                                                                                                                                                                                                                         |
| gallery_images[]                               | `images jsonb`                                       | already exists (+ image_candidates pipeline from 0004 feeds it)                                                                                                                                                                                                                                                                       |
| rating_avg/review_count/view_count/save_count  | —                                                    | **DEFER** — service-side aggregates; meaningless without the service. Additive later                                                                                                                                                                                                                                                  |
| staff_profile                                  | —                                                    | DEFER                                                                                                                                                                                                                                                                                                                                 |
| editorial_status (Sample/Verified/**Partner**) | `partnership_status` exists                          | **ADD** `editorial_status text` check (**sample/verified only**) + design fix: the plan conflates data-verification state with partnership. Partnership already lives in `partnership_status` ('partner' badge derives from it); `editorial_status` tracks only whether the data is verified. Research-promoted places start `sample` |
| sponsorship_disclosure                         | `partnership_status` + product `disclosure_required` | DEFER a dedicated enum; derive from partnership_status until the disclosure copy needs more states                                                                                                                                                                                                                                    |
| **last_verified_at**                           | —                                                    | **ADD** `last_verified_at timestamptz` — set from the admin form's "mark verified" control                                                                                                                                                                                                                                            |

### Neighborhood (adopt now, minimal — migration 0005)

`neighborhoods`: id, slug unique, name, name_kr, vibe_tags text[], hero_image,
linked_guide_post_id FK→posts. Rationale: the plan's Editorial→Guide→Directory
funnel keys on neighborhoods; the site already filters by area; research runs
are area-keyed. Admin CRUD UI for neighborhoods is a small follow-up task —
the table unblocks data accumulation now. `places.area` free text remains the
dedupe/display key until backfill.

### Research pipeline tie-in (adopt now)

- Candidate extraction gains **optional structured hints**: `nameKr`,
  `addressHint` — only when present verbatim in source material (no guessing;
  same rule as imageUrls). Stored in the candidate's `evidence` jsonb — no
  candidate-table migration needed.
- **Approve→promote** now carries the hints into the place draft (`name_kr`,
  `address`) and stamps `editorial_status='sample'`. The editor's later
  verification pass (hours/address/booking checked) sets `verified` +
  `last_verified_at` in the CMS.

### Deferred tables (revisit when the booking service is scheduled)

| Plan entity                                     | Why deferred                                                                                    | Future path                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- |
| Service (시술/메뉴)                             | needs price/duration data collection ops that don't exist yet                                   | additive table `place_services`   |
| Booking                                         | no booking product                                                                              | additive; plan reserves the shape |
| Editor                                          | posts have `author` text; multi-editor CMS is premature for a solo operation                    | additive `editors` + posts FK     |
| Review / Experience Log                         | no user reviews; editorial experience lives in the article template's personal_experience block | additive                          |
| Product extensions (treatment link, price_tier) | The Edit rework is its own content task                                                         | additive columns                  |

### Article/Guide template (§4) → Track 3 input

quick_answer / who_its_for / quick_recs / personal_experience_block / faq map
onto the **existing posts jsonb seams** (`brief`, `research`, `ai_review` from 0003) plus body markdown conventions — the Track 3 writing agent will emit this
template. Byline strategy (§3: 에디토리얼팀 + per-article editor byline,
Essenri operator disclosure) is a content/footer task, not schema. No action
now beyond recording it as Track 3 requirements.

## Definition of done (this alignment)

- Migration 0005: `neighborhoods` + places booking-readiness columns, all
  additive, RLS consistent with 0002.
- Admin PlaceForm surfaces: name_kr, geo lat/lng, price min/max KRW,
  booking_channel, deposit_policy, editorial_status, mark-verified control.
- Candidate schema + prompt + promote flow carry nameKr/addressHint;
  promoted places are `editorial_status='sample'`.
- Suite/typecheck/build green; public site behavior unchanged.
