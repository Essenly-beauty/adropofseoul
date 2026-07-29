-- Backstop: one profile snapshot per attempt (Essenly Phase 1, M2b-2; hazard H9).
--
-- completeQuizAttempt already compare-and-set guards a single winner in app code
-- (only the writer that flips in_progress → completed inserts the snapshot). This
-- unique index makes that idempotency enforceable at the DB layer too, so a race
-- or a bug can never create two snapshots for one attempt. quiz_attempt_id is
-- NOT NULL, so a plain unique index suffices.
--
-- Additive only. Apply via the Supabase dashboard SQL editor and then optionally
-- `supabase migration repair --status applied 20260727120000` — do NOT blind
-- `db push` (see supabase/migrations/README.md, known history drift).

create unique index if not exists profile_snapshots_one_per_attempt
  on profile_snapshots (quiz_attempt_id);
