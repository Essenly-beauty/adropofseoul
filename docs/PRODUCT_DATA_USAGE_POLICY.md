# Product Data Usage Policy

**Status:** Internal product/engineering baseline; legal review required before launch
**Scope:** Hwahae-derived masters, Olive Young data, brand/retailer data, editorial enrichment, and generated recommendation output.

This document is a product and engineering control, not legal advice. Source
terms, licenses, contractual permissions, privacy obligations, advertising
rules, and claim requirements must be reviewed by the business before public
launch or monetization.

## 1. Default posture

Source data is evidence, not publish-ready copy. Preserve raw source values,
normalize into a separate layer, and publish only reviewed facts and editorial
language that A Drop of Seoul is allowed to use.

Do not assume that access to a webpage or dataset grants a right to republish
reviews, rankings, images, descriptions, or derived databases.

## 2. Data classes

| Class                           | Examples                                              | Default use                                                                       |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Product identity                | brand, product name, category, source product ID      | internal matching; public after verification                                      |
| Source URL/provenance           | Hwahae URL, Olive Young URL, collected time           | internal audit; retailer link where permitted                                     |
| Suitability/category signal     | skin type, concern, texture                           | internal candidate generation; public only through reviewed normalized statements |
| Ranking/award                   | rising rank, category rank, award                     | internal tie-break/research; public only with source, scope, and date verified    |
| Commerce                        | retailer URL, availability, affiliate status          | public only when active and disclosed as required                                 |
| Source editorial/review content | review text, descriptions, user quotes                | do not republish without explicit permission                                      |
| Media                           | product and campaign images                           | public only with documented usage rights                                          |
| A Drop of Seoul enrichment      | controlled traits, reasons, cautions, editorial notes | public after editorial approval                                                   |

## 3. Source-specific baseline

### Hwahae-derived data

- Keep raw values and source product IDs in the evidence layer.
- Use categories, suitability labels, ranking, or award information internally
  only until public-display rights and attribution requirements are confirmed.
- Do not copy user reviews, scores, summaries, or source descriptions into
  consumer-facing recommendation copy without permission.
- Do not present “Hwahae says this is right for you.” A Drop of Seoul owns the
  recommendation decision and must state its own reviewed rationale.
- Rankings need source, category/scope, and effective date; stale ranks must not
  appear as current facts.

### Olive Young / Olive Young Global

- A product source row proves a known URL, not current inventory or price.
- Verify active offer status and market immediately before showing a purchase action.
- Separate editorial ranking from retailer availability.
- Apply affiliate disclosure adjacent to affected links or cards as required.
- Do not imply Olive Young sponsors or endorses the recommendation unless true.

### Brand-official information

- Prefer official sources for INCI, directions, size, SPF, and manufacturer claims.
- Preserve source and verification date.
- A manufacturer claim is not independent evidence and must be described accordingly.

### A Drop of Seoul editorial enrichment

- Record reviewer, review date, source/evidence, confidence, and status.
- Distinguish observed texture/finish from inferred attributes.
- Model-generated traits remain `candidate` until a human approves them.

## 4. Consumer-facing claim rules

Allowed patterns after review:

- “Selected for your hydration priority.”
- “A lightweight texture may suit your stated preference.”
- “Available from Olive Young Global when last checked on [date].”
- “Worth considering for the serum step in your routine.”

Avoid:

- “This will cure acne/hair loss/dermatitis.”
- “Guaranteed safe for sensitive skin.”
- “Clinically proven” without verified, applicable substantiation.
- “Best for you” based only on popularity, award, or retailer rank.
- “Currently in stock” without current inventory evidence.
- Percentage match scores that imply unvalidated precision.

Health-adjacent answers must not be turned into ad targeting segments or strong
efficacy claims. Safety and professional-evaluation guidance takes precedence
over conversion.

## 5. Publication states

Every catalog product has one of these states:

- `ingested`: raw source record exists;
- `candidate`: identity and minimum signals are available for review;
- `approved_internal`: usable by recommendation evaluation/tests;
- `approved_public`: allowed in consumer-facing previews;
- `needs_update`: stale or conflicting evidence;
- `retired`: no longer recommended or displayed.

CSV presence never implies `approved_public`.

## 6. Minimum public record

Before a product appears in a recommendation preview, require:

- canonical `P#####` ID;
- verified Korean and English identity where applicable;
- normalized category/routine step;
- at least one approved recommendation trait;
- reviewed consumer reason and relevant caution;
- evidence source and review timestamp;
- approved image, or a designed no-image fallback;
- active commerce verification if a retailer button is displayed;
- disclosure flag for affiliate relationships.

## 7. User profile data

Beauty Profile data is separate from product source data.

- Store the minimum answers needed for the promised experience.
- Never put raw answers or health-adjacent flags in analytics or handoff URLs.
- Do not use scalp/skin symptom answers for marketing segments.
- Use explicit, versioned consent before attaching an anonymous profile to a My
  Seoul Drop account.
- Keep personalization consent separate from marketing consent.
- Define retention, deletion, export, and account unlink behavior before launch.

Essenly product research should preferentially use aggregated, thresholded
insights such as profile distribution and product save rate. Access to raw
individual answers must not be the default business workflow.

## 8. Provenance and freshness

Recommended evidence fields:

```text
source
source_product_id
source_url
raw_value
collected_at
verified_at
reviewed_by
reviewed_at
confidence
review_status
```

Freshness rules must be set per datum:

- retailer availability: short-lived and checked frequently;
- price: short-lived, market/currency specific;
- ranking: dated and never silently treated as current;
- award: historical but exact theme/year must be preserved;
- product identity: stable but discontinuation/renaming must be handled;
- editorial texture/finish: re-review on reformulation.

## 9. Operational controls

- Run `validate.py` before every export/import.
- Generate `product_coverage_report.csv` from source masters; never hand-edit it.
- Keep automatic matches conservative and send ambiguity to a review queue.
- Require human approval before `approved_public`.
- Log importer version and input checksum for production catalog updates.
- Preserve the immutable `P#####` identifier.
- Make catalog imports idempotent and reversible without deleting source history.
- Recheck offer links and disclosures before launch.

## 10. Launch review checklist

- [ ] Source rights and attribution reviewed.
- [ ] Image rights documented.
- [ ] Affiliate disclosures approved and visible.
- [ ] Consumer recommendation copy reviewed.
- [ ] Health/non-diagnostic language reviewed.
- [ ] Initial catalog manually approved.
- [ ] Retailer links and markets verified.
- [ ] Privacy notice describes profile personalization and cross-service claim.
- [ ] Consent, deletion, export, and retention behavior implemented.
- [ ] My Seoul Drop handoff passes security and privacy review.
