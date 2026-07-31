# Seoul Attractions → Places 디렉터리 확장 설계 (전망대·시장·쇼핑몰·스파)

**Date:** 2026-07-31
**Status:** Approved (verbal)
**Scope:** 외부 CSV(전망대 & 타워 / 벼룩시장 & 재래시장 / 쇼핑몰 / 스파·웰니스 644행)에서 검증 가능한 71행을 `places` 디렉터리에 시딩한다. `place_category`에 `observatory` / `market` / `mall`을 신설해 디렉터리를 K-뷰티 전용에서 "서울 여행 + 뷰티"로 넓힌다. 정보 부족 572행은 Phase 2(별도 스펙)로 분리.

## Background

- 원본 CSV: `a_drop_of_seoul_places_전망대_시장_쇼핑몰_스파웰니스.csv` (644행, UTF-8 BOM,
  칼럼 `카테고리,국문명,영문명,지역,주소,평점,리뷰수,About`).
- 현재 `places`에는 138행이 있고 전부 K-뷰티(살롱·퍼스널컬러·스파·플래그십·워크숍)다.
  소스는 `data/adropofseoul_places.json`(기계 필드) + `data/places-curation.en.json`(영문 편집
  레이어)이고, `scripts/seed-places.mjs`가 slug로 조인해 upsert 또는 `--sql` 마이그레이션을 만든다.
- `place_category` 현재 값 14종: `head_spa` `salon` `cafe` `clinic` `shop` `wellness`
  `personal_color` `makeup` `spa` `facial` `nail_lash` `perfume` `cooking_class` `food_tour`.
  전망대·시장·쇼핑몰에 해당하는 값이 없다.
- 디렉터리(`app/seoul/places/page.tsx`)의 `area`·`type` 필터는 **게시된 장소에서 파생**된다.
  신규 값은 코드 변경 없이 노출되고, 미게시 행은 칩을 만들지 않는다.
- 법적 제약(기존 프로젝트 원칙 유지): 타인의 리뷰 텍스트는 재게시하지 않는다. 평점·리뷰수는
  숫자 필드로만 저장하고, 산문은 자체 작성한다 — 기존 138행과 동일한 방식.
- Google Places API 키가 없다(`.env.local` 미보유). 스크래핑은 ToS 위반이므로 검증은
  공개 웹 검색으로 한다.

## 데이터 실측 (구현 전 확정된 수치)

| 카테고리            | 전체    | 주소 O | 주소 O + About O |
| ------------------- | ------- | ------ | ---------------- |
| 전망대 & 타워       | 12      | 12     | 12               |
| 벼룩시장 & 재래시장 | 66      | 18     | 18               |
| 쇼핑몰              | 86      | 14     | 14               |
| 스파/웰니스         | 480     | 28     | 28               |
| **합계**            | **644** | **72** | **72**           |

- 나머지 572행은 주소·About이 모두 `정보 부족`이고 리뷰 0~2개다 → Phase 2.
- **CSV 버그: 스파/웰니스 480행은 `지역`↔`주소` 칼럼이 서로 뒤바뀌어 있다.**
  (`스파고결`: `지역="서울 강남구 선릉로132길 13 J&C빌딩 4층"`, `주소="강남구"`)
  파싱 시 이 블록만 두 칼럼을 교환해야 한다.
- `지역` 칼럼은 스왑 교정 후에도 신뢰할 수 없다. `헬로에이피엠`은 `지역=서대문(아현)`인데
  주소는 `중구 장충단로 253`(동대문 권역), `Eco Jardin Aeogae Branch`는 `지역=애오개/아현`인데
  주소는 `마포대로 204`다. **area는 주소로만 판정한다.**
- 72행 내 상호·주소 중복 없음.
- About 길이는 15~91자(중위 38자). 기존 `long_description`(약 150 단어)에는 못 미치므로
  About은 **사실 씨앗**으로만 쓰고 영문 편집 레이어는 새로 쓴다.

## 결정 사항 (사용자 확정)

