-- Ingredient dictionary (public reads published rows; writes require an
-- authenticated session, gated by the app-layer admin allowlist). Reuses the
-- existing post_status enum and set_updated_at() trigger from 0001.

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  inci_name text,
  also_known_as text[] not null default '{}',
  functions text[] not null default '{}',
  summary text,
  description text,
  benefits text,
  good_for_skin_types text[] not null default '{}',
  targets_concerns text[] not null default '{}',
  caution text,
  seo_title text,
  meta_description text,
  status post_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ingredients_status_name_idx on ingredients (status, name);
create index ingredients_functions_idx on ingredients using gin (functions);
create index ingredients_skin_types_idx on ingredients using gin (good_for_skin_types);
create index ingredients_concerns_idx on ingredients using gin (targets_concerns);
create trigger ingredients_set_updated_at before update on ingredients
  for each row execute function set_updated_at();

create table product_ingredients (
  product_id uuid not null references products(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  is_key boolean not null default false,
  position int,
  primary key (product_id, ingredient_id)
);
create index product_ingredients_ingredient_idx on product_ingredients (ingredient_id);

alter table ingredients enable row level security;
alter table product_ingredients enable row level security;

create policy ingredients_public_read on ingredients
  for select to anon using (status = 'published');
create policy ingredients_admin_all on ingredients
  for all to authenticated using (true) with check (true);

create policy product_ingredients_public_read on product_ingredients
  for select to anon using (true);
create policy product_ingredients_admin_all on product_ingredients
  for all to authenticated using (true) with check (true);
