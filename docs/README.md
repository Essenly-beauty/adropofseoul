# Essenly Platform Documentation

> Operating context and implementation instructions for Claude Code, Codex, gstack, and human contributors.

## 1. Purpose

This documentation set enables an AI coding agent to inspect the existing repository, preserve what already works, and build the first usable layer of the Essenly beauty intelligence platform without inventing product strategy.

The documents are intentionally divided into two layers:

1. **Stable company and product decisions**
2. **Phase 1 implementation specifications**

When documents conflict, use the following priority:

1. `00_ESSENLY_PRODUCT_CONTEXT.md`
2. `01_PHASE1_BUILD_SPEC.md`
3. `03_DATABASE_SCHEMA.md`
4. `04_INFORMATION_ARCHITECTURE.md`
5. `05_COMPONENT_GUIDELINES.md`
6. `06_ANALYTICS_EVENTS.md`
7. `07_API_SPEC.md`
8. Existing repository conventions
9. General framework conventions

The agent must report conflicts rather than silently choosing a different product direction.

---

## 2. Product ecosystem

```text
A Drop of Seoul
    → discovery, education, trust
Beauty Profile
    → structured self-understanding
Beauty Passport
    → persistent first-party profile
My Seoul Drop
    → products, places, saved discoveries, action
AI Beauty Concierge
    → future interpretation and assistance
adropof
    → future consumer product brand
```

### Brand distinction

- **A Drop of Seoul**: editorial and discovery platform.
- **My Seoul Drop**: personalized utility and saved discovery application.
- **adropof**: future consumer product brand.
- **Essenly Inc.**: company and owner of the ecosystem.

Never merge these names or roles in UI copy, metadata, route naming, or product logic.

---

## 3. Phase 1 objective

Build the minimum trustworthy infrastructure for:

- editorial discovery,
- anonymous Skin and Hair Profile quizzes,
- useful results before signup,
- optional account creation,
- persistent Beauty Passport,
- profile history,
- editorial and rule-based recommendations,
- My Seoul Drop gateway,
- analytics and consent foundations.

Phase 1 does **not** include:

- chatbot UI,
- LLM calls,
- AI-generated diagnosis,
- medical diagnosis,
- booking engine,
- full commerce,
- marketplace,
- adropof storefront,
- opaque personalization.

---

## 4. Required agent workflow

Before editing code, the coding agent must:

1. Read every file in `/docs`.
2. Inspect the full repository.
3. Identify the actual framework, package manager, database, auth, styling, tests, deployment, and gstack setup.
4. Produce a concise repository audit.
5. Map requested features onto the existing architecture.
6. Identify assumptions and blockers.
7. Propose milestones and changed files.
8. Wait for approval only when a change is destructive, security-sensitive, or materially conflicts with these documents.
9. Otherwise begin the approved milestone and complete it end-to-end.

Do not rewrite the application merely to match examples in these documents. Adapt the specification to the repository.

---

## 5. Suggested implementation sequence

```text
M0 Repository Audit
M1 Foundation and Data Model
M2 Beauty Profile Hub
M3 Skin Quiz
M4 Hair Quiz
M5 Results and Signup Linking
M6 Beauty Passport
M7 Editorial Personalization and My Seoul Drop Gateway
M8 Analytics, Accessibility, QA, and Release
```

Each milestone must conclude with:

- summary of completed work,
- changed files,
- migrations,
- tests executed,
- screenshots or route verification where possible,
- known limitations,
- recommended next milestone.

---

## 6. Start command for Claude Code

Copy and paste the contents of `CLAUDE_CODE_START_PROMPT.md` into Claude Code from the repository root.

Do not ask Claude Code to implement all milestones in a single uncontrolled pass. Start with M0, review the audit, then authorize M1–M3 or another bounded set.

---

## 7. Documentation maintenance

When implementation changes an approved interface, schema, route, or event:

- update the relevant document in the same pull request,
- add an Architecture Decision Record or Product Decision note when the change is material,
- preserve historical migrations rather than rewriting production history.

This documentation is a living operating system, not promotional copy.
