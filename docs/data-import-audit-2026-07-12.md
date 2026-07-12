# External Beauty Data Archive Audit

Date: 2026-07-12

Archive reviewed:
`/Users/jj_whatap/Downloads/아카이브 3`

## Summary

The archive is useful as a broad reference dataset for A Drop of Seoul, but it
should not be imported directly into public production tables yet. The strongest
slice is the product dataset, because most product prices include Olive Young
Global source URLs. The ingredient, store, clinic, and treatment datasets are
valuable for planning and drafting, but need source verification, normalization,
and editorial review before publication.

Generated staging artifacts:

- `scripts/prepare-source-archive.mjs`
- `content/source-archives/archive-3/normalized.json`
- `content/source-archives/archive-3/audit.json`

## Files

| File                            | Rows | Usefulness  | Notes                                                                                                          |
| ------------------------------- | ---: | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `products_rows.json`            |  100 | High        | Best immediate value. Product prices are marked `real`; 82 rows have `global.oliveyoung.com` source URLs.      |
| `ingredients_rows.json`         |  100 | Medium-high | Good INCI/function seed list, but no source URLs or editorial descriptions. Needs taxonomy mapping.            |
| `brands_rows.json`              |  100 | Medium      | Useful brand vocabulary, but duplicate names exist and 23 product brand references are missing.                |
| `product_ingredients_rows.json` |  100 | Medium      | Useful product-to-ingredient links, but 9 ingredient references do not resolve.                                |
| `stores_rows.json`              |  100 | Medium      | Useful for store guides, but source URLs are missing and `location` is empty.                                  |
| `product_stores_rows.json`      |  100 | Low-medium  | Useful only after store IDs are reconciled; 64 store references do not resolve.                                |
| `clinics_rows.json`             |  100 | Medium      | Useful for future clinic guides, but no source URLs, no coordinates, no booking URLs. Needs high verification. |
| `treatments_rows.json`          |   53 | Medium      | Good treatment taxonomy seed, but medical/aesthetic claims and prices need review. Price source is `manual`.   |
| `clinic_treatments_rows.json`   |  100 | Medium      | Referentially clean against current clinic/treatment files.                                                    |

## Data Quality Findings

- The archive uses JSON strings inside JSON fields, for example multilingual
  `name` and `description` values are stored as stringified objects.
- All primary datasets are marked `active`.
- Product categories are coherent: `bodycare`, `haircare`, `makeup`,
  `skincare`, `tools`.
- Product source quality is relatively strong: product `price_source` and
  `range_source` are `real`, and detected product source domains are
  `global.oliveyoung.com`.
- Treatment price source is weaker: all treatment `price_source` values are
  `manual`, and `price_source_url` is empty.
- Current app schema is much simpler than this archive. The existing `products`
  table has flat `brand`, `price`, `image`, `ingredients` fields, while the
  archive expects brands, stores, product-store links, price ranges, tags,
  translated text, and embeddings.
- Current public `ingredients` schema requires editorial fields such as
  `summary`, `description`, `benefits`, `caution`, skin types, and concerns.
  The archive ingredients provide INCI and functions, but not enough public
  glossary prose.

## Referential Integrity

Problems found:

- `products.brand_id`: 23 references are missing from `brands_rows.json`.
- `product_ingredients.ingredient_id`: 9 references are missing from
  `ingredients_rows.json`.
- `product_stores.store_id`: 64 references are missing from `stores_rows.json`.

Clean links:

- `product_ingredients.product_id`: all product references resolve.
- `product_stores.product_id`: all product references resolve.
- `clinic_treatments.clinic_id`: all clinic references resolve.
- `clinic_treatments.treatment_id`: all treatment references resolve.

## Duplicate Names

Examples:

- Brands: `ON:THE BODY`, `FOODOLOGY`, `Isntree`, `APLB`, `LABO-H`,
  `AROMATICA`.
- Products: `haming Rice Water Glow BB Lotion 30ml (3 Shades)`,
  `epais Scalp Boosting Ampoule 150ml`, `AESTURA Regederm365 Retinoid Eye Serum
15ml`, `ETUDE Curl Fix Mascara 1+1 Set (4 Options)`.
- Ingredients: `Mugwort Extract`.

Duplicates may be legitimate variants, but they need slug/source reconciliation
before import.

## Recommended Use

### Use Now

