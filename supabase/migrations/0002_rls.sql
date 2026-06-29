-- Enable RLS
alter table posts enable row level security;
alter table places enable row level security;
alter table products enable row level security;
alter table media enable row level security;
alter table newsletter_subscribers enable row level security;

-- Admin check: email present in app.admin_emails GUC (set per-request) OR
-- simpler: rely on authenticated role for writes. For MVP, writes require an
-- authenticated session; the app-layer allowlist (lib/auth.ts) is the gate.
-- Public read policies expose only published rows.

-- posts: public reads published; authenticated users full access
create policy posts_public_read on posts
  for select using (status = 'published');
create policy posts_admin_all on posts
  for all to authenticated using (true) with check (true);

-- places
create policy places_public_read on places
  for select using (is_published = true);
create policy places_admin_all on places
  for all to authenticated using (true) with check (true);

-- products
create policy products_public_read on products
  for select using (is_published = true);
create policy products_admin_all on products
  for all to authenticated using (true) with check (true);

-- media: admin-only
create policy media_admin_all on media
  for all to authenticated using (true) with check (true);

-- newsletter: anyone may insert their email; reads admin-only
create policy newsletter_public_insert on newsletter_subscribers
  for insert to anon, authenticated with check (true);
create policy newsletter_admin_read on newsletter_subscribers
  for select to authenticated using (true);