1. **범위:** 4개 카테고리 전부 (72행), 정보 부족 572행은 따로 리서치 → Phase 2
2. **카테고리:** `observatory` / `market` / `mall` 3개 신설 (기존 `shop` 재사용 안 함)
3. **편집 분량:** 기존 138건과 동일한 풀 패리티 (5필드 전부, `long_description` 포함)
4. **area 분류:** 3단 하이브리드 — 기존 어휘 재사용 → 정체성 뚜렷+2건 이상이면 신설 → 자치구 단위

### `shop`을 재사용하지 않는 이유

기존 `shop` 12건은 전부 성수 브랜드 플래그십(올리브영 N 성수, 아모레 성수, 탬버린즈,
논픽션, LCDC…)이고, 성수 허브의 "Shop the flagships" 섹션이 `categories: ["shop"]`으로
묶여 있다(`lib/taxonomy.ts` `SEOUL_NEIGHBORHOODS`). 여기에 스타필드 코엑스나 동대문
도매상가가 섞이면 허브 섹션이 오염된다.

## 편집 심사 — 제외 1행, 미게시 3행 (사용자 확정: "분리")

두 사안을 **다르게** 처리한다. 분류가 사실과 다른 것은 데이터 오류라 제외하고,
평점이 낮은 것은 사실이므로 데이터로는 보유하되 추천으로 노출하지 않는다.

### 제외 1행 — `data/places-curation.en.json`의 `excluded` 맵에 기록

| 제외     | 이유                                                                     |
| -------- | ------------------------------------------------------------------------ |
| 종로타워 | 30층 전망 데크가 오피스로 전환됨 — `observatory` 분류 자체가 사실과 다름 |

### 미게시 3행 — 시딩하되 `verified: false` → `is_published: false`

| 장소                  | category   | area       | 평점/리뷰 |
| --------------------- | ---------- | ---------- | --------- |
| 오투 (O2 Body & Foot) | `spa`      | Myeongdong | 2.7★ / 13 |
| Eco Jardin (경복궁)   | `head_spa` | Jongno     | 2.6★ / 10 |
| 황족마사지            | `spa`      | Myeongdong | 2.4★ / 19 |

편집 매체가 2점대 업소를 디렉터리 추천으로 **노출하지는** 않되, 나중에 재평가하거나
Phase 2에서 중복 판정할 때 쓸 수 있도록 행 자체는 남긴다. 이 3행은 **검증 성공 여부와
무관하게** 미게시다 — 검증 실패로 인한 미게시와 이유가 다르므로 `excluded` 맵에 사유를
`unpublishedReason`으로 따로 남겨 나중에 구분할 수 있게 한다.
`Eco Jardin Aeogae Branch`(4.8★)는 별개 지점이므로 정상 게시 대상이다.

**주의 표기 대상(미게시 아님):** `정동전망대`는 About에 "최근 운영 여부에 혼선"이 있어
검증 결과에 따라 `is_published`를 정한다. `명동밀리오레`(3.1★, "노후화된 시설로 평가됨"),
`강변스파랜드`(3.4★), `호쿠토시치세이`(3.4★), `헬로에이피엠`(3.3★)은 게시하되 편집
산문에서 기대치를 솔직히 적는다.

## 카테고리 매핑 (71행)

전망대 12→11(종로타워 제외), 시장 18, 쇼핑몰 14, 스파/웰니스 28.
스파/웰니스는 신설 값을 쓰지 않고 기존 뷰티 카테고리로 분해한다.

| category      | 건수 | 비고 |
| ------------- | ---- | ---- |
| `market`      | 18   | 신설 |
| `spa`         | 17   | 기존 |
| `mall`        | 14   | 신설 |
| `observatory` | 11   | 신설 |
| `facial`      | 7    | 기존 |
| `head_spa`    | 3    | 기존 |
| `wellness`    | 1    | 기존 |

