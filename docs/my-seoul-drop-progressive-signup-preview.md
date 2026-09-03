# My Seoul Drop — Progressive Signup Flow Preview

## 목적

My Seoul Drop에서 사용자가 회원가입 없이 장소와 콘텐츠를 자유롭게 탐색하다가, 즐겨찾기처럼 계정이 필요한 행동을 하는 순간 Google SSO를 안내하는 흐름을 클릭 가능한 미리보기로 구현한다.

이 문서는 **프로덕션 인증을 연결하기 전 UX 검토용 프론트엔드 프로토타입**을 만들기 위한 구현 스펙이다. 실제 Google OAuth, Supabase, 데이터베이스 저장, 전화번호 인증은 연결하지 않는다.

## 핵심 사용자 흐름

```text
비회원으로 장소 탐색
  → 장소 카드의 즐겨찾기 버튼 클릭
  → Google 로그인 안내
  → 데모 Google 로그인 성공
  → 선택형 최소 온보딩
  → 사용자가 원래 보던 장소 목록으로 복귀
  → 처음 눌렀던 장소가 자동으로 즐겨찾기 처리됨
  → 저장 완료 토스트 표시
```

가입 자체가 별도의 긴 여정처럼 느껴지지 않도록 한다. 사용자가 로그인 전에 시도했던 행동을 인증 후 자동으로 완료하는 것이 가장 중요한 요구사항이다.

## 미리보기 경로

프로젝트 라우팅 규칙에 맞춰 다음 중 하나에 만든다.

- 권장: `/preview/progressive-signup`
- 기존 preview 라우트 규칙이 있다면 해당 규칙을 따른다.

검색엔진에 노출되지 않도록 `noindex, nofollow` 메타데이터를 설정한다.

## 구현 범위

### 포함

- My Seoul Drop의 현재 헤더, 색상, 타이포그래피, 버튼, 카드 컴포넌트 재사용
- 비회원 상태의 장소 탐색 화면
- 즐겨찾기 버튼
- 로그인 유도 모달 또는 모바일 bottom sheet
- 데모용 Google 로그인 버튼
- 한 화면으로 구성된 선택형 온보딩
- pending favorite 자동 처리
- 저장 완료 토스트
- 데스크톱 및 모바일 반응형
- 키보드 조작과 기본 접근성

### 제외

- 실제 Google OAuth redirect
- Supabase Auth 연결
- 실제 사용자 또는 프로필 레코드 생성
- 데이터베이스 favorite 저장
- 전화번호 입력 및 인증
- 이메일/비밀번호 가입
- 이메일 마케팅 동의
- 실제 analytics 전송

## 화면 1 — 비회원 탐색

My Seoul Drop의 실제 장소 목록 또는 홈 화면과 최대한 같은 UI를 사용한다. 별도의 마케팅 랜딩 페이지를 새로 디자인하지 않는다.

### 필수 요소

- 사용자가 비회원임을 은은하게 알리는 표시
  - 예: `Browsing as a guest`
- 3개 이상의 장소 카드
- 각 카드의 즐겨찾기 버튼
- 첫 번째 장소의 즐겨찾기 버튼은 전체 데모 흐름을 시작
- 나머지 카드도 가능하면 동일하게 동작하도록 구현

### 샘플 장소

실제 seed 또는 mock 데이터가 있다면 그것을 우선 사용한다. 없다면 아래 데이터를 사용한다.

| Area    | Name                 | Type              |
| ------- | -------------------- | ----------------- |
| Seongsu | Amore Seongsu        | Beauty flagship   |
| Hannam  | Jung Saem Mool Plops | Makeup & café     |
| Gangnam | Toun28 Dosan         | Skincare flagship |

### 동작

비회원이 하트를 누르면 해당 장소 ID 또는 slug를 `pendingFavorite` 상태에 보존하고 로그인 안내를 연다.

로그인 안내를 닫으면 현재 페이지와 스크롤 위치를 유지한다. 장소가 저장된 것처럼 잘못 표시하지 않는다.

## 화면 2 — Google 로그인 안내

데스크톱에서는 중앙 모달, 모바일에서는 화면 하단에서 올라오는 bottom sheet로 표시한다.

### 권장 문구

Eyebrow:

> KEEP THIS PLACE

Title:

> Save your Seoul finds.

Body:

> Sign in once to save {placeName} and find it later on any device.

Primary button:

> Continue with Google

