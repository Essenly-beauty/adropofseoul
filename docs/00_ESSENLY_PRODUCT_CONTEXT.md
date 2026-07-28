# 00 — Essenly Product Context

**Document owner:** CEO / Product
**Applies to:** A Drop of Seoul, Beauty Profile, Beauty Passport, My Seoul Drop, future AI Beauty Concierge, and adropof
**Status:** Foundational product decision
**Audience:** Product, design, engineering, editorial, marketing, data, AI agents

---

## 1. Company thesis

Essenly exists to help people make better beauty decisions.

The problem is not a lack of products or content. The problem is fragmented information, generic advice, unclear commercial incentives, and poor continuity between learning about beauty and acting on that knowledge.

Essenly should become a trusted intelligence layer between:

- the user's own traits, goals, and preferences,
- credible editorial knowledge,
- Korean beauty products and experiences,
- the user's evolving decisions over time.

### Working company definition

> Essenly is building the operating system for discovering, understanding, and experiencing Korean beauty.

This definition is directional, not homepage copy.

---

## 2. Core belief

> People do not need more products. They need better decisions.

Every feature must be evaluated against this question:

> Does this help the user understand themselves or make a better beauty decision?

If the answer is unclear, the feature should not enter Phase 1.

---

## 3. Product constitution

1. **Trust before traffic.**
2. **Editorial before commerce.**
3. **Relationship before revenue.**
4. **First-party data before advertising dependence.**
5. **Education before recommendation.**
6. **Personalization before automation.**
7. **Explain recommendations.**
8. **AI assists; humans decide.**
9. **Beauty is personal; never generic.**
10. **User value must be delivered before asking for signup.**
11. **Data is collected to serve the user, not merely to enrich a database.**
12. **Medical uncertainty must be stated clearly.**
13. **Commercial relationships must never be disguised as editorial judgment.**
14. **The platform must remain useful even when the user buys nothing.**

---

## 4. What Essenly is

Essenly is:

- editorial-first,
- trust-first,
- user-first,
- education-first,
- profile-aware,
- relationship-oriented,
- globally accessible,
- Korean-beauty specific but not tourist-only,
- designed for long-term user memory.

## 5. What Essenly is not

Essenly is not primarily:

- an affiliate-link farm,
- an ecommerce marketplace,
- a generic beauty quiz website,
- a booking platform,
- a travel itinerary app,
- a social network,
- a medical diagnosis service,
- a chatbot wrapper,
- a trend-chasing content mill.

A feature can use affiliate links or facilitate commerce later, but those mechanisms must remain subordinate to editorial trust and user utility.

---

## 6. Brand and product architecture

### 6.1 Essenly Inc.

The company and owner of the ecosystem.

Essenly should usually remain in legal, corporate, investor, employment, privacy, and platform ownership contexts rather than replace consumer-facing product names.

### 6.2 A Drop of Seoul

**Role:** Editorial discovery and trust.

Primary jobs:

- explain Korean beauty,
- help users understand products, procedures, ingredients, routines, places, and cultural context,
- create durable search and AI-search visibility,
- build editorial authority,
- introduce Beauty Profile at contextually useful moments,
- create an ongoing relationship through newsletter and returning visits.

A Drop of Seoul must look and feel like an editorial publication, not a storefront.

### 6.3 Beauty Profile

**Role:** Structured self-understanding.

Includes:

- Skin Profile
- Hair Profile

It converts subjective concerns and preferences into structured, explainable data. It is not a diagnosis.

The user can complete a quiz anonymously and must receive a meaningful result before signup.

### 6.4 Beauty Passport

**Role:** Persistent user memory.

Stores and presents:

- current skin and hair profile,
- goals,
- concerns,
- traits,
- sensitivities and preferences,
- previous quiz versions,
- saved recommendations,
- profile changes over time.

Beauty Passport should feel like a useful personal record, not a CRM form.

### 6.5 My Seoul Drop

**Role:** Personalized action layer.

Eventually includes:

