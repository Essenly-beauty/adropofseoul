# A Drop of Seoul — Content Strategy & Launch Plan

**Date:** 2026-07-09
**Status:** Approved (brainstorming) — content spec
**Owner:** jj@whatap.io (solo builder / editor)

## Goal

Build the launch content that makes A Drop of Seoul a credible, indexable media
platform ready for a custom domain and **Google AdSense approval**, then grows
into an affiliate-monetized K-beauty / Seoul-experience guide for 20–40 year-old
international readers. See [[adropofseoul-monetization-direction]].

**Hard truth driving every decision:** Google's spam policies penalize _scaled
content abuse_ (mass, low-effort AI text). Approval and ranking come from
**genuine E-E-A-T** — first-hand experience, specifics, and a point of view.
This plan optimizes for _fewer, genuinely useful, human-edited_ articles, not
volume.

## Authorship model (E-E-A-T)

**Drafts are written AI-assisted, then finished by a human before publish.**

- Each draft ships with `[[ NOTE: … ]]` **fill-in slots** where the editor adds
  real first-hand detail (how a product felt, skin reaction, price paid, the
  actual studio visited, a candid "what I didn't love"). **A draft is not
  publishable until every `[[ NOTE ]]` is resolved or deliberately cut.**
- Every article carries a real author byline and a short "How we tested / chose"
  transparency note.
- Voice: first person ("I"/"we"), specific, opinionated, warm-but-precise
  (Into The Gloss × Monocle). Short and long sentences mixed.

### Anti-AI-tells checklist (every article)

