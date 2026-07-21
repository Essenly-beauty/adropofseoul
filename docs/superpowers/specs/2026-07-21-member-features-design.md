# 회원 기능 기획: 즐겨찾기 · 마이페이지 지도/경로 · 뷰티 프로필 · 공유

날짜: 2026-07-21
상태: 초안 (사용자 리뷰 대기)
범위: Google SSO 로그인, 장소 즐겨찾기, 마이페이지 지도 + 최적 경로, 스킨/헤어케어 프로필 온보딩, 장소 공유

---

## 0. 총평 (가능성 검토 결론)

**5개 기능 모두 현재 스택(Next.js 14 App Router + Supabase + Vercel)으로 구현 가능.** 외부 유료 서비스 없이도 MVP가 가능하다. 단, 착수 전 반드시 해결해야 할 전제조건이 2개 있다.

| 기능              | 가능성         | 난이도 | 블로커                                      |
| ----------------- | -------------- | ------ | ------------------------------------------- |
| Google SSO 로그인 | ✅             | 하     | **RLS 보안 개편 선행 필수**                 |
| 장소 즐겨찾기     | ✅             | 하     | SSO 선행                                    |
| 마이페이지 지도   | ✅             | 중     | **places에 좌표(lat/lng) 없음 → 백필 필요** |
| 최적 경로         | ✅ (제약 있음) | 중     | 한국에서 Google Maps 자동차 경로 미지원     |
| 공유 기능         | ✅             | 최하   | 없음 (OG 메타 인프라 이미 완비)             |

---

## 1. 전제조건 (Phase 0 — 반드시 선행)

### 1-1. RLS 보안 개편 (치명적)

`supabase/migrations/0002_rls.sql`의 쓰기 정책이 전부 `for all to authenticated using (true)`다. 지금은 이메일 가입이 막혀 있어 "authenticated = 관리자"가 성립하지만, **Google provider를 켜는 순간 아무나 로그인해서 places/posts/products/media를 수정·삭제할 수 있다.**

개편안 (권장): `app_metadata.role = 'admin'` 클레임 기반

- 관리자 계정의 `app_metadata`에 `role: admin`을 수동 세팅 (Supabase 대시보드 또는 service role API)
- 정책을 `using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')`으로 교체
- `app_metadata`는 사용자가 스스로 수정 불가하므로 안전
- 기존 앱 레이어 가드(`ADMIN_EMAILS` + middleware)는 그대로 유지 (이중 방어)

대안: admin 이메일 테이블 + security definer 함수. 클레임 방식보다 관리 유연하지만 조인 비용·복잡도 증가. 관리자가 1~2명인 현 단계에선 클레임 방식이 낫다.

### 1-2. 개인정보처리방침 / 이용약관 페이지

Google SSO(이메일·이름 수집) + 뷰티 프로필(피부·모발 정보 = 민감 성향 데이터) + 향후 AdSense까지 고려하면 `/privacy`, `/terms` 정적 페이지가 필요하다. Google OAuth 동의 화면 심사에도 privacy policy URL이 필수다.

### 1-3. Supabase 요금제 검토 (운영 리스크)

Free tier는 미사용 시 DB가 auto-pause되어 로그인·즐겨찾기가 통째로 죽는다. 회원 기능 오픈 시점에는 Pro 전환(월 $25)을 권장. (지금 데이터 페이지 500 에러의 원인이기도 했음)

---

## 2. Google SSO 로그인

### 설계

- Supabase Auth Google provider 활성화 + Google Cloud Console OAuth 클라이언트 생성 (redirect: `https://<project>.supabase.co/auth/v1/callback`)
- `app/auth/callback/route.ts` 신설 — `exchangeCodeForSession` 처리 후 원래 페이지로 복귀
- 헤더에 로그인 버튼 / 로그인 후 아바타 드롭다운(마이페이지·로그아웃)
- 로그인 트리거 UX: 즐겨찾기 하트 클릭 시 비로그인 상태면 로그인 유도 모달 ("Save your favorite places") — 기능 맥락에서 로그인시키는 게 전환율이 가장 높음
- 기존 admin 로그인(email/password)은 그대로 별도 유지

### 데이터

- `profiles` 테이블: `id (= auth.users.id)`, `display_name`, `avatar_url`, `created_at` + auth.users insert 트리거로 자동 생성
- RLS: 본인 row만 select/update (`auth.uid() = id`)

공수: 1.5~2일 (RLS 개편 제외)

---

