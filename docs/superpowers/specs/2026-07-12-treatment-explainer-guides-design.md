# A Drop of Seoul — Treatment Explainer Guides Design

**Date:** 2026-07-12
**Status:** Approved (brainstorming) — pending implementation plan
**Part of:** the platform vision ([[adropofseoul-platform-vision]]) — a "explain the
principle simply" education layer, the same voice as the ingredient encyclopedia
([[2026-07-10-ingredient-encyclopedia-design]]), applied to the aesthetic
treatments visitors to Korea are curious about.

## Intent

Visitors planning a Korea trip often want popular in-clinic treatments
(Ultherapy, Thermage, Shurink, skin boosters, pigment lasers) but do not
understand what they actually are or how they work. Explain the **principle**
in plain English — not to recommend clinics, not to sell, but to demystify.

The author's own framing: "I didn't know what Ultherapy, Thermage, or Shurink
even were." That confusion is the reader we write for.

**Chosen approach:** long-form guides in the **existing articles system** — no
new database entity, route, service, or component. This is a pure content
effort layered on the proven `posts` pipeline. Guides are grouped **by
mechanism** (how the treatment works), because the mechanism is exactly the
"why/how" the reader is missing.

## Non-goals (explicit guardrails)

These are hard constraints on every guide, confirmed during brainstorming:

- **No prices.** No specific costs or ranges. Prices vary by clinic and go stale
  fast; the source archive audit already flagged treatment prices as weakly
  sourced.
- **No efficacy claims.** Never "this is best" or "this definitely works."
  Frame as "this is understood to work by <mechanism>," and always state
  individual variation and non-permanence.
- **No clinic or doctor recommendations.** No named clinics, no booking links, no
  referrals. Explanation only.
- **Non-medical disclaimer** on every guide (fixed wording, see below).
- Brand/device names (Ultherapy™, Thermage™, Shurink, Rejuran, etc.) are used
  only nominatively to identify what is being explained. All copy is written
  originally — do not copy clinic marketing, Wikipedia, or manufacturer text.
  Same copyright discipline as the ingredient encyclopedia.

## Architecture (reuse only — no new code)

Existing pipeline, unchanged:

`content/articles/*.md` (frontmatter) → `scripts/seed-posts.mjs` (idempotent
upsert on `slug`) → `posts` table → served at `/articles/[slug]` and listed on
`/articles`.

- **Category:** reuse the existing `"beauty"` category. No new taxonomy.
- **Frontmatter:** the fields `seed-posts.mjs` already parses — `title`, `slug`,
  `subtitle`, `excerpt`, `category`, `tags`, `featured_image`, `author`,
  `seo_title`, `meta_description`, `status`, `published_at`.
- **Drafting flow:** write each guide in `content/drafts/` first (that folder is
  NOT read by the seeder, so it is safe editorial WIP). After a medical-accuracy
  review pass, move the file to `content/articles/` and set
  `status: "published"` with a real `published_at`. Until then it never reaches
  the public site.

No migration, no `services/*`, no route, no component work.

## Content — three guides, grouped by mechanism

| slug                                 | Treatments covered                           | Core principle                                                                                           |
| ------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `skin-lifting-treatments-explained`  | Ultherapy, Thermage, Shurink                 | Focused heat energy (HIFU / RF) stimulates collagen, which tightens and lifts as the skin repairs itself |
| `skin-booster-treatments-explained`  | Rejuran, "skin botox", Juvelook, and similar | Micro-injections deliver a substance into the dermis to improve texture, hydration, and firmness         |
| `pigment-laser-treatments-explained` | Laser toning, IPL, pico lasers               | Specific light wavelengths selectively target pigment and vessels                                        |

**Sequencing:** ship the **lifting guide first** as the anchor (the treatments
the author personally knows, so tone is easiest to get right). The other two
follow using the identical template. Each is an independent deliverable.

The treatment list per guide is a starting set, not a closed list — items can be
added or dropped during writing, but each guide stays within its one mechanism.

## Per-guide template

A consistent structure that answers "what even is this?":

1. **Quick answer** — one-paragraph plain-English summary (same device the
   ingredient articles use).
2. **Why people get it** — the concern it targets (laxity, pigment, etc.).
3. **How it works** — the mechanism in everyday language (e.g. "heat prompts the
   skin to make new collagen, and that gradual repair is what firms it").
4. **How the options differ** — a comparison table contrasting the treatments in
   that group (e.g. Ultherapy vs Thermage vs Shurink: energy type, what layer it
   targets, sensation), on differences of principle — not on "which is better."
5. **What to know going in** — the concept of downtime, individual variation, and
   that results are not permanent. No numbers presented as guarantees.
6. **After-care at home** — internal links to the existing
   [korean-post-treatment-recovery-skincare-routine](/articles/korean-post-treatment-recovery-skincare-routine)
   and to relevant ingredient pages (e.g. panthenol, centella/cica). This is the
   bridge that ties the treatment layer back into the encyclopedia.
7. **Disclaimer** — the fixed non-medical notice.

### Fixed disclaimer wording

> This guide is for education only and is not medical advice. Treatments,
> suitability, and results vary by individual. Talk to a licensed medical
> professional before deciding on any procedure.

Placed at the end of every guide (and may be echoed briefly near the top where
appropriate).

## SEO & internal linking

- Standard article `seo_title` / `meta_description` per guide (targets queries
  like "what is Ultherapy", "Thermage vs Shurink difference").
- Internal links both directions: guides → recovery routine article and
  ingredient pages; and, where natural, the recovery/clinic-to-home articles can
  link back to these guides. Reuse existing article JSON-LD (whatever
  `/articles/[slug]` already emits) — no new SEO code.

## Scope

**In:** three long-form guide markdown files following the template and
guardrails above, drafted in `content/drafts/`, plus their internal links to the
existing recovery article and ingredient pages. Lifting guide first, then the
other two. Publication = move to `content/articles/`, set `status: published`,
run `seed-posts.mjs`.

**Out:** any new DB entity/table, a `/treatments` route or index, a treatments
service or component, a treatment taxonomy, prices, clinic data, booking, images
(reuse `featured_image: null` unless an original asset exists), and the source
archive's clinic/treatment rows (audit says do not publish those).

## Done criteria

- Each guide reads as original, plain-English explanation that a first-time
  visitor understands, and carries the disclaimer.
- No prices, no efficacy guarantees, no clinic/doctor names or links.
- Internal links resolve to real existing article/ingredient slugs.
- After review, guides live under `content/articles/` with
  `status: published`; `seed-posts.mjs` upserts them; `/articles/<slug>` renders
  live. Existing suite stays green (`npm run typecheck`, `lint`, `test`, `build`)
  — expected trivially, since only content files are added.
