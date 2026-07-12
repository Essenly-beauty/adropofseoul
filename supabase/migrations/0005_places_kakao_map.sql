-- Add Kakao Map support to public place listings. Google and Naver map URLs
-- already exist in the MVP places table.

alter table places add column if not exists kakao_map_url text;
