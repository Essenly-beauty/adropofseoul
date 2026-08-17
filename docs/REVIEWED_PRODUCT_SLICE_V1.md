# Reviewed Product Slice V1

**Reviewed:** 2026-08-17
**Implementation:** `lib/skincare/recommendation-v1.ts`
**Scope:** Recommendation logic and evidence review; final consumer copy and legal review remain required.

## 1. Decision

Six of the eight existing Picks may enter the first Skin Profile preview
evaluation. Two remain outside public recommendation output.

| Product ID | Product                                      | Decision                                 | Initial supported use                                                  |
| ---------- | -------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| `P00249`   | Torriden DIVE IN Serum                       | approved for V1 evaluation               | lightweight hydration serum                                            |
| `P00075`   | Anua PDRN Hyaluronic Acid Capsule 100 Serum  | approved for V1 evaluation               | lightweight hydration serum; salmon-derived PDRN caution               |
| `P00256`   | beplain Mung Bean pH-Balanced Cleansing Foam | approved for V1 evaluation               | pH-balanced cleanser; sensitive consideration                          |
| `P00097`   | AESTURA ATOBARRIER365 Cream                  | approved for V1 evaluation               | richer hydration/barrier moisturizer; dry and sensitive consideration  |
| `P00017`   | S.NATURE Aqua Squalane Moisturizing Cream    | approved with limited finish evidence    | hydration moisturizer                                                  |
| `P00262`   | mixsoon Bean Essence                         | approved with exfoliation-method caution | lightweight hydration/texture essence                                  |
| `P00172`   | Dr.G R.E.D Blemish Clear Soothing Cream      | needs review                             | soothing moisturizer; texture evidence not yet approved in the overlay |
| `P00348`   | ILLIYOON Ceramide Ato Concentrate Cream      | excluded from face V1                    | source master currently classifies the concern as body cream           |

“Approved” here means eligible for deterministic recommendation evaluation. It
does not waive final copy, privacy, advertising, affiliate, image-rights, or
consumer-safety review.

## 2. Primary evidence checked

- Torriden official English product page: `https://m.torriden.com/main/html.php?htmid=promotion/promotion_english/product_view/product_05.html`
- Torriden US collection: `https://torriden.us/collections/hyaluronic-acid-dive-in`
- Anua official product page: `https://anua.com/products/pdrn-hyaluronic-acid-capsule-100-serum`
- beplain official global product page: `https://beplainglobal.com/products/beplain-mung-bean-ph-balanced-cleansing-foam-160ml`
- AESTURA official international product page: `https://int.aestura.com/products/atobarrier365-cream`
- S.NATURE official product page: `https://snature.kr/product/detail.html?product_no=74`
- S.NATURE official English category: `https://en.snature.kr/category/aqua-skin-care/75/`
- mixsoon official US product page: `https://mixsoon.us/collections/pores-exfoliating/products/mixsoon-bean-essence-30ml`
- Dr.G official global product page: `https://dr-g.com/collections/sensitive-calming/products/dr-g-red-blemish-clear-soothing-cream`
- ILLIYOON official catalog/site: `https://www.illiyoon.com/brand/index.html`

The repository's Hwahae-derived concern/tendency rows and Olive Young Global
product URLs remain provenance inputs. Source rankings and awards are not used
as personal-match evidence.

## 3. Important evidence limitations

- Current source data contains no texture rows for these eight products.
- Some official regional pages show different package sizes; identity is tied
  to canonical `P#####`, while offer/package verification remains separate.
- `P00017` is not given a lightweight/rich match until finish evidence is approved.
- `P00172` remains in the catalog but is filtered from recommendations until its
  texture and consumer reason copy are reviewed.
- `P00348` remains a valid Pick/catalog product but is filtered from the facial
  Skin Profile because the source concern is `바디 · 바디크림`.
- `P00075` exposes `SALMON_DERIVED_PDRN` as a controlled caution so preference,
  allergy, dietary, or ethical handling can be designed explicitly later.
- `P00262` exposes `EXFOLIATION_METHOD_REVIEW`; a reactive user receives a score
  penalty instead of an unqualified texture recommendation.

## 4. Skin Profile V1

`lib/skincare/profile-v1.ts` defines eight closed questions:

1. midday oil/dry balance;
2. post-cleanse feel;
3. primary goal;
4. secondary goals;
5. self-observed reactivity;
6. finish preference;
7. routine-step focus;
8. desired routine complexity.

It emits a deterministic profile label plus normalized traits. The label helps
the user understand the result; product matching uses the traits rather than
the label alone.

## 5. Recommendation V1

The initial recommender:

- considers only `approved` overlay products;
- respects an explicit routine-step focus;
- scores primary concern, secondary concern, tendency, finish, and sensitive
  consideration separately;
- penalizes unresolved exfoliation handling for reactive users;
- returns controlled reason and caution codes;
- keeps internal numeric scores out of consumer-facing output;
- returns at most three previews by default;
- is deterministic and versionable.

This is a vertical-slice evaluator, not the final production recommender. The
next implementation task is to connect it to the persisted Skin Profile quiz
flow and render the three product identities from the canonical product catalog.
