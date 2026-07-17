-- Booking-service readiness (alignment spec 2026-07-17).
-- Research output accumulates into a structure the future adropof booking
-- service can consume. Additive only.

-- neighborhoods: the funnel (Editorial → Guide → Directory) keys on these.
-- places.area free text stays the display/dedupe key until backfill.
create table neighborhoods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_kr text,
  vibe_tags text[] not null default '{}',
  hero_image text,
  linked_guide_post_id uuid references posts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger neighborhoods_set_updated_at before update on neighborhoods
  for each row execute function set_updated_at();

alter table neighborhoods enable row level security;
create policy neighborhoods_public_read on neighborhoods
  for select to anon using (true);
create policy neighborhoods_admin_all on neighborhoods
  for all to authenticated using (true) with check (true);

-- places: booking-readiness columns.
-- editorial_status tracks DATA verification only (sample → verified);
-- partnership lives in the existing partnership_status ('partner' badge
-- derives from it). Research-promoted places start as 'sample'.
alter table places add column if not exists name_kr text;
alter table places add column if not exists neighborhood_id uuid
  references neighborhoods (id) on delete set null;
alter table places add column if not exists geo_lat double precision;
alter table places add column if not exists geo_lng double precision;
alter table places add column if not exists opening_hours jsonb;
alter table places add column if not exists price_min_krw integer;
alter table places add column if not exists price_max_krw integer;
alter table places add column if not exists booking_channel text
  check (booking_channel in ('naver', 'online', 'phone', 'instagram', 'walk_in'));
alter table places add column if not exists deposit_policy text;
alter table places add column if not exists editorial_status text not null
  default 'sample' check (editorial_status in ('sample', 'verified'));
alter table places add column if not exists last_verified_at timestamptz;

create index places_neighborhood_idx on places (neighborhood_id);
create index places_editorial_status_idx on places (editorial_status);
