# Initial Product Promotion Review

**Generated:** 2026-08-17
**Queue:** `data/beauty-pipeline/csv/product_promotion_queue.csv`
**Status:** Candidate review only; zero products are auto-approved by this process.

## 1. Queue outcome

The deterministic promotion queue contains 42 products:

| Routine step              | Candidates |
| ------------------------- | ---------: |
| Cleanser                  |          6 |
| Toner / pad               |          6 |
| Essence / serum / ampoule |         10 |
| Moisturizer               |         10 |
| Sunscreen                 |          5 |
| Mask / exfoliant          |          5 |

All eight existing curated Picks are retained. The remaining candidates favor
source concern coverage, skin-type evidence, existing rankings/awards, English
brand identity, and diversity of concerns within each routine step. Those
signals determine review order only; they do not establish suitability.

## 2. Current blockers

| Missing review input     | Products |
| ------------------------ | -------: |
| English product name     |       34 |
| English brand name       |        1 |
| Olive Young Global offer |       34 |
| Texture/finish review    |       42 |

The queue is therefore a worklist, not a launch catalog. The first vertical
slice should use the eight existing Picks, of which six already satisfy the
minimum concern/skin-signal coverage gate. Texture/finish and caution review
are still required for all eight.

The first evidence review and executable overlay now live in
`docs/REVIEWED_PRODUCT_SLICE_V1.md` and
`lib/skincare/recommendation-v1.ts`. Six products are eligible for V1
evaluation; Dr.G remains `needs_review`, and ILLIYOON is excluded from the
facial profile scope under the current source classification.

## 3. Review order

### Batch 1 — Existing Picks

Review all eight first because English identity, global offers, assets, and the
existing public Picks workflow are already present.

For each product:

1. confirm routine step;
2. normalize source concerns;
3. review texture and finish;
4. add caution/exclusion notes;
5. approve one to three controlled recommendation reasons;
6. verify offer URL and affiliate disclosure;
7. mark `editorial_status=approved` only after the above is complete.

### Batch 2 — Strong source candidates

Work down the queue by `selection_score`, but preserve step balance. Verify the
official English identity and global retailer match before enriching traits.
An ambiguous global match goes to the existing reconciliation workflow and is
never guessed.

### Batch 3 — Coverage gaps

After 30 products are approved, run test Skin Profile fixtures. Add products
only for gaps such as no suitable cleanser, sunscreen, texture, or concern
match. Do not continue toward 42 merely to meet a count.

## 4. Required reviewer fields

Fill these columns in a separate reviewed overlay or future review table; the
generated queue itself should remain reproducible:

- `normalized_skin_types`
- `normalized_concerns`
- `texture_finish_review`
- `caution_review`
- `image_status`
- `editorial_status`
- `review_notes`

Recommended status progression:

```text
needs_review
  → identity_verified
  → traits_reviewed
  → copy_reviewed
  → approved
```

Use `rejected` when the product is irrelevant, ambiguous, unsuitable for the
first profile scope, impossible to present safely, or lacks usable rights.

## 5. Product rejection criteria

Reject or defer a candidate when:

- the Korean and global retailer records cannot be matched confidently;
- the product is discontinued or the offer is stale;
- its only apparent relevance is ranking or award popularity;
- available evidence cannot support a clear recommendation reason;
- health/treatment claims cannot be presented safely;
- the routine step is wrong or duplicates a stronger candidate without adding
  profile coverage;
- display assets or public data rights cannot be established.

## 6. Inputs to Skin Profile design

The current source master has useful coverage for these user goals:

- hydration/moisture;
- soothing;
- pores;
- brightening;
- slow-aging support;
- breakout consideration;
- texture/exfoliation;
- excess-sebum/finish preference;
- sun protection.

Skin Profile V1 should capture at minimum:

1. self-observed oil/dry tendency;
2. post-cleansing tightness;
3. primary goal from the supported concern set;
4. secondary goals;
5. reactivity/sensitive consideration;
6. preferred lightweight vs richer finish;
7. routine step needed;
8. desired routine complexity.

Do not finalize result archetypes until approved products have been tested
against these inputs. The quiz must describe the user accurately even if no
reviewed product is available for a particular combination.

## 7. Reproduction

```bash
cd data/beauty-pipeline
.venv/bin/python validate.py
.venv/bin/python coverage_report.py
.venv/bin/python build_promotion_queue.py
```

`build_promotion_queue.py` must produce the same output from unchanged masters.
Changing quotas, classification, or scoring is a product-taxonomy change and
requires review rather than an incidental script edit.
