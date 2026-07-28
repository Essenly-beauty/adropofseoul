# Claude Code Start Prompt — Essenly Phase 1

You are working in the existing Essenly / A Drop of Seoul repository.

Your first task is **not to implement features yet**. Your first task is to conduct a repository and product implementation audit so we can safely begin Phase 1 today.

## Required context

Read every Markdown file in `/docs`, beginning with:

1. `README.md`
2. `00_ESSENLY_PRODUCT_CONTEXT.md`
3. `01_PHASE1_BUILD_SPEC.md`
4. `02_GSTACK_CLAUDE_CODE_RUNBOOK.md`
5. `03_DATABASE_SCHEMA.md`
6. `04_INFORMATION_ARCHITECTURE.md`
7. `05_COMPONENT_GUIDELINES.md`
8. `06_ANALYTICS_EVENTS.md`
9. `07_API_SPEC.md`
10. `08_ROADMAP.md`

The Essenly product documents take precedence over generic agent or gstack advice.

## Required audit

Inspect the repository and determine:

- framework and versions,
- package manager and scripts,
- routing,
- current A Drop of Seoul IA,
- styling and design system,
- reusable components,
- CMS/content model,
- database and migrations,
- authentication,
- analytics,
- newsletter/CRM,
- deployment,
- tests,
- environment requirements,
- current user/save/profile functionality,
- installed gstack configuration and the exact available commands or skills.

Do not guess gstack command names. Discover them from the installation.

## Deliverable

Create `docs/IMPLEMENTATION_AUDIT.md` with:

1. Executive summary
2. Current architecture
3. Existing product and route map
4. Reusable assets/components
5. Existing data/auth model
6. Gap analysis against Phase 1
7. Security/privacy risks
8. Exact gstack command mapping
9. Recommended milestones
10. Proposed files to add/change for M1 and M2
11. Assumptions and blockers
12. Clear recommendation for what can be implemented today

Do not make broad production changes during the audit.

## After the audit

In your response:

- summarize the audit,
- identify any decisions that truly require the founder,
- propose a bounded first implementation batch,
- show the commands/tests you will run,
- wait for approval if the first batch is destructive or conflicts with existing architecture.

If the first batch is safe and non-destructive, you may also prepare a detailed implementation plan, but do not silently implement the entire roadmap.

## Non-negotiables

- A Drop of Seoul remains editorial-first.
- Show quiz results before signup.
- Support anonymous quiz completion.
- Preserve raw answers and version history.
- Do not implement AI/chatbot/LLM features in Phase 1.
- Do not invent medical claims or final quiz taxonomy.
- Keep A Drop of Seoul, My Seoul Drop, and adropof distinct.
- Do not rewrite the stack without evidence.
- Do not send raw quiz answers to analytics.
- Report uncertainty honestly.
