-- Enable RLS
alter table posts enable row level security;
alter table places enable row level security;
alter table products enable row level security;
alter table media enable row level security;
alter table newsletter_subscribers enable row level security;

-- Access model (MVP): writes require an authenticated session; the real admin
-- restriction is the app-layer email allowlist (lib/auth.ts + app/admin/layout.tsx),
-- safe only while Supabase email signups are disabled (see docs/PROVISIONING.md).
-- Public reads are scoped to the anon role and expose only published rows.

-- posts: public reads published; authenticated users full access
create policy posts_public_read on posts
  for select to anon using (status = 'published');
create policy posts_admin_all on posts
  for all to authenticated using (true) with check (true);

-- places
create policy places_public_read on places
  for select to anon using (is_published = true);
create policy places_admin_all on places
  for all to authenticated using (true) with check (true);

-- products
create policy products_public_read on products
  for select to anon using (is_published = true);
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
