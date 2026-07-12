# Treatment Explainer Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish three original, plain-English long-form guides that explain how popular Korean aesthetic treatments work, grouped by mechanism, using the existing articles pipeline.

**Architecture:** Pure content. Each guide is one markdown-with-frontmatter file. Drafted under `content/drafts/` (not seeded), reviewed for medical accuracy, then moved to `content/articles/` and upserted into the `posts` table via `scripts/seed-posts.mjs`, served at `/articles/[slug]`. No migration, service, route, or component work.

**Tech Stack:** Markdown (remark-gfm — tables, blockquotes, links all render via `components/editorial/Prose.tsx`), the existing `seed-posts.mjs` upsert script, Supabase `posts` table.

## Global Constraints

Every task inherits these. They are the spec's guardrails, verbatim:

- **No prices.** No costs or ranges anywhere.
- **No efficacy claims.** Never "best" / "definitely works". Frame as "understood to work by <mechanism>"; always state individual variation and that results are not permanent.
- **No clinic or doctor recommendations.** No named clinics, no booking links, no referrals.
- **Non-medical disclaimer** at the end of every guide, verbatim:
  > This guide is for education only and is not medical advice. Treatments, suitability, and results vary by individual. Talk to a licensed medical professional before deciding on any procedure.
- **Original copy only.** Brand/device names used nominatively to identify the subject; do not copy clinic marketing, Wikipedia, or manufacturer text.
- **Category** is `"beauty"`. **Author** is `"A Drop of Seoul Editorial"`.
- **Voice:** match the existing beauty articles (e.g. `content/articles/glass-skin-without-10-steps.md`) — a "Quick answer" opener, calm plain English, short paragraphs.
- **Drafting location:** write in `content/drafts/`. Do NOT move to `content/articles/` or run the seeder until Task 4 (after the human medical-accuracy review).

## File Structure

- `content/drafts/skin-lifting-treatments-explained.md` — Task 1 (anchor)
- `content/drafts/skin-booster-treatments-explained.md` — Task 2
- `content/drafts/pigment-laser-treatments-explained.md` — Task 3
- (Task 4 moves the three files to `content/articles/` and publishes)

Verified internal-link targets that exist today (use only these):

- `/articles/korean-post-treatment-recovery-skincare-routine`
- `/articles/korean-clinic-to-home-skincare`
- Ingredient pages: `/ingredients/panthenol`, `/ingredients/centella-asiatica`, `/ingredients/madecassoside`, `/ingredients/allantoin`, `/ingredients/heartleaf-extract`, `/ingredients/ceramide-np`, `/ingredients/green-tea-extract`

Shared 7-section template for every guide (from the spec):

1. **Quick answer** (one paragraph) 2. **Why people get it** 3. **How it works** (mechanism in everyday language) 4. **How the options differ** (GFM comparison table, differences of principle) 5. **What to know going in** (downtime concept, individual variation, not permanent) 6. **After-care at home** (internal links to the recovery article + soothing ingredient pages) 7. **Disclaimer** (verbatim blockquote).

---

### Task 1: Skin lifting guide (anchor)

**Files:**

- Create: `content/drafts/skin-lifting-treatments-explained.md`

**Interfaces:**

- Consumes: nothing (first task).
- Produces: the frontmatter shape + 7-section template + disclaimer block that Tasks 2 and 3 copy exactly. Slug `skin-lifting-treatments-explained`.

**Mechanism facts to cover (accurate, non-controversial — write original prose around these; do not present as guarantees):**

- These are energy-based tightening treatments. The shared idea: controlled heat delivered below the skin surface creates a small, deliberate injury; the body's wound-healing response builds new collagen over the following weeks to months, and that gradual remodeling is what firms and lifts. Results build slowly and are not permanent because aging continues.
- **Ultherapy** — micro-focused ultrasound; energy is focused at set depths (superficial dermis down to the deeper SMAS layer) as tiny heated points.
- **Thermage** — monopolar radiofrequency; heats a broader volume of the dermis to contract and remodel collagen; typically framed as a single session.
- **Shurink** — an ultrasound (HIFU) device in the same family as Ultherapy (different brand/cartridges); same "focused heat → collagen" principle.
- **What to know:** sensation is heat/prickling; downtime is usually short (possible redness/swelling); individual response varies; effects develop over months and fade over time.