- Use `products_rows.json` as a product research queue for blog content.
- Use product Olive Young URLs as source evidence for price, product name,
  category, and purchase links.
- Use `ingredients_rows.json` to prioritize the next 30-50 ingredient glossary
  entries, but write original descriptions from verified references.

### Use Later

- Use stores for Seoul shopping guides after verifying address, hours, and
  official links.
- Use clinics and treatments for a future medical-aesthetic guide only after
  source review, legal/medical disclaimer work, and stronger evidence fields.
- Use treatment prices only as draft estimates until each range has a source URL
  and checked date.

### Avoid For Now

- Do not publish clinic claims, license status, treatment efficacy, or treatment
  price ranges directly from this archive.
- Do not overwrite the current production `products` or `ingredients` tables
  with these rows.
- Do not treat multilingual descriptions as final editorial copy; they look like
  generated or templated copy and need rewriting for the site voice.

## Proposed Implementation Path

1. Add a private staging layer:
   - `source_archives`
   - `source_products`
   - `source_ingredients`
   - `source_stores`
   - `source_clinics`
   - `source_treatments`
   - `source_links`

2. Import the archive into staging only:
   - Preserve original IDs.
   - Parse stringified JSON fields into `jsonb`.
   - Store `source_file`, `source_url`, `source_checked_at`, and
     `verification_status`.

3. Build an editorial promotion flow:
   - `draft` -> `verified` -> `published`.
   - Product rows with Olive Young URLs can move first.
   - Ingredient rows should become glossary drafts, not published entries.

4. Reconcile relationships:
   - Resolve missing brands.
   - Resolve missing ingredient IDs.
   - Repair product-store links or drop unresolved joins.

5. Extend public schema only after staging review:
   - Add normalized brands.
   - Add product price ranges and source metadata.
   - Add stores and clinic/treatment tables when the editorial product is ready.

## Editorial Writing Plan

Use the normalized archive as an internal research layer whenever drafting blog
posts, glossary entries, product roundups, Seoul shopping guides, or future
clinic/treatment explainers.

### Ingredient Articles

- Start from `content/source-archives/archive-3/normalized.json` →
  `tables.ingredients` to choose candidate ingredients, INCI names, and function
  tags.
- Cross-check each ingredient against CosIng, PCPC INCI, FDA, CIR, PubChem, or
  PubMed before publishing claims.
- Use product links from `tables.products` and `tables.productIngredients` as
  supporting examples only after the product and ingredient IDs reconcile.
- Write all glossary prose originally in the A Drop of Seoul voice; do not use
  the multilingual archive descriptions as publishable copy.

### Product Articles

- Use `tables.products` as the product research queue for roundups, comparison
  posts, and product cards.
- Treat `price_source_url`, `purchase_links`, `price_min`, `price_max`,
  `price_currency`, and `price_updated_at` as the evidence trail for price and
  availability.
- Prefer products with `global.oliveyoung.com` URLs first because they have the
  strongest source trail in this archive.
- Re-check live product pages before publishing; prices, stock, packaging, and
  formulas can change.

### Store Guides

- Use `tables.stores` for Seoul shopping guide ideation, neighborhood lists, and
  store-type clustering.
- Verify store addresses, hours, maps, and official links before publication.
- Do not publish store records directly from this archive because location and
  external-link fields are incomplete.

### Clinic And Treatment Guides

- Use `tables.clinics`, `tables.treatments`, and `tables.clinicTreatments` only
  for future planning and draft outlines.
- Require a stricter review pass before publication: official clinic pages,
  booking pages, Korean medical-license context, price source URLs, disclaimers,
  and medical/aesthetic claim review.
- Treat treatment prices as unverified estimates until a source URL and checked
  date are attached.

### Source Discipline

- Every published article should record which archive rows were consulted and
  which external sources verified the final claims.
- Archive data can guide topic selection, product examples, and internal links;
  it should not be treated as the final public source of truth.
- When archive data conflicts with a current official source, the current
  official source wins and the archive row should be marked for reconciliation.

## Best Next Step

The import/audit script and cleaned staging JSON artifacts now exist. Next,
choose one narrow publication slice:

- Option A: 30-50 ingredient glossary drafts.
- Option B: 20 product cards sourced from Olive Young.
- Option C: Seoul store guide draft, unpublished.

Recommended first slice: Option A plus product source links as supporting
evidence, because it directly extends the already deployed ingredient
encyclopedia.
