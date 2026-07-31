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
