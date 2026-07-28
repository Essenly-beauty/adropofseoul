# 04 — Information Architecture

**Owner:** CPO
**Reviewers:** CMO, CTO
**Rule:** Adapt route names to the existing codebase and SEO history. Do not break existing URLs without redirects.

---

## 1. Global navigation

Recommended conceptual GNB:

- Skincare
- Haircare
- Wellness
- Seoul
- Stories
- About
- CTA: My Beauty Profile

Authenticated account area:

- Beauty Passport
- My Seoul Drop
- Saved
- Settings
- Sign out

The exact grouping should follow current desktop/mobile navigation conventions.

---

## 2. Homepage hierarchy

```text
Hero
Featured Stories
Beauty Profile
Latest Editorial
Seoul
My Seoul Drop
Newsletter
Footer
```

The page must establish editorial authority before presenting the profile product.

### Beauty Profile homepage module

Contains:

- concise value proposition,
- Skin Profile entry,
- Hair Profile entry,
- estimated time,
- no-signup-before-result reassurance.

### My Seoul Drop module

Present as a personalized discovery utility, not ecommerce inventory.

---

## 3. Conceptual route map

Replace prefixes only after repository audit.

```text
/
├── skincare/
├── haircare/
├── wellness/
├── seoul/
├── stories/
├── about/
│
├── beauty-profile/
│   ├── skin/
│   │   ├── start/
│   │   ├── quiz/[attempt]
│   │   └── result/[result]
│   └── hair/
│       ├── start/
│       ├── quiz/[attempt]
│       └── result/[result]
│
├── beauty-passport/
│   ├── overview/
│   ├── skin/
│   ├── hair/
│   ├── history/
│   └── settings/
│
├── my-seoul-drop/
│   ├── saved/
│   ├── products/
│   ├── places/
│   └── maps/
│
├── account/
│   ├── sign-in/
│   ├── sign-up/
│   └── callback/
│
└── legal/
    ├── privacy/
    ├── terms/
    └── disclosures/
```

If My Seoul Drop lives on another domain, document canonical cross-domain behavior, auth strategy, and analytics continuity.

---

## 4. Page contracts

### Beauty Profile hub

Primary action:

- choose Skin or Hair.

Secondary action:

- open existing Passport.

Must include:

- value,
- privacy,
- limitations,
- estimated effort.

### Quiz page

Must include:

- question,
- answer controls,
- progress,
- back/next,
- save state,
- exit behavior,
- error recovery.

Avoid:

- editorial sidebars,
- unrelated commerce,
- newsletter popups during completion.

### Result page

Must include:

- result summary,
- rationale,
- limitations,
- editorial next steps,
- save/create account,
- retake/update.

### Beauty Passport

Must include:

- current profiles,
- update state,
- history,
- relevant editorial,
- My Seoul Drop gateway,
- settings.

---

## 5. Article integration

Article templates may support:

- inline Beauty Profile CTA,
- related profile card,
- related articles,
- save to My Seoul Drop,
- product/place references,
- disclosures.

Article bodies must not become dependent on authentication.

Contextual CTA examples:

- Hair-damage article → Hair Profile
- Skin-barrier article → Skin Profile
- Seoul head-spa guide → Hair Profile or My Seoul Drop
- Product category explainer → relevant profile, not forced signup

---

## 6. Indexing rules

### Indexable

- public editorial categories,
- public articles,
- public Beauty Profile explanation pages,
- general methodology pages if created.

### Noindex/private

- quiz attempts,
- personalized results,
- Beauty Passport,
- account routes,
- saved lists unless intentionally public in a future phase,
- settings.

Use canonical and robots behavior consistent with the framework.

---

## 7. Error and edge routes

Support:

- expired anonymous attempt,
- invalid attempt token,
- result not found,
- old quiz version,
- feature disabled,
- auth callback failure,
- account exists,
- identity link retry,
- no profile yet,
- My Seoul Drop unavailable.

Each state should preserve user trust and provide one clear next action.

---

## 8. Cross-product naming rules

Use:

- "A Drop of Seoul" for the publication.
- "Beauty Profile" for the profiling entry.
- "Skin Profile" and "Hair Profile" for domains.
- "Beauty Passport" for persistent profile.
- "My Seoul Drop" for personalized saves/actions.
- "adropof" only for the consumer product brand.

Do not write "A Drop of" as a shorthand for adropof.
