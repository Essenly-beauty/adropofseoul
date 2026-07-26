-- Beauty Profile foundation (Essenly Phase 1, M1).
--
-- Additive only: creates the quiz / profile / consent / anonymous-identity data
-- model from docs/03, adapted to this repo. No existing table is altered.
-- Nothing here renders to users; the Phase 1 UI is gated behind feature flags.
--
-- Authorization model (docs/03 §12, docs/01 WS-04):
--   * Anonymous (pre-signup) rows have user_id = null and are reachable ONLY
--     through trusted server actions using the service-role client, which
--     enforces ownership from an opaque HTTP-only cookie. RLS therefore denies
--     all anon/authenticated-key access to anonymous-owned rows by default.
--   * Authenticated rows (user_id = auth.uid()) are owner-scoped via RLS so the
--     anon-key client with a user session can only ever touch its own rows.
--   * Staff/admin get NO access to personal profile data by default.
--   * Active quiz definitions and consent documents are public-read.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type profile_domain as enum ('skin', 'hair');
create type quiz_status as enum ('draft', 'active', 'retired');
create type quiz_question_type as enum (
  'single_select', 'multi_select', 'scale', 'text', 'info'
);
create type attempt_status as enum (
  'in_progress', 'completed', 'abandoned', 'invalidated'
);
create type consent_type as enum ('terms', 'privacy', 'marketing');
create type consent_status as enum ('granted', 'withdrawn');
create type identity_link_status as enum ('linked', 'conflict', 'reverted');

-- ---------------------------------------------------------------------------
-- Anonymous identity  (server-trusted; RLS-locked, service-role only)
-- ---------------------------------------------------------------------------
create table anonymous_identities (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,       -- sha-256 of the opaque cookie token
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  linked_user_id uuid references auth.users (id) on delete set null,
  linked_at timestamptz,
  metadata jsonb
);
create index anonymous_identities_expires_idx on anonymous_identities (expires_at);
create index anonymous_identities_linked_user_idx on anonymous_identities (linked_user_id);

create table identity_links (
  id uuid primary key default gen_random_uuid(),
  anonymous_identity_id uuid not null references anonymous_identities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  link_status identity_link_status not null default 'linked',
  link_method text,
  idempotency_key text,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (anonymous_identity_id, user_id),
  unique (idempotency_key)
);

-- ---------------------------------------------------------------------------
-- Quiz definitions  (versioned; active = public-read)
-- ---------------------------------------------------------------------------
create table quiz_definitions (
  id uuid primary key default gen_random_uuid(),
  quiz_key profile_domain not null,       -- skin | hair
  version integer not null,
  status quiz_status not null default 'draft',
  locale_strategy text not null default 'single',
  title_key text,
  description_key text,
  published_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_key, version)
);
create index quiz_definitions_active_idx on quiz_definitions (quiz_key, status);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_definition_id uuid not null references quiz_definitions (id) on delete cascade,
  question_key text not null,
  question_type quiz_question_type not null,
  section_key text,
  position integer not null default 0,
  is_required boolean not null default true,
  allows_multiple boolean not null default false,
  validation_json jsonb,
  display_logic_json jsonb,
  content_key text,
  help_text_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_definition_id, question_key)
);
create index quiz_questions_definition_idx on quiz_questions (quiz_definition_id, position);

create table quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions (id) on delete cascade,
  option_key text not null,
  position integer not null default 0,
  content_key text,
  value_code text not null,               -- canonical value, never localized label
  metadata_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, option_key)
);

-- ---------------------------------------------------------------------------
-- Attempts and responses  (owner-scoped)
-- ---------------------------------------------------------------------------
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_definition_id uuid not null references quiz_definitions (id),
  anonymous_identity_id uuid references anonymous_identities (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  status attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  last_saved_at timestamptz not null default now(),
  completed_at timestamptz,
  current_step integer,
  source_context text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- an attempt must be owned by an anonymous identity, a user, or both
  -- (both only during a controlled link transition)
  constraint quiz_attempts_owner_present
    check (anonymous_identity_id is not null or user_id is not null),
  unique (idempotency_key)
);
create index quiz_attempts_anon_idx on quiz_attempts (anonymous_identity_id, status);
create index quiz_attempts_user_idx on quiz_attempts (user_id, status);

create table quiz_responses (
  id uuid primary key default gen_random_uuid(),
  quiz_attempt_id uuid not null references quiz_attempts (id) on delete cascade,
  question_id uuid not null references quiz_questions (id),
  response_json jsonb not null,           -- validated server-side per question type
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_attempt_id, question_id)
);
create index quiz_responses_attempt_idx on quiz_responses (quiz_attempt_id);