- [ ] **Step 1: Write the guide file**

Create `content/drafts/skin-lifting-treatments-explained.md` with this exact frontmatter, then original prose for all 7 template sections covering the mechanism facts above:

```markdown
---
title: "Ultherapy, Thermage, Shurink: How Skin Lifting Treatments Actually Work"
slug: "skin-lifting-treatments-explained"
subtitle: "The heat is the point. Here's what it's doing under your skin."
excerpt: "A plain-English explainer of the energy-based lifting treatments people ask about in Korea — Ultherapy, Thermage, and Shurink — and the collagen mechanism they share."
category: "beauty"
tags:
  [
    "beauty",
    "treatments",
    "lifting",
    "ultherapy",
    "thermage",
    "shurink",
    "korea",
  ]
seo_title: "Ultherapy vs Thermage vs Shurink: How Skin Lifting Works (Plain English)"
meta_description: "What Ultherapy, Thermage, and Shurink actually do — the heat-and-collagen principle behind skin lifting treatments, explained simply. Not medical advice."
author: "A Drop of Seoul Editorial"
status: "draft"
published_at: null
featured_image: null
---
```

Body requirements:

- Open with a `## Quick answer` paragraph.
- Include a `## How the options differ` GFM table with columns `Treatment | Energy type | What it targets | Feel`, one row each for Ultherapy (micro-focused ultrasound / focused depths incl. deeper SMAS / heat points), Thermage (monopolar radiofrequency / broad dermal heating / warming), Shurink (focused ultrasound, HIFU / focused depths / heat points). Compare principle only — no "which is better", no scores, no prices.
- `## After-care at home` section links to `[post-treatment recovery routine](/articles/korean-post-treatment-recovery-skincare-routine)` and at least two soothing ingredient pages, e.g. `[panthenol](/ingredients/panthenol)` and `[centella](/ingredients/centella-asiatica)`.
- End with the disclaimer as a blockquote, verbatim from Global Constraints.

- [ ] **Step 2: Verify guardrails (banned content) — must return nothing**

Run:

```bash
cd /Users/jj_whatap/up/adropofseoul
grep -niE '\$|₩|won|\bprice|\bcost|\bbest\b|guarantee|book (now|a|an)|appointment' content/drafts/skin-lifting-treatments-explained.md
```

Expected: no output. Any hit means a price/efficacy/booking phrase leaked in — remove it. (If a legitimate word matches, e.g. "the best results happen when…", rephrase to avoid the superlative.)

- [ ] **Step 3: Verify frontmatter parses and links resolve**

Run:

```bash
cd /Users/jj_whatap/up/adropofseoul
node -e 'const t=require("fs").readFileSync("content/drafts/skin-lifting-treatments-explained.md","utf8");const m=t.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);if(!m)throw new Error("no frontmatter");console.log("frontmatter OK; body chars:",m[2].trim().length)'
grep -oE '\]\(/(articles|ingredients)/[a-z0-9-]+\)' content/drafts/skin-lifting-treatments-explained.md | sort -u
```

Expected: "frontmatter OK" with a non-trivial body length, and every listed link path corresponds to a real file (`content/articles/<slug>.md` or `content/ingredients/<slug>.md`). Confirm each printed slug exists:

```bash
for p in $(grep -oE '/(articles|ingredients)/[a-z0-9-]+' content/drafts/skin-lifting-treatments-explained.md | sort -u); do f="content${p}.md"; test -f "$f" && echo "OK $p" || echo "MISSING $p"; done
```

Expected: all `OK`, no `MISSING`.

- [ ] **Step 4: Verify disclaimer present**

Run:

```bash
grep -q "is for education only and is not medical advice" content/drafts/skin-lifting-treatments-explained.md && echo "disclaimer OK" || echo "MISSING disclaimer"
```

Expected: `disclaimer OK`.