## 3. 장소 즐겨찾기

### 설계

- `favorites` 테이블: `user_id`, `place_id`, `created_at`, `unique(user_id, place_id)`
- RLS: `auth.uid() = user_id`로 select/insert/delete 전부 제한
- UI: 장소 카드 + 상세 페이지에 하트 버튼 (클라이언트 컴포넌트, 낙관적 업데이트, Server Action으로 토글)
- 마이페이지 `/me/favorites`: 즐겨찾기 리스트 (기존 editorial 카드 재사용) — 지도 뷰는 Phase 3

공수: 1~1.5일

---

## 4. 마이페이지 지도 + 최적 경로

### 4-1. 좌표 데이터 백필 (선행)

- `places`에 `latitude`, `longitude` 컬럼 추가
- 백필 방법: 장소 수가 수십 개 수준이므로 **스크립트 반자동 + 관리자 확인**이 현실적
  - Google Geocoding API(월 무료 크레딧 내) 또는 Nominatim(무료)으로 1차 지오코딩 → admin places 폼에 좌표 필드 추가해 검수·수정
- 신규 장소 등록 플로우에도 좌표 입력 추가

### 4-2. 지도 렌더링

**권장: Leaflet(react-leaflet) + CARTO 타일** — 무료, API 키 불필요, 이미 `public/seongsu_map.html`에서 검증된 조합이라 디자인 톤 일관성 유지. 이번엔 iframe이 아닌 정식 npm 의존성으로 도입 (마이페이지는 dynamic import로 번들 영향 최소화).

대안 비교:

- Google Maps JS API: 익숙한 UX지만 유료(월 크레딧 존재) + 한국 지도 데이터 디테일이 오히려 떨어짐
- Kakao/Naver 지도 SDK: 국내 데이터 최상이지만 영어 라벨·해외 사용자 UX가 약하고 키 발급·약관 부담

### 4-3. 최적 경로

- **경로 순서 최적화는 앱 내에서, 실제 내비게이션은 딥링크로 넘기는 2단 구조** (권장)
  1. 즐겨찾기 중 오늘 방문할 장소 선택 (2~10곳)
  2. 클라이언트에서 하버사인 거리 기반 nearest-neighbor + 2-opt로 방문 순서 계산 (N이 작아 순수 JS로 충분, 외부 API 불필요, 무료)
  3. 지도에 번호 매긴 핀 + 순서 리스트 표시
  4. "Open in Google Maps" 버튼 → `google.com/maps/dir/?api=1&waypoints=...` 딥링크로 구간별 안내 이양
- **제약(중요)**: 한국에서 Google Maps는 자동차 경로를 제공하지 않음 → 도보·대중교통 중심 안내. 타깃(외국인 관광객)의 실제 이동 수단과 일치하므로 실용상 문제 없음. UI에 "walking & transit" 명시.
- 실거리 기반 정밀 경로(대중교통 소요시간 반영)는 유료 API(Google Routes 등) 필요 → YAGNI, 직선거리 순서 최적화로 시작

공수: 좌표 백필 1일 + 지도 뷰 1.5일 + 경로 1.5일 ≈ 4일

---

## 5. 뷰티 프로필 온보딩 (스킨/헤어케어 질문)

### 목적

- 향후 제품 추천 + Essenly 퍼널용 1st-party 데이터 축적
- 기존 뷰티 파이프라인 택소노미(`data/beauty-pipeline/csv/`의 `skin_types.csv`, `concerns.csv` 등)와 값을 맞춰 나중에 제품 매칭이 바로 가능하도록 설계

### 설계

- 첫 로그인 직후 2단계 위저드 (반드시 **skippable** — 로그인 목적이 즐겨찾기인 사용자를 막으면 안 됨), 마이페이지에서 언제든 수정
- 질문 구성 (5~7문항, 각 단계 30초 이내):
  - Step 1 스킨케어: 피부 타입(지성/건성/복합성/민감성...), 주요 고민(최대 3개: 여드름, 미백, 주름, 모공...), 현재 루틴 단계 수(선택)
  - Step 2 헤어케어: 모발 타입(직모/곱슬, 굵기), 두피 타입, 주요 고민(탈모, 손상, 비듬...)
- 저장: `profiles`에 typed 컬럼(`skin_type`, `hair_type`) + `beauty_answers jsonb` (질문 추가/변경에 유연)
- 답변 값은 택소노미 slug와 1:1 매핑 → 추천 엔진 붙일 때 조인만 하면 됨

