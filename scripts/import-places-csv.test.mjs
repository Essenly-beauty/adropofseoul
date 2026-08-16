import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
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

  it("unescapes doubled quotes inside a quoted field", () => {
    const rows = parseCsv('a,b\n"say ""hi""",z');
    expect(rows[0]).toEqual({ a: 'say "hi"', b: "z" });
  });

  it("preserves the escaped quotes in the 스파고결 About field", () => {
    const row = parseCsv(CSV).find((r) => r["국문명"] === "스파고결");
    expect(row.About).toContain('"기 순환"');
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

  // MAPPING은 게시 여부를 다루지 않는다 — buildRows가 전 행을 verified: false로
  // 내보내고, 미게시 사유는 curation의 unpublishedReason이 갖는다.
  // 게이트 자체는 scripts/seed-places.test.mjs가 검증한다.
  it("carries no publish flag — only category, area, address", () => {
    const keys = new Set(Object.values(MAPPING).flatMap((m) => Object.keys(m)));
    expect([...keys].sort()).toEqual(["address", "area", "category"]);
  });

  // 주소 공란은 단일 주소가 존재하지 않는 곳(포장마차 골목) 하나뿐이다.
  // 마르지아 청담은 네이버 플레이스로 주소가 확정되어 공란에서 빠졌다.
  // 목록이 늘어나면 검증을 건너뛴 행이 섞인 것이므로 여기서 걸린다.
  it("leaves address blank only for the row with no confirmable address", () => {
    const blank = Object.entries(MAPPING)
      .filter(([, m]) => !m.address)
      .map(([n]) => n);
    expect(blank.sort()).toEqual(["종로3가 포장마차 골목"]);
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
