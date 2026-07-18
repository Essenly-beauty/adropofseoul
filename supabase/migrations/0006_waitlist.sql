-- Waitlist for the Aesenly (에센리) small-group Seongsu guide service.
-- Kept separate from newsletter_subscribers so signups read as a clean
-- demand-validation signal, tagged by `source` (which post drove the signup).
create table waitlist_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'unknown',
  created_at timestamptz not null default now(),
  unique (email, source)
);
create index waitlist_subscribers_source_idx on waitlist_subscribers (source);

-- Access model mirrors newsletter_subscribers: anyone may join; reads admin-only.
alter table waitlist_subscribers enable row level security;

create policy waitlist_public_insert on waitlist_subscribers
  for insert to anon, authenticated with check (true);
create policy waitlist_admin_read on waitlist_subscribers
  for select to authenticated using (true);
