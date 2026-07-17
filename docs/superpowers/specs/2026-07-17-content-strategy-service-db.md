# A Drop of Seoul — 콘텐츠 전략 기획안 (예약 서비스 DB 연동)

**작성 기준:** 2026-07-17 / **운영 주체:** 주식회사 에센리
**원본:** 에디터 작성 내부 워킹 문서 (`a-drop-of-seoul-content-strategy.md`) — repo 보관본.
**정합성 리뷰:** `2026-07-17-booking-service-db-alignment.md` (채택/보류 판정)

## 0. 개요

- A Drop of Seoul은 주식회사 에센리가 소유·운영하는 K뷰티 에디토리얼 미디어.
- 향후 자사 브랜드(adropof, 상표 준비 중)의 K뷰티 가이드/예약 서비스 론칭 전,
  정보성 콘텐츠로 트래픽과 콘텐츠 DB를 먼저 축적하는 단계.
- 콘텐츠는 추후 예약 서비스의 데이터베이스(장소/시술/가격/후기)로 이전
  가능한 구조로 설계.

## 1. 현 사이트 리뷰 요약

**강점**

- 절제된 헤드라인 + 베이지 톤의 에디토리얼 무드, "The Korean Beauty Edit" 등
  카피 톤 확립
- Editorial → Guide → Directory → Place detail → 예약/커머스 전환이라는
  퍼널이 About 페이지에 명시됨
- Beauty(Skincare/Ingredients/Hair/Scalp/Treatments), Places(Hair Salon/Head
  Spa/Skin Clinic/Beauty Store), Neighborhood(Seongsu/Hannam/Gangnam/
  Apgujeong/Hongdae/Myeongdong) 분류 체계가 실제 사용자 여정과 부합
- Editorial Standards(선정 기준/협찬 구분/업데이트 원칙) 사전 문서화

**보완 필요**

