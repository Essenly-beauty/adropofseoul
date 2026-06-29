insert into posts (title, slug, category, excerpt, body, author, status, published_at)
values
  ('The Seoul Head Spa Ritual', 'seoul-head-spa-ritual', 'head_spa',
   'Inside the slow, sensory world of Korean scalp care.',
   E'## A new kind of calm\n\nKorean head spas treat the scalp as skin...',
   'Editorial Team', 'published', now()),
  ('Five K-Beauty Serums Worth the Hype', 'five-k-beauty-serums', 'beauty',
   'Our shortlist after months of testing.',
   E'## The shortlist\n\nWe narrowed it down...',
   'Editorial Team', 'published', now() - interval '2 days');

insert into places (name, slug, category, area, short_description, why_we_like_it, is_published)
values
  ('Sool Loft Head Spa', 'sool-loft-head-spa', 'head_spa', 'Seongsu',
   'A minimalist scalp-care studio in Seongsu.',
   'The aromatherapy steam treatment is unmatched.', true),
  ('Aman Salon', 'aman-salon', 'salon', 'Hannam',
   'Quiet, expert color work in Hannam.',
   'English-speaking stylists and a calm room.', true);

insert into products (name, brand, slug, category, description, price, best_for, disclosure_required, is_published)
values
  ('Rice Toner', 'Beauty of Joseon', 'boj-rice-toner', 'toner',
   'A milky, brightening toner.', '$17', 'dull skin', true, true);
