# -*- coding: utf-8 -*-
"""장소 후보 파이프라인 — 행안부 인허가 공공데이터 다운로드 + 파싱.

데이터 출처: https://file.localdata.go.kr/file/download/beauty_salons/info?orgCode=<코드>
  - Referer 헤더 필수 (없으면 302 → /error.html)
  - 응답 헤더는 UTF-8이라 주장하지만 실제 payload는 CP949
  - 모든 필드에 트레일링 공백이 붙어있음 (strip 필수)
  - 자치구별 orgCode 파라미터가 실제로 해당 구만 필터링해 반환함을 실증 확인
    (2026-07-23, ?orgCode=3130000 → 마포구만, 전국 스트리밍 불필요)

실행: .venv/bin/python candidates.py <district_key> [--raw PATH] [--out PATH]
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
from collections import Counter
from pathlib import Path

import requests

BASE_URL = "https://file.localdata.go.kr/file/download/beauty_salons/info"
REFERER = "https://www.data.go.kr/"
UA = "adropofseoul-research-bot/0.1 (contact: jj@whatap.io)"
TIMEOUT = 30
MAX_RETRIES = 2

DISTRICTS = {
    "gangnam": {
        "org": "3220000",
        "hub": "gangnam-cheongdam",
        "neighborhoods": ["청담동", "압구정", "신사동"],
    },
    "mapo": {
        "org": "3130000",
        "hub": "hongdae",
        "neighborhoods": ["서교동", "동교동", "합정동", "연남동", "상수동"],
    },
    "junggu": {
        "org": "3010000",
        "hub": "myeongdong",
        "neighborhoods": ["명동", "충무로", "을지로"],
    },
}

# spec §3 표 순서 그대로 — 먼저 매치되는 규칙이 이긴다("first matching rule wins").
# 통계상 실제 데이터는 법정 명칭(네일미용업 단독, 화장·분장 미용업)이 아니라
# 업계 관행 명칭(네일아트업, 메이크업업)을 쓴다 — 두 쪽 다 토큰으로 남겨둔다.
CATEGORY_RULES: list[tuple[str, list[str]]] = [
    ("salon", ["일반미용업", "종합미용업", "미용업"]),
    ("nail_lash", ["네일아트업", "네일미용업"]),
    ("facial", ["피부미용업", "두피관리업"]),
    ("makeup", ["메이크업업", "화장ㆍ분장", "화장·분장"]),
]

# 출력 CSV 컬럼 — spec §4 그대로, 순서 고정.
OUTPUT_COLUMNS = [
    "관리번호",
    "사업장명",
    "category",
    "업태구분명",
    "위생업태명",
    "도로명주소",
    "지번주소",
    "전화",
    "인허가일자",
    "영업상태",
    "hub",
    "existing_slug",
    "status",
]

# data/places-pipeline/candidates.py → parents[1] == data/
PLACES_JSON_PATH = Path(__file__).resolve().parent.parent / "adropofseoul_places.json"


def download_district(district_key: str, dest_dir: str) -> str:
    """지정 자치구의 인허가 CSV를 원본 바이트 그대로 dest_dir에 저장하고 경로를 반환.

    Referer 헤더는 필수 (없으면 /error.html로 302). orgCode 파라미터가 해당 구만
    필터링해 반환함을 실증 확인했으므로(2026-07-23) 전국 스트리밍 폴백은 두지 않는다.
    """
    if district_key not in DISTRICTS:
        raise ValueError(f"알 수 없는 district_key: {district_key}")

    org = DISTRICTS[district_key]["org"]
    headers = {"User-Agent": UA, "Referer": REFERER}

    last_exc = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.get(
                BASE_URL,
                params={"orgCode": org},
                headers=headers,
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
            break
        except requests.RequestException as exc:  # noqa: PERF203 — 재시도 목적
            last_exc = exc
            if attempt == MAX_RETRIES:
                raise
    else:  # pragma: no cover — for/else, loop always breaks or raises above
        raise last_exc

    dest = Path(dest_dir)
    dest.mkdir(parents=True, exist_ok=True)
    out_path = dest / f"localdata_{district_key}.csv"
    out_path.write_bytes(resp.content)
    return str(out_path)


def parse_rows(path: str) -> list[dict]:
    """CP949로 디코딩 후 csv.DictReader로 파싱, 모든 키/값 strip()."""
    raw = Path(path).read_bytes()
    text = raw.decode("cp949")
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for row in reader:
        rows.append({(k.strip() if k else k): (v.strip() if v else v) for k, v in row.items()})
    return rows


def _token_matches(value: str, token: str) -> bool:
    """단일 값(업태구분명 전체, 또는 위생업태명의 콤마 분리 파트 하나)이 토큰과
    매치하는지 판정.

    맨 토큰 "미용업"은 legacy 업태명이라 값과 완전히 같을 때만("미용업" 그 자체) 매치한다
    — 그렇지 않으면 "네일미용업"/"화장ㆍ분장 미용업"처럼 끝에 "미용업"이 붙는 다른
    업종에도 부분 문자열로 잘못 매치된다. 그 외 토큰(네일아트업, 피부미용업,
    화장ㆍ분장 등)은 부분 문자열 포함으로 매치한다 — 예: 위생업태명이
    "화장ㆍ분장 미용업"처럼 접미사가 붙어 오는 경우가 실제 데이터에 존재하기 때문.
    """
    if not value:
        return False
    if token == "미용업":
        return value == token
    return token in value


def map_category(row: dict) -> str | None:
    """업태구분명 → 위생업태명 순으로 CATEGORY_RULES를 매치해 category를 반환.

    1) 업태구분명(전체 값 하나)을 CATEGORY_RULES 전체 규칙에 대해(테이블 순서대로)
       검사한다 — 여기서 매치되면 위생업태명은 아예 보지 않는다("업태구분명이
       위생업태명보다 우선"; spec 표현으로는 "match 업태구분명 then 위생업태명").
    2) 업태구분명이 어떤 규칙에도 안 걸리면 위생업태명을 콤마로 분리한 뒤(각 파트
       strip), 파트를 등장 순서대로 순회하면서 각 파트를 CATEGORY_RULES 전체에
       대해(테이블 순서대로) 검사한다. 즉 "파트 등장 순서가 1순위, 같은 파트
       안에서는 CATEGORY_RULES 테이블 순서가 2순위"다.

       해석 기록(brief가 명시적으로 허용): spec §3의 "첫 매칭 규칙(테이블 순서)이
       이긴다"는 문장은 업태구분명 단계의 전역 우선순위를 말하는 것으로 읽었다.
       위생업태명이 콤마로 여러 업종을 나열하는 경우(예: "피부미용업, 네일미용업")
       실제로는 그 사업장의 "주된" 업종이 먼저 오는 관행이 있어 보여, 파트 등장
       순서를 CATEGORY_RULES 테이블 순서보다 우선시켰다 — 예:
       "피부미용업, 네일미용업"은 두 번째 파트가 nail_lash 토큰과 완전히 같아도
       (CATEGORY_RULES상 nail_lash가 facial보다 앞이지만) 첫 파트가 facial로
       확정되므로 facial을 반환한다.
    """
    upcode = (row.get("업태구분명") or "").strip()
    for category, tokens in CATEGORY_RULES:
        if any(_token_matches(upcode, token) for token in tokens):
            return category

    sanitation = row.get("위생업태명") or ""
    parts = [p.strip() for p in sanitation.split(",") if p.strip()]
    for part in parts:
        for category, tokens in CATEGORY_RULES:
            if any(_token_matches(part, token) for token in tokens):
                return category

    return None


def is_open(row: dict) -> bool:
    """영업중 여부 판정 — 상세영업상태코드 == "01".

    결정 기록: 브리프는 "영업상태구분코드 == '01'"을 예시로 들었지만, Task 1이
    캡처한 실제 헤더에는 그 컬럼이 없다. 대신 존재하는 4개 상태 컬럼은:
      - 영업상태코드 (대분류, 예: 01=영업/03=폐업)
      - 영업상태명 (대분류 표시명, 예: "영업/정상"/"폐업")
      - 상세영업상태코드 (세분류, 예: 01=영업/02=폐업)
      - 상세영업상태명 (세분류 표시명, 예: "영업"/"폐업")
    상세영업상태코드를 채택했다 — 브리프가 예시로 든 "…구분코드 == '01'" 패턴과
    가장 유사한 코드 컬럼이면서, "영업/정상"처럼 표기가 흔들릴 수 있는 표시명
    문자열보다 숫자 코드가 데이터 개정에 더 안정적이기 때문.
    """
    return (row.get("상세영업상태코드") or "").strip() == "01"


def match_neighborhood(row: dict, neighborhoods: list[str]) -> bool:
    """동네 필터 — 도로명주소 우선, 없거나 매치 안 되면 지번주소로 폴백.

    결정 기록: spec/브리프는 "도로명전체주소"/"소재지전체주소"라는 컬럼명을 쓰지만
    Task 1이 캡처한 실제 헤더에는 그 이름의 컬럼이 없다 — 대응하는 실제 컬럼은
    도로명주소(도로명 전체 주소, 동/건물명까지 포함)와 지번주소다. 부분 문자열
    매치를 두 필드 모두에 대해(OR) 시도한다 — 도로명주소가 비어 있는 행(있음,
    특히 폐업/구주소만 있는 행)에서도 지번주소로 동네를 판별할 수 있도록.
    """
    road = row.get("도로명주소") or ""
    jibun = row.get("지번주소") or ""
    if any(n in road for n in neighborhoods):
        return True
    return any(n in jibun for n in neighborhoods)


def _normalize_for_match(value: str) -> str:
    """공백/괄호(반각·전각) 제거 — 사업장명·주소 비교 전 정규화."""
    if not value:
        return ""
    value = re.sub(r"[()（）]", "", value)
    value = re.sub(r"\s+", "", value)
    return value.strip()


def existing_slug_hint(row: dict, places_json: list[dict]) -> str | None:
    """기존 `data/adropofseoul_places.json`과의 중복 힌트 — 절대 자동 채택하지 않고
    사람이 검토할 후보 slug만 제안한다.

    정규화(공백/괄호 제거) 후 사업장명이 nameKr 또는 nameEn과 서로 포함 관계이거나,
    도로명주소/지번주소가 address와 서로 포함 관계이면 그 장소의 slug를 반환한다.
    첫 매치를 반환(순서는 places_json 리스트 순서).
    """
    name = _normalize_for_match(row.get("사업장명", ""))
    road = _normalize_for_match(row.get("도로명주소", ""))
    jibun = _normalize_for_match(row.get("지번주소", ""))

    for place in places_json:
        name_kr = _normalize_for_match(place.get("nameKr", ""))
        name_en = _normalize_for_match(place.get("nameEn", ""))
        addr = _normalize_for_match(place.get("address", ""))

        if name and name_kr and (name in name_kr or name_kr in name):
            return place.get("slug")
        if name and name_en and (name in name_en or name_en in name):
            return place.get("slug")
        if addr and road and (road in addr or addr in road):
            return place.get("slug")
        if addr and jibun and (jibun in addr or addr in jibun):
            return place.get("slug")

    return None


def business_type_value_counts(rows: list[dict]) -> "Counter[str]":
    """OPEN 행들의 업태구분명 value_counts — 첫 적재 시 미매핑 값을 잡아내기 위한
    로그용(spec §3). 내림차순으로 순회 가능한 Counter를 반환한다."""
    return Counter((row.get("업태구분명") or "") for row in rows)


def emit_candidates(rows: list[dict], district_key: str, out_path: str) -> dict:
    """후보 CSV를 OUTPUT_COLUMNS 순서 그대로 UTF-8로 쓰고, category별 건수를 반환.

    rows는 이미 is_open → map_category(및 "category" 키 부여) → match_neighborhood →
    existing_slug_hint(및 "existing_slug" 키 부여) 단계를 거친 최종 후보 행 목록이라고
    가정한다. hub는 DISTRICTS[district_key]에서 조회한다. status는 항상
    PENDING_REVIEW(사람이 검토하기 전에는 이 스크립트가 절대 확정하지 않는다).
    """
    hub = DISTRICTS[district_key]["hub"]
    counts: dict[str, int] = {}

    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        for row in rows:
            category = row.get("category") or ""
            writer.writerow(
                {
                    "관리번호": row.get("관리번호", ""),
                    "사업장명": row.get("사업장명", ""),
                    "category": category,
                    "업태구분명": row.get("업태구분명", ""),
                    "위생업태명": row.get("위생업태명", ""),
                    "도로명주소": row.get("도로명주소", ""),
                    "지번주소": row.get("지번주소", ""),
                    "전화": row.get("전화번호", ""),
                    "인허가일자": row.get("인허가일자", ""),
                    "영업상태": row.get("상세영업상태명", ""),
                    "hub": hub,
                    "existing_slug": row.get("existing_slug") or "",
                    "status": "PENDING_REVIEW",
                }
            )
            counts[category] = counts.get(category, 0) + 1

    return counts


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description="places-pipeline: 후보 CSV 생성")
    ap.add_argument("district", choices=sorted(DISTRICTS.keys()), help="자치구 키")
    ap.add_argument("--raw", help="이미 받아둔 원본 CSV 경로(지정 시 다운로드 생략)")
    ap.add_argument(
        "--dest",
        default=str(Path(__file__).resolve().parent / "raw"),
        help="--raw 미지정 시 다운로드 저장 폴더",
    )
    ap.add_argument(
        "--out",
        help="출력 CSV 경로 (기본: csv/candidates_<district>.csv)",
    )
    args = ap.parse_args(argv)

    raw_path = args.raw or download_district(args.district, args.dest)
    rows = parse_rows(raw_path)
    print(f"{args.district}: {len(rows)}건 파싱 → {raw_path}")

    open_rows = [row for row in rows if is_open(row)]
    print(f"영업중 {len(open_rows)}건 / 전체 {len(rows)}건")

    # spec §3: 각 자치구 첫 적재 시 업태구분명 value_counts 로그 — 미매핑 값 발견용.
    print("업태구분명 value_counts (영업중 행 기준):")
    for name, count in business_type_value_counts(open_rows).most_common():
        print(f"  {name or '(빈값)'}: {count}")

    neighborhoods = DISTRICTS[args.district]["neighborhoods"]
    candidates_rows = []
    for row in open_rows:
        category = map_category(row)
        if category is None:
            continue
        if not match_neighborhood(row, neighborhoods):
            continue
        row["category"] = category
        candidates_rows.append(row)
    print(f"동네·카테고리 매치 후보 {len(candidates_rows)}건")

    if PLACES_JSON_PATH.exists():
        places_json = json.loads(PLACES_JSON_PATH.read_text(encoding="utf-8"))
    else:  # pragma: no cover — 로컬 개발 중 파일이 없을 때의 방어적 폴백
        places_json = []

    for row in candidates_rows:
        row["existing_slug"] = existing_slug_hint(row, places_json) or ""

    out_path = args.out or str(
        Path(__file__).resolve().parent / "csv" / f"candidates_{args.district}.csv"
    )
    counts = emit_candidates(candidates_rows, args.district, out_path)
    print(f"{args.district}: 후보 CSV → {out_path}")
    for category, count in sorted(counts.items()):
        print(f"  {category}: {count}")


if __name__ == "__main__":
    main()
