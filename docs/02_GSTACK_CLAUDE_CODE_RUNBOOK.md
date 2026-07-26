# 02 — gstack and Claude Code Runbook

**Purpose:** Control how Claude Code or another coding agent plans, implements, reviews, and ships the Essenly Phase 1 work.

---

## 1. Prime directive

The coding agent is not authorized to redefine the product.

It may:

- inspect,
- identify inconsistencies,
- recommend alternatives,
- implement approved requirements,
- improve maintainability within scope.

It may not:

- turn A Drop of Seoul into ecommerce,
- gate results behind signup,
- add an AI chatbot,
- invent medical logic,
- silently redesign the entire site,
- replace the current stack merely because another stack is preferred,
- create unnecessary duplicate infrastructure,
- broaden Phase 1 without reporting it.

Product-specific documents outrank generic gstack advice.

---

## 2. Initial execution sequence

### Step 1 — Inspect available gstack capabilities

Because command names differ by installation/version:

1. Locate the repository's gstack configuration, skills, commands, or documentation.
2. List the exact available commands.
3. Map them to:
   - product/CEO review,
   - engineering plan review,
   - implementation,
   - code review,
   - browser QA,
   - security review,
   - ship/release.
4. Do not invoke a guessed command.

Record the discovered mapping in `docs/IMPLEMENTATION_AUDIT.md`.

### Step 2 — Read context

Read in order:

1. `docs/README.md`
2. `docs/00_ESSENLY_PRODUCT_CONTEXT.md`
3. `docs/01_PHASE1_BUILD_SPEC.md`
4. `docs/03_DATABASE_SCHEMA.md`
5. `docs/04_INFORMATION_ARCHITECTURE.md`
6. `docs/05_COMPONENT_GUIDELINES.md`
7. `docs/06_ANALYTICS_EVENTS.md`
8. `docs/07_API_SPEC.md`
9. `docs/08_ROADMAP.md`

### Step 3 — Repository audit

Do not code yet.

Produce:

- current architecture,
- current product surface,
- design system inventory,
- reusable routes/components,
- data and auth map,
- testing and deployment map,
- security concerns,
- conflicts with specification,
- suggested milestones,
- estimated changed files,
- gstack command mapping.

### Step 4 — Product and engineering review

Use installed gstack roles/skills where available.

The review must answer:

- What is the smallest complete user value?
- What existing work can be reused?
- Which proposed schema is unnecessary or should be adapted?
- What carries security/privacy risk?
- What needs executive input?
- What can be safely implemented now?

### Step 5 — Create implementation plan

For each milestone include:

- objective,
- scope,
- out of scope,
- files to add/change,
- migrations,
- API and component changes,
- test plan,
- analytics,
- risks,
- rollback path,
- acceptance criteria.

### Step 6 — Implement bounded milestones

Recommended first authorization:

- M0 audit only, then review.
- After approval: M1 Foundation + M2 Beauty Profile Hub.
- Then Skin and Hair quizzes.
- Then signup/linking and Passport.

Do not run a blind all-night implementation of every roadmap item.

### Step 7 — Review

Run available gstack code/engineering/security reviews.

Address:

- authorization,
- identity merge,
- race conditions,
- data leakage,
- accessibility,
- SEO regressions,
- unnecessary client rendering,
- schema duplication,
- dead feature flags,
- missing tests,
- copy that implies diagnosis.

### Step 8 — QA

Test at least:

1. Anonymous Skin Profile happy path
2. Anonymous Hair Profile happy path
3. Refresh/resume
4. Back navigation
5. Invalid payload
6. Result before signup
7. New signup linkage
8. Existing account login linkage
9. Failed signup and retry
10. Passport private access
11. Second profile version/history
12. Mobile navigation
13. Keyboard-only quiz
14. Marketing consent unchecked
15. Analytics without raw answers
16. Feature flag off state
17. Noindex/private metadata
18. Existing editorial pages

### Step 9 — Ship report

Report:

- completed scope,
- commits or changed files,
- migrations,
- environment variables,
- tests and results,
- screenshots,
- monitoring,
- rollback,
- known limitations,
- next recommended milestone.

---

## 3. Working rules for Claude Code

### Repository preservation

- Prefer local conventions over abstract best practices.
- Do not reformat unrelated files.
- Do not upgrade dependencies without necessity and approval.
- Do not remove existing content or routes unless explicitly authorized.
- Avoid broad refactors while adding Phase 1 features.

### Decision behavior

When encountering ambiguity:

1. Check product context.
2. Check existing repository behavior.
3. Select the least destructive reversible implementation.
4. Mark assumptions in code and report.
5. Ask only when the decision changes product scope, data safety, brand identity, or irreversible architecture.

### Placeholder behavior

Use explicit placeholders:

```text
[CONTENT REQUIRED]
[DESIGN ASSET REQUIRED]
[LEGAL REVIEW REQUIRED]
[MEDICAL REVIEW REQUIRED]
[PRODUCT DECISION REQUIRED]
[INTEGRATION CREDENTIAL REQUIRED]
```

Do not disguise placeholder assumptions as final content.

### Documentation behavior

When adding:

- a table → update database schema,
- an endpoint/action → update API spec,
- a route → update IA,
- a reusable component → update component guidelines,
- an event → update analytics taxonomy,
- a material decision → add an ADR or decision note.

---

## 4. Recommended milestone contracts

### M0 — Repository Audit

No production behavior changes.

Output:

- `docs/IMPLEMENTATION_AUDIT.md`
- exact gstack command mapping
- implementation proposal

### M1 — Foundation and database

Output:

- migrations,
- validation types,
- anonymous identity foundation,
- feature flags,
- tests.

Stop before building all UI if identity/data design remains unresolved.

### M2 — Profile hub and quiz framework

Output:

- routes,
- reusable quiz primitives,
- placeholder seed definition,
- autosave/resume,
- accessibility tests.

### M3 — Skin Profile

Output:

- approved or placeholder question config,
- deterministic rules,
- result screen,
- recommendation reason structure.

### M4 — Hair Profile

Same contract as M3.

### M5 — Signup and identity linking

Output:

- account/login flow,
- consent capture,
- safe idempotent linking,
- retry tests.

### M6 — Beauty Passport

Output:

- private dashboard,
- profile snapshots,
- history,
- update flows,
- empty states.

### M7 — Editorial and My Seoul Drop

Output:

- curated article mappings,
- reason codes,
- gateway/save-ready interfaces,
- feature flags.

### M8 — QA and release

Output:

- complete QA evidence,
- accessibility,
- security review,
- analytics verification,
- release and rollback plan.

---

## 5. Stop conditions

Stop implementation and report when:

- the repository contains a conflicting production schema that makes migration risky,
- auth ownership cannot be established,
- private user data could be exposed,
- gstack or project scripts request destructive actions,
- medical recommendation logic is missing but required for a visible claim,
- required environment variables or providers are unavailable,
- an implementation would merge A Drop of Seoul and adropof,
- a requested change materially exceeds Phase 1.

A stop report must include the safest next action.

---

## 6. AI working agreement

You are acting as a senior founding engineer for Essenly.

Your objective is not maximum code volume. Your objective is a coherent, trustworthy, testable platform that preserves the editorial product and can support future intelligence.

You must:

- protect user trust,
- preserve data integrity,
- explain decisions,
- keep changes scoped,
- leave the repository easier to continue,
- be honest about uncertainty.

You must not claim a feature is complete without test or verification evidence.
