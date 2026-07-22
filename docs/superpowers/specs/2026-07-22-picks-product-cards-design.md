# Picks Product Cards — offers, 승격 파이프라인, 이미지 도구 설계

**Date:** 2026-07-22
**Status:** Approved (verbal)
**Scope:** 파이프라인 CSV의 제품을 앱 Supabase로 승격해 `/beauty/picks`에 판매처 링크·태그·어워드 배지가 달린 제품 카드로 노출한다. 리테일러는 지금 올리브영 글로벌만, 아마존은 슬롯만 준비.

## Background

- 파이프라인(`data/beauty-pipeline/csv/`)에 제품 359개 마스터가 있고, 그중 8개는 올리브영 글로벌 시딩으로 `product_name_en` + 글로벌 URL + 어워드가 채워져 있다 (PR #12).
- 앱의 `products` 테이블(0001_init.sql)은 `affiliate_url` 단일 컬럼이라 다중 판매처를 담을 수 없다.
- `/beauty/picks`와 `ProductCard`(components/editorial)는 이미 이미지·가격·Shop 링크·대가성 표기를 지원한다. `TonalFrame`은 이미지 null일 때 라벨 placeholder를 렌더한다.
- 법적 제약: 타사 평점·리뷰수 재게시 금지(화해 `4.61 (84,119)` 같은 것 표시 안 함), 제품 사진은 권리 확보된 원본만 사용, 제휴 링크에 대가성 표기 필수.
- 아마존 PA-API는 판매 3건 전까지 사용 불가 → 이번 슬라이스에서 아마존은 데이터 모델 슬롯만.

## 결정 사항 (사용자 확정)

1. 데이터 경로: **승격 스크립트** (admin 수동 입력 아님)
2. 카드 링크 UI: **리테일러별 버튼** ("Olive Young →", 나중에 "Amazon →")
3. 이미지: **rembg 로컬 누끼 도구 + 원본은 사람이 수동 소싱** (권리 확보된 것만)
4. 베이스: **feat/phase0-rls-legal 머지 후 main에서 새 브랜치** (RLS 정책 확정 후 마이그레이션)

## Deliverables

### 1. DB 마이그레이션 (1개)

```sql
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
```

- `products`에 컬럼 추가: `award_badge text`, `tags text[] not null default '{}'`
- RLS: 공개(anon/authenticated) 읽기는 **is_published=true인 제품의 offers만** (products 조인 조건). 쓰기는 admin — phase0에서 확정된 정책 패턴을 그대로 따른다.
- `updated_at` 트리거는 기존 `set_updated_at()` 재사용.

### 2. 파이프라인: `data/beauty-pipeline/export_picks.py` (TDD)

- 입력: `csv/picks.txt` — 승격할 `P#####` 한 줄에 하나(사람이 관리). 첫 내용은 시딩된 8개.
- 각 제품에 대해 조립:
  - `slug`: `brand_en` + `product_name_en`을 케밥케이스로 (예: `torriden-dive-in-serum-50ml`). 용량 표기는 제거하지 않는다(그대로 케밥).
  - `brand`: brands.csv의 `brand_en` (없으면 에러 — 승격 대상은 글로벌 시딩 제품이므로 반드시 있어야 함)
  - `name`: products.csv의 `product_name_en` (비어 있으면 에러)
  - `tags`: skin_types.csv + concerns.csv에서 source=올리브영글로벌 인 영문 raw 값들 (중복 제거, 없으면 빈 배열)
  - `award_badge`: awards.csv에서 해당 제품의 "올리브영 어워즈 YYYY" 중 **최신 연도 1건**을 영문 문자열로. 형식: `"Olive Young Awards YYYY[ · <category>][ · #<rank>]"` (category/rank는 있을 때만). 영국 뷰티 어워즈는 `"UK Beauty Awards 2025 · <category>"`. 어워드 없으면 null.
  - `offers`: product_sources.csv의 올리브영글로벌 행 → `[{retailer: "oliveyoung_global", url}]`. 환경변수 `OY_REWARD_CODE`가 있으면 `https://global.oliveyoung.com/partner/gate?url=<인코딩된 상대경로>&rwardCode=<코드>` 딥링크로, 없으면 맨 URL.
  - `disclosure_required`: true
- 출력: `csv/picks_export.json` (UTF-8). `description`(편집 한 줄)은 **넣지 않는다** — 사람이 admin 폼에서 작성.
- 검증: picks.txt의 ID가 마스터에 없거나 `product_name_en`이 비어 있으면 해당 ID를 명시하고 종료 코드 1.

### 3. 파이프라인: `data/beauty-pipeline/process_image.py` (rembg)

- 입력: `images/raw/<P#####>.<ext>` — 사용자가 권리 확보한 원본(브랜드 프레스킷, 직접 촬영 등)을 넣는 폴더 (git ignore).
- 처리: rembg 누끼 → 투명 여백 트리밍 → 정사각 캔버스에 콘텐츠 비율 80%(양쪽 10% 패딩) 중앙 배치 → 흰 배경 합성 → WebP 1200×1200 저장.
- 출력: `images/out/<slug>.webp` (slug는 export_picks.py의 picks_export.json에서 P#####→slug 매핑을 읽어 결정; export 먼저 실행 필요).
- 의존성: `requirements.txt`에 `rembg`, `Pillow` 추가. 네트워크 불필요(모델 최초 1회 다운로드 제외).
- 테스트: rembg 호출은 함수 주입으로 대체(테스트에서 alpha 이미지 픽스처 사용) — 트리밍·패딩·정사각·출력 규격만 검증. 실제 rembg 품질은 사람이 눈으로 확인.

### 4. 앱: `scripts/seed-picks.mjs`

- 기존 `seed-ingredients.mjs` 패턴(service key, upsert)을 따른다.
- 입력: `data/beauty-pipeline/csv/picks_export.json` + `data/beauty-pipeline/images/out/`
- 동작 (제품별):
  1. slug로 products upsert — **신규면** name/brand/slug/tags/award_badge/disclosure_required/is_published=true 삽입. **기존이면** tags/award_badge만 갱신 (name/brand/description은 덮지 않음 — admin에서 다듬은 값 보호. image는 아래 2가 유일한 갱신 경로).
  2. `images/out/<slug>.webp` 파일이 있으면 Supabase storage에 `products/<slug>.webp`로 업로드(upsert)하고 `products.image`를 그 public URL로 갱신 — 파이프라인 out 폴더가 이미지의 단일 원천이므로 항상 최신본으로 덮는다. 버킷은 기존 이미지(places 등)가 쓰는 공개 버킷을 그대로 쓰고, 구현 시 확인해 없으면 public 버킷 `media`를 생성한다.
  3. offers upsert: `(product_id, retailer)` 충돌 시 url/price/is_active 갱신.
- 이미지 없는 제품도 `is_published=true` — 카드의 TonalFrame placeholder가 처리.

### 5. 앱: 서비스 + ProductCard 확장

- `services/types.ts`: `ProductOffer = { retailer: "oliveyoung_global" | "amazon_us"; url: string }`, `Product`에 `offers: ProductOffer[]`, `tags: string[]`, `awardBadge: string | null` 추가.
- `services/products.ts`: `listProducts`/`getProductBySlug`에 offers 조인 (Supabase nested select `product_offers(retailer,url,is_active,sort)` — is_active만, sort 순).
- `ProductCard`:
  - 기존 "Shop →" 단일 링크 자리 → offers 배열대로 리테일러 링크 나열: 표시명 `oliveyoung_global`→"Olive Young", `amazon_us`→"Amazon". 링크 rel은 기존과 동일(`nofollow noopener noreferrer`). offers가 비면 기존 `affiliateUrl` 폴백 유지.
  - `tags`가 있으면 브랜드 라인 아래 작은 칩/텍스트 한 줄 (최대 3개 표시).
  - `awardBadge`가 있으면 이미지 위 좌상단 코너 배지.
  - 평점·리뷰수는 어떤 형태로도 표시하지 않는다.
- 기존 카드 사용처(픽스 페이지)는 시그니처 변화 없이 동작해야 함 (새 필드는 전부 optional/기본값).

## 비목표 (이번 슬라이스에서 안 함)

- `/products/[slug]` 상세 페이지
- 아마존 offers 실데이터 (PA-API는 판매 3건 후)
- 가격 자동 수집·갱신
- 자체(1st-party) 평점 시스템
- admin 폼에 offers/tags 편집 UI (다음 슬라이스 — 당장은 스크립트가 관리)

## Verification

- `export_picks.py`: pytest — 8개 픽스처 마스터에서 slug/tags/badge/offers 조립, 리워드코드 유무 분기, 결측 `product_name_en` 에러.
- `process_image.py`: pytest — 주입 픽스처로 트리밍·패딩·1200² WebP 규격 검증.
- `seed-picks.mjs`: 앱 vitest는 스크립트를 직접 커버하지 않음(기존 seed 스크립트들과 동일 취급). 라이브 실행 후 `/beauty/picks` 눈 확인.
- ProductCard: vitest — offers 렌더(2개 리테일러), 폴백(affiliateUrl), tags 3개 제한, awardBadge 유무, 평점 미표시.
- 수직 슬라이스 완성 기준: 토리든 다이브인 세럼 1개가 이미지·배지·태그·OY 링크·대가성 표기까지 실사이트 카드로 보일 것. 나머지 7개는 placeholder 이미지로 게시.

## 순서

1. (선행) feat/phase0-rls-legal 머지 — 사용자 결정
2. main에서 `feat/picks-product-cards` 분기
3. 마이그레이션 → export_picks → process_image → seed-picks → 서비스/카드 → 라이브 시드 + 눈 확인
