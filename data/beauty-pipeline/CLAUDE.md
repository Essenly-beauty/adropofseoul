# 뷰티 제품 데이터 파이프라인 (화해 마스터 + 올리브영 병합)

이 폴더는 K-뷰티 제품 CSV 마스터와 올리브영 병합 도구다. 앱(Next.js/Supabase)과는 독립적이다.

## 폴더 구성

- `csv/` — 마스터 CSV (UTF-8 BOM). 생성 파일(`*.bak.csv`, `review_queue.csv`, 크롤 JSON, `reconcile_global.csv`)도 여기 생긴다.
- `merge_oliveyoung.py` — 국내(한글) 자동 병합. 입력: `csv/oliveyoung_crawl.json`
- `reconcile_global.py` — 글로벌(영문) 1단계: 사람이 판정할 대조표 생성. 입력: `csv/oliveyoung_global_crawl.json`
- `apply_global.py` — 글로벌 2단계: 판정된 `csv/reconcile_global.csv` 적용
- `inventory_raw_values.py` — 크롤 JSON의 skin/concern 원본값을 맵 CSV에 사전 등록
- `crawler.py` — 글로벌 시딩 수집기 (og:title 기반, brands.csv brand_en 접두 매칭). 국내는 봇 차단으로 수집 안 함(2026-07-21 조사, 이슈 #11)
- `validate.py` — 마스터 무결성 리포트 (exit 0/1)
- `tests/` — pytest. 마스터를 절대 건드리지 않고 tmp 폴더 사본으로 검증.

## 실행

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python validate.py
.venv/bin/python -m pytest tests/ -v
```

## 절대 규칙 (어기지 말 것)

1. `csv/products.csv`의 `product_id`(P00001~)는 **불변**. 재정렬·재부여 금지. 신규는 항상 다음 번호.
2. 자동 병합은 **제품 매칭 키 일치**일 때만. 애매하면 `csv/review_queue.csv`로.
3. 기존 제품이면 `products.csv`는 수정하지 말고 `product_sources.csv`에 소스 행만 추가.
4. 각 CSV를 덮어쓰기 전 `*.bak.csv`로 백업. 검증 실패 시 저장 중단.
5. 매칭 키 함수는 `merge_oliveyoung.py`의 `keyf()`가 유일한 기준. 복제하지 말고 import.

## 스키마 (CSV 1개 = 테이블 1개, 조인 키 = product_id)

- `products.csv` : product_id, brand, product_name, product_name_en, category, subcategory, is_rising, rising_rank, category_rank, brand_rank
- `product_sources.csv` : product_id, source, source_product_id, url
- `brands.csv` : brand, brand_en, status
- `skin_types.csv` : product_id, source, skin_type_raw, rank (원본값 보존)
- `age_groups.csv` : product_id, age_group, rank
- `concerns.csv` : product_id, source, concern_raw (원본값 보존)
- `skin_type_map.csv` / `concern_map.csv` : source, raw_value, std_value (표준화 규칙; std는 나중에 사람이 채움)
- `awards.csv` / `textures.csv` / `rankings.csv` : 화해 전용 — 올리브영 병합 시 건드리지 않음

### 원본 보존 원칙 (중요)

- skin/concern은 소스 원본값 그대로 저장 (예: 글로벌 "Dry"를 건성으로 바꾸지 않는다).
- 표준화는 `*_map.csv`에서만. 추천 로직은 raw → map → std로 읽는다.
- 새 (source, 원본값)은 스크립트가 map에 자동 등록(std 공란). `inventory_raw_values.py`로 병합 전 이형을 미리 볼 수 있다.

## 수집 필드 (제품 1건당)

- 국내: 필수 brand, product_name, oy_id, url / 선택 brand_en, category, subcategory, skin_types[], concerns[]
- 글로벌: brand_en, product_name_en, oy_id, url / 선택 category, skin_types[], concerns[]
- brand_en은 brands.csv에서 해당 브랜드가 비어 있을 때만 채운다 (기존 값 덮어쓰기 금지).

## 흐름

### 국내 (한글 자동 병합)

※ 2026-07-21 조사: 국내 사이트는 봇 차단 대기실로 비브라우저 트래픽을 거부 → 크롤링 금지. 이 흐름은 다른 데이터 출처가 생길 때만 사용.

1. 수집 준비: robots.txt/이용약관 확인, 요청 간 지연, User-Agent 명시. 공식 API·제휴 피드 우선 확인.
2. 시딩 샌드박스: 5~10개만 수집 → `csv/oliveyoung_crawl.json` → 필드가 스키마에 맞는지 사람이 확인.
3. `merge_oliveyoung.py` 실행 → 검증 리포트(신규/병합/리뷰 건수) 확인.
4. `csv/review_queue.csv`를 사람이 판정.

### 글로벌 (영문, 2단계)

1. `reconcile_global.py` → `csv/reconcile_global.csv` 생성 (matched_product_id는 항상 공란, candidate_* 열은 참고용).
2. 사람(LLM 제안 허용)이 `matched_product_id`에 P##### 또는 NEW 기입. 애매하면 절대 추측 금지.
3. `apply_global.py` → 매칭이면 product_name_en 채움+소스 추가, NEW면 다음 내부 ID로 신규 등록.
   ※ brand_en이 brands.csv에 미리 채워져 있을수록 글로벌 매칭률이 올라간다.

## 완료 기준

- product_id 유일, 매칭 키 중복 0, 고아 소스 행 0 (`validate.py` 통과)
- 신규 제품은 P00360부터 연속 부여
- 리뷰 대기 항목은 자동 병합되지 않고 `review_queue.csv`에 남는다
