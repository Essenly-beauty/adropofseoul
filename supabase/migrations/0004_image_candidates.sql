-- Image candidates gathered during research runs (Track 2 amendment).
-- Two channels: reality photos found in sources (license 'unverified' — the
-- editor must clear rights before use, attribution alone is not a license)
-- and stock photos from commercial-safe APIs (Unsplash/Pexels).
-- Approved images are later re-processed with the brand tone treatment
-- (content-strategy spec: warm porcelain/blush tint applied in code).

create table image_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references research_runs (id) on delete set null,
  place_candidate_id uuid references place_candidates (id) on delete set null,
  area text not null,
  url text not null unique,
  source_url text not null,
  source_type text not null
    check (source_type in ('reddit', 'web', 'unsplash', 'pexels')),
  description text,
  suggested_use text not null default 'inline'
    check (suggested_use in ('thumbnail', 'inline')),
  license text not null default 'unverified'
    check (license in ('commercial-ok', 'attribution-required', 'unverified')),
  attribution text,
  status text not null default 'new'
    check (status in ('new', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index image_candidates_status_idx on image_candidates (status, area);
create index image_candidates_place_idx on image_candidates (place_candidate_id);
create trigger image_candidates_set_updated_at before update on image_candidates
  for each row execute function set_updated_at();

-- RLS: authenticated only, same posture as 0003. NO anon access.
alter table image_candidates enable row level security;
create policy image_candidates_admin_all on image_candidates
  for all to authenticated using (true) with check (true);
