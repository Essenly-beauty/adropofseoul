-- Places directory import (Klook dataset): richer service categories,
-- place vs experience split, ratings, and Korean name / official site fields.

-- New service categories. Existing values (head_spa, salon, cafe, clinic,
-- shop, wellness) stay valid, so current rows and ?type= links keep working.
alter type place_category add value if not exists 'personal_color';
alter type place_category add value if not exists 'makeup';
alter type place_category add value if not exists 'spa';
alter type place_category add value if not exists 'facial';
alter type place_category add value if not exists 'nail_lash';
alter type place_category add value if not exists 'perfume';
alter type place_category add value if not exists 'cooking_class';
alter type place_category add value if not exists 'food_tour';

-- A row is either a bookable spot ("place") or a bookable activity
-- ("experience": classes, tours, tastings).
create type place_entry_type as enum ('place', 'experience');

alter table places
  add column if not exists entry_type place_entry_type not null default 'place',
  add column if not exists rating numeric(2,1),
  add column if not exists review_count integer,
  add column if not exists name_kr text,
  add column if not exists website_url text,
  -- finer-grained service description than the category enum,
  -- e.g. "Full-body, foot & facial spa" (from the source dataset's type field)
  add column if not exists service_detail text;

create index if not exists places_entry_type_idx on places (entry_type);