- 모든 글이 3줄 요약(Quick answer / Who it's for / Quick recs) 수준에서 멈춰
  있음 — 본문·개인경험·실제 사진 없음
- Places 디렉토리 전부 Sample 상태 (주소/영업시간/예약링크/지도 미검증)
- 에디터 정체성 부재 — "정보+개인경험" 컨셉이 아직 구현되지 않음
- The Edit(제품) 섹션에 실사용 후기 없음
- 시의성 콘텐츠(월별 변화, 시즌 이슈) 부재

## 2. 벤치마킹

| 사이트               | 모델                 | 특징                                                                                | 시사점                                                          |
| -------------------- | -------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Travel-Stained       | 개인 블로거          | "15년 거주, 클리닉 20곳+ 방문" 단일 화자, 강한 몰입감, 시술 단위 준비물/자유도 노출 | 개인경험의 디테일 수준을 참고, 화자 구조는 그대로 채택하지 않음 |
| Creatrip 블로그      | 미디어+예약 플랫폼   | 바이라인(예: Jaycie Kim) + 브랜드 소유, 비교표/가격대/FAQ/예약 CTA 결합             | 지금 목표 사업구조와 가장 유사한 선례                           |
| Soko Glam / The Klog | 커머스 브랜드+미디어 | 다수 named 화자, 자사 브랜드 언급 투명 노출, 정보성+1인칭 경험 혼합                 | adropof 시나리오(자사 브랜드+미디어)의 직접적 선례              |

## 3. 화자 / 톤앤매너 전략 (확정)

- **전체 화자**: "A Drop of Seoul 에디토리얼팀" (법인 소유 명시, 미디어 브랜드
  보이스)
- **아티클 단위**: 실제/가명 에디터 바이라인으로 1인칭 경험 지분 담당
- 하단 고지: "A Drop of Seoul is operated by Essenri Inc." + 협찬/제휴 여부
  disclosure 필드 표준화
- 근거: (1) 기존 About 페이지 톤과 정합, (2) 다수 필진으로 콘텐츠 속도·DB 적재
  속도 확보, (3) 추후 자사 브랜드/서비스 노출 시 신뢰 훼손 리스크 최소화
  (Soko Glam 선례), (4) 협찬 공시와 disclosure 이슈에서 안전

## 4. 완성형 아티클 구조 템플릿

예시: "Best Head Spas in Seoul for a Slow Scalp-Care Reset"

1. 상단 메타: `By [에디터명], A Drop of Seoul Editor · Visited [월/연도]`
2. Quick answer / Who this guide is for / Quick recommendations (기존 유지)
3. 도입부: 정보 문장 + 에디터 1인칭 관찰 1~2문장
4. 비교 테이블: 지역 / 스타일 / 영업시간 / 가격대 / 영어가능 / 추천대상
   (서비스 DB 필드에 매핑)
5. "[에디터]가 실제 다녀온 곳": 방문일/예약방법/실결제 금액/대기시간/불편했던
   점/주관적 추천 포인트
6. 예약 실무 팁 (언어장벽, 예약 도구 — 추후 예약 버튼 자리 확보)
7. 세이프티케어 주의사항 (3~5개)
8. FAQ (5~6개, 추후 서비스 FAQ DB로 재사용)
9. Read Next (내부링크)
10. 하단 disclosure: "이 가이드에 포함된 장소는 편집팀이 자체 선정한
    목록이며, 제휴/협찬 여부는 있을 경우 명시합니다."

## 5. 초기 발행 캘린더 (6주)

- **1주차**: Best-of 비교 가이드 3편 (헤드스파, 영어가능 헤어살롱, 첫
  스킨클리닉 방문) — 기존 초안에 개인경험 레이어 채움
- **2주차**: 동네 가이드 완성 (성수, 한남) — 허브 콘텐츠로 내부링크 확장
- **3주차**: 시술/제품 비교형 정보 콘텐츠 (레이저 vs 스킨부스터, 팩토리형 vs
  1:1 클리닉)
- **4주차**: 시의성/실무 콘텐츠 (월별 변화, 캐시백/프로모션, 예약 언어장벽
  해소)
- **5주차**: 원데이 K뷰티 코스형 콘텐츠 (장소 여러 개 엮기)
- **6주차 이후**: 스캘프케어 심화 + The Edit 제품 섹션에 에디터 실사용 경험
  추가, 이후 6개 카테고리 로테이션 + 트래픽 데이터 기반 비중 조정

## 6. 서비스 DB 스키마 설계

### Neighborhood

id, slug, name, vibe_tags[], hero_image, linked_guide_article_id(FK)

### Place

id, slug, name_en, name_kr, place_type(enum), category_detail,
neighborhood_id(FK), address, geo_lat, geo_lng, opening_hours(JSON),
price_tier, price_range_krw{min,max}, languages_supported[],
booking_channel(enum), deposit_policy, gallery_images[], rating_avg,
review_count, view_count, save_count, staff_profile(object, optional),
editorial_status(enum: Sample/Verified/Partner),
sponsorship_disclosure(enum), last_verified_at

### Service (Place 하위 시술/메뉴)

id, place_id(FK), name, treatment_category_id(FK), duration_minutes,
price_krw, first_time_trial_price(optional), downtime_note

### Article / Guide

id, slug, content_type(enum: Guide/Journal/Neighborhood/Itinerary/How-to),
editor_id(FK), visited_places[](FK Place), quick_answer, who_its_for[],
quick_recs[], personal_experience_block{visit_date, payment_amount_krw,
wait_time, pain_discomfort_note, verdict}, faq[]{q,a},
sponsorship_disclosure(enum), last_updated_at

### Editor

id, display_name, bio_short, avatar

### Review / Experience Log

id, place_id(FK), source(enum: Editorial/User/AI_Summary), rating(optional),
body, review_date

### Booking (향후 활성화 대비, 스키마 자리만)

id, place_id(FK), service_id(FK), status(enum: Pending/Confirmed/Cancelled),
cashback_or_benefit

### Product (The Edit)

id, brand, name, category(enum), editorial_note,
linked_treatment_category_id(FK, optional), price_tier

---

_이 문서는 A Drop of Seoul 콘텐츠/서비스 기획을 위한 내부 워킹 문서입니다.
리서치 진행에 따라 지속 업데이트 예정._