- [ ] **Step 5: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add content/drafts/skin-lifting-treatments-explained.md
git commit -m "content(drafts): skin lifting treatments explainer (Ultherapy/Thermage/Shurink)"
```

---

### Task 2: Skin booster / injectable guide

**Files:**

- Create: `content/drafts/skin-booster-treatments-explained.md`

**Interfaces:**

- Consumes: the frontmatter shape, 7-section template, comparison-table format, and disclaimer block from Task 1 — reuse them exactly (only content changes). Slug `skin-booster-treatments-explained`.
- Produces: nothing later tasks depend on beyond being one of the three files Task 4 publishes.

**Mechanism facts to cover (accurate; write original prose; no guarantees):**

- Shared idea: very small injections place a material into the dermis (the layer under the surface) to improve texture, hydration, and firmness. Usually done as a course of several sessions; results build up and fade over time.
- **Rejuran** — polynucleotides (fragments derived from salmon DNA); used to support skin repair, elasticity, and hydration.
- **"Skin botox" (microtox)** — tiny intradermal amounts of botulinum toxin spread across the skin, aimed at oil/pore/surface smoothness; this is a different use and dosing from the muscle-relaxing wrinkle injections people usually picture.
- **Juvelook (and similar biostimulators)** — a poly-lactic-acid-type material (often with hyaluronic acid) that prompts gradual collagen build-up.
- **What to know:** tiny needle marks/redness are common short-term; multiple sessions typical; response varies; effects are not permanent.

- [ ] **Step 1: Write the guide file**

Create `content/drafts/skin-booster-treatments-explained.md` with this frontmatter, then original prose for all 7 sections covering the facts above (same template as Task 1):

```markdown
---
title: "Rejuran, Skin Botox, Juvelook: How Skin Boosters Actually Work"
slug: "skin-booster-treatments-explained"
subtitle: "Tiny injections, a bigger idea: feeding the skin from the inside."
excerpt: "A plain-English explainer of the injectable skin boosters people ask about in Korea — Rejuran, skin botox, and biostimulators like Juvelook — and the dermal-delivery principle they share."
category: "beauty"
tags:
  [
    "beauty",
    "treatments",
    "skin booster",
    "rejuran",
    "skin botox",
    "juvelook",
    "korea",
  ]
seo_title: "Rejuran vs Skin Botox vs Juvelook: How Skin Boosters Work (Plain English)"
meta_description: "What Rejuran, skin botox, and Juvelook actually do — the micro-injection principle behind skin boosters, explained simply. Not medical advice."
author: "A Drop of Seoul Editorial"
status: "draft"
published_at: null
featured_image: null
---
```

Body requirements:

- Open with `## Quick answer`.
- `## How the options differ` GFM table, columns `Treatment | What's injected | What it aims to improve | Sessions`, one row each for Rejuran (polynucleotides / repair, elasticity, hydration / a course), Skin botox (micro-dose botulinum toxin, intradermal / oil, pores, surface smoothness / repeated), Juvelook (poly-lactic-acid biostimulator ± HA / gradual firmness via collagen / a course). Principle only.
- `## After-care at home` links to `[post-treatment recovery routine](/articles/korean-post-treatment-recovery-skincare-routine)` and at least two soothing ingredient pages (e.g. `[centella](/ingredients/centella-asiatica)`, `[panthenol](/ingredients/panthenol)`, or `[madecassoside](/ingredients/madecassoside)`).
- End with the verbatim disclaimer blockquote.

- [ ] **Step 2: Verify guardrails (banned content)**

```bash
cd /Users/jj_whatap/up/adropofseoul
grep -niE '\$|₩|won|\bprice|\bcost|\bbest\b|guarantee|book (now|a|an)|appointment' content/drafts/skin-booster-treatments-explained.md
```

Expected: no output.

- [ ] **Step 3: Verify frontmatter + links**

```bash
cd /Users/jj_whatap/up/adropofseoul
node -e 'const t=require("fs").readFileSync("content/drafts/skin-booster-treatments-explained.md","utf8");const m=t.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);if(!m)throw new Error("no frontmatter");console.log("frontmatter OK; body chars:",m[2].trim().length)'
for p in $(grep -oE '/(articles|ingredients)/[a-z0-9-]+' content/drafts/skin-booster-treatments-explained.md | sort -u); do f="content${p}.md"; test -f "$f" && echo "OK $p" || echo "MISSING $p"; done
```

Expected: "frontmatter OK" + all links `OK`.

- [ ] **Step 4: Verify disclaimer**

```bash
grep -q "is for education only and is not medical advice" content/drafts/skin-booster-treatments-explained.md && echo "disclaimer OK" || echo "MISSING disclaimer"
```

Expected: `disclaimer OK`.

