-- Enums
create type post_status as enum ('draft', 'published');
create type post_category as enum ('beauty', 'hair', 'head_spa', 'places', 'wellness', 'products', 'guides');
create type place_category as enum ('head_spa', 'salon', 'cafe', 'clinic', 'shop', 'wellness');
create type partnership_status as enum ('none', 'contacted', 'interested', 'partner');

-- updated_at trigger helper
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text,
  excerpt text,
  body text,
  category post_category not null,
  tags text[] not null default '{}',
  featured_image text,
  gallery_images jsonb not null default '[]',
  author text,
  seo_title text,
  meta_description text,
  status post_status not null default 'draft',
  published_at timestamptz,
  related_places uuid[] not null default '{}',
  related_products uuid[] not null default '{}',
  instagram_caption text,
  threads_post text,
  x_post text,
  pinterest_title text,
  pinterest_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_status_published_at_idx on posts (status, published_at desc);
create index posts_category_idx on posts (category);
create trigger posts_set_updated_at before update on posts
  for each row execute function set_updated_at();

-- places
create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category place_category not null,
  area text,
  address text,
  short_description text,
  long_description text,
  why_we_like_it text,
  best_for text,
  price_range text,
  instagram_url text,
  naver_map_url text,
  google_map_url text,
  booking_url text,
  contact_email text,
  contact_phone text,
  languages text[] not null default '{}',
  images jsonb not null default '[]',
  partnership_status partnership_status not null default 'none',
  notes text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index places_category_idx on places (category);
create index places_published_idx on places (is_published);
create trigger places_set_updated_at before update on places
  for each row execute function set_updated_at();

-- products
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  slug text not null unique,
  category text,
  description text,
  price text,
  image text,
  affiliate_url text,
  where_to_buy text,
  best_for text,
  ingredients text,
  rating numeric(3,1),
  disclosure_required boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();

-- media
create table media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  alt_text text not null,
  caption text,
  folder text,
  width int,
  height int,
  created_at timestamptz not null default now()
);

-- newsletter
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
