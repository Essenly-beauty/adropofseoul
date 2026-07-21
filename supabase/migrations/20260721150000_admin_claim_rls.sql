-- Until now every admin-scoped policy trusted any authenticated session,
-- because public signups were disabled ("authenticated" == admin). Google
-- SSO opens signup, so admin-ness moves to a server-controlled claim:
-- app_metadata.role = 'admin'. Users cannot modify their own app_metadata.
-- scripts/set-admin-role.mjs stamps the claim; admins must sign out and
-- back in afterward so a freshly issued JWT carries it.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- content tables: writes become admin-only
drop policy if exists posts_admin_all on posts;
create policy posts_admin_all on posts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists places_admin_all on places;
create policy places_admin_all on places
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists products_admin_all on products;
create policy products_admin_all on products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists media_admin_all on media;
create policy media_admin_all on media
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists ingredients_admin_all on ingredients;
create policy ingredients_admin_all on ingredients
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists product_ingredients_admin_all on product_ingredients;
create policy product_ingredients_admin_all on product_ingredients
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- subscriber PII: reads become admin-only
drop policy if exists newsletter_admin_read on newsletter_subscribers;
create policy newsletter_admin_read on newsletter_subscribers
  for select to authenticated
  using (public.is_admin());

drop policy if exists waitlist_admin_read on waitlist_subscribers;
create policy waitlist_admin_read on waitlist_subscribers
  for select to authenticated
  using (public.is_admin());
