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