`entry_type`은 71행 전부 `place`. 신규 허브는 만들지 않는다 —
`SEOUL_NEIGHBORHOODS` 4개 허브(성수·홍대·명동·강남&청담)는 손대지 않고,
신규 area는 디렉터리 필터 값으로만 쓴다.

## area 정규화 — 42종 → 32종

`지역` 칼럼 42종을 주소 기준으로 재판정해 통제 어휘 32종(기존 17 + 신설 15)으로 정리한다.
71행 중 42행(59%)이 기존 어휘로 흡수된다.

**area는 행정구역이 아니라 독자가 인식하는 권역이다.** 그래서 종로구 청계천로 279의
`프로방스 스파 바이 록시땅`은 입점 건물이 JW메리어트 **동대문** 스퀘어이므로 `Dongdaemun`,
중구 한강대로 405의 `롯데아울렛 서울역점`은 아이파크몰과 같은 용산~서울역 축이므로 `Yongsan`이다.

### 기존 어휘 재사용 (42행)

| area                                      | 기존           | +신규   |
| ----------------------------------------- | -------------- | ------- |
| Jongno                                    | 2              | +9      |
| Myeongdong                                | 25             | +9      |
| Dongdaemun                                | 2              | +7      |
| Gangnam                                   | 9              | +5      |
| Yongsan                                   | 1              | +4      |
| Jamsil                                    | 1              | +2      |
| Itaewon                                   | 1              | +2      |
| Cheongdam / Apgujeong / Mangwon / Gangseo | 13 / 8 / 2 / 1 | +1 each |

### 신설 15종 (29행)

2건 이상: `Gongdeok`(5) `Euljiro`(3) `Gwangjin`(3) `Hapjeong`(2) `Sangam`(2)
`Seodaemun`(2) `Seongdong`(2) `Songpa`(2) `Yeouido`(2)
1건: `Gangdong` `Jeongdong` `Noryangjin` `Nowon` `Seocho` `Yeongdeungpo`

판정 근거 몇 가지:

- `N 서울타워` → `Namsan` 신설 대신 `Yongsan` (남산은 행정상 용산구, 기존 어휘 재사용)
- `가락시장`·`가든파이브` → `Jamsil`이 아니라 `Songpa` (송파구지만 잠실 권역이 아님)
- `노량진 수산물 도매시장` → `Dongjak`보다 검색어 가치가 큰 `Noryangjin`
- `서울풍물시장`(동대문구) → 동묘벼룩시장과 도보권이므로 `Dongdaemun`
- `응봉산팔각정`(성동구 응봉동) → 성수동이 아니므로 `Seongsu`가 아닌 `Seongdong` 신설

1건짜리 area가 미게시로 남으면 필터 칩이 아예 생기지 않으므로(필터는 게시된 장소에서 파생)
어휘가 비어도 UI가 자가 치유된다.

전체 71행 매핑표는 **부록 A**.

## Deliverables

### 1. DB 마이그레이션 2개 (둘 다 additive)

```sql
-- <ts>_place_category_attractions.sql
alter type place_category add value if not exists 'observatory';
alter type place_category add value if not exists 'market';
alter type place_category add value if not exists 'mall';
```

```sql
-- <ts>_seed_seoul_attractions.sql  (GENERATED by seed-places.mjs --sql)
insert into places (...) values (...) on conflict (slug) do update set ...;
```

`CLAUDE.md`의 history drift 경고에 따라 **`supabase db push`를 쓰지 않는다.**
두 SQL을 Supabase 대시보드 SQL 에디터에서 순서대로 1회 실행하고,
`supabase migration repair --status applied <version>`으로 기록만 맞춘다.
enum 추가와 seed는 별도 트랜잭션이어야 한다(Postgres는 같은 트랜잭션에서 추가한 enum 값을 쓸 수 없다).

### 2. 원본 CSV 커밋

`data/places-import/seoul-attractions-2026-07.csv` — ASCII 파일명으로 원본 그대로 커밋해
변환을 재현 가능하게 한다(`data/places-pipeline/csv/`의 선례와 동일한 원칙).

