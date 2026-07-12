# Seoul Beauty Source Radar

Date: 2026-07-12

A Drop of Seoul should treat source accounts and review platforms as an
editorial radar, not as publishable truth. The goal is to find Seoul beauty
places with a local point of view, then verify them through Korean and global
signals before they become guides, directory pages, or neighborhood picks.

## Editorial Goal

- Find places locals are actually talking about, not only places already
  over-indexed for tourists.
- Turn scattered signals into useful English-language guidance: who a place is
  for, what to book or buy, what to know before going, and when to skip it.
- Preserve the A Drop of Seoul angle: local-first, traveler-aware, calm,
  practical, and beauty-culture literate.
- Use Instagram, Reddit, Tripadvisor, Google, Naver, and official sources as
  evidence layers with different jobs.

## Source Layers

### 1. Local Trend Radar

Use Korean Instagram accounts, local magazines, beauty media, neighborhood
accounts, salon groups, store accounts, and creator posts to discover candidates.

Best for:

- New openings
- Card-news style roundups
- Local beauty routes
- Pop-ups, limited events, collaborations
- Places that have not yet become obvious on English travel sites

Do not publish from this layer alone. Instagram should produce candidates and
source links, not final facts.

### 2. Korean Validation

Use Naver Map, Kakao Map, Naver Search, Naver Blog, and official Korean pages to
check whether a candidate has real local activity.

Best for:

- Korean names and branch names
- Address, hours, reservation paths, phone numbers
- Recent local reviews
- Whether the place is still open
- Whether locals describe the place the same way Instagram does

### 3. Global Traveler Validation

Use Google Maps, Tripadvisor, English blogs, travel forums, and foreigner-facing
booking pages to understand visitor friction.

Best for:

- English accessibility
- Reservation difficulty
- Translation issues
- Payment or booking friction
- Whether a place is already tourist-heavy
- What international readers are confused about

### 4. Community Question Mining

Use Reddit and forum threads to understand the questions people ask before they
visit Seoul.

Best for:

- Article angles
- FAQ questions
- Pain points
- Mismatch between hype and actual traveler needs
- Repeated neighborhood or treatment questions

Reddit is strongest as a question source and weak as a fact source. Verify all
place details elsewhere.

### 5. Official Fact Check

Use the place's official website, Instagram profile, booking page, Naver Place,
Kakao Place, or brand/store page as the final factual source.

Best for:

- Current name
- Address
- Hours
- Menu or treatment list
- Price ranges when published
- Booking rules
- Images or media permissions

## Source Account Seed

The first candidate seed lives in:

`content/source-accounts/seoul-beauty-radar.json`

The database layer is defined in:

`supabase/migrations/0004_source_radar.sql`

Seed source accounts with:

```sh
npm run content:seed-source-accounts
```

Seed place candidates with:

```sh
npm run content:seed-place-candidates
```

The seed command requires `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`, either in the shell or `.env.local`.

Statuses:

- `candidate`: useful lead, not yet verified for automation.
- `approved`: reviewed and allowed for the current workflow.
- `paused`: do not use until policy, quality, or relevance is resolved.

Priorities:

- `1`: high editorial value or strong validation utility.
- `2`: useful secondary context.
- `3`: occasional signal or niche context.

## Candidate Scoring

Each place candidate should be scored before promotion into the public
directory.

| Field                   | Meaning                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `local_signal_score`    | Strength of Korean/local mentions, recency, and neighborhood fit.  |
| `traveler_signal_score` | Strength of English/global mentions and visitor usefulness.        |
| `editorial_fit_score`   | Fit with A Drop of Seoul's local-first beauty-culture angle.       |
| `verification_score`    | Confidence in address, hours, booking path, and current operation. |
| `tourist_heavy_score`   | How strongly the place appears optimized for mass tourism.         |

Recommended simple scale: `0-5`.

Promotion rule:

- Publishable candidate: `local_signal_score >= 3`, `editorial_fit_score >= 3`,
  and `verification_score >= 4`.
- Local hidden-gem candidate: local score high, traveler score low, official
  facts verified.
- Traveler-safe candidate: local score moderate, traveler score high, practical
  access is clear.
- Tourist-heavy caution: traveler score high, tourist-heavy score high, local
  score low.

## A Drop Of Seoul Angles

Use the evidence layers to create angles that are more useful than generic "best
places in Seoul" lists.

- "Where locals actually go for a scalp check near Seongsu"
- "The Apgujeong salon route that makes sense if you do not speak Korean"
- "Hannam beauty stops for a half-day without turning it into a shopping haul"
- "What Reddit gets right and wrong about Seoul skin clinics"
- "Myeongdong beauty shopping without buying the same viral products everyone
  buys"
- "Gangnam clinic research checklist before you book"
- "Hongdae beauty route for younger brands, color, and hair"

## Neighborhood Series Structure

