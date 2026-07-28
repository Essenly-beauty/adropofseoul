# Claude Code Prompt — Begin the First Approved Build Batch

Use this prompt only after reviewing `docs/IMPLEMENTATION_AUDIT.md`.

Implement the smallest safe batch that establishes Phase 1 foundations, normally:

- M1 Foundation and data model
- M2 Beauty Profile hub and reusable quiz framework

Adapt this batch if the audit recommends a safer boundary.

## Before coding

1. Restate the exact scope.
2. List files and migrations you expect to change.
3. Identify feature flags.
4. State what remains placeholder content.
5. Confirm how anonymous identity will work with the existing auth stack.
6. Confirm tests.

## Implementation constraints

- Preserve existing routes and visual system.
- Do not implement all final Skin/Hair medical-adjacent questions without approved copy.
- Seed clearly labeled placeholder/demo quiz definitions only when required to test the framework.
- Keep results behind a placeholder deterministic rule set if final taxonomy is unapproved.
- Do not expose private attempts or results.
- Do not add a chatbot or LLM.
- Do not send raw answers to analytics.
- Use the installed gstack review and QA capabilities discovered in the audit.

## Required completion report

Provide:

- scope completed,
- changed files,
- schema/migrations,
- environment variables,
- tests and results,
- screenshots or route verification,
- accessibility checks,
- security/privacy checks,
- documentation updates,
- known limitations,
- exact next recommended milestone.

Do not call the work complete if tests or verification were not run.