- No throat-clearing intros ("In today's fast-paced world…", "When it comes
  to…"). Open on a concrete scene, number, or claim.
- At least one **specific number/date/price** and one **named product/place**
  per section.
- At least one **honest negative** ("what didn't work", "who should skip this").
- A real opinion or contrarian take, not just balanced summary.
- No filler transitions, no over-listing, no uniform paragraph lengths.
- Cut anything that could appear verbatim on ten other blogs.

## Content pillars → category & SEO mapping

The site's categories are `beauty · hair · head-spa · wellness · guides`, plus
the `places` directory. Filling all of them signals a complete site.

| Pillar                                                | Category                             | Format                                                                                                                 | Primary SEO (English long-tail)                                         |
| ----------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **1. K-Beauty reviews (by skin type, purchase-help)** | `beauty`                             | "Best X for [skin type]" roundups + single-product deep reviews. Reference: Hwahae rankings. Affiliate slots built in. | `best korean serum for oily skin`, `[brand] [product] review`, `A vs B` |
| **2. Skin-type care (local Korean routines)**         | `beauty`                             | "The Korean [skin type] routine", glass skin, double cleansing                                                         | `korean skincare routine for dry skin`, `how to get glass skin`         |
| **3. Hair & scalp (Korean methods)**                  | `hair`, `head-spa`                   | Scalp scaling, head-spa guides/reviews, treatments                                                                     | `korean hair care routine`, `what is a korean head spa`                 |
| **4. Seoul hip spots (by area)**                      | `places` entries + `guides` articles | Neighborhood roundups, new spots; area filter (feature B)                                                              | `things to do in seongsu`, `seoul beauty guide`                         |
| **(fill) Wellness**                                   | `wellness`                           | Bathhouse, tea, sauna culture                                                                                          | `korean bathhouse explained`, `jjimjilbang guide`                       |

## SEO framework

- **Title:** primary keyword front-loaded + benefit + year when it helps
  (e.g. _"Best Korean Sunscreens for Oily Skin (2026, Tested)"_).
- **`seo_title`** and **`meta_description`** (150–160 chars) authored per post,
  distinct from the display title/excerpt.
- **slug** = kebab-case primary keyword.
- **Structure:** H2/H3 mapped to related queries; a short **FAQ block** at the
  end (feeds FAQ schema later). The site already emits Article JSON-LD.
- **Internal linking:** reviews ↔ routines ↔ places using the existing
  `related_products` / `related_places` post fields. Every article links to
  ≥2 others.
- **Audience:** English-first, global; mix buyer-intent and informational
  keywords.

## Imagery & thumbnails

Every article ships with a **featured thumbnail**, and they must read as one
warm editorial system (Essenly's porcelain/blush palette), not a grab-bag of
stock photos.

**Sourcing (free, commercial-safe):**

- **Unsplash** and **Pexels** — both licenses permit commercial use with no
  attribution required. Curate one hero image per article with specific search
  terms (e.g. head spa → _"scalp massage", "spa towel", "steam facial"_;
  serums → _"skincare bottles minimal", "beige flatlay"_).
- Prefer calm, warm, minimal frames (beige/cream grounds, soft light, negative
  space) so the brand treatment lands cleanly.

**Brand "touch" — applied in code, not per-file:** a single, light warm
treatment on featured images (subtle warmth + soft porcelain/blush edge scrim)
so any sourced photo auto-matches the palette. This is consistent and scalable —
no hand-editing each image. Product-review shots can opt out of the tint where
color accuracy matters. (Implementation is a small frontend task after this
spec.)

**Hosting:** upload chosen images to **Supabase Storage** (already the trusted
`next/image` host) so every thumbnail shares one origin and gets optimized;
external CDN URLs also work now that `remotePatterns` allows HTTPS hosts.

**Licensing hygiene:** only Unsplash/Pexels (or owned/original) images — no
Google Images grabs. Original photos are still best for E-E-A-T; use them when
available.

**Better over time:** replace stock with the editor's own photos of real
products/visits — strongest for both brand and E-E-A-T.

## Launch set (8 flagship articles — covers every category)

| #   | Category | Working title                                                  | Notes                           |
| --- | -------- | -------------------------------------------------------------- | ------------------------------- |
| 1   | beauty   | Best Korean Serums for Every Skin Type (Tested)                | affiliate/purchase-help anchor  |
| 2   | beauty   | The Korean Skincare Routine, Simplified — by Skin Type         | how-to                          |
| 3   | beauty   | Korean Sunscreens Worth Buying (Oily/Dry/Sensitive)            | affiliate                       |
| 4   | hair     | How Koreans Actually Care for Their Hair & Scalp               |                                 |
| 5   | head-spa | What Really Happens at a Korean Head Spa (First-Timer's Guide) | **sample written this session** |
| 6   | guides   | Where to Go in Seongsu: Beauty, Coffee & Concept Stores        | links `places` entries          |
| 7   | wellness | The Korean Bathhouse (Jjimjilbang), Explained                  |                                 |
| 8   | beauty   | Glass Skin, Realistically — What Works, What's Hype            |                                 |

**Launch strategy:** publish the 8 flagship pieces (each fully human-finished)
before applying to AdSense — quality signal, no scaled-content risk. Expand
afterward from the backlog.

## Backlog (titles only — write after launch, ~10 per pillar)

**Reviews:** best Korean toners by skin type · Beauty of Joseon line, ranked ·
best cushion foundations for [type] · snail mucin, honestly · best cleansers for
acne-prone skin · vitamin C serums compared · best Korean retinol for beginners ·
Olive Young haul: what's worth it · drugstore vs department K-beauty · best value
under ₩20,000.

**Routines:** morning vs night Korean routine · routine for sensitive skin ·
winter vs summer Korean skincare · the "skip-care" minimalist routine · fixing a
damaged barrier · exfoliation the Korean way · eye care · men's Korean routine ·
routine order explained · what Korean derms actually recommend.

**Hair & scalp:** scalp scaling at home · Korean hair loss care · best Korean
scalp shampoos · how often Koreans wash their hair · Korean hair gloss/clinic
treatments · protecting color-treated hair · Korean hair supplements · dandruff,
the Korean approach · salon glossary for foreigners · head spa vs regular salon.

**Spots & guides:** where to go in Hannam · Bukchon slow day · Seoul head spas
worth booking · English-friendly salons in Seoul · best K-beauty flagship stores ·
Seongsu concept stores · quiet cafés for a skincare-shopping break · a beauty
day-trip itinerary · seasonal Seoul (what's new) · first-timer's Seoul beauty map.

## Deferred sub-projects (separate specs — not this plan)

- **B. Places area filter** — filter `/places` by Seoul area (Seongsu, Hannam,
  Bukchon, …). Small feature; do right after launch content. The `places.area`
  field already exists.
- **C. Hip-spot discovery automation** — a scheduled research pipeline: pull
  candidate spots via the **Reddit API + web research**, draft candidate `places`
  rows, and surface them in the admin for **human approval** before publish.
  Instagram/TikTok have no clean public API and scraping breaks ToS/reliability,
  so full auto-ingest is out; research-assist + human gate is the realistic
  design. Own V2 spec.
- **D. Affiliate integration** — Amazon Associates + Olive Young. Article and
  product structures reserve link slots now (the `products.affiliate_url` and
  `disclosureRequired` fields already exist); real links wired after program
  approval. Own spec.

## This session's deliverable

1. This spec, committed.
2. **Sample article #5** — "What Really Happens at a Korean Head Spa" — full
   draft as a markdown file with frontmatter mapping to the `posts` schema
   (`title, slug, subtitle, excerpt, category, tags, seo_title,
meta_description, author, status, featured_image`), body in publishable
   markdown, `[[ NOTE ]]` experience slots (including a curated thumbnail slot),
   a "What to expect" box, and an FAQ block. Saved under `content/drafts/` for
   the editor to finish and paste into the admin CMS.

## Definition of done (per article, before publish)

- All `[[ NOTE ]]` slots resolved with real detail.
- One honest negative + one clear opinion present.
- `seo_title` + `meta_description` filled; slug is keyword-clean.
- **Featured thumbnail set** — a curated Unsplash/Pexels (or original) image,
  hosted on Supabase Storage, carrying the site's warm brand treatment.
- ≥2 internal links; affiliate disclosure present if links are affiliate.
- Reads like a person wrote it — passes the anti-AI-tells checklist.

## Related implementation task

**Brand image treatment (frontend):** add a light, tasteful warm treatment to
featured images in the `TonalFrame`/card rendering (or a `branded` variant) so
every thumbnail matches the porcelain/blush palette regardless of source, with
an opt-out for color-accurate product shots. Gated by `prefers-reduced-motion`
only for any transition, not the static tint. Small task, done alongside launch
content.