### 3. `scripts/import-places-csv.mjs` (신규)

기계 변환만 담당한다. 편집 산문은 만들지 않는다.

- 스파/웰니스 블록의 `지역`↔`주소` 스왑 교정
- 부록 A의 `국문명 → {category, area}` 매핑을 **스크립트 안의 JS 리터럴로** 옮겨 적용한다
  (마크다운을 파싱하지 않는다). 주소 파싱 휴리스틱이 아니라 수기 검토된 테이블을 쓰는 이유는
  71행 규모에서는 감사 가능성이 휴리스틱의 편의보다 중요하기 때문이다. 부록 A가 사람이 읽는
  정본, JS 리터럴이 기계가 읽는 사본이며 둘의 행 수·키가 일치하는지는 테스트로 잠근다.
- `excluded` 목록 필터
- slug 생성: 영문명 → ASCII kebab, 기존 138개 slug와 충돌 검사 후 실패 시 에러
- 지도 링크 생성 (기존 패턴 준수):
  - `googleMaps` = `https://www.google.com/maps/search/?api=1&query=<영문명 + area + Seoul>` (URL 인코딩)
  - `naverMap` = `https://map.naver.com/p/search/<국문명>` (URL 인코딩)
- 산출: `data/adropofseoul_places.json`에 71행 append (138 → 209)

`--dry-run`으로 결과만 출력하는 모드를 둔다(`seed-places.mjs` 관례).

### 4. 검증 + 영문 편집 레이어 (`data/places-curation.en.json`)

71행 각각:

1. **검증** — 공개 웹 검색으로 상호·도로명주소·현재 영업 여부를 확인한다. 주소가
   `주소 미기재`인 2행(`중부시장`, `종로3가 포장마차 골목`)은 검색으로 도로명주소를 채운다.
2. **편집 5필드 작성** — `short_description`(1문장) · `service_detail`(짧은 라벨) ·
   `best_for`(구) · `why_we_like_it`(1~2문장, nullable) · `long_description`(약 150 단어).
   전부 자체 산문이며 **타인 리뷰 텍스트를 인용하거나 번역해 옮기지 않는다.**
   평점·리뷰수는 `rating`·`review_count` 숫자 필드로만 들어간다.
3. **`verified` 플래그** — 검증 성공 시 `true`, 실패·불확실 시 `false`.
   `seed-places.mjs`가 `verified: false` → `is_published: false`로 시딩한다.

게시 판단은 **리뷰 수가 아니라 검증 성공 여부**다. `응봉산팔각정`은 2리뷰지만 서울의
알려진 야경 명소이므로 검증되면 게시한다. 최종 게시는 커밋 `fab6a65`의 선례대로
사용자 게이트를 거친다.

### 5. taxonomy·UI 배선

`lib/taxonomy.ts`:

```ts
PLACE_TYPE_LABELS: { observatory: "Observatory & Tower", market: "Market", mall: "Shopping Mall" }
PLACE_TYPE_EMOJI:  { observatory: "🔭", market: "🏮", mall: "🛒" }
```

이 두 맵이 디렉터리 필터와 `components/admin/PlaceForm.tsx` 카테고리 드롭다운을 동시에 커버한다.

`app/seoul/places/page.tsx:34` — `listPlaces({ limit: 200 })` → `300`.
138 + 71 = 209로 현재 상한을 넘어 조용히 잘린다.

`app/seoul/page.tsx`의 `PLACE_TYPES` 진입점 카드에 `Observatories`(observatory) ·
`Markets`(market) · `Shopping Malls`(mall) 3개를 추가해 6개 → 9개로 만든다.

이 그리드의 선정 기준은 주석이 말하는 "best-populated"가 아니다 — 실제로는 `clinic`(2건)이
들어가 있고 `facial`(13건) · `nail_lash`(13건) · `shop`(12건)이 빠져 있다. 진짜 기준은
**"서울에 그걸 하러 오는가"**이고, 그 기준에서 동대문·명동 쇼핑은 K-뷰티 방문객의 실제
목적이므로 `mall`(14건)은 자격이 있다. 레이아웃도 `lg:grid-cols-3`에서 9개가 3행을 꽉 채운다
(8개면 `3+3+2`로 마지막 행이 어그러진다).

