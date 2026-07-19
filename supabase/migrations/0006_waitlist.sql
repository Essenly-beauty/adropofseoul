-- Waitlist for the Aesenly (에센리) small-group Seongsu guide service.
-- Kept separate from newsletter_subscribers so signups read as a clean
-- demand-validation signal, tagged by `source` (which post drove the signup).
--
-- NOTE: these objects were originally created on the remote project under a
-- different migration version that was never committed here, so this file is
-- written idempotently — `supabase db push` can apply/record it safely even
-- where the objects already exist.
create table if not exists waitlist_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'unknown',
  created_at timestamptz not null default now(),
  unique (email, source)
);
create index if not exists waitlist_subscribers_source_idx on waitlist_subscribers (source);

-- Access model mirrors newsletter_subscribers: anyone may join; reads admin-only.
alter table waitlist_subscribers enable row level security;

do $$ begin
  create policy waitlist_public_insert on waitlist_subscribers
    for insert to anon, authenticated with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy waitlist_admin_read on waitlist_subscribers
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;
