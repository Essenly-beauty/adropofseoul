# Seoul Attractions → Places 디렉터리 확장 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 외부 CSV의 서울 전망대·시장·쇼핑몰·스파 71곳을 `places` 디렉터리에 시딩하고, `place_category`에 `observatory`/`market`/`mall`을 신설해 디렉터리를 K-뷰티 전용에서 "서울 여행 + 뷰티"로 넓힌다.

**Architecture:** 기존 시딩 경로를 그대로 쓴다 — `data/adropofseoul_places.json`(기계 필드) + `data/places-curation.en.json`(영문 편집 레이어)를 `scripts/seed-places.mjs`가 slug로 조인해 upsert SQL을 생성한다. 새로 만드는 것은 CSV → 기계 필드 변환기 하나(`scripts/import-places-csv.mjs`)뿐이고, 편집 산문은 사람이 쓴다. DB 변경은 additive 마이그레이션 2개(enum 추가 / seed upsert)이며 대시보드에서 수동 적용한다.

**Tech Stack:** Node 20 ESM(`.mjs`) · vitest · Supabase Postgres · Next.js 14 App Router · TypeScript 5

## Global Constraints

- **설계 문서:** `docs/superpowers/specs/2026-07-31-seoul-attractions-places-design.md`. 부록 A가 71행 매핑의 정본이다.
- **`supabase db push` 금지.** `CLAUDE.md`의 history drift 경고 — 마이그레이션은 Supabase 대시보드 SQL 에디터에서 수동 실행하고 `supabase migration repair --status applied <version>`으로 기록만 맞춘다.
- **타인의 리뷰 텍스트를 인용·번역·재게시하지 않는다.** 평점·리뷰수는 `rating`/`review_count` 숫자 필드로만 저장하고 산문은 전부 자체 작성한다.
- **디자인 토큰 신설 금지.** `accent`(#B78B62) · `soft-gray` · `porcelain` · `text` / `text-muted` · `max-w-content` 등 `tailwind.config.ts`의 기존 토큰만 쓴다.
- **커밋마다** `npm run typecheck` · `npm run test` · `npm run lint` 그린 유지. pre-commit이 Prettier + ESLint를 돌린다.
- **브랜드명 구분:** A Drop of Seoul(퍼블리케이션) / My Seoul Drop(개인 저장) / adropof(제품 브랜드) / Essenly Inc.(회사). 코드·카피에서 섞지 않는다.
- 작업 브랜치: `feat/places-seoul-attractions` (이미 생성됨, 스펙 3커밋 존재).

---

## File Structure

| 파일                                                      | 책임                                         | 신규/수정 |
| --------------------------------------------------------- | -------------------------------------------- | --------- |
| `supabase/migrations/<ts>_place_category_attractions.sql` | enum 값 3개 추가                             | 신규      |
| `supabase/migrations/<ts>_seed_seoul_attractions.sql`     | 71행 upsert (생성물)                         | 신규      |
| `lib/taxonomy.ts`                                         | 신규 카테고리 라벨·이모지                    | 수정      |
| `lib/taxonomy.test.ts`                                    | 라벨·이모지 완전성 테스트                    | 수정      |
| `app/seoul/page.tsx`                                      | 진입점 카드 6 → 9                            | 수정      |
| `app/seoul/places/page.tsx`                               | `limit` 200 → 300                            | 수정      |
| `data/places-import/seoul-attractions-2026-07.csv`        | 원본 CSV (재현용)                            | 신규      |
| `scripts/import-places-csv.mjs`                           | CSV → 기계 필드 변환. 순수 함수 export + CLI | 신규      |
| `scripts/import-places-csv.test.mjs`                      | 변환기 테스트                                | 신규      |
| `data/adropofseoul_places.json`                           | 기계 필드 138 → 209행                        | 수정      |
| `data/places-curation.en.json`                            | 영문 편집 레이어 134 → 205항목               | 수정      |

변환기를 한 파일에 두되 순수 함수를 export하고 CLI 실행은 가드로 감싼다 — 테스트가 부작용 없이 import할 수 있어야 한다.

---

## Task 1: taxonomy 배선 + enum 마이그레이션 파일

신규 enum 값을 UI가 인식하게 만들고 마이그레이션 파일을 만든다. 아직 데이터가 없으므로 이 태스크만으로는 화면 변화가 없지만, 라벨 맵이 비어 있으면 나중에 카테고리가 raw enum 문자열(`observatory`)로 노출된다.

**Files:**

- Create: `supabase/migrations/20260731090000_place_category_attractions.sql`
- Modify: `lib/taxonomy.ts` (`PLACE_TYPE_LABELS` ~322행, `PLACE_TYPE_EMOJI` ~341행)
- Modify: `app/seoul/page.tsx:17-24` (`PLACE_TYPES`)
- Modify: `app/seoul/places/page.tsx:34` (`limit: 200`)
- Test: `lib/taxonomy.test.ts`

**Interfaces:**

- Consumes: 없음 (첫 태스크)
- Produces: `PLACE_TYPE_LABELS` / `PLACE_TYPE_EMOJI`에 `observatory` · `market` · `mall` 키. Task 10의 seed SQL이 이 enum 값을 쓴다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`lib/taxonomy.test.ts` 파일 끝에 추가:

```ts
import { PLACE_TYPE_LABELS, PLACE_TYPE_EMOJI } from "./taxonomy";

describe("place categories — Seoul attractions", () => {
  const ATTRACTION_CATEGORIES = ["observatory", "market", "mall"] as const;

  it.each(ATTRACTION_CATEGORIES)("has a reader-facing label for %s", (cat) => {
    expect(PLACE_TYPE_LABELS[cat]).toBeTruthy();
    expect(PLACE_TYPE_LABELS[cat]).not.toBe(cat);
  });

  it.each(ATTRACTION_CATEGORIES)("has a card glyph for %s", (cat) => {
    expect(PLACE_TYPE_EMOJI[cat]).toBeTruthy();
  });

  it("keeps labels and glyphs in sync — every label has a glyph", () => {
    for (const key of Object.keys(PLACE_TYPE_LABELS)) {
      expect(PLACE_TYPE_EMOJI[key], `missing glyph for ${key}`).toBeTruthy();
    }
  });
});
```

`lib/taxonomy.test.ts`에 이미 import가 있으면 중복 import 줄은 넣지 말고 기존 import에 이름만 추가한다.

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npx vitest run lib/taxonomy.test.ts`
Expected: FAIL — `expected undefined to be truthy` (observatory 라벨 없음)

- [ ] **Step 3: 라벨과 이모지를 추가한다**

`lib/taxonomy.ts`의 `PLACE_TYPE_LABELS` 객체 마지막 항목(`food_tour: "Food Tour",`) 뒤에 추가:

```ts
  observatory: "Observatory & Tower",
  market: "Market",
  mall: "Shopping Mall",
```

`PLACE_TYPE_EMOJI` 객체 마지막 항목(`food_tour: "🥢",`) 뒤에 추가:

```ts
  observatory: "🔭",
  market: "🏮",
  mall: "🛒",
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npx vitest run lib/taxonomy.test.ts`
Expected: PASS

- [ ] **Step 5: `/seoul` 진입점 카드를 3개 추가한다**

`app/seoul/page.tsx`의 `PLACE_TYPES` 배열 마지막 항목 뒤에 추가:

```ts
  { type: "observatory", label: "Observatories", cat: "observatory" },
  { type: "market", label: "Markets", cat: "market" },
  { type: "mall", label: "Shopping Malls", cat: "mall" },
```

6개 → 9개가 되어 `lg:grid-cols-3` 그리드에서 3행이 꽉 찬다.

- [ ] **Step 6: 디렉터리 조회 상한을 올린다**

`app/seoul/places/page.tsx:34`:

```ts
places = await listPlaces({ limit: 300 });
```

138 + 71 = 209행이라 현재 상한 200을 넘으면 조용히 잘린다.

- [ ] **Step 7: enum 마이그레이션 파일을 만든다**

`supabase/migrations/20260731090000_place_category_attractions.sql`:

```sql
-- Seoul attractions: 전망대/시장/쇼핑몰을 places 디렉터리에 담기 위한 카테고리 확장.
-- Additive only — 기존 값은 건드리지 않는다.
-- 적용: Supabase 대시보드 SQL 에디터에서 1회 실행 후
--       supabase migration repair --status applied 20260731090000
-- 주의: Postgres는 같은 트랜잭션에서 추가한 enum 값을 즉시 쓸 수 없다.
--       이 파일과 seed 파일은 반드시 별도 실행해야 한다.
alter type place_category add value if not exists 'observatory';
alter type place_category add value if not exists 'market';
alter type place_category add value if not exists 'mall';
```

- [ ] **Step 8: 전체 검증**

Run: `npm run typecheck && npm run test && npm run lint`
Expected: 3개 모두 통과

- [ ] **Step 9: 커밋**

```bash
git add lib/taxonomy.ts lib/taxonomy.test.ts app/seoul/page.tsx app/seoul/places/page.tsx supabase/migrations/20260731090000_place_category_attractions.sql
git commit -m "feat(places): observatory/market/mall 카테고리 배선 + enum 마이그레이션"
```

---

## Task 2: 원본 CSV 커밋 + CSV 파싱·컬럼 스왑 교정

CSV를 리포에 넣고 변환기의 첫 두 함수를 TDD로 만든다. 스파/웰니스 480행은 `지역`↔`주소`가 뒤바뀌어 있어 이 교정이 나머지 전부의 전제다.

**Files:**

- Create: `data/places-import/seoul-attractions-2026-07.csv`
- Create: `scripts/import-places-csv.mjs`
- Create: `scripts/import-places-csv.test.mjs`

**Interfaces:**

- Consumes: 없음
- Produces:
  - `parseCsv(text: string) => Array<Record<string,string>>` — BOM 제거, 따옴표 안 콤마·개행 처리
  - `fixSpaColumnSwap(row) => row` — `카테고리`가 `스파/`로 시작하면 `지역`↔`주소` 교환, 아니면 원본 그대로
  - `isUsable(row) => boolean` — `주소`·`About`이 모두 실값(빈칸/`정보 부족`/`-` 아님)

- [ ] **Step 1: 원본 CSV를 리포로 복사한다**

```bash
mkdir -p data/places-import
cp ~/Downloads/a_drop_of_seoul_places_전망대_시장_쇼핑몰_스파웰니스.csv \
   data/places-import/seoul-attractions-2026-07.csv
wc -l data/places-import/seoul-attractions-2026-07.csv
```

Expected: `644` — `wc -l`은 개행 수를 센다. 파일은 645줄(헤더 1 + 데이터 644)이고 마지막 줄에 개행이 없다.

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`scripts/import-places-csv.test.mjs`:

```js
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseCsv, fixSpaColumnSwap, isUsable } from "./import-places-csv.mjs";