- saved products,
- product matching,
- Olive Young discoveries,
- salons and beauty places,
- maps,
- saved lists or collections,
- contextual links from editorial content,
- future reservation or availability integrations.

A Drop of Seoul links users into My Seoul Drop. It should not reproduce the full utility application inside editorial article templates.

### 6.6 AI Beauty Concierge

**Role:** Future conversational and interpretive assistance.

Not Phase 1.

Future AI should be able to use:

- raw quiz responses,
- versioned profile snapshots,
- explicit preferences,
- behavioral signals,
- content and product knowledge,
- recommendation rationale,
- consent state.

Phase 1 must create clean data foundations without implementing chatbot UI or LLM calls.

### 6.7 adropof

**Role:** Future consumer product brand.

adropof is not the same as A Drop of Seoul. It should emerge from earned insight, trust, and observed user needs.

Commerce must not interrupt or distort editorial judgment.

---

## 7. Primary users

Phase 1 should support users who:

- are curious about Korean beauty but overwhelmed by choices,
- want to understand their skin or hair rather than chase trends,
- are planning beauty shopping or experiences in Seoul,
- live outside Korea and need cultural and practical context,
- save products and places across multiple sessions,
- want recommendations with reasons,
- may return before ever creating an account.

Do not assume all users are tourists or beauty beginners.

---

## 8. Core user journey

```text
Search / social / direct visit
        →
Editorial article or homepage
        →
Contextual education
        →
Beauty Profile invitation
        →
Anonymous quiz
        →
Useful result
        →
Optional signup to save and deepen profile
        →
Beauty Passport
        →
Relevant stories, products, and places
        →
My Seoul Drop saves and actions
        →
Return visits and newsletter relationship
```

The journey must also support direct entry into Beauty Profile and return entry into Beauty Passport.

---

## 9. Product boundaries

### Phase 1 includes

- editorial-first homepage and navigation integration,
- Beauty Profile landing or hub,
- Skin Profile quiz,
- Hair Profile quiz,
- anonymous progress and result,
- results with education and transparent rationale,
- signup after result,
- identity linking,
- Beauty Passport overview,
- profile snapshots and history,
- rule-based content and resource matching,
- My Seoul Drop gateway and save-ready interfaces,
- analytics events,
- consent history,
- localization-ready architecture.

### Phase 1 excludes

- AI chatbot,
- generative recommendation engine,
- automated medical interpretation,
- booking and payment,
- retailer inventory synchronization,
- full product catalog ingestion unless already present,
- complex social features,
- native mobile apps,
- loyalty points,
- adropof commerce,
- aggressive marketing automation.

---

## 10. Data philosophy

Separate four types of data:

### Identity data

Examples:

- authenticated user ID,
- anonymous ID,
- email,
- locale,
- consent records.

### Declared data

What the user explicitly tells us:

- concerns,
- goals,
- preferences,
- sensitivities,
- routines,
- quiz answers.

### Inferred data

What the system derives:

- profile type,
- matched traits,
- recommendation scores,
- confidence,
- inferred interests.

Inferences must be labeled as inferences and traceable to the relevant rules or evidence.

### Behavioral data

What the user does:

- article viewed,
- quiz started,
- quiz completed,
- result saved,
- recommendation clicked,
- item saved,
- passport revisited.

Behavioral data must not silently overwrite declared data.

---

## 11. Recommendation philosophy

Phase 1 recommendations are deterministic, editorial, or rules-based.

Every recommendation should answer:

- Why is this relevant to me?
- Which answer, goal, trait, or preference affected it?
- Is this editorial guidance, a product match, a place suggestion, or sponsored content?
- How confident is the match?
- What limitations should I know?

Recommendations must never imply clinical certainty.

---

## 12. Content philosophy

Content exists to build trust and help decisions, not merely to acquire traffic.

A high-quality article should:

- answer a real user question,
- explain context and limitations,
- distinguish fact from editorial judgment,
- use medical review where appropriate,
- connect to Beauty Profile only when genuinely useful,
- remain valuable without clicking an affiliate link,
- provide a logical next action.

### Editorial and commercial separation

