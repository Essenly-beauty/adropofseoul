# -*- coding: utf-8 -*-
"""장소 후보 파이프라인 — 행안부 인허가 공공데이터 다운로드 + 파싱.

데이터 출처: https://file.localdata.go.kr/file/download/beauty_salons/info?orgCode=<코드>
  - Referer 헤더 필수 (없으면 302 → /error.html)
  - 응답 헤더는 UTF-8이라 주장하지만 실제 payload는 CP949
  - 모든 필드에 트레일링 공백이 붙어있음 (strip 필수)
  - 자치구별 orgCode 파라미터가 실제로 해당 구만 필터링해 반환함을 실증 확인
    (2026-07-23, ?orgCode=3130000 → 마포구만, 전국 스트리밍 불필요)

실행: .venv/bin/python candidates.py <district_key> [--dest raw/]
"""
import argparse
import csv
import io
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


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description="places-pipeline: 인허가 CSV 다운로드")
    ap.add_argument("district", choices=sorted(DISTRICTS.keys()), help="자치구 키")
    ap.add_argument("--dest", default=str(Path(__file__).resolve().parent / "raw"), help="저장 폴더")
    args = ap.parse_args(argv)

    path = download_district(args.district, args.dest)
    rows = parse_rows(path)
    print(f"{args.district}: {len(rows)}건 다운로드 → {path}")


if __name__ == "__main__":
    main()
