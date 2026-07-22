# Places candidate pipeline (phase c) — 인허가 공공데이터 후보 생성기

Date: 2026-07-22
Status: user-approved (scope: generator + run + top-candidate curation through the publish gate; hardening follow-ups included)
Depends on: phase (b) (`2026-07-22-neighborhood-hubs-design.md`), branch `feat/neighborhood-hubs` (PR #16).

## 1. Goal

A repeatable candidate generator that enumerates licensed beauty businesses per Seoul district × category from 행정안전부 인허가 공공데이터, emits a human-reviewable candidate table, and NEVER writes to the DB. Then one curation sprint: verify top candidates per hub (5–8 each) and take them through the existing 2-JSON → seed → publish-gate flow. Targets: Gangnam & Cheongdam hair (`salon`), Hongdae nails (`nail_lash`), Myeongdong facials (`facial`).

## 2. Data source (verified 2026-07-22, adversarially)

- **Primary**: 행안부 생활_미용업 bulk CSV at `https://file.localdata.go.kr/file/download/beauty_salons/info` — **no account, no API key**; requires a `Referer` header (e.g. `https://www.data.go.kr/`) or the host 302s to an error page. Encoding is **CP949 despite a UTF-8 content-type header**; fields carry trailing spaces (strip everything). Updated daily; license "이용허락범위 제한 없음" (commercial reuse OK — permanent storage legal). Per-district variants exist (`?orgCode=` / `/file/download-all?orgCode=<code>_ALL`) — the exact per-district URL shape must be confirmed empirically at implementation; the fallback is streaming the nationwide file and filtering rows by 개방자치단체코드 (always filter by that column regardless, as defense). District codes: 마포구 3130000, 중구 3010000, 강남구 3220000.
- **Fallback** (document only, don't implement): 서울열린데이터광장 per-gu sheetView CSV (no account, KOGL-1).
- data.go.kr OpenAPI (needs serviceKey) is NOT used — bulk file wins on simplicity.

## 3. Category mapping (empirical values ≠ statute — verified against real extracts)

Match BOTH `업태구분명` and `위생업태명` (substring; 위생업태명 has comma-combined values like "피부미용업, 네일미용업" and legacy bare "미용업"):

| place_category | match tokens                          |
| -------------- | ------------------------------------- |
| salon          | 일반미용업, 종합미용업, (bare) 미용업 |
| nail_lash      | 네일아트업, 네일미용업                |
| facial         | 피부미용업, 두피관리업                |
| makeup         | 메이크업업, 화장ㆍ분장, 화장·분장     |

Statutory names (네일미용업/화장·분장 미용업) alone yield ~0 rows — the data uses 네일아트업/메이크업업. First matching rule (in table order) assigns the category; raw 업태구분명/위생업태명 are preserved in the output for review. On each district's first ingest, log `value_counts()` of 업태구분명 to catch unmapped values.

Known coverage gaps (confirmed): personal color and general massage are unlicensed (자유업) — absent from 인허가 data by construction; Myeongdong-style facial spas ARE captured as 피부미용업 (중구 영업중 ~168). 이용업 (barber) out of scope.

## 4. Generator design

New directory `data/places-pipeline/` (sibling of `beauty-pipeline`, same conventions: descriptive User-Agent, tests with fixtures, CLI, no side effects on the app). Python, deps: requests + pytest only (reuse beauty-pipeline's requirements pattern).

Flow per district: download (Referer header; cache raw CSV under `raw/`, git-ignored) → decode CP949 → strip all fields → keep 영업상태 open only (영업상태구분코드 `01` / 상세영업상태명 영업중 — confirm exact column at implementation; 폐업 rows outnumber open ones, e.g. 마포 3,111 closed vs 2,124 open) → category mapping (§3) → neighborhood filter by address substring on 도로명전체주소 with 지번 fallback:

- `gangnam-cheongdam` (3220000): 청담동, 압구정, 신사동
- `hongdae` (3130000): 서교동, 동교동, 합정동, 연남동, 상수동
- `myeongdong` (3010000): 명동, 충무로, 을지로

→ dedupe hint vs existing `data/adropofseoul_places.json` (normalized nameKr/address containment → `existing_slug` column) → emit `data/places-pipeline/csv/candidates_<district>.csv` (committed): 관리번호(key), 사업장명, category, 업태구분명, 위생업태명, 도로명주소, 지번주소, 전화, 인허가일자, 영업상태, hub, existing_slug, status=PENDING_REVIEW.

**Omitted by design**: coordinates (EPSG:5174/2097 ambiguity + ~6% nulls; the site stores no lat/lng — addresses and map deep links suffice), DB writes, scheduling.

## 5. Curation sprint

From the candidate tables, verify candidates per hub against official channels (site/Instagram) — same first-party-only rules as phases (a)/(b) — selecting 5–8 per hub that are (i) confirmed operating, (ii) have a live official channel, (iii) suit a foreign-visitor directory. Multi-agent fan-out is expected (candidate pools are 50–200/hub; loop until 5–8 confirmed each). Write 2-JSON entries (`verified: false`, `rating: null`, first-party editorial copy), regenerate the seed migration, then the standing **user publish gate** before any `verified: true` flip and DB push.

## 6. Hardening follow-ups (from phase (a)/(b) reviews)

- Extract `NeighborhoodDirectory`'s URL building into a pure helper (in `lib/taxonomy.ts`, e.g. `sectionDirectoryHref(neighborhood, section)`) + unit tests for the 4-case matrix (single/multi category × single/multi area).
- Doc comment on `listPlaces` noting `area`/`areas` are AND-ed if both passed (callers should pass one).
- Trim the three new hub ledes' metadata description overflow (>160 chars) — `generateMetadata` may truncate to ~155 chars at word boundary rather than rewriting copy.

## 7. Testing & verification

- Pipeline: pytest with a CP949 fixture built from the real header (sanitized rows) — decode/strip, status filter, category mapping (incl. comma-combined 위생업태명, legacy 미용업, unmapped→skip+log), neighborhood matching, dedupe hint, CSV shape. Live run counts reported per district×category.
- App: existing suites + typecheck + build; new helper tests.
- Curation entries: per-venue evidence recorded; publish only after the user gate.