### 6. 테스트

`scripts/import-places-csv.test.mjs` (vitest, 네트워크 없음):

- 스파/웰니스 스왑 교정: 교정 후 `주소`가 도로명, `지역`이 구
- 스왑이 스파 블록에만 적용되고 다른 3개 카테고리는 그대로
- `excluded` 4건이 산출에서 빠짐
- slug ASCII kebab 생성 + 기존 slug와 충돌 시 throw
- 지도 링크 URL 인코딩 (한글 국문명, `&`가 든 `롯데월드타워&몰`)
- 부록 A 테이블에 없는 국문명이 들어오면 throw (조용한 누락 방지)

`npm run typecheck` · `npm run test` · `npm run lint` 그린 유지.

## Out of Scope

- **Phase 2 (별도 스펙):** 정보 부족 572행 보완. 중복 제거 후 552 고유 상호,
  업종 분류상 93건은 범위 밖(사우나·목욕탕·불한증막·피트니스·필라테스·성형클리닉),
  185건은 K-뷰티 가능성, 294건 판단 불가. 접근은 `data/places-pipeline`의 행안부 인허가
  파이프라인을 25개 자치구 + 목욕장업 데이터셋으로 확장해 공식 상호·도로명주소·영업상태를
  대량 해결하고, keep 버킷만 타겟 웹검증하는 방식. 현재 3개 구(강남·중구·마포, 그것도
  허브 동네 필터링) 데이터로는 552건 중 11건(2%)만 매칭되므로 파이프라인 확장이 선행 조건이다.
  예상 산출 60~120건.
- 신규 동네 허브 페이지. 신설 area 15종은 디렉터리 필터 값일 뿐이다.
- 장소 사진. `images` 칼럼은 비워둔다(권리 확보된 원본만 쓴다는 기존 원칙).
- `booking_url` · `price_range` · `languages` · `website_url` · `instagram_url` —
  CSV에 없고 이번 검증 범위도 아니다. null로 둔다.

## 부록 A — 71행 매핑표

수기 검토된 `국문명 → {category, area}` 테이블. import 스크립트가 이 표를 그대로 쓴다.

