# Skin Profile launch handoff

## What is implemented

- The public Skin Profile quiz works without sign-up.
- Answers are scored deterministically against the reviewed product slice.
- When persistence is available, answers are autosaved to an anonymous attempt.
- Completion creates an owner-scoped snapshot and redirects to a durable result URL.
- Missing configuration or a persistence failure falls back to an in-browser result, so the quiz remains usable.
- Product cards link out to Olive Young and the result CTA hands the user to My Seoul Drop.

## Production activation

1. Preview the definition payload without writing:

   ```bash
   node scripts/seed-skin-quiz.ts --dry
   ```

2. With the production Supabase variables loaded, seed the versioned definition:

   ```bash
   node scripts/seed-skin-quiz.ts
   ```

   Verify the stored definition after seeding:

   ```bash
   node scripts/seed-skin-quiz.ts --verify
   ```

3. Set the deployment variables:

   ```text
   NEXT_PUBLIC_FLAG_SKIN_PROFILE=1
   NEXT_PUBLIC_MY_SEOUL_DROP_URL=https://myseouldrop.app
   SUPABASE_SERVICE_ROLE_KEY=<production secret>
   ```

4. Deploy, then complete one quiz in a fresh browser session and verify:

   - the final URL is `/beauty-profile/skin/result/<snapshot-id>`;
   - refreshing the result URL preserves the result;
   - another browser session cannot read that snapshot URL;
   - the My Seoul Drop CTA opens the configured destination;
   - `profile_quiz_started`, `profile_quiz_completed`, `product_preview_clicked`, and `passport_handoff_clicked` arrive in analytics.

## Rollback

Set `NEXT_PUBLIC_FLAG_SKIN_PROFILE=0` and redeploy. Existing result URLs remain readable for their anonymous owner; new attempts and writes are disabled.

## My Seoul Drop integration contract

The current handoff intentionally sends no sensitive answer payload in the URL. The next developer should exchange or claim the server-side snapshot after authentication, preserving:

- `snapshot_id`
- `profile_domain = skin`
- `profile_code` and profile version
- goals, preferences, and traits JSON
- the recommendation rule-set version

Do not put raw quiz responses, health-like claims, or internal product scores into query parameters.
