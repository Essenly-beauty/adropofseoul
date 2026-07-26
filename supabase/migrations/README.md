# Supabase migrations

Migrations for the A Drop of Seoul / Essenly database. Applied to the linked
remote project with the Supabase CLI (`npm run db:push`), types regenerated with
`npm run db:types`.

## ⚠️ Known migration-history drift (read before `db push`)

The remote DB and this folder are **not** perfectly in sync. This is expected —
not a bug — and reconciling it is a low-priority cleanup (see below).

**Two kinds of drift exist today:**

1. **Remote-applied, no local file.** These versions were applied to the remote
   DB out-of-band and never committed here:
   - `20260721224015`, `20260722110032`, `20260722110036`, `20260722155713`, `20260722155721`
   - Older ones already have empty placeholder files: `0003_remote_applied.sql`, `0004_…`, `0005_…`.

2. **Local file, not recorded on remote.** `20260721150000_admin_claim_rls.sql`
   exists here but is not in the remote migration history — its RLS is already
   live on the remote (applied under one of the `20260722*` versions above).

### Symptom

`supabase db push` (or `npm run db:push`) prints:

```
Remote migration versions not found in local migrations directory.
```

That error is the drift above. It is **not** a sign your migration is broken.

### Safe rules

- **Do not blind-`db push`.** Pushing would try to re-run
  `20260721150000_admin_claim_rls.sql`. It is idempotent (all
  `drop policy if exists` + `create or replace`), so it won't error — but if a
  later `20260722*` migration refined those same policies, re-running it would
  **silently revert a live RLS/security fix.** Don't gamble on production RLS.
- **Applying a new, additive migration** (new tables/columns, nothing touching
  existing objects) — the safest route until the drift is cleaned up is to paste
  the migration's SQL into the **Supabase dashboard SQL editor** and run it once.
  Example: `20260726205322_beauty_profile_foundation.sql` only `CREATE`s new
  objects, so it applies cleanly this way. Optionally record it afterward with
  `supabase migration repair --status applied <version>` so a future push skips it.

## Reconciling the drift (the real fix, when you have time)

Do this on a clean tree, on its own branch, in your own terminal
(`migration repair` needs interactive auth). It changes only the migration
**history bookkeeping** — never the schema.

```bash
git checkout -b chore/reconcile-migrations
supabase migration list --linked          # inspect the drift

# drop the remote-only versions from the history table so pull can re-capture them
supabase migration repair --status reverted \
  20260721224015 20260722110032 20260722110036 20260722155713 20260722155721

supabase db pull                           # writes supabase/migrations/<ts>_remote_schema.sql
supabase migration list --linked           # confirm Local == Remote
npm run typecheck && npm run build
git commit -am "chore(db): reconcile migration history with remote"
```

Review the generated `_remote_schema.sql` before committing — `db pull` dumps a
full schema diff, so trim anything that would redefine objects that already
exist. Once reconciled, the placeholder files and this warning can be removed.

**Alternative (preserves granular history):** the original SQL for the
remote-only versions may still exist in the merged feature branches, or in the
remote `supabase_migrations.schema_migrations` table (queryable from the
dashboard). Restoring the real files instead of a squashed `db pull` keeps the
history meaningful.