| category      | 국문명                      | 영문명                                     | area         | 주소                                                        | 평점/리뷰  |
| ------------- | --------------------------- | ------------------------------------------ | ------------ | ----------------------------------------------------------- | ---------- |
| `observatory` | 광진교8번가                 | Riverview 8th Avenue                       | Gangdong     | 서울 강동구 선사로 4 광진교 중앙지점 하단                   | 3.9 / 9    |
| `observatory` | 김포공항 전망대             | Gimpo Int'l Airport Observatory Deck       | Gangseo      | 서울 강서구 하늘길 78 김포국제공항                          | 3.5 / 20   |
| `observatory` | 뚝섬 전망문화콤플렉스 J-Bug | Cultural Complex J-Bug                     | Gwangjin     | 광진구 뚝섬한강공원 내(정식명칭 서울생각마루)               | 4.0 / 9    |
| `observatory` | 롯데월드타워&몰             | Lotte World Tower & Mall                   | Jamsil       | 서울 송파구 올림픽로 300(롯데월드 117~123층)                | 4.4 / 902  |
| `observatory` | 서울스카이                  | Seoul Sky                                  | Jamsil       | 서울 송파구 올림픽로 300(롯데월드타워 117~123층)            | 4.3 / 303  |
| `observatory` | 정동전망대                  | Jeongdong Observatory                      | Jeongdong    | 서울 중구 덕수궁길 15 서울시청 서소문별관 13층              | 4.4 / 37   |
| `observatory` | 서울 한양도성               | Seoul City Wall                            | Jongno       | 종로구 일대(단일 주소 없음)                                 | 4.4 / 195  |
| `observatory` | 채석장 전망대               | Chaeseokjang Observatory                   | Jongno       | 종로구 창신동 일대(비공식)                                  | – / 2      |
| `observatory` | 응봉산팔각정                | Eungbongsan Palgakjeong                    | Seongdong    | 성동구 응봉동(비공식)                                       | 5.0 / 2    |
| `observatory` | 63 스카이피크닉             | 63 Skypicnic                               | Yeouido      | 영등포구 63로 50 63빌딩 내(비공식)                          | 5.0 / 10   |
| `observatory` | N 서울타워                  | N Seoul Tower                              | Yongsan      | 서울 용산구 남산공원길 105                                  | 4.2 / 9678 |
| `market`      | 서울풍물시장                | Seoul Folk Flea Market                     | Dongdaemun   | 서울 동대문구 천호대로4길 21                                | 3.6 / 71   |
| `market`      | 중부시장                    | Jungbu Market                              | Euljiro      | 주소 미기재 — 검증으로 채움                                 | 4.2 / 115  |
| `market`      | 공덕시장                    | Gongdeok Market                            | Gongdeok     | 서울 마포구 만리재로 19                                     | 3.7 / 9    |
| `market`      | 광장시장                    | Kwangjang Market                           | Jongno       | 서울 종로구 창경궁로 88                                     | 4.2 / 2368 |
| `market`      | 동묘벼룩시장                | Dongmyo Flea Market                        | Jongno       | 서울 종로구 숭인동(동묘앞역 3번 출구 인근)                  | 4.2 / 35   |
| `market`      | 쌈지길                      | Ssamzigil                                  | Jongno       | 서울 종로구 인사동길 44                                     | 3.9 / 469  |
| `market`      | 종로3가 포장마차 골목       | Jongno 3-ga Stalls Alley                   | Jongno       | 주소 미기재 — 검증으로 채움                                 | 4.1 / 8    |
| `market`      | 망원시장                    | Mangwon Market                             | Mangwon      | 서울 마포구 포은로8길 14                                    | 4.3 / 48   |
| `market`      | Myeongdong Night Market     | Myeongdong Night Market                    | Myeongdong   | 서울 중구 충무로2길 3                                       | 4.7 / 18   |
| `market`      | 남대문시장                  | Namdaemun Market                           | Myeongdong   | 서울 중구 남대문시장4길 21                                  | 3.9 / 2966 |
| `market`      | 노량진 수산물 도매시장      | Noryangjin Fisheries Wholesale Market      | Noryangjin   | 서울 동작구 노들로 674                                      | 3.9 / 930  |
| `market`      | 공릉동 도깨비시장           | Gongneungdong Goblin Market                | Nowon        | 서울 노원구 동일로180길 37                                  | 4.3 / 3    |
| `market`      | 마포 농수산물 시장          | Mapo Agricultural & Marine Products Market | Sangam       | 서울 마포구 월드컵로 235                                    | 3.9 / 11   |
| `market`      | 영천시장                    | Yeongcheon Market                          | Seodaemun    | 서울 서대문구 성산로 704                                    | 4.3 / 4    |
| `market`      | 마장 축산물시장             | Majang Meat Market                         | Seongdong    | 서울 성동구 마장로31길 40                                   | 4.3 / 111  |
| `market`      | 가락시장                    | Garak Market                               | Songpa       | 서울 송파구 양재대로 932                                    | 4.2 / 46   |
| `market`      | 영등포중앙시장              | Yeongdeungpo Market                        | Yeongdeungpo | 서울 영등포구 영등포로 225                                  | 3.4 / 18   |
| `market`      | 신흥시장                    | Shinheung Market                           | Yongsan      | 서울 용산구 신흥로 95-9                                     | 4.4 / 5    |
| `mall`        | 남평화 상가                 | Nampyeonghwa Sangga                        | Dongdaemun   | 서울 중구 장충단로 282-10                                   | 3.8 / 35   |
| `mall`        | 에이피엠 플레이스           | Apm Place                                  | Dongdaemun   | 서울 중구 을지로 276                                        | 3.9 / 21   |
| `mall`        | 헬로에이피엠                | Hello APM                                  | Dongdaemun   | 서울 중구 장충단로 253                                      | 3.3 / 32   |
| `mall`        | 스타필드 코엑스몰           | Starfield COEX Mall                        | Gangnam      | 서울 강남구 영동대로 513                                    | 4.0 / 902  |
| `mall`        | 커먼그라운드                | Common Ground                              | Gwangjin     | 서울 광진구 아차산로 200                                    | 3.7 / 186  |
| `mall`        | 메세나폴리스몰              | Mecenatpolis Mall                          | Hapjeong     | 서울 마포구 양화로 45                                       | 3.9 / 80   |
| `mall`        | 명동밀리오레                | Myeongdong Migliore                        | Myeongdong   | 서울 중구 퇴계로 115                                        | 3.1 / 42   |
| `mall`        | 명동지하상가                | Myeongdong Underground Shopping Center     | Myeongdong   | 서울 중구 남대문로지하 72                                   | 3.6 / 65   |
| `mall`        | 스타일난다 핑크호텔         | Stylenanda Pink Hotel Flagship Store       | Myeongdong   | 서울 중구 명동8길 37-8                                      | 4.1 / 71   |
| `mall`        | 고투 몰                     | GOTO Mall                                  | Seocho       | 서울 서초구 신반포로 194                                    | 4.1 / 290  |
| `mall`        | 가든파이브                  | Garden 5                                   | Songpa       | 서울 송파구 충민로 66                                       | 3.8 / 31   |
| `mall`        | IFC 몰                      | IFC Mall                                   | Yeouido      | 서울 영등포구 여의도동 국제금융로 10                        | 4.0 / 188  |
| `mall`        | 롯데아울렛 서울역점         | Lotte Outlets Seoul Station                | Yongsan      | 서울 중구 한강대로 405                                      | 3.6 / 288  |
| `mall`        | 아이파크몰                  | I'Park Mall                                | Yongsan      | 서울 용산구 한강대로23길 55                                 | 3.9 / 118  |
| `spa`         | 2s 압구정                   | 2s Apgujeong                               | Apgujeong    | 서울 강남구 선릉로157길 6 4층                               | 4.9 / 16   |
| `spa`         | 마르지아 힐링 스파 - 청담   | Marzia Healing Spa - Cheongdam             | Cheongdam    | 서울 강남구 삼성로119길 23 4층                              | 4.9 / 14   |
| `spa`         | Asuca                       | Asuca                                      | Dongdaemun   | 서울 중구 장충단로 213                                      | 4.6 / 10   |
| `spa`         | 프로방스 스파 바이 록시땅   | Provence Spa by L'OCCITANE                 | Dongdaemun   | 서울 종로구 청계천로 279 JW 메리어트 동대문 스퀘어 서울 9층 | 4.8 / 13   |
| `spa`         | 황금스파                    | Gold Spa                                   | Dongdaemun   | 서울 중구 청계천로 400 B2F, Lotte Castle                    | 3.9 / 14   |
| `spa`         | 호쿠토시치세이              | Hokutosichisei                             | Euljiro      | 서울 중구 을지로 78 남광빌딩 406호                          | 3.4 / 12   |
| `spa`         | 스파 1899 동인비            | Spa 1899 Donginbi                          | Gangnam      | 서울 강남구 영동대로 416 KT&G 타워 B2층                     | 4.6 / 25   |
| `spa`         | 스파고결                    | Spa Gogyeol                                | Gangnam      | 서울 강남구 선릉로132길 13 J&C빌딩 4층                      | 5.0 / 269  |
| `spa`         | 아로마 타이 스파 공덕점     | Aroma Thai Spa Gongdeok                    | Gongdeok     | 서울 마포구 독막로 320 태영 데시앙101동 지하 101호          | 4.9 / 336  |
| `spa`         | 강변스파랜드                | Riverside Spa Land                         | Gwangjin     | 서울 광진구 구의강변로 45 성진빌딩 지하2층                  | 3.4 / 17   |
| `spa`         | 뱀부테라피                  | Bamboo Therapy                             | Hapjeong     | 서울 마포구 양화로18안길 22                                 | 4.4 / 12   |
| `spa`         | 더 스파 그랜드 하얏트 서울  | The Spa Grand Hyatt Seoul                  | Itaewon      | 서울 용산구 소월로 322 Garden Level                         | 4.6 / 53   |
| `spa`         | 레비쉬 스파                 | Lavish Spa                                 | Jongno       | 서울 종로구 동숭3길 6-4 2층                                 | 4.9 / 98   |
| `spa`         | 스파렉스 사우나             | Sparex Sauna                               | Jongno       | 서울 종로구 지봉로 19 Season Bldg. 12F                      | 3.6 / 65   |
| `spa`         | 오투 ⚑미게시                | O2 Body & Foot                             | Myeongdong   | 서울 중구 남대문로 78                                       | 2.7 / 13   |
| `spa`         | 황족마사지 ⚑미게시          | Hwangjok Massage                           | Myeongdong   | 서울 중구 명동8나길 12 롯데리아 5층                         | 2.4 / 19   |
| `spa`         | 숲속 한방 랜드              | Supsok Hanbang Land                        | Seodaemun    | 서울 서대문구 봉원동 51                                     | 3.9 / 11   |
| `facial`      | 설화수 스파                 | Sulwhasoo Spa                              | Euljiro      | 서울 중구 을지로 30 4층                                     | 4.1 / 15   |
| `facial`      | Individuel Geneve           | Individuel Geneve                          | Gangnam      | 서울 강남구 봉은사로47길 60                                 | 3.9 / 37   |
| `facial`      | Seoulistique Skin           | Seoulistique Skin                          | Gongdeok     | 서울 마포구 마포대로 225                                    | 4.3 / 10   |
| `facial`      | 달콤한 게으름               | Dolce Far Niente                           | Gongdeok     | 서울 마포구 만리재로 93 2층                                 | 5.0 / 12   |
| `facial`      | 미조 에스떼 살롱            | MIZO Esthe Salon                           | Myeongdong   | 서울 중구 충무로2가 66-9                                    | 4.3 / 25   |
| `facial`      | 헤라                        | Hera                                       | Myeongdong   | 서울 중구 명동8가길 39                                      | 4.5 / 12   |
| `facial`      | Laurel studio               | Laurel studio                              | Sangam       | 서울 마포구 월드컵북로 7, 3층                               | 5.0 / 21   |
| `head_spa`    | 스톤 하우스 헤드 스파       | Stone House Head Spa                       | Gangnam      | 서울 강남구 언주로147길 B63-22 B1, A동                      | 4.9 / 11   |
| `head_spa`    | Eco Jardin Aeogae Branch    | Eco Jardin Aeogae Branch                   | Gongdeok     | 서울 마포구 마포대로 204, 2층                               | 4.8 / 17   |
| `head_spa`    | Eco Jardin (경복궁) ⚑미게시 | Eco Jardin                                 | Jongno       | 서울 종로구 자하문로 9, 5층                                 | 2.6 / 10   |
| `wellness`    | 크레이트 웰네스             | Create Wellness Center                     | Itaewon      | 서울 용산구 이태원로 211 한남빌딩 1층                       | 4.8 / 30   |

⚑미게시 3행은 `verified: false`로 시딩되어 `is_published: false`가 된다 — 데이터는 보유하되
디렉터리에 노출하지 않는다. 나머지 68행은 검증 성공 시 게시 대상이다.

주소 칼럼에는 CSV 원본을 옮기되 영문 혼용(`서울 Mapo-daero 225`)·오타(`말리재로`→`만리재로`)를
정규화했다. `주소 미기재` 2행과 위 정규화 전부 검증 단계에서 재확인한다.
