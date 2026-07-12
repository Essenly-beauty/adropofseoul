-- Internal source radar for Seoul beauty place discovery. These tables are
-- intentionally private: they power editorial research, not public pages.

create table source_accounts (
  id text primary key,
  platform text not null,
  handle text,
  display_name text not null,
  url text not null,
  language text[] not null default '{}',
  market_scope text,
  source_type text,
  category text[] not null default '{}',
  neighborhood_focus text[] not null default '{}',
  priority int not null default 3 check (priority between 1 and 3),
  status text not null default 'candidate'
    check (status in ('candidate', 'approved', 'paused', 'rejected')),
  signal_use text,
  verification_role text,
  notes text,
  last_checked_at timestamptz,
  raw_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index source_accounts_platform_idx on source_accounts (platform);
create index source_accounts_status_priority_idx on source_accounts (status, priority);
create index source_accounts_category_idx on source_accounts using gin (category);
create index source_accounts_neighborhood_focus_idx on source_accounts using gin (neighborhood_focus);
create trigger source_accounts_set_updated_at before update on source_accounts
  for each row execute function set_updated_at();

create table source_items (
  id uuid primary key default gen_random_uuid(),
  source_account_id text references source_accounts(id) on delete set null,
  platform_item_id text,
  url text not null unique,
  published_at timestamptz,
  captured_at timestamptz not null default now(),
  content_type text,
  text_excerpt text,
  mentioned_place_names text[] not null default '{}',
  mentioned_neighborhoods text[] not null default '{}',
  raw_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index source_items_account_idx on source_items (source_account_id);
create index source_items_captured_at_idx on source_items (captured_at desc);
create index source_items_mentioned_places_idx on source_items using gin (mentioned_place_names);
create index source_items_mentioned_neighborhoods_idx on source_items using gin (mentioned_neighborhoods);
create trigger source_items_set_updated_at before update on source_items
  for each row execute function set_updated_at();

create table place_candidates (
  id uuid primary key default gen_random_uuid(),
  name_ko text,
  name_en text,
  slug text unique,
  category text not null,
  neighborhood text,
  candidate_status text not null default 'watch'
    check (candidate_status in ('watch', 'draft', 'directory_ready', 'rejected', 'published')),
  local_signal_score int not null default 0 check (local_signal_score between 0 and 5),
  traveler_signal_score int not null default 0 check (traveler_signal_score between 0 and 5),
  editorial_fit_score int not null default 0 check (editorial_fit_score between 0 and 5),
  verification_score int not null default 0 check (verification_score between 0 and 5),
  tourist_heavy_score int not null default 0 check (tourist_heavy_score between 0 and 5),
  editorial_angle text,
  official_url text,
  instagram_url text,
  naver_map_url text,
  kakao_map_url text,
  google_map_url text,
  tripadvisor_url text,
  reddit_urls text[] not null default '{}',
  notes text,
  promoted_place_id uuid references places(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index place_candidates_status_idx on place_candidates (candidate_status);
create index place_candidates_neighborhood_idx on place_candidates (neighborhood);
create index place_candidates_category_idx on place_candidates (category);
create index place_candidates_scores_idx on place_candidates (
  verification_score desc,
  editorial_fit_score desc,
  local_signal_score desc
);
create trigger place_candidates_set_updated_at before update on place_candidates
  for each row execute function set_updated_at();

create table place_evidence (
  id uuid primary key default gen_random_uuid(),
  place_candidate_id uuid not null references place_candidates(id) on delete cascade,
  source_account_id text references source_accounts(id) on delete set null,
  source_item_id uuid references source_items(id) on delete set null,
  source_type text not null,
  source_name text,
  url text not null,
  evidence_kind text not null,
  observed_value text,
  checked_at timestamptz not null default now(),
  confidence int not null default 3 check (confidence between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);
create index place_evidence_candidate_idx on place_evidence (place_candidate_id);
create index place_evidence_source_type_idx on place_evidence (source_type);
create index place_evidence_checked_at_idx on place_evidence (checked_at desc);

create table place_research_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  query text,
  source_count int not null default 0,
  candidate_count int not null default 0,
  reviewer text,
  notes text,
  raw_metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index place_research_runs_started_at_idx on place_research_runs (started_at desc);

alter table source_accounts enable row level security;
alter table source_items enable row level security;
alter table place_candidates enable row level security;
alter table place_evidence enable row level security;
alter table place_research_runs enable row level security;

create policy source_accounts_admin_all on source_accounts
  for all to authenticated using (true) with check (true);
create policy source_items_admin_all on source_items
  for all to authenticated using (true) with check (true);
create policy place_candidates_admin_all on place_candidates
  for all to authenticated using (true) with check (true);
create policy place_evidence_admin_all on place_evidence
  for all to authenticated using (true) with check (true);
create policy place_research_runs_admin_all on place_research_runs
  for all to authenticated using (true) with check (true);
