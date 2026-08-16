-- Multi-retailer affiliate offers for picks products.
-- Read: public, but only offers of published products. Write: admin only.

alter table products add column award_badge text;
alter table products add column tags text[] not null default '{}';

create table product_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  retailer text not null check (retailer in ('oliveyoung_global', 'amazon_us')),
  url text not null,
  price text,
  currency text,
  is_active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, retailer)
);

create index product_offers_product_id_idx on product_offers (product_id);

create trigger product_offers_set_updated_at before update on product_offers
  for each row execute function set_updated_at();

alter table product_offers enable row level security;

create policy product_offers_public_read on product_offers
  for select to anon, authenticated
  using (
    exists (
      select 1 from products p
      where p.id = product_offers.product_id and p.is_published = true
    )
  );

create policy product_offers_admin_all on product_offers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