const CSV = readFileSync(
  "data/places-import/seoul-attractions-2026-07.csv",
  "utf8"
);

describe("parseCsv", () => {
  it("strips the BOM from the first header", () => {
    const rows = parseCsv(CSV);
    expect(Object.keys(rows[0])[0]).toBe("카테고리");
  });

  it("reads every data row", () => {
    expect(parseCsv(CSV)).toHaveLength(644);
  });

  it("keeps commas inside quoted fields together", () => {
    const rows = parseCsv('a,b\n"x,y",z');
    expect(rows[0]).toEqual({ a: "x,y", b: "z" });
  });
});

describe("fixSpaColumnSwap", () => {
  it("swaps 지역 and 주소 for the 스파/웰니스 block", () => {
    const raw = {
      카테고리: "스파/웰니스",
      지역: "서울 강남구 선릉로132길 13 J&C빌딩 4층",
      주소: "강남구",
    };
    expect(fixSpaColumnSwap(raw)).toMatchObject({
      지역: "강남구",
      주소: "서울 강남구 선릉로132길 13 J&C빌딩 4층",
    });
  });

  it("leaves the other three categories untouched", () => {
    const raw = {
      카테고리: "전망대 & 타워",
      지역: "용산구",
      주소: "서울 용산구 남산공원길 105",
    };
    expect(fixSpaColumnSwap(raw)).toEqual(raw);
  });
});