-- ---------------------------------------------------------------------------
-- Profile snapshots  (immutable; current pointer may change)
-- ---------------------------------------------------------------------------
create table profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  anonymous_identity_id uuid references anonymous_identities (id) on delete cascade,
  quiz_attempt_id uuid not null references quiz_attempts (id),
  profile_domain profile_domain not null,
  profile_version integer not null default 1,
  rule_set_version text not null,
  profile_code text not null,             -- non-sensitive controlled taxonomy
  summary_json jsonb,
  traits_json jsonb,
  goals_json jsonb,
  preferences_json jsonb,
  confidence_json jsonb,
  created_at timestamptz not null default now(),
  superseded_at timestamptz,
  constraint profile_snapshots_owner_present
    check (anonymous_identity_id is not null or user_id is not null)
);
create index profile_snapshots_user_idx on profile_snapshots (user_id, profile_domain, created_at desc);
create index profile_snapshots_anon_idx on profile_snapshots (anonymous_identity_id, profile_domain);

create table user_current_profiles (
  user_id uuid not null references auth.users (id) on delete cascade,
  profile_domain profile_domain not null,
  profile_snapshot_id uuid not null references profile_snapshots (id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (user_id, profile_domain)
);

-- ---------------------------------------------------------------------------
-- Consent  (marketing kept distinct from terms/privacy)
-- ---------------------------------------------------------------------------
create table consent_documents (
  id uuid primary key default gen_random_uuid(),
  consent_type consent_type not null,
  version text not null,
  locale text not null default 'en',
  effective_at timestamptz not null default now(),
  content_reference text,
  created_at timestamptz not null default now(),
  unique (consent_type, version, locale)
);

create table consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  anonymous_identity_id uuid references anonymous_identities (id) on delete cascade,
  consent_document_id uuid not null references consent_documents (id),
  status consent_status not null default 'granted',
  recorded_at timestamptz not null default now(),
  source text,
  metadata_json jsonb
);
create index consent_records_user_idx on consent_records (user_id, consent_document_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuse set_updated_at() from 0001_init)
-- ---------------------------------------------------------------------------
create trigger quiz_definitions_set_updated_at before update on quiz_definitions
  for each row execute function set_updated_at();
create trigger quiz_questions_set_updated_at before update on quiz_questions
  for each row execute function set_updated_at();
create trigger quiz_options_set_updated_at before update on quiz_options
  for each row execute function set_updated_at();
create trigger quiz_attempts_set_updated_at before update on quiz_attempts
  for each row execute function set_updated_at();
create trigger quiz_responses_set_updated_at before update on quiz_responses
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table anonymous_identities enable row level security;
alter table identity_links enable row level security;
alter table quiz_definitions enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table quiz_attempts enable row level security;
alter table quiz_responses enable row level security;
alter table profile_snapshots enable row level security;
alter table user_current_profiles enable row level security;
alter table consent_documents enable row level security;
alter table consent_records enable row level security;

-- anonymous_identities + identity_links: no policies → default-deny for anon and
-- authenticated keys. Reachable only by the service-role client in trusted
-- server actions (service role bypasses RLS).

-- Quiz definitions/questions/options: public read of ACTIVE content; admin manage.
create policy quiz_definitions_public_read on quiz_definitions
  for select using (status = 'active');
create policy quiz_definitions_admin_all on quiz_definitions
  for all using (public.is_admin()) with check (public.is_admin());

create policy quiz_questions_public_read on quiz_questions
  for select using (
    exists (
      select 1 from quiz_definitions d
      where d.id = quiz_questions.quiz_definition_id and d.status = 'active'
    )
  );
create policy quiz_questions_admin_all on quiz_questions
  for all using (public.is_admin()) with check (public.is_admin());

create policy quiz_options_public_read on quiz_options
  for select using (
    exists (
      select 1
      from quiz_questions q
      join quiz_definitions d on d.id = q.quiz_definition_id
      where q.id = quiz_options.question_id and d.status = 'active'
    )
  );
create policy quiz_options_admin_all on quiz_options
  for all using (public.is_admin()) with check (public.is_admin());

-- Attempts / responses / snapshots / current profiles: authenticated owner only.
-- Anonymous (user_id null) rows are unreachable here and handled by the server.
create policy quiz_attempts_owner on quiz_attempts
  for all
  using (user_id is not null and user_id = auth.uid())
  with check (user_id is not null and user_id = auth.uid());

create policy quiz_responses_owner on quiz_responses
  for all
  using (
    exists (
      select 1 from quiz_attempts a
      where a.id = quiz_responses.quiz_attempt_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from quiz_attempts a
      where a.id = quiz_responses.quiz_attempt_id and a.user_id = auth.uid()
    )
  );

create policy profile_snapshots_owner_read on profile_snapshots
  for select using (user_id is not null and user_id = auth.uid());

create policy user_current_profiles_owner on user_current_profiles
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Consent documents are public policy text; records are owner-scoped.
create policy consent_documents_public_read on consent_documents
  for select using (true);
create policy consent_documents_admin_all on consent_documents
  for all using (public.is_admin()) with check (public.is_admin());

create policy consent_records_owner_read on consent_records
  for select using (user_id is not null and user_id = auth.uid());
create policy consent_records_owner_insert on consent_records
  for insert with check (user_id is not null and user_id = auth.uid());
create policy consent_records_owner_update on consent_records
  for update
  using (user_id is not null and user_id = auth.uid())
  with check (user_id is not null and user_id = auth.uid());
