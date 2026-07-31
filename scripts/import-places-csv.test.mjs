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
