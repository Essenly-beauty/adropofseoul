-- Editorial research agents foundations (Track 1).
-- Spec: docs/superpowers/specs/2026-07-17-editorial-research-agents-design.md §6
-- Additive only: new tables + post workflow extensions. No existing column changes.

-- Post workflow statuses (additive; status logic lives in lib/admin/workflow.ts)
alter type post_status add value if not exists 'research';
alter type post_status add value if not exists 'ai_review';
alter type post_status add value if not exists 'ready';
alter type post_status add value if not exists 'archived';

-- Posts: V2 AI Editorial OS fields (admin-cms spec §7 seams)
alter table posts add column if not exists brief jsonb;
alter table posts add column if not exists research jsonb;
alter table posts add column if not exists ai_review jsonb;

-- research_runs: one row per agent invocation (observability, cost, idempotency)
create table research_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null check (agent in ('research', 'writer')),
  area text not null,
  status text not null default 'running'
    check (status in ('running', 'done', 'error')),
  source_config jsonb,
  prompt_version text not null,
  counts jsonb,
  token_cost integer,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index research_runs_area_idx on research_runs (area, started_at desc);

-- place_candidates: research output, isolated from live places. A candidate
-- reaches the public site only by an editor's Approve → promote action.
create table place_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references research_runs (id) on delete set null,
  name text not null,
  area text not null,
  category_guess place_category,
  why_notable text,
  source_urls jsonb not null,
  evidence jsonb,
  confidence numeric,
  dedupe_key text not null unique,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'approved', 'rejected', 'promoted')),
  promoted_place_id uuid references places (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index place_candidates_status_idx on place_candidates (status, area);
create trigger place_candidates_set_updated_at before update on place_candidates
  for each row execute function set_updated_at();

-- RLS: same posture as 0002 — authenticated only (app-layer allowlist is the
-- real gate). NO anon policies: candidates/runs are invisible to the public.
alter table research_runs enable row level security;
alter table place_candidates enable row level security;

create policy research_runs_admin_all on research_runs
  for all to authenticated using (true) with check (true);
create policy place_candidates_admin_all on place_candidates
  for all to authenticated using (true) with check (true);