Legal copy:

> By continuing, you agree to the Terms of Service and Privacy Policy.

`Terms of Service`와 `Privacy Policy`는 프로젝트의 실제 페이지로 연결한다.

### 동작

- `Continue with Google`은 실제 OAuth 대신 짧은 loading 상태를 거친 뒤 로그인 성공으로 처리한다.
- 중복 이름·이메일·비밀번호 폼은 표시하지 않는다.
- 닫기 버튼, `Escape`, backdrop 클릭 중 프로젝트의 기존 modal 규칙과 맞는 방식을 지원한다.
- Google 버튼에는 Google 아이콘을 사용하되, 공식 브랜드 가이드와 기존 프로젝트 자산을 우선한다.

## 화면 3 — 최소 온보딩

로그인 성공 직후 한 화면에서 두 질문만 보여준다. 모든 질문은 선택 사항이며 언제든 건너뛸 수 있다.

### 헤더

Eyebrow:

> OPTIONAL · ABOUT 20 SECONDS

Title:

> Make it yours.

Body:

> We’ll use this to put the most useful Seoul picks first.

Secondary action:

> Skip

### 질문 1

Label:

> Where are you in your Seoul journey?

단일 선택:

- `I’m in Seoul now`
- `I’m planning a trip`
- `I live in Seoul`
- `Just exploring`

기본 선택값을 강제로 지정하지 않는다. 사용자가 선택하지 않고 완료할 수 있어야 한다.

### 질문 2

Label:

> What are you interested in?

복수 선택 chip:

- `K-beauty shopping`
- `Skin clinics`
- `Hair salons`
- `Nails & lashes`
- `Personal color`
- `Head spa & scalp care`
- `Malls, gifts & souvenirs`

선택 chip에는 명확한 selected 상태를 제공한다. 체크 표시와 색상 변화를 함께 사용해 색상에만 의존하지 않는다.

### Primary action

> Personalize my Seoul Drop

아무 항목도 선택하지 않은 상태에서도 버튼을 누를 수 있다.

### 이 화면에서 묻지 않는 항목

- 이름
- 이메일
- 비밀번호와 비밀번호 확인
- 출신 국가 또는 거주 국가
- 나이
- 성별
- 전화번호
- 피부 타입
- 헤어 타입
- 예산

피부 타입, 헤어 타입, 예산 등의 상세 정보는 가입 후 My 탭의 점진적 프로필 완성 흐름에서 받는다.

## 화면 4 — 원래 행동 자동 완료

사용자가 `Skip` 또는 `Personalize my Seoul Drop`을 누르면 다음 순서로 처리한다.

1. 온보딩 UI 닫기
2. 사용자가 로그인 전에 보고 있던 탐색 화면 유지 또는 복귀
3. `pendingFavorite`에 저장된 장소를 즐겨찾기 상태로 변경
4. 하트의 selected 상태 표시
5. 토스트 표시
6. `pendingFavorite` 제거

토스트 문구:

> **{placeName} saved.**  
> Added to My Seoul Drop

토스트는 약 3초 후 자동으로 사라지고 수동 닫기도 가능하게 한다. `aria-live="polite"`를 적용한다.

## 프로토타입 상태 모델

구현 프레임워크와 프로젝트 패턴에 맞추되, 최소한 다음 상태를 표현한다.

```ts
type PreviewStep = "browsing" | "signing-in" | "onboarding" | "saved";

type PreviewState = {
  step: PreviewStep;
  isAuthenticated: boolean;
  pendingFavorite: string | null;
  favorites: string[];
  seoulJourney: string | null;
  interests: string[];
};
```

페이지 새로고침 후 상태 유지까지는 필요하지 않다. 기존 프로젝트의 auth provider를 오염시키지 않도록 실제 세션 대신 preview component 내부 상태를 사용한다.

## 디자인 원칙

- My Seoul Drop의 기존 디자인 시스템을 우선하고 새로운 브랜드 스타일을 만들지 않는다.
- 기존 `Modal`, `BottomSheet`, `Button`, `Chip`, `PlaceCard`, `Toast`가 있으면 반드시 재사용한다.
- 가입 요구보다 `장소를 안전하게 저장한다`는 사용자 효용을 먼저 말한다.
- 화면당 primary action은 하나만 둔다.
- 온보딩은 가입의 필수 조건처럼 보이지 않아야 한다.
- 전화번호 `Coming soon` 화면은 포함하지 않는다.
- 별도의 stepper 또는 `Step 1 / Step 2 / Step 3` 표시는 사용하지 않는다.