공수: 2~2.5일

---

## 6. 장소 공유 기능

### 설계

- `SharePlace` 클라이언트 컴포넌트 (장소 상세 + 카드 hover)
- 모바일: `navigator.share` (네이티브 공유 시트 — 사용자가 쓰는 모든 앱 커버)
- 데스크톱/폴백: 팝오버에 채널 버튼 나열
- 공유 URL에 `?utm_source=share&utm_medium=<channel>` 부착 → GA에서 채널별 유입 측정 (canonical은 이미 설정돼 있어 SEO 영향 없음)
- OG 메타는 장소별로 이미 완비 (`app/places/[slug]/page.tsx`) → 추가 작업 없음

### 채널 구성 (우선순위 순)

요청된 채널: 링크 복사, WhatsApp, Threads, X(트위터), Facebook — 전부 URL 스킴만으로 구현 가능 (SDK 불필요).

**추가 권장 채널** (영어권 K-뷰티·서울 여행 미디어 + AdSense 트래픽 목적 기준):

1. **Pinterest** — 최우선 추가. 뷰티·여행 "저장형" 플랫폼이라 핀 하나가 수년간 검색 유입을 만드는 evergreen 트래픽 소스. AdSense 목적과 가장 부합. 장소별 OG 이미지가 이미 있어 바로 활용 가능.
2. **Reddit** — r/AsianBeauty(수십만), r/koreatravel 등 타깃 커뮤니티가 정확히 존재. 커뮤니티발 트래픽 + 백링크.
3. **LINE** — 서울 방문객 상위 국가인 일본·대만·태국의 기본 메신저. "친구에게 장소 공유" 시나리오에 정확히 부합.
4. **Telegram** — 여행 그룹챗 문화권(유럽·동남아·러시아어권) 커버.
5. **Email (mailto)** — 여행 계획은 여전히 이메일로 공유되는 경우 많음. 구현 비용 0.

- 제외 권장: KakaoTalk(타깃이 국내 사용자 아님 + SDK/키 발급 부담), Instagram(URL 공유 스킴 미지원 — 네이티브 공유 시트로만 커버됨)

UI는 상위 4~5개만 노출 + "More" 로 나머지. 채널별 클릭 수 측정 후 3개월 뒤 순서 재조정.

공수: 0.5~1일

---

## 7. 신규 데이터 모델 요약

```sql
-- profiles: auth.users 1:1
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  skin_type text,
  hair_type text,
  beauty_answers jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- favorites
create table favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

-- places 확장
alter table places add column latitude double precision;
alter table places add column longitude double precision;
```

RLS: profiles/favorites 모두 `auth.uid()` 본인 row 한정. 기존 콘텐츠 테이블은 admin 클레임 기반으로 교체(§1-1).

---

## 8. 단계별 로드맵

| Phase | 내용                                                  | 공수(대략) | 비고                                        |
| ----- | ----------------------------------------------------- | ---------- | ------------------------------------------- |
| **0** | RLS 개편 + privacy/terms 페이지 + Supabase Pro 검토   | 1.5~2일    | **SSO 오픈 전 필수**                        |
| **1** | 공유 버튼 (전 채널 + UTM)                             | 0.5~1일    | 로그인 불필요, 즉시 트래픽 가치 → 가장 먼저 |
| **2** | Google SSO + profiles + 즐겨찾기 + 마이페이지(리스트) | 3~4일      | 회원 기능의 코어                            |
| **3** | 좌표 백필 + 마이페이지 지도 뷰                        | 2.5일      | Leaflet 도입                                |
| **4** | 최적 경로 + 뷰티 프로필 온보딩                        | 4~5일      | 독립적이라 순서 교체 가능                   |

총 12~15일 (1인 기준). Phase 1은 나머지와 완전히 독립적이므로 오늘이라도 착수 가능.

---

## 9. 열린 결정사항 (사용자 확인 필요)

1. **지도 라이브러리**: Leaflet+CARTO(무료, 권장) vs Google Maps JS(유료·익숙한 UX) — 문서는 Leaflet 기준으로 작성됨
2. **Supabase Pro 전환 시점**: Phase 2 오픈과 동시 권장
3. **온보딩 노출 시점**: 첫 로그인 직후(권장) vs 마이페이지에서만 제공
4. **Phase 4 내 우선순위**: 최적 경로 먼저 vs 프로필 온보딩 먼저 (Essenly 데이터 축적이 급하면 프로필 먼저)