- Affiliate relationships must be disclosed.
- Sponsored content must be labeled.
- Ranking must not be secretly determined by commission.
- adropof products must be subject to the same disclosure and evidence standards as external products.

---

## 13. UX principles

1. Show value before requesting identity.
2. Keep the homepage editorial.
3. Avoid quiz-first takeover of the publication.
4. Explain progress and expected time.
5. Allow users to skip nonessential questions where safe.
6. Use plain language.
7. Avoid alarmist medical copy.
8. Keep recommendation rationale visible.
9. Design for mobile first without reducing editorial richness.
10. Preserve user progress and avoid unexpected loss.
11. Make account creation feel like continuity, not a gate.
12. Use accessibility as a product requirement.

---

## 14. Design direction

The platform should feel:

- editorial,
- refined,
- calm,
- intelligent,
- warm,
- contemporary Seoul rather than cliché Korea,
- visually spacious,
- trustworthy rather than clinical,
- premium without becoming exclusionary.

Avoid:

- marketplace density,
- excessive badges,
- countdowns,
- discount-led hierarchy,
- gamified pseudo-science,
- neon "AI" aesthetics,
- generic K-pop tourism tropes,
- medical imagery used only for authority theater.

Exact visual tokens must be derived from the current site and design system during repository audit.

---

## 15. SEO and discoverability principles

- Preserve indexable editorial routes.
- Use stable canonical URLs.
- Add structured data only when semantically correct.
- Do not hide core editorial content behind authentication.
- Quiz result pages should avoid accidental indexing of personal data.
- Personal passport routes must never be publicly indexable.
- Internal links should connect education, profiles, products, and places without keyword stuffing.
- Build for search engines and AI answer engines by making claims clear, sourced, and structured.

---

## 16. Consent principles

- Account terms and privacy consent must be distinguishable from optional marketing consent.
- Do not preselect optional consent.
- Record consent version and timestamp.
- Make deletion and data export technically possible, even if UI is introduced later.
- Do not collect age, country, or demographic details unless the product can explain the value.
- Avoid collecting sensitive medical data not required for the feature.

---

## 17. Executive ownership

### CEO

Owns:

- company thesis,
- portfolio and brand architecture,
- strategic priority,
- capital allocation,
- final resolution of cross-functional conflicts.

### CPO

Owns:

- user value,
- scope,
- flows,
- requirements,
- acceptance criteria,
- product coherence.

### CTO

Owns:

- architecture,
- security,
- privacy implementation,
- data integrity,
- technical feasibility,
- maintainability,
- release quality.

### CMO

Owns:

- editorial distribution,
- SEO,
- lifecycle and newsletter relationship,
- acquisition and activation measurement,
- disclosure consistency.

### CSO

Owns:

- ecosystem partnerships,
- My Seoul Drop business layer,
- commerce sequence,
- strategic monetization,
- retailer and place integrations.

### Decision priority

```text
User trust
> user safety and data integrity
> product coherence
> maintainability
> learning value
> conversion
> implementation speed
```

---

## 18. Non-negotiable decisions

- A Drop of Seoul remains editorial-first.
- The result is shown before signup.
- Anonymous quiz completion is supported.
- Raw quiz answers are preserved.
- Profile history is versioned.
- Recommendation reasons are stored.
- Marketing consent is optional and separate.
- AI Concierge is not Phase 1.
- The platform must not present a beauty profile as a medical diagnosis.
- A Drop of Seoul and adropof remain distinct brands.
- My Seoul Drop is an application layer, not merely a homepage section.

---

## 19. Open decisions to validate during implementation

These items require repository evidence or executive confirmation:

- final authentication provider,
- exact route prefixes and domain/subdomain strategy,
- whether My Seoul Drop launches in the same repository,
- current CMS and editorial content model,
- current analytics provider,
- email service provider,
- supported languages at Phase 1 launch,
- existing product/place data,
- legal copy and privacy policy versions,
- final profile taxonomy and question copy,
- final recommendation rules.

The coding agent must not fabricate these. Use placeholders, configuration, or a documented interim decision.