## 반응형 요구사항

### Mobile

- 로그인과 온보딩은 bottom sheet 또는 거의 전체 높이 sheet
- safe-area inset 고려
- 선택 chip은 자연스럽게 wrap
- primary button은 한 손으로 누르기 쉬운 하단 위치
- 작은 화면에서 내용이 길면 sheet 내부만 스크롤

### Desktop

- 로그인 모달 최대 너비 약 `420–460px`
- 온보딩 모달 최대 너비 약 `600–680px`
- backdrop으로 탐색 맥락은 보이되 콘텐츠 집중을 방해하지 않게 처리

## 접근성 요구사항

- 즐겨찾기 버튼에 장소명이 포함된 accessible name 제공
  - 예: `Save Amore Seongsu`, 저장 후 `Remove Amore Seongsu from saved places`
- modal에 적절한 dialog role, title 연결, focus trap 적용
- modal이 열리면 첫 의미 있는 요소로 focus 이동
- modal을 닫으면 원래 즐겨찾기 버튼으로 focus 복귀
- 모든 동작은 키보드로 가능
- 선택 chip에 `aria-pressed` 사용
- loading 중 Google 버튼 비활성화 및 상태 문구 제공
- 토스트에 `aria-live="polite"`
- `prefers-reduced-motion` 존중

## 데모용 analytics 표시

실제 analytics를 전송하지 말고 개발 환경 console 또는 화면 하단의 접을 수 있는 debug panel로 다음 이벤트 payload를 확인할 수 있게 해도 된다.

```text
favorite_clicked_as_guest
signup_prompt_viewed
google_signin_demo_started
google_signin_demo_completed
onboarding_skipped
onboarding_completed
pending_favorite_completed
```

이벤트에는 가능한 경우 `placeId`, `source`, `selectedInterestCount`만 포함한다. 이름이나 이메일 등 PII는 포함하지 않는다.

## 완료 조건

- [ ] 로그아웃 상태에서 장소를 탐색할 수 있다.
- [ ] 비회원이 하트를 누르면 로그인 안내가 열린다.
- [ ] 로그인 안내에 클릭한 장소명이 표시된다.
- [ ] 로그인 안내를 닫아도 현재 탐색 상태가 유지된다.
- [ ] 데모 Google 로그인을 누르면 최소 온보딩으로 이동한다.
- [ ] 온보딩은 두 질문만 포함한다.
- [ ] 두 질문 모두 응답하지 않아도 완료할 수 있다.
- [ ] `Skip`이 항상 보인다.
- [ ] 완료 또는 Skip 후 원래 장소가 자동 저장된다.
- [ ] 저장된 하트와 완료 토스트가 표시된다.
- [ ] 데스크톱과 모바일에서 레이아웃이 깨지지 않는다.
- [ ] 실제 인증, DB, 사용자 데이터에는 영향을 주지 않는다.
- [ ] TypeScript, lint, 기존 테스트가 통과한다.
- [ ] preview route가 `noindex, nofollow`로 설정된다.

## 검토할 질문

미리보기를 실행한 뒤 아래 항목을 중심으로 UX를 평가한다.

1. 하트를 누른 뒤 가입 안내가 자연스러운가?
2. 로그인해야 얻는 이점이 즉시 이해되는가?
3. Google 로그인 이후 온보딩이 가입을 방해하는 느낌은 없는가?
4. `Skip`과 완료 버튼의 위계가 적절한가?
5. 처음 누른 장소가 자동 저장됐다는 사실이 명확한가?
6. 모바일에서 sheet의 높이와 버튼 위치가 편안한가?

## 프로덕션 연결 시 후속 작업

이 미리보기 승인 후 별도 작업으로 진행한다.

- Google OAuth 및 auth callback 연결
- OAuth 전 `returnTo`와 pending action 보존
- 신규 사용자에게만 선택형 온보딩 노출
- 기존 사용자는 인증 직후 pending action을 바로 완료
- favorite DB 저장과 optimistic update
- 온보딩 profile upsert
- OAuth 실패·취소·네트워크 오류 처리
- RLS와 사용자 데이터 접근 정책 검증
- 실제 analytics 이벤트 연결
- 가입/탈퇴/개인정보 삭제 정책 검증