- [ ] **Step 5: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add content/drafts/skin-booster-treatments-explained.md
git commit -m "content(drafts): skin booster treatments explainer (Rejuran/skin botox/Juvelook)"
```

---

### Task 3: Pigment / laser guide

**Files:**

- Create: `content/drafts/pigment-laser-treatments-explained.md`

**Interfaces:**

- Consumes: the frontmatter shape, template, table format, and disclaimer from Task 1. Slug `pigment-laser-treatments-explained`.
- Produces: nothing later tasks depend on beyond being one of the three files Task 4 publishes.

**Mechanism facts to cover (accurate; original prose; no guarantees):**

- Shared idea (selective photothermolysis, in plain words): a specific colour/wavelength of light is chosen because it is absorbed mainly by one target in the skin — pigment (melanin) or blood vessels — so that target heats up while the surrounding skin is relatively spared.
- **Laser toning** — low-energy Q-switched Nd:YAG (1064 nm) done over many sessions, often discussed for melasma and overall tone.
- **IPL (intense pulsed light)** — broadband light, not a single-wavelength laser; targets both brown (pigment) and red (vessels).
- **Pico lasers** — very short (picosecond) pulses that act more mechanically to break up pigment.
- **What to know — say this honestly:** pigment treatments carry a real risk of temporary darkening (post-inflammatory hyperpigmentation), and that risk is higher for deeper/tan skin tones and with sun exposure; sun protection matters; response varies a lot between people; multiple sessions are typical and results are not permanent.

- [ ] **Step 1: Write the guide file**

Create `content/drafts/pigment-laser-treatments-explained.md` with this frontmatter, then original prose for all 7 sections covering the facts above:

```markdown
---
title: "Laser Toning, IPL, Pico: How Pigment Laser Treatments Actually Work"
slug: "pigment-laser-treatments-explained"
subtitle: "One idea does most of the work: light that only the target absorbs."
excerpt: "A plain-English explainer of the pigment and tone laser treatments people ask about in Korea — laser toning, IPL, and pico lasers — and the selective-light principle they share."
category: "beauty"
tags:
  [
    "beauty",
    "treatments",
    "laser",
    "pigmentation",
    "laser toning",
    "ipl",
    "korea",
  ]
seo_title: "Laser Toning vs IPL vs Pico: How Pigment Lasers Work (Plain English)"
meta_description: "What laser toning, IPL, and pico lasers actually do — the selective-light principle behind pigment treatments, explained simply. Not medical advice."
author: "A Drop of Seoul Editorial"
status: "draft"
published_at: null
featured_image: null
---
```

Body requirements:

- Open with `## Quick answer`.
- `## How the options differ` GFM table, columns `Treatment | Light type | Main target | Notes`, one row each for Laser toning (low-energy 1064 nm Nd:YAG / pigment & tone / many gentle sessions), IPL (broadband light, not a laser / pigment + vessels / broad targets), Pico (picosecond pulses / stubborn pigment / acts more mechanically). Principle only.
- Include the honest PIH / skin-tone / sun-exposure caution in `## What to know going in`.
- `## After-care at home` links to `[post-treatment recovery routine](/articles/korean-post-treatment-recovery-skincare-routine)` and at least two soothing/brightening-adjacent ingredient pages (e.g. `[centella](/ingredients/centella-asiatica)`, `[panthenol](/ingredients/panthenol)`, or `[green tea extract](/ingredients/green-tea-extract)`), and mention daily sunscreen (may link the existing `[sunscreen as skincare](/articles/sunscreen-as-skincare-korean-routine)` article if desired — verify it exists first).
- End with the verbatim disclaimer blockquote.

- [ ] **Step 2: Verify guardrails (banned content)**

```bash
cd /Users/jj_whatap/up/adropofseoul
grep -niE '\$|₩|won|\bprice|\bcost|\bbest\b|guarantee|book (now|a|an)|appointment' content/drafts/pigment-laser-treatments-explained.md
```

Expected: no output.

- [ ] **Step 3: Verify frontmatter + links**

```bash
cd /Users/jj_whatap/up/adropofseoul
node -e 'const t=require("fs").readFileSync("content/drafts/pigment-laser-treatments-explained.md","utf8");const m=t.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);if(!m)throw new Error("no frontmatter");console.log("frontmatter OK; body chars:",m[2].trim().length)'
for p in $(grep -oE '/(articles|ingredients)/[a-z0-9-]+' content/drafts/pigment-laser-treatments-explained.md | sort -u); do f="content${p}.md"; test -f "$f" && echo "OK $p" || echo "MISSING $p"; done
```

