# Beauty Profile → Product Preview → My Seoul Drop

**Status:** Product design baseline
**Primary product:** A Drop of Seoul
**Handoff consumer:** My Seoul Drop
**Updated:** 2026-08-17

## 1. Decision

A Drop of Seoul owns the complete pre-signup value experience:

1. a visitor arrives from an ad, search result, social post, or article;
2. they complete My Beauty Profile without an account;
3. they receive the full educational result;
4. they see a small, explainable preview of relevant Korean products;
5. they are invited to save the result and continue in My Seoul Drop.

My Seoul Drop is not required to ship the A Drop of Seoul experience. It later
consumes a documented handoff to provide Google sign-in, My Beauty Passport,
the full recommendation set, saved products, feedback, places, maps, and trips.

The signup promise is continuity and additional utility, not access to a result
that A Drop of Seoul has withheld.

## 2. Product roles

| Surface         | Owns                                                                                                 | Must not become                                           |
| --------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| A Drop of Seoul | acquisition, anonymous quiz, result, recommendation preview, editorial explanation, signup intent    | an account dashboard or opaque recommendation marketplace |
| My Seoul Drop   | identity, Beauty Passport, full recommendations, saves, feedback, product/place/trip continuity      | a duplicate editorial publication                         |
| Shared contract | versioned profile snapshot, canonical `P#####` product ID, normalized traits, consent and provenance | a direct dependency on either UI implementation           |

Naming:

- **My Beauty Profile** is the public, no-signup assessment.
- **My Beauty Passport** is the future authenticated collection inside My Seoul Drop.

## 3. Target outcome

The A Drop of Seoul activation event is not `account_created`. It is
`passport_handoff_started` after a user has seen a useful result and a credible
recommendation preview.

The downstream activation event, owned by My Seoul Drop, should be the first
successful save of a profile, product, or Seoul place.

## 4. V1 scope

### Current data baseline (2026-08-17)

Generated from `data/beauty-pipeline/csv/product_coverage_report.csv`:

| Measure                                            | Count |
| -------------------------------------------------- | ----: |
| Canonical products                                 |   359 |
| Products with at least one concern signal          |   298 |
| Products with at least one skin-type signal        |    30 |
| Products with texture data                         |     8 |
| Products with English product names                |     8 |
| Products with Olive Young Global offers            |     8 |
| Recommendation review candidates under the V1 gate |     6 |
| Commerce review candidates under the V1 gate       |     6 |

The immediate bottleneck is international catalog readiness, not the number of
Korean source records. Reaching the V1 target of 30–50 reviewed skincare
products requires a deliberate promotion batch: select products with useful
concern evidence, verify English identity, reconcile the global retailer record,
review traits/cautions, and approve display assets. The system must not weaken
the eligibility gate merely to reach the target count.

### Included

- Skin Profile as the first product-personalization domain.
- Hair Profile remains a useful public result; its V1 product output may be
  category guidance until the hair catalog is sufficiently broad.
- A reviewed set of 30–50 skincare products.
- Three product previews per completed Skin Profile.
- `Strong match`, `Good match`, or `Worth considering`; no percentage score.
- One to three evidence-backed reasons per recommendation.
- Olive Young Global link when an active, verified offer exists.
- `Save to My Beauty Passport` as the principal post-result CTA.
- A provider-neutral, versioned handoff contract for My Seoul Drop.

### Excluded

- Medical diagnosis or treatment claims.
- Automated publication of all products in the CSV master.
- Review-text republication.
- Popularity-only recommendations.
- Collaborative filtering or model fine-tuning.
- A Drop of Seoul account creation, saved-product dashboard, map, or itinerary.
- Inventing My Seoul Drop routes or APIs before its developer confirms them.

## 5. Primary journey

```text
Ad / search / article
  → My Beauty Profile landing
  → anonymous quiz
  → full profile result and explanation
  → three reviewed product previews
  → Save to My Beauty Passport
  → handoff boundary
  → My Seoul Drop sign-in and consent (future/other owner)
  → claim profile, view full set, save, refine
```

The result page must remain useful when My Seoul Drop is unavailable. The CTA
can fall back to a waitlist or a non-destructive “coming soon” state, but the
quiz result and editorial guidance must still work.

## 6. Result-page experience

### Always visible before signup

- profile name and concise summary;
- “Why this result” derived from declared rules;
- observed priorities and limitations;
- routine/category guidance;
- three product previews when reviewed matches exist;
- appropriate non-diagnostic and professional-evaluation guidance;
- relevant A Drop of Seoul reading.

### Product preview card

Each preview contains:

- English product and brand name;
- product type/routine step;
- match level;
- one to three reasons supported by normalized product traits;
- a caution or uncertainty statement when relevant;
- Olive Young Global action only if the offer is active and recently verified;
- affiliate disclosure when required.

