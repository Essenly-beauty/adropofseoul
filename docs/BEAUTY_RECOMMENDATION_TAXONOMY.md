# Beauty Recommendation Taxonomy

**Status:** V1 proposal; product and safety review required
**Purpose:** Translate Beauty Profile outputs and source catalog values into one explainable recommendation language.

## 1. Rules

1. Raw source values are immutable evidence. Normalize them in mapping tables.
2. Quiz option codes, profile labels, and product traits are separate concepts.
3. A product receives a trait only from a named source or an approved editorial review.
4. Absence of evidence is not a negative trait.
5. Health-adjacent answers can trigger caution or professional guidance but not
   marketing segmentation.
6. Traits use stable English `snake_case` codes; localized labels are presentation.
7. Every mapping and recommendation carries a version.

## 2. Core dimensions

### Skin tendency

| Code                      | Meaning                                  | Initial source mapping                            |
| ------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `dry`                     | usually low oil / dryness tendency       | 화해 `건성`                                       |
| `oily`                    | usually higher oil tendency              | 화해 `지성`                                       |
| `combination`             | mixed oil/dry tendency                   | 화해 `복합성`                                     |
| `normal`                  | no dominant tendency declared            | 화해 `중성`                                       |
| `sensitive_consideration` | user reports reactivity; not a diagnosis | 화해 `민감성` only as a source suitability signal |

`아토피`, `여드름`, or other disease-adjacent source labels must not be mapped
to a diagnosis. They enter a review queue until a safe consumer taxonomy and
data-use decision is approved.

### Concern and goal

| Canonical code            | Initial raw mappings            | Notes                                                              |
| ------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `hydration`               | `수분`, `보습`, `모이스처`      | Merge only for broad candidate generation; retain raw evidence     |
| `soothing`                | `진정`                          | Do not claim treatment of redness or inflammation                  |
| `texture`                 | `각질`                          | Product type/strength must also match                              |
| `pores`                   | `모공`                          | Cosmetic appearance language only                                  |
| `excess_sebum`            | `노세범`                        |                                                                    |
| `breakout_consideration`  | `트러블`                        | Avoid acne-treatment claims without separate evidence/review       |
| `brightening`             | `브라이트닝`, `톤업`            | `tone_up` may be cosmetic finish; preserve distinction in evidence |
| `slow_aging`              | `안티에이징`                    | Avoid reversal or treatment claims                                 |
| `sun_protection`          | `선케어 · 선크림`, `워터프루프` | SPF claims require verified product evidence                       |
| `cleansing`               | `클렌징`, `스킨케어 · 클렌저`   |                                                                    |
| `damage_care`             | `손상케어`                      | Hair domain                                                        |
| `scalp_care`              | `두피케어`                      | Hair domain; non-diagnostic                                        |
| `hair_loss_consideration` | `탈모케어`                      | No efficacy claim; separate safety/editorial review required       |
| `color_care`              | `컬러케어`                      | Hair domain                                                        |

Raw values describing a product category rather than a benefit—such as
`스킨케어 · 크림`, `팩`, or `헤어 · 트리트먼트`—map to routine/product type,
not concern.

### Routine step

| Code             | Examples                                   |
| ---------------- | ------------------------------------------ |
| `cleanser`       | cleansing oil, gel cleanser, foam cleanser |
| `toner`          | skin/toner, toner pad when used as toner   |
| `essence`        | essence                                    |
| `serum`          | serum, ampoule                             |
| `moisturizer`    | lotion, emulsion, cream, balm              |
| `sunscreen`      | sunscreen, sun cushion                     |
| `mask`           | sheet mask, wash-off mask, sleeping mask   |
| `exfoliant`      | peeling pad, scrub, exfoliant              |
| `shampoo`        | shampoo                                    |
| `conditioner`    | conditioner/rinse                          |
| `hair_treatment` | treatment/mask                             |
| `hair_leave_in`  | essence, oil, mist, styling treatment      |

### Texture and finish

Source coverage is currently sparse. These traits must default to `unknown`
unless sourced or editorially reviewed.

| Code          | Raw examples                          |
| ------------- | ------------------------------------- |
| `water`       | `워터`                                |
| `gel`         | `젤`                                  |
| `lotion`      | lotion/emulsion                       |
| `cream`       | `크림`                                |
| `balm`        | balm                                  |
| `oil`         | `오일`                                |
| `lightweight` | editorial/reliable source review only |
| `rich`        | editorial/reliable source review only |
| `low_residue` | editorial/reliable source review only |

