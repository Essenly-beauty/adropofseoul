-- sool-loft-head-spa and aman-salon were CMS test rows (no evidence of real
-- venues; verified 2026-07-22) that were live-published. Removed at owner's direction.
delete from places where slug in ('sool-loft-head-spa', 'aman-salon');
