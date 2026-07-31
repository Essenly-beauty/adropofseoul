-- Seoul attractions: 전망대/시장/쇼핑몰을 places 디렉터리에 담기 위한 카테고리 확장.
-- Additive only — 기존 값은 건드리지 않는다.
-- 적용: Supabase 대시보드 SQL 에디터에서 1회 실행 후
--       supabase migration repair --status applied 20260731090000
-- 주의: Postgres는 같은 트랜잭션에서 추가한 enum 값을 즉시 쓸 수 없다.
--       이 파일과 seed 파일은 반드시 별도 실행해야 한다.
alter type place_category add value if not exists 'observatory';
alter type place_category add value if not exists 'market';
alter type place_category add value if not exists 'mall';