## 3. Profile-to-trait contract

Skin Profile should emit a set of traits, not only an archetype label.

```json
{
  "domain": "skin",
  "profile_slug": "dehydrated-combination",
  "traits": [
    { "trait": "combination", "strength": 1.0 },
    { "trait": "hydration", "strength": 1.0 },
    { "trait": "lightweight", "strength": 0.6 }
  ],
  "cautions": ["sensitive_consideration"]
}
```

Hair Profile V1 mappings:

| Quiz/profile signal               | Product traits                                         |
| --------------------------------- | ------------------------------------------------------ |
| fine / weighed down / volume goal | `lightweight`, `low_residue`, `volume`                 |
| oily scalp                        | `scalp_care`, `cleansing`                              |
| dry lengths                       | `hydration`, `hair_treatment`                          |
| chemical damage / breakage        | `damage_care`, `strengthening`                         |
| frizz / expanded texture          | `smoothing` or `curl_definition`, depending on pattern |
| sensitive scalp answers           | caution only; no diagnosis or automatic efficacy claim |

Because the current hair catalog is small and trait coverage is weak, these
mappings may produce category guidance before product-level recommendations.

## 4. Product trait record

```text
product_id,trait,strength,source,evidence_value,confidence,review_status,reviewed_at
P00003,hydration,1.0,hwahae,보습,medium,approved,2026-08-17
P00003,lightweight,0.8,editorial,,high,approved,2026-08-17
```

Allowed `source` values initially:

- `hwahae`
- `oliveyoung_global`
- `brand_official`
- `editorial`

Allowed `confidence` values:

- `high`: directly verified or editor-reviewed;
- `medium`: normalized from a source category/suitability label;
- `low`: candidate only and never sufficient for public copy.

Allowed `review_status` values:

- `candidate`
- `approved`
- `rejected`
- `needs_update`

## 5. Eligibility before scoring

A product is eligible for a public preview only when:

- its identity is verified in English;
- category and routine step are normalized;
- it is editorially approved;
- at least one approved trait matches the profile;
- caution rules have been reviewed;
- display assets and claims meet the data-use policy.

Retail availability is not an eligibility requirement for editorial relevance.
It is a separate commerce signal.

## 6. V1 scoring proposal

```text
required routine/category fit        +30
primary concern match                +25
skin tendency match                  +20
secondary concern match              +10
texture/finish preference match      +10
editorial confidence                 +10
active global offer                   +5
caution conflict                     -30 or exclude
unreviewed/low-confidence evidence   exclude from public preview
```

Match levels are assigned from reviewed test fixtures rather than published as
percentages:

- `strong`: multiple independent relevant signals and no unresolved caution;
- `good`: clear primary match with acceptable supporting evidence;
- `consider`: useful category candidate with explicit uncertainty.

Popularity, ranking, award, and retailer availability may break close ties but
must not create personal suitability on their own.

## 7. Controlled reason codes

Initial codes:

- `PRIMARY_CONCERN_MATCH`
- `SECONDARY_CONCERN_MATCH`
- `SKIN_TENDENCY_MATCH`
- `TEXTURE_PREFERENCE_MATCH`
- `ROUTINE_STEP_MATCH`
- `HAIR_DAMAGE_PRIORITY_MATCH`
- `SCALP_CARE_CATEGORY_MATCH`
- `EDITOR_REVIEWED_PICK`
- `AVAILABLE_AT_OLIVE_YOUNG_GLOBAL`
- `LIMITED_TEXTURE_EVIDENCE`
- `SENSITIVE_CONSIDERATION`
- `OFFER_VERIFICATION_REQUIRED`

Each code maps to reviewed copy. Example:

```text
PRIMARY_CONCERN_MATCH
→ Selected because hydration is one of your main priorities.
```

## 8. Versioning

Track independently:

- quiz definition version;
- profile scoring version;
- taxonomy version;
- product trait/evidence version;
- recommendation scoring version;
- copy template version.

A stored recommendation must be reproducible from these versions and the
catalog snapshot used at the time.

## 9. Open approvals

- Final Skin Profile question and archetype taxonomy.
- Treatment of disease-adjacent raw source labels.
- Initial 30–50 reviewed products.
- Texture/finish review rubric.
- Exclusion and caution rules by product category.
- Localized consumer copy for each reason and caution code.