Expected: "frontmatter OK" + all links `OK`.

- [ ] **Step 4: Verify disclaimer**

```bash
grep -q "is for education only and is not medical advice" content/drafts/pigment-laser-treatments-explained.md && echo "disclaimer OK" || echo "MISSING disclaimer"
```

Expected: `disclaimer OK`.

- [ ] **Step 5: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add content/drafts/pigment-laser-treatments-explained.md
git commit -m "content(drafts): pigment laser treatments explainer (toning/IPL/pico)"
```

---

### Task 4: Human medical-accuracy review, then publish

**This task has a human gate.** The three guides make mechanism statements about medical procedures. They must be read by the site owner (and ideally sanity-checked against a reputable source) before going public. Do NOT run the seeder against production until the owner confirms.

**Files:**

- Move: `content/drafts/skin-lifting-treatments-explained.md` → `content/articles/`
- Move: `content/drafts/skin-booster-treatments-explained.md` → `content/articles/`
- Move: `content/drafts/pigment-laser-treatments-explained.md` → `content/articles/`

- [ ] **Step 1: Owner review gate**

Present the three drafts to the site owner. Confirm: mechanism descriptions are accurate and non-committal, no efficacy guarantees, no prices, no clinic names/links, disclaimer present. Get explicit go-ahead. If changes are requested, apply them in `content/drafts/` and re-run the Task-1/2/3 verification steps before continuing.

- [ ] **Step 2: Move to the seeded folder and set published status**

For each of the three files, move it and set `status: "published"` with a real ISO timestamp (Asia/Seoul), e.g.:

```bash
cd /Users/jj_whatap/up/adropofseoul
git mv content/drafts/skin-lifting-treatments-explained.md content/articles/
git mv content/drafts/skin-booster-treatments-explained.md content/articles/
git mv content/drafts/pigment-laser-treatments-explained.md content/articles/
```

Then edit each moved file: change `status: "draft"` → `status: "published"` and `published_at: null` → the publish timestamp (match the format used by existing articles, e.g. `"2026-07-12T09:50:00+09:00"`).

- [ ] **Step 3: Full check before seeding**

```bash
cd /Users/jj_whatap/up/adropofseoul
npm run typecheck && npm run lint && npm run test && npm run build
```

Expected: all green. (Only content files changed, so this should pass trivially; it guards against a stray broken reference.)

- [ ] **Step 4: Seed to Supabase**

```bash
cd /Users/jj_whatap/up/adropofseoul
node scripts/seed-posts.mjs
```

Expected: HTTP `2xx` and the three new slugs appear in the returned representation.

- [ ] **Step 5: Verify live render**

Confirm each renders with published data:

- `/articles/skin-lifting-treatments-explained`
- `/articles/skin-booster-treatments-explained`
- `/articles/pigment-laser-treatments-explained`

Check the comparison table, internal links, and disclaimer all render. Use the `run` skill if a local server is needed.

- [ ] **Step 6: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add -A content/articles content/drafts
git commit -m "content(articles): publish three treatment explainer guides"
```

---

## Self-Review

- **Spec coverage:** Intent (explain mechanism, don't recommend) → Tasks 1-3 content briefs. Three grouped guides → Tasks 1-3. Lifting first → Task 1 is the anchor. All four guardrails → Global Constraints + Step 2/4 checks in each task. Articles-pipeline architecture, draft-then-publish flow → Task 4. Internal linking → each task's after-care step. SEO fields → frontmatter blocks. "Out" scope (no new route/DB/service, no prices, no clinic rows) → nothing in the plan creates those. Covered.
- **Placeholder scan:** No TBD/TODO; each guide has verbatim frontmatter, concrete mechanism facts, exact table columns, verbatim disclaimer, and exact verification commands.
- **Type/name consistency:** Slugs are consistent between frontmatter, file paths, verification commands, and the Task-4 moves (`skin-lifting-treatments-explained`, `skin-booster-treatments-explained`, `pigment-laser-treatments-explained`). Disclaimer sentence used in write and grep steps matches. Internal-link slugs were verified to exist on disk.