describe("isUsable", () => {
  it.each([
    [
      { 주소: "서울 용산구 남산공원길 105", About: "남산 정상의 랜드마크" },
      true,
    ],
    [{ 주소: "정보 부족", About: "정보 부족" }, false],
    [{ 주소: "-", About: "설명" }, false],
    [{ 주소: "", About: "설명" }, false],
  ])("%o → %s", (row, expected) => {
    expect(isUsable(row)).toBe(expected);
  });

  it("finds exactly 72 usable rows in the real CSV", () => {
    const rows = parseCsv(CSV).map(fixSpaColumnSwap).filter(isUsable);
    expect(rows).toHaveLength(72);
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `npx vitest run scripts/import-places-csv.test.mjs`
Expected: FAIL — `Failed to resolve import "./import-places-csv.mjs"`

- [ ] **Step 4: 최소 구현을 쓴다**

`scripts/import-places-csv.mjs`:

```js
// data/places-import/seoul-attractions-2026-07.csv → data/adropofseoul_places.json 기계 필드.
// 편집 산문은 만들지 않는다 — 영문 레이어는 data/places-curation.en.json에 사람이 쓴다.
// 설계: docs/superpowers/specs/2026-07-31-seoul-attractions-places-design.md
//
// Usage:
//   node scripts/import-places-csv.mjs --dry-run   변환 결과만 출력
//   node scripts/import-places-csv.mjs             adropofseoul_places.json에 append

/** RFC4180 최소 파서 — 따옴표 안의 콤마·개행·이스케이프된 따옴표를 처리한다. */
export function parseCsv(text) {
  const src = text.replace(/^﻿/, "");
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((cells) =>
    Object.fromEntries(
      header.map((h, i) => [h.trim(), (cells[i] ?? "").trim()])
    )
  );
}

/** 스파/웰니스 블록만 지역↔주소가 뒤바뀌어 있다 (원본 CSV의 버그). */
export function fixSpaColumnSwap(row) {
  if (!row["카테고리"]?.startsWith("스파/")) return row;
  return { ...row, 지역: row["주소"], 주소: row["지역"] };
}

const hasValue = (v) => {
  const s = (v ?? "").trim();
  return s !== "" && s !== "-" && !s.includes("정보 부족");
};

/** 주소와 About이 모두 실값인 행만 시딩 대상이다. */
export function isUsable(row) {
  return hasValue(row["주소"]) && hasValue(row["About"]);
}
```

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `npx vitest run scripts/import-places-csv.test.mjs`
Expected: PASS (9 tests)

- [ ] **Step 6: 전체 테스트가 깨지지 않았는지 확인한다**

Run: `npm run test`
Expected: 기존 197 + 신규 통과, 실패 0

- [ ] **Step 7: 커밋**

```bash
git add data/places-import/ scripts/import-places-csv.mjs scripts/import-places-csv.test.mjs
git commit -m "feat(data): places CSV 파서 + 스파 블록 컬럼 스왑 교정 (TDD)"
```

---

## Task 3: 매핑 테이블 + slug·지도 링크 빌더

부록 A의 71행 매핑을 JS 리터럴로 옮기고 소스 JSON 엔트리를 만든다.

**Files:**

- Modify: `scripts/import-places-csv.mjs`
- Modify: `scripts/import-places-csv.test.mjs`

**Interfaces:**

- Consumes: Task 2의 `parseCsv` · `fixSpaColumnSwap` · `isUsable`
- Produces:
  - `MAPPING: Record<string, {category: string, area: string, address: string, unpublished?: boolean}>` — 국문명이 키, 71개
  - `EXCLUDED: Record<string, string>` — 국문명 → 제외 사유, 1개
  - `slugify(nameEn: string) => string`
  - `googleMapsUrl(nameEn: string, area: string) => string`
  - `naverMapUrl(nameKr: string) => string`
  - `buildRows(csvText: string, existingSlugs: string[], startId: number) => Array<SourceEntry>` — Task 4가 이 배열을 JSON에 append한다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`scripts/import-places-csv.test.mjs`에 추가 (기존 import 줄에 이름을 더한다):

```js
import {
  parseCsv,
  fixSpaColumnSwap,
  isUsable,
  MAPPING,
  EXCLUDED,
  slugify,
  googleMapsUrl,
  naverMapUrl,
  buildRows,
} from "./import-places-csv.mjs";

describe("MAPPING", () => {
  it("covers exactly the 71 seeded rows", () => {
    expect(Object.keys(MAPPING)).toHaveLength(71);
  });

  it("has an entry for every usable CSV row that is not excluded", () => {
    const names = parseCsv(CSV)
      .map(fixSpaColumnSwap)
      .filter(isUsable)
      .map((r) => r["국문명"])
      .filter((n) => !EXCLUDED[n]);
    const missing = names.filter((n) => !MAPPING[n]);
    expect(missing).toEqual([]);
    expect(names).toHaveLength(71);
  });

  it("has no MAPPING key that is absent from the CSV", () => {
    const names = new Set(parseCsv(CSV).map((r) => r["국문명"]));
    expect(Object.keys(MAPPING).filter((n) => !names.has(n))).toEqual([]);
  });

  it("uses only categories the DB enum knows", () => {
    const ALLOWED = [
      "observatory",
      "market",
      "mall",
      "spa",
      "facial",
      "head_spa",
      "wellness",
    ];
    for (const [name, m] of Object.entries(MAPPING)) {
      expect(ALLOWED, `${name} has category ${m.category}`).toContain(
        m.category
      );
    }
  });

  it("marks exactly the three editorially held-back rows", () => {
    const held = Object.entries(MAPPING)
      .filter(([, m]) => m.unpublished)
      .map(([n]) => n);
    expect(held.sort()).toEqual(["Eco Jardin", "오투", "황족마사지"].sort());
  });

  it("leaves address blank only for the two rows verification must fill", () => {
    const blank = Object.entries(MAPPING)
      .filter(([, m]) => !m.address)
      .map(([n]) => n);
    expect(blank.sort()).toEqual(["종로3가 포장마차 골목", "중부시장"].sort());
  });
});

describe("slugify", () => {
  it.each([
    ["N Seoul Tower", "n-seoul-tower"],
    ["Lotte World Tower & Mall", "lotte-world-tower-mall"],
    [
      "Gimpo Int'l Airport Observatory Deck",
      "gimpo-intl-airport-observatory-deck",
    ],
    ["I'Park Mall", "ipark-mall"],
    ["Provence Spa by L'OCCITANE", "provence-spa-by-loccitane"],
    ["63 Skypicnic", "63-skypicnic"],
    ["Café Déjà", "cafe-deja"],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe("map links", () => {
  it("builds a Google Maps search URL from name + area", () => {
    expect(googleMapsUrl("N Seoul Tower", "Yongsan")).toBe(
      "https://www.google.com/maps/search/?api=1&query=N%20Seoul%20Tower%20Yongsan%20Seoul"
    );
  });

  it("encodes ampersands so the query is not truncated", () => {
    expect(googleMapsUrl("Lotte World Tower & Mall", "Jamsil")).toContain(
      "%26"
    );
  });

  it("builds a Naver search URL from the Korean name", () => {
    expect(naverMapUrl("남대문시장")).toBe(
      "https://map.naver.com/p/search/%EB%82%A8%EB%8C%80%EB%AC%B8%EC%8B%9C%EC%9E%A5"
    );
  });
});

describe("buildRows", () => {
  const rows = buildRows(CSV, [], 140);

  it("produces 71 entries", () => {
    expect(rows).toHaveLength(71);
  });

  it("drops the excluded row", () => {
    expect(rows.find((r) => r.nameKr === "종로타워")).toBeUndefined();
  });

  it("numbers ids sequentially as zero-padded strings", () => {
    expect(rows[0].id).toBe("140");
    expect(rows.at(-1).id).toBe("210");
  });

  it("seeds every row unverified — verification flips this by hand", () => {
    expect(rows.every((r) => r.verified === false)).toBe(true);
  });

  it("carries the CSV About through as an internal note, never as public copy", () => {
    const tower = rows.find((r) => r.nameKr === "N 서울타워");
    expect(tower.reviewSummary).toContain("남산");
  });

  it("keeps the raw CSV 지역 in region for traceability", () => {
    expect(rows.find((r) => r.nameKr === "헬로에이피엠").region).toBe(
      "서대문(아현)"
    );
  });

  it("parses rating and reviews as numbers, null when absent", () => {
    const tower = rows.find((r) => r.nameKr === "N 서울타워");
    expect(tower.rating).toBe(4.2);
    expect(tower.reviews).toBe(9678);
    const quarry = rows.find((r) => r.nameKr === "채석장 전망대");
    expect(quarry.rating).toBeNull();
    expect(quarry.reviews).toBe(2);
  });

  it("throws when a slug collides with an existing one", () => {
    expect(() => buildRows(CSV, ["n-seoul-tower"], 140)).toThrow(
      /n-seoul-tower/
    );
  });

  it("produces no duplicate slugs among the new rows", () => {
    const slugs = rows.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npx vitest run scripts/import-places-csv.test.mjs`
Expected: FAIL — `MAPPING is not defined` 등

- [ ] **Step 3: 매핑 테이블을 추가한다**

`scripts/import-places-csv.mjs`에 추가. **부록 A가 정본이고 이 리터럴은 사본이다** — 둘의 정합성은 위 테스트가 잠근다.

```js
// 부록 A(설계 문서)의 수기 검토 매핑. 국문명 → { category, area, address }.
// address는 CSV 원본을 옮기되 영문 혼용·오타·불필요한 꼬리를 정규화했다.
// unpublished: 편집 판단으로 게시하지 않는 행 (검증 실패와 이유가 다르다).
export const MAPPING = {
  광진교8번가: {
    category: "observatory",
    area: "Gangdong",
    address: "서울 강동구 선사로 4 광진교 중앙지점 하단",
  },
  "김포공항 전망대": {
    category: "observatory",
    area: "Gangseo",
    address: "서울 강서구 하늘길 78 김포국제공항",
  },
  "뚝섬 전망문화콤플렉스 J-Bug": {
    category: "observatory",
    area: "Gwangjin",
    address: "서울 광진구 뚝섬한강공원 내(정식명칭 서울생각마루)",
  },
  "롯데월드타워&몰": {
    category: "observatory",
    area: "Jamsil",
    address: "서울 송파구 올림픽로 300(롯데월드 117~123층)",
  },
  서울스카이: {
    category: "observatory",
    area: "Jamsil",
    address: "서울 송파구 올림픽로 300(롯데월드타워 117~123층)",
  },
  정동전망대: {
    category: "observatory",
    area: "Jeongdong",
    address: "서울 중구 덕수궁길 15 서울시청 서소문별관 13층",
  },
  "서울 한양도성": {
    category: "observatory",
    area: "Jongno",
    address: "서울 종로구 일대(단일 주소 없음)",
  },
  "채석장 전망대": {
    category: "observatory",
    area: "Jongno",
    address: "서울 종로구 창신동 일대(비공식)",
  },
  응봉산팔각정: {
    category: "observatory",
    area: "Seongdong",
    address: "서울 성동구 응봉동(비공식)",
  },
  "63 스카이피크닉": {
    category: "observatory",
    area: "Yeouido",
    address: "서울 영등포구 63로 50 63빌딩 내(비공식)",
  },
  "N 서울타워": {
    category: "observatory",
    area: "Yongsan",
    address: "서울 용산구 남산공원길 105",
  },
  서울풍물시장: {
    category: "market",
    area: "Dongdaemun",
    address: "서울 동대문구 천호대로4길 21",
  },
  중부시장: { category: "market", area: "Euljiro", address: "" },
  공덕시장: {
    category: "market",
    area: "Gongdeok",
    address: "서울 마포구 만리재로 19",
  },
  광장시장: {
    category: "market",
    area: "Jongno",
    address: "서울 종로구 창경궁로 88",
  },
  동묘벼룩시장: {
    category: "market",
    area: "Jongno",
    address: "서울 종로구 숭인동(동묘앞역 3번 출구 인근)",
  },
  쌈지길: {
    category: "market",
    area: "Jongno",
    address: "서울 종로구 인사동길 44",
  },
  "종로3가 포장마차 골목": { category: "market", area: "Jongno", address: "" },
  망원시장: {
    category: "market",
    area: "Mangwon",
    address: "서울 마포구 포은로8길 14",
  },
  "Myeongdong Night Market": {
    category: "market",
    area: "Myeongdong",
    address: "서울 중구 충무로2길 3",
  },
  남대문시장: {
    category: "market",
    area: "Myeongdong",
    address: "서울 중구 남대문시장4길 21",
  },
  "노량진 수산물 도매시장": {
    category: "market",
    area: "Noryangjin",
    address: "서울 동작구 노들로 674",
  },
  "공릉동 도깨비시장": {
    category: "market",
    area: "Nowon",
    address: "서울 노원구 동일로180길 37",
  },
  "마포 농수산물 시장": {
    category: "market",
    area: "Sangam",
    address: "서울 마포구 월드컵로 235",
  },
  영천시장: {
    category: "market",
    area: "Seodaemun",
    address: "서울 서대문구 성산로 704",
  },
  "마장 축산물시장": {
    category: "market",
    area: "Seongdong",
    address: "서울 성동구 마장로31길 40",
  },
  가락시장: {
    category: "market",
    area: "Songpa",
    address: "서울 송파구 양재대로 932",
  },
  영등포중앙시장: {
    category: "market",
    area: "Yeongdeungpo",
    address: "서울 영등포구 영등포로 225",
  },
  신흥시장: {
    category: "market",
    area: "Yongsan",
    address: "서울 용산구 신흥로 95-9",
  },
  "남평화 상가": {
    category: "mall",
    area: "Dongdaemun",
    address: "서울 중구 장충단로 282-10",
  },
  "에이피엠 플레이스": {
    category: "mall",
    area: "Dongdaemun",
    address: "서울 중구 을지로 276",
  },
  헬로에이피엠: {
    category: "mall",
    area: "Dongdaemun",
    address: "서울 중구 장충단로 253",
  },
  "스타필드 코엑스몰": {
    category: "mall",
    area: "Gangnam",
    address: "서울 강남구 영동대로 513",
  },
  커먼그라운드: {
    category: "mall",
    area: "Gwangjin",
    address: "서울 광진구 아차산로 200",
  },
  메세나폴리스몰: {
    category: "mall",
    area: "Hapjeong",
    address: "서울 마포구 양화로 45",
  },
  명동밀리오레: {
    category: "mall",
    area: "Myeongdong",
    address: "서울 중구 퇴계로 115",
  },
  명동지하상가: {
    category: "mall",
    area: "Myeongdong",
    address: "서울 중구 남대문로지하 72",
  },
  "스타일난다 핑크호텔": {
    category: "mall",
    area: "Myeongdong",
    address: "서울 중구 명동8길 37-8",
  },
  "고투 몰": {
    category: "mall",
    area: "Seocho",
    address: "서울 서초구 신반포로 194",
  },
  가든파이브: {
    category: "mall",
    area: "Songpa",
    address: "서울 송파구 충민로 66",
  },
  "IFC 몰": {
    category: "mall",
    area: "Yeouido",
    address: "서울 영등포구 국제금융로 10",
  },
  "롯데아울렛 서울역점": {
    category: "mall",
    area: "Yongsan",
    address: "서울 중구 한강대로 405",
  },
  아이파크몰: {
    category: "mall",
    area: "Yongsan",
    address: "서울 용산구 한강대로23길 55",
  },
  "2s 압구정": {
    category: "spa",
    area: "Apgujeong",
    address: "서울 강남구 선릉로157길 6, 4층",
  },
  "마르지아 힐링 스파 - 청담": {
    category: "spa",
    area: "Cheongdam",
    address: "서울 강남구 삼성로119길 23, 4층",
  },
  Asuca: {
    category: "spa",
    area: "Dongdaemun",
    address: "서울 중구 장충단로 213",
  },
  "프로방스 스파 바이 록시땅": {
    category: "spa",
    area: "Dongdaemun",
    address: "서울 종로구 청계천로 279 JW 메리어트 동대문 스퀘어 서울 9층",
  },
  황금스파: {
    category: "spa",
    area: "Dongdaemun",
    address: "서울 중구 청계천로 400 롯데캐슬 B2층",
  },
  호쿠토시치세이: {
    category: "spa",
    area: "Euljiro",
    address: "서울 중구 을지로 78 남광빌딩 406호",
  },
  "스파 1899 동인비": {
    category: "spa",
    area: "Gangnam",
    address: "서울 강남구 영동대로 416 KT&G 타워 B2층",
  },
  스파고결: {
    category: "spa",
    area: "Gangnam",
    address: "서울 강남구 선릉로132길 13 J&C빌딩 4층",
  },
  "아로마 타이 스파 공덕점": {
    category: "spa",
    area: "Gongdeok",
    address: "서울 마포구 독막로 320 태영 데시앙101동 지하 101호",
  },
  강변스파랜드: {
    category: "spa",
    area: "Gwangjin",
    address: "서울 광진구 구의강변로 45 성진빌딩 지하2층",
  },
  뱀부테라피: {
    category: "spa",
    area: "Hapjeong",
    address: "서울 마포구 양화로18안길 22",
  },
  "더 스파 그랜드 하얏트 서울": {
    category: "spa",
    area: "Itaewon",
    address: "서울 용산구 소월로 322 Garden Level",
  },
  "레비쉬 스파": {
    category: "spa",
    area: "Jongno",
    address: "서울 종로구 동숭3길 6-4, 2층",
  },
  "스파렉스 사우나": {
    category: "spa",
    area: "Jongno",
    address: "서울 종로구 지봉로 19 시즌빌딩 12층",
  },
  오투: {
    category: "spa",
    area: "Myeongdong",
    address: "서울 중구 남대문로 78",
    unpublished: true,
  },
  황족마사지: {
    category: "spa",
    area: "Myeongdong",
    address: "서울 중구 명동8나길 12 롯데리아 5층",
    unpublished: true,
  },
  "숲속 한방 랜드": {
    category: "spa",
    area: "Seodaemun",
    address: "서울 서대문구 봉원동 51",
  },
  "설화수 스파": {
    category: "facial",
    area: "Euljiro",
    address: "서울 중구 을지로 30, 4층",
  },
  "Individuel Geneve": {
    category: "facial",
    area: "Gangnam",
    address: "서울 강남구 봉은사로47길 60",
  },
  "Seoulistique Skin": {
    category: "facial",
    area: "Gongdeok",
    address: "서울 마포구 마포대로 225",
  },
  "달콤한 게으름": {
    category: "facial",
    area: "Gongdeok",
    address: "서울 마포구 만리재로 93, 2층",
  },
  "미조 에스떼 살롱": {
    category: "facial",
    area: "Myeongdong",
    address: "서울 중구 충무로2가 66-9",
  },
  헤라: {
    category: "facial",
    area: "Myeongdong",
    address: "서울 중구 명동8가길 39",
  },
  "Laurel studio": {
    category: "facial",
    area: "Sangam",
    address: "서울 마포구 월드컵북로 7, 3층",
  },
  "스톤 하우스 헤드 스파": {
    category: "head_spa",
    area: "Gangnam",
    address: "서울 강남구 언주로147길 B63-22 B1, A동",
  },
  "Eco Jardin Aeogae Branch": {
    category: "head_spa",
    area: "Gongdeok",
    address: "서울 마포구 마포대로 204, 2층",
  },
  "Eco Jardin": {
    category: "head_spa",
    area: "Jongno",
    address: "서울 종로구 자하문로 9, 5층",
    unpublished: true,
  },
  "크레이트 웰네스": {
    category: "wellness",
    area: "Itaewon",
    address: "서울 용산구 이태원로 211 한남빌딩 1층",
  },
};

// 시딩하지 않는 행 — 분류가 사실과 다른 경우만. 저평점은 여기가 아니라 MAPPING.unpublished로 다룬다.
export const EXCLUDED = {
  종로타워: "전망 데크가 오피스로 전환됨 — observatory 분류가 사실과 다름",
};

// 위 EXCLUDED가 유일한 제외 관문이다. 종로타워는 소스 JSON에 아예 들어가지 않으므로
// data/places-curation.en.json의 excluded 맵(slug 키)에는 넣지 않는다 — 넣어도 매칭될
// slug가 없어 죽은 항목이 된다. 스펙 "편집 심사" 절의 excluded 언급은 이 관문을 가리킨다.

// DB의 place_category 중 이번에 쓰는 값. 오타를 컴파일 시점에 잡지 못하므로 런타임 검증한다.
const ALLOWED_CATEGORIES = new Set([
  "observatory",
  "market",
  "mall",
  "spa",
  "facial",
  "head_spa",
  "wellness",
]);

// 소스 JSON의 category(국문)는 DB enum이 아니라 원본 분류 라벨이다.
const SOURCE_CATEGORY = {
  observatory: "전망대",
  market: "시장",
  mall: "쇼핑몰",
  spa: "뷰티",
  facial: "뷰티",
  head_spa: "뷰티",
  wellness: "뷰티",
};
```

- [ ] **Step 4: slug·링크 빌더를 추가한다**

```js
/** 영문명 → ASCII kebab slug. 발음 부호는 벗기고 어포스트로피는 지운다. */
export function slugify(nameEn) {
  return nameEn
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function googleMapsUrl(nameEn, area) {
  const q = encodeURIComponent(`${nameEn} ${area} Seoul`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function naverMapUrl(nameKr) {
  return `https://map.naver.com/p/search/${encodeURIComponent(nameKr)}`;
}
```

`encodeURIComponent`는 공백을 `%20`, `&`를 `%26`으로 인코딩한다 — 쿼리가 잘리지 않는다.

- [ ] **Step 5: `buildRows`를 추가한다**

```js
const num = (v) => {
  const s = (v ?? "").trim();
  if (s === "" || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * CSV 텍스트 → 소스 JSON 엔트리 배열.
 * verified는 전부 false로 시작한다 — 검증 태스크가 손으로 뒤집는다.
 */
export function buildRows(csvText, existingSlugs, startId) {
  const taken = new Set(existingSlugs);
  const usable = parseCsv(csvText).map(fixSpaColumnSwap).filter(isUsable);
  const rows = [];
  let id = startId;

  for (const raw of usable) {
    const nameKr = raw["국문명"];
    if (EXCLUDED[nameKr]) continue;

    const m = MAPPING[nameKr];
    if (!m) throw new Error(`MAPPING에 없는 국문명: ${nameKr}`);
    if (!ALLOWED_CATEGORIES.has(m.category))
      throw new Error(`${nameKr}: 알 수 없는 category ${m.category}`);

    const nameEn = raw["영문명"];
    const slug = slugify(nameEn);
    if (taken.has(slug)) throw new Error(`slug 충돌: ${slug} (${nameKr})`);
    taken.add(slug);

    rows.push({
      id: String(id++).padStart(3, "0"),
      slug,
      category: SOURCE_CATEGORY[m.category],
      entryType: "장소",
      type: m.category,
      region: raw["지역"],
      nameEn,
      nameKr,
      rating: num(raw["평점"]),
      reviews: num(raw["리뷰수"]),
      website: null,
      instagram: null,
      address: m.address,
      googleMaps: googleMapsUrl(nameEn, m.area),
      naverMap: naverMapUrl(nameKr),
      reviewSummary: raw["About"],
      verified: false,
    });
  }
  return rows;
}
```

`reviewSummary`는 `seed-places.mjs`가 DB로 보내지 않는 내부 메모 필드다 — CSV의 About을 여기 담아도 공개되지 않는다.

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

Run: `npx vitest run scripts/import-places-csv.test.mjs`
Expected: PASS (전체)

`MAPPING has an entry for every usable CSV row` 테스트가 실패하면 CSV 국문명과 리터럴 키의 공백·특수문자가 다른 것이다. 실패 메시지의 `missing` 배열을 그대로 리터럴 키로 옮긴다.

- [ ] **Step 7: 커밋**

```bash
git add scripts/import-places-csv.mjs scripts/import-places-csv.test.mjs
git commit -m "feat(data): 71행 매핑 테이블 + slug·지도 링크 빌더 (TDD)"
```

---

## Task 4: 소스 JSON에 71행 append

**Files:**

- Modify: `scripts/import-places-csv.mjs` (CLI 진입점)
- Modify: `data/adropofseoul_places.json` (138 → 209행)

**Interfaces:**

- Consumes: Task 3의 `buildRows`
- Produces: `data/adropofseoul_places.json` 209행. Task 5~9의 편집 레이어가 이 slug들을 키로 쓴다.

- [ ] **Step 1a: 파일 최상단(헤더 주석 바로 아래)에 import를 넣는다**

```js
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
```

ESM은 import를 최상단에 두어야 한다 — 파일 끝에 두면 `import/first` ESLint 규칙에 걸린다.

- [ ] **Step 1b: 파일 끝에 CLI 진입점을 추가한다**

```js
// --- CLI ---------------------------------------------------------------
// import 시 부작용이 없도록 직접 실행일 때만 돈다 (테스트가 이 모듈을 import한다).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const jsonPath = join(root, "data/adropofseoul_places.json");
  const csvPath = join(
    root,
    "data/places-import/seoul-attractions-2026-07.csv"
  );

  const existing = JSON.parse(readFileSync(jsonPath, "utf8"));
  const startId = Math.max(...existing.map((e) => Number(e.id))) + 1;
  const rows = buildRows(
    readFileSync(csvPath, "utf8"),
    existing.map((e) => e.slug),
    startId
  );

  console.log(`${rows.length} rows built (id ${rows[0].id}–${rows.at(-1).id})`);
  const counts = {};
  for (const r of rows) counts[r.type] = (counts[r.type] ?? 0) + 1;
  console.log("categories:", counts);

  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(rows.slice(0, 2), null, 2));
    process.exit(0);
  }

  writeFileSync(
    jsonPath,
    JSON.stringify([...existing, ...rows], null, 2) + "\n"
  );
  console.log(
    `wrote ${jsonPath} (${existing.length} → ${existing.length + rows.length})`
  );
}
```

- [ ] **Step 2: dry-run으로 확인한다**

Run: `node scripts/import-places-csv.mjs --dry-run`
Expected:

```
71 rows built (id 140–210)
categories: { observatory: 11, market: 18, mall: 14, spa: 17, facial: 7, head_spa: 3, wellness: 1 }
```

이어서 첫 2행의 JSON. `googleMaps`·`naverMap`이 인코딩된 URL인지, `address`가 정규화된 도로명인지 눈으로 확인한다.

- [ ] **Step 3: 실제로 append한다**

Run: `node scripts/import-places-csv.mjs`
Expected: `wrote .../data/adropofseoul_places.json (138 → 209)`

- [ ] **Step 4: 결과를 검증한다**

```bash
node -e "
const d=JSON.parse(require('fs').readFileSync('data/adropofseoul_places.json','utf8'));
const slugs=d.map(x=>x.slug);
console.log('rows', d.length, '| unique slugs', new Set(slugs).size, '| unique ids', new Set(d.map(x=>x.id)).size);
console.log('unverified', d.filter(x=>x.verified===false).length);
"
```

Expected: `rows 209 | unique slugs 209 | unique ids 209`, `unverified` 는 기존 미검증분 + 71

- [ ] **Step 5: 커밋**

```bash
git add scripts/import-places-csv.mjs data/adropofseoul_places.json
git commit -m "feat(data): 서울 명소 71행을 places 소스에 추가 (미검증·미게시)"
```

---

## Task 5~9: 검증 + 영문 편집 레이어 (배치 5개)

분량의 대부분이다. 카테고리별 배치로 나눠 각 배치마다 커밋한다. 아래는 **모든 배치에 공통인 절차**이고, 배치별 대상만 다르다.

| 배치 | 태스크 | 대상                                     | 건수               |
| ---- | ------ | ---------------------------------------- | ------------------ |
| A    | Task 5 | `observatory`                            | 11                 |
| B    | Task 6 | `market`                                 | 18                 |
| C    | Task 7 | `mall`                                   | 14                 |
| D    | Task 8 | `spa`                                    | 17 (미게시 2 포함) |
| E    | Task 9 | `facial` 7 + `head_spa` 3 + `wellness` 1 | 11                 |

**Files (모든 배치 공통):**

- Modify: `data/places-curation.en.json`
- Modify: `data/adropofseoul_places.json` (검증 성공 시 `verified: true`, 주소 교정)

**Interfaces:**

- Consumes: Task 4의 209행 소스 JSON (slug가 키)
- Produces: `curation.places[slug]` 엔트리. `seed-places.mjs`가 `{name, category, kind, area, summary, serviceDetail, bestFor, whyWeLikeIt, longDescription}`를 읽으므로 이 키 이름을 정확히 지켜야 한다. 누락 시 Task 10에서 `no curation entry for <slug>`로 실패한다.

### 배치 공통 절차

- [ ] **Step 1: 배치 대상을 뽑는다**

```bash
node -e "
const d=JSON.parse(require('fs').readFileSync('data/adropofseoul_places.json','utf8'));
for (const r of d.filter(x=>x.type==='observatory'))
  console.log([r.slug, r.nameKr, r.nameEn, r.address, r.rating+'★/'+r.reviews, r.reviewSummary].join(' | '));
"
```

`'observatory'` 자리를 배치의 `type` 값으로 바꾼다. 배치 E는 `['facial','head_spa','wellness'].includes(x.type)`.

- [ ] **Step 2: 각 장소를 웹 검색으로 검증한다**

한 곳당 검색 2회를 기준으로 한다:

1. `"<국문명> 주소"` — 도로명주소·영업 여부
2. `"<영문명> Seoul"` — 영문 표기·공식 사이트

확인할 것:

- **상호가 실재하고 영업 중인가** — 폐업·이전이면 `verified: false` 유지하고 `unpublishedReason`에 사유를 적는다
- **도로명주소가 MAPPING 값과 일치하는가** — 다르면 `data/adropofseoul_places.json`의 `address`를 고친다
- **`중부시장`·`종로3가 포장마차 골목`은 빈 주소를 채운다** (배치 B)
- **`정동전망대`는 운영 여부에 혼선이 있다** — 운영 중임을 확인하지 못하면 `verified: false`로 남긴다

검색은 US 리전에서 나가므로 국내 소상공인은 결과가 얇을 수 있다. **찾지 못하면 추측하지 말고 `verified: false`로 남긴다.** 미검증 행은 게시되지 않으므로 잘못된 정보가 노출될 위험이 없다.

- [ ] **Step 3: 편집 5필드를 쓴다**

`data/places-curation.en.json`의 `places` 객체에 slug를 키로 추가한다. 기존 138개 항목과 같은 목소리로 쓴다 — 담백한 서술, 과장 없음, 확인된 사실만.

**금지:** 구글·네이버 리뷰 문장을 인용하거나 번역해 옮기는 것. CSV의 About도 그대로 번역하지 않는다 — 사실만 취하고 문장은 새로 쓴다.

필드별 규격:

| 필드              | 규격                                 | 예                                                                    |
| ----------------- | ------------------------------------ | --------------------------------------------------------------------- |
| `name`            | 영문명 (소스 JSON의 `nameEn`과 동일) | `"N Seoul Tower"`                                                     |
| `category`        | DB enum 값 (MAPPING과 동일)          | `"observatory"`                                                       |
| `kind`            | 항상 `"place"`                       | `"place"`                                                             |
| `area`            | 통제 어휘 (MAPPING과 동일)           | `"Yongsan"`                                                           |
| `summary`         | 1문장, 디렉터리 카드에 노출          | `"Seoul's landmark tower on Namsan — the city's default first view."` |
| `serviceDetail`   | 짧은 라벨                            | `"Observation tower"`                                                 |
| `bestFor`         | 소문자로 시작하는 구                 | `"a first orientation to the city"`                                   |
| `whyWeLikeIt`     | 1~2문장. 특기할 게 없으면 `null`     | `null`                                                                |
| `longDescription` | 약 150단어. 문단 사이는 `\n\n`       | (아래 예 참조)                                                        |

완성 예 (`n-seoul-tower`):

```json
"n-seoul-tower": {
  "name": "N Seoul Tower",
  "category": "observatory",
  "kind": "place",
  "area": "Yongsan",
  "summary": "Seoul's landmark tower on Namsan — the city's default first view, and its most photographed one after dark.",
  "serviceDetail": "Observation tower",
  "bestFor": "a first orientation to the city",
  "whyWeLikeIt": "Nearly ten thousand ratings hold it at 4.2 — unusual consistency for a landmark that sees this much traffic, and a fair signal that the view delivers on the climb.",
  "longDescription": "N Seoul Tower stands at the summit of Namsan, in Yongsan-gu, and functions as the city's orientation point: the observation deck gives you the whole basin at once, which is the fastest way to understand how Seoul is laid out before you start walking it.\n\nThe tower is busiest after sunset, when the night view is the draw. Its rating sits at 4.2 across more than 9,600 ratings — a large enough sample that the number means something. Getting up is part of the visit; the cable car from Myeongdong is the usual route, and the walk up through Namsan Park is the quieter one.\n\nNamdaemun Market sits at the foot of the hill, close enough to pair the two in an afternoon."
}
```

`longDescription`은 확인된 사실(위치·구조·평점·접근 경로·인근 연계)로만 채운다. 확인하지 못한 것은 쓰지 않는다.

- [ ] **Step 4: 검증에 성공한 행의 `verified`를 뒤집는다**

`data/adropofseoul_places.json`에서 해당 행의 `"verified": false` → `true`. 검증 실패·불확실은 그대로 둔다.

`MAPPING.unpublished`인 3행(`오투`·`황족마사지`·`Eco Jardin` 경복궁, 배치 D·E)은 **검증에 성공하더라도 `verified: false`로 유지**하고, curation 엔트리에 사유를 남긴다:

```json
"unpublishedReason": "2.7★ across 13 ratings — held out of the directory on editorial judgment, kept for the record"
```

`unpublishedReason`은 `seed-places.mjs`가 읽지 않는 문서용 필드다. `excluded` 맵에 넣으면 시딩 자체가 안 되므로 거기 넣지 않는다.

- [ ] **Step 5: 조인이 깨지지 않았는지 확인한다**

Run: `node scripts/seed-places.mjs --dry-run`
Expected: `no curation entry for <slug>` 에러 없이 `N rows to upsert (M published, ...)` 출력. 이 배치에서 검증 성공한 만큼 published 수가 늘어야 한다.

에러가 나면 curation 키가 소스 JSON의 slug와 다른 것이다.

- [ ] **Step 6: 전체 검증**

Run: `npm run typecheck && npm run test && npm run lint`
Expected: 통과

- [ ] **Step 7: 커밋**

```bash
git add data/adropofseoul_places.json data/places-curation.en.json
git commit -m "content(places): <배치명> N곳 검증 + 영문 편집 레이어"
```

예: `content(places): observatory 11곳 검증 + 영문 편집 레이어`

---

## Task 10: seed SQL 생성 + 원격 적용

**Files:**

- Create: `supabase/migrations/20260731100000_seed_seoul_attractions.sql` (생성물)
- Modify: `docs/superpowers/specs/2026-07-31-seoul-attractions-places-design.md` (Status를 Implemented로)

**Interfaces:**

- Consumes: Task 4의 소스 JSON 209행 + Task 5~9의 curation 205항목
- Produces: 원격 DB에 적용된 places 209행

- [ ] **Step 1: seed SQL을 생성한다**

```bash
node scripts/seed-places.mjs --sql supabase/migrations/20260731100000_seed_seoul_attractions.sql
```

Expected: `wrote ... (209 rows)`

`seed-places.mjs`는 소스 전체를 다시 쓰므로 기존 138행도 포함된 idempotent upsert가 나온다. `on conflict (slug) do update`이므로 기존 행은 같은 값으로 덮어써질 뿐 안전하다.

- [ ] **Step 2: 생성된 SQL을 눈으로 확인한다**

```bash
grep -c "^('" supabase/migrations/20260731100000_seed_seoul_attractions.sql
grep -o "::place_category" supabase/migrations/20260731100000_seed_seoul_attractions.sql | wc -l
grep -c "observatory'::place_category" supabase/migrations/20260731100000_seed_seoul_attractions.sql
```

Expected: 209 / 209 / 11

- [ ] **Step 3: enum 마이그레이션을 원격에 적용한다**

**`supabase db push`를 쓰지 않는다.** Supabase 대시보드 → SQL Editor에서 Task 1의
`20260731090000_place_category_attractions.sql` 내용을 붙여넣고 실행한다.

확인:

```sql
select unnest(enum_range(null::place_category));
```

Expected: 17개 값 — 기존 14 + `observatory` · `market` · `mall`

- [ ] **Step 4: seed SQL을 원격에 적용한다**

enum 실행이 **커밋된 뒤 별도 쿼리로** 실행한다 (같은 트랜잭션에서는 새 enum 값을 쓸 수 없다).
대시보드 SQL Editor에 `20260731100000_seed_seoul_attractions.sql` 내용을 붙여넣고 실행한다.

확인:

```sql
select category, count(*), count(*) filter (where is_published) as published
from places group by category order by count(*) desc;
```

Expected: `market 18` · `mall 14` · `observatory 11` 행이 존재하고, published 수가 검증 성공 건수와 일치

- [ ] **Step 5: 마이그레이션 기록을 맞춘다**

```bash
npx supabase migration repair --status applied 20260731090000
npx supabase migration repair --status applied 20260731100000
```

- [ ] **Step 6: 실제 화면을 확인한다**

```bash
npm run dev
```

- `/seoul` — 진입점 카드 9개, Observatories · Markets · Shopping Malls 노출
- `/seoul/places` — area 필터에 신규 값(Gongdeok·Euljiro·Yeouido…) 노출, type 필터에 Observatory & Tower · Market · Shopping Mall 노출
- `/seoul/places?type=observatory` — 게시된 전망대만
- `/seoul/places/n-seoul-tower` — 상세 페이지에 편집 산문·평점·지도 링크 렌더
- 미게시 3곳(`오투` 등)이 디렉터리에 **없는지** 확인

- [ ] **Step 7: 스펙 Status를 갱신하고 커밋**

`docs/superpowers/specs/2026-07-31-seoul-attractions-places-design.md`의 `**Status:** Approved (verbal)` → `**Status:** Implemented (2026-07-31)`

```bash
git add supabase/migrations/20260731100000_seed_seoul_attractions.sql docs/superpowers/specs/2026-07-31-seoul-attractions-places-design.md
git commit -m "feat(data): 서울 명소 71곳 seed SQL + 원격 적용"
```

---

## 완료 기준

- `/seoul/places`에 209행 중 게시분이 노출되고 신규 3개 타입 필터가 동작한다
- 미게시 3곳과 검증 실패 행은 디렉터리에 나타나지 않는다
- `npm run typecheck && npm run test && npm run lint` 그린
- `node scripts/seed-places.mjs --dry-run`이 에러 없이 209행을 보고한다
- 편집 산문 어디에도 타인의 리뷰 문장이 옮겨져 있지 않다