Use neighborhood pillar guides as the top of the internal-link structure. The
pillar page should explain how to move through the area; supporting articles can
then cover narrower lists without making the pillar feel like a directory dump.

For Seongsu, the recommended cluster is:

- Pillar: `Where to Go in Seongsu: Beauty, Coffee & Concept Stores`
- Series 1: `Seongsu Beauty Spots`
- Series 2: `Seongsu Cafes For A Beauty Break`
- Series 3: `Seongsu Concept Stores And Pop-Ups`
- Series 4: `What's New In Seongsu`

Each supporting article should link back to the pillar guide and to verified
place pages when available. The pillar guide should link out to the supporting
series, but it should remain useful even before every individual place has been
verified.

## Map Link Rules

Verified public place pages should support three outbound map actions when
available:

- Google Maps
- Naver Map
- Kakao Map

Do not add exact map buttons from guesswork. For each place, fill map URLs only
after verifying the branch/location through official pages or the map provider
itself. Search-result links can be stored in evidence as a validation queue, but
public place pages should prefer exact place URLs.

Long-term, these buttons can sit beside an A Drop of Seoul-native map, itinerary,
or booking CTA. The current role of the buttons is practical traveler utility and
source transparency.

## Review Workflow

1. Collect signal
   - Save source URL, platform, posted date if visible, mentioned place names,
     neighborhood, and content type.
   - Store thumbnails or media only when licensing allows it. Prefer source
     links over copied media.

2. Normalize candidate
   - Korean name
   - English display name
   - Neighborhood
   - Category
   - Possible official URL
   - Source account that surfaced it

3. Validate locally
   - Check Naver Map and Kakao Map.
   - Confirm the place is open and the branch is correct.
   - Review recent Korean-language comments or blog mentions for context.

4. Validate globally
   - Check Google Maps, Tripadvisor, and English-language discussions.
   - Record visitor friction: language, reservation, pricing transparency,
     location, and payment.

5. Editorial decision
   - Add a note explaining why this is worth A Drop of Seoul coverage.
   - Mark as `reject`, `watch`, `draft`, or `directory_ready`.

6. Publish carefully
   - Use original prose.
   - Link to official pages and maps.
   - Include "best for" and "check before you go" notes.
   - Do not present scraped social content as owned editorial media.

## Suggested Data Model

These are planning tables for a later Supabase migration.

### `source_accounts`

- `id`
- `platform`
- `handle`
- `display_name`
- `url`
- `language`
- `market_scope`
- `source_type`
- `category`
- `neighborhood_focus`
- `priority`
- `status`
- `notes`
- `last_checked_at`

### `source_items`

- `id`
- `source_account_id`
- `platform_item_id`
- `url`
- `published_at`
- `captured_at`
- `content_type`
- `text_excerpt`
- `mentioned_place_names`
- `mentioned_neighborhoods`
- `raw_metadata`

### `place_candidates`

- `id`
- `name_ko`
- `name_en`
- `category`
- `neighborhood`
- `candidate_status`
- `local_signal_score`
- `traveler_signal_score`
- `editorial_fit_score`
- `verification_score`
- `tourist_heavy_score`
- `editorial_angle`
- `notes`

### `place_evidence`

- `id`
- `place_candidate_id`
- `source_type`
- `source_name`
- `url`
- `evidence_kind`
- `observed_value`
- `checked_at`
- `confidence`
- `notes`

### `place_research_runs`

- `id`
- `run_type`
- `started_at`
- `finished_at`
- `query`
- `source_count`
- `candidate_count`
- `reviewer`
- `notes`

## Automation Rules

- Do not automate login-gated scraping or private content collection.
- Prefer official APIs, approved partner data, RSS/newsletter sources, manual
  review, or compliant third-party monitoring tools.
- Save links, public metadata, and editorial notes. Avoid storing full copied
  captions, images, videos, or review text unless the license and platform terms
  allow it.
- Keep every automatically discovered place unpublished until human review.
- Re-check facts before publication and again on a schedule for high-traffic
  guide pages.
- Treat medical-aesthetic and clinic information as higher risk: require
  official source verification, cautious language, and no treatment outcome
  promises.

## MVP

Start with a weekly manual/semi-automated radar before building a full bot.

- Week 1: Review priority 1 source accounts and save 30-50 place candidates.
- Week 2: Validate candidates for Seongsu, Hannam, Gangnam, Apgujeong, Hongdae,
  and Myeongdong.
- Week 3: Promote 10-20 places into unpublished directory drafts.
- Week 4: Publish one neighborhood guide and one cross-neighborhood beauty
  route, with source notes retained internally.

## Publishing Checklist

- Does this place have a current official or map source?
- Is the branch/neighborhood correct?
- Are hours and booking paths checked?
- Is there a local signal, not only tourist chatter?
- Is there enough traveler context to make the article useful in English?
- Does the article explain who should skip it?
- Are claims original, cautious, and supported by source notes?
- Are images licensed, original, or intentionally blank until sourced?