No empty carousel is allowed. If fewer than three reviewed matches exist, show
the available matches and category guidance rather than filling positions with
weak candidates.

### Conversion module

Recommended copy:

> **Take your profile with you.**
> Save it to My Beauty Passport to keep your result, see more Korean product
> matches, and use it when you explore beauty places in Seoul.

Primary action: `Save to My Beauty Passport`
Reassurance: `Your full result is already yours. An account keeps it and makes future recommendations more personal.`

## 7. Recommendation contract

The recommender accepts a versioned, server-owned profile snapshot and a
reviewed product catalog. Raw answers never enter URLs or analytics.

```ts
type RecommendationInput = {
  profileSnapshotId: string;
  profileDomain: "skin" | "hair";
  profileVersion: number;
  scoringVersion: string;
  normalizedTraits: Array<{
    trait: string;
    strength: number;
  }>;
};

type ProductRecommendation = {
  productId: string; // canonical P#####
  matchLevel: "strong" | "good" | "consider";
  internalScore: number;
  matchedTraits: string[];
  reasonCodes: string[];
  cautionCodes: string[];
  recommendationVersion: string;
};
```

User-facing sentences are generated from controlled reason/caution codes, not
from unreviewed free-form model output.

## 8. Handoff contract for My Seoul Drop

The receiving developer must be able to integrate without reading A Drop of
Seoul's internal quiz tables.

### Required payload semantics

- opaque, single-use claim token;
- token expiry;
- profile domain and version;
- scoring/recommendation version;
- snapshot ownership proven server-side;
- optional preview product IDs;
- consent document version accepted in the receiving flow.

### Security requirements

- no raw answers or health-adjacent traits in query parameters;
- no user email or provider identity in the handoff URL;
- claim is single-use, expiring, transactional, and safely retryable;
- My Seoul Drop explicitly asks to attach the profile to the signed-in account;
- profile personalization consent is separate from marketing consent;
- failure to claim never destroys the anonymous A Drop of Seoul result.

Exact route, API shape, auth provider, and deployment are intentionally open for
the My Seoul Drop developer to confirm.

## 9. Editorial and catalog workflow

```text
CSV masters
  → validate
  → coverage report
  → normalized trait candidates
  → editorial/product review
  → approved recommendation catalog
  → deterministic recommendation build
  → A Drop of Seoul preview
```

`recommendation_review_candidate` in the coverage report means “ready for a
human to assess,” never “safe to publish automatically.”

Minimum publish gate:

- stable `P#####` ID;
- verified English identity;
- normalized category and routine step;
- at least one relevant, sourced trait;
- reviewed reasons and cautions;
- approved image or no image treatment;
- source and last-reviewed timestamp;
- active offer verification if a retailer action is shown.

## 10. Analytics

A Drop of Seoul owns:

- `beauty_profile_entry_viewed`
- `beauty_profile_started`
- `beauty_profile_completed`
- `product_preview_viewed`
- `product_preview_clicked`
- `passport_handoff_clicked`
- `passport_handoff_started`

Allowed properties include profile domain/version, placement, product ID,
match level, controlled reason codes, and campaign identifiers. Raw answers,
symptoms, email, provider identity, and free text are prohibited.

My Seoul Drop should return aggregate funnel counts or privacy-safe events for:

- claim completion;
- full recommendation view;
- first save;
- retailer action;
- 30-day return.

## 11. Acceptance criteria

- A new visitor can finish and understand a profile without signing in.
- Every preview has at least one traceable reason.
- Removing My Seoul Drop does not break the result page.
- A handoff can be implemented without exposing raw answers in the browser URL.
- No unreviewed catalog row becomes a public recommendation.
- An article can reference a product by canonical `P#####` ID.
- Recommendation output is reproducible for a stored version.
- Analytics can measure quiz completion → handoff intent without collecting raw answers.

## 12. Delivery sequence

1. Approve taxonomy and product data-use policy.
2. Review the six current candidates as the first vertical slice.
3. Select the next 24–44 skincare products from the source master and complete
   English identity, retailer reconciliation, trait review, and asset approval.
4. Design and approve Skin Profile questions and scoring.
5. Create normalized traits and editorial review records for the selected set.
6. Implement deterministic recommendation and result-page preview.
7. Add handoff UI behind a configurable My Seoul Drop destination.
8. Give this spec, taxonomy, and contract to the My Seoul Drop developer.

The initial 42-product worklist and its review procedure are documented in
`docs/INITIAL_PRODUCT_PROMOTION_REVIEW.md`. It is generated by
`data/beauty-pipeline/build_promotion_queue.py` and is not a public approval list.
