# -*- coding: utf-8 -*-
"""올리브영 수집 뼈대 — 기본 비활성. parse_product가 미구현이라 실수로 돌 수 없다.

실행 전 체크리스트 (brief 1단계):
  1) robots.txt / 이용약관 확인 → check_robots() 사용
  2) 공식 API·제휴 피드가 있는지 먼저 확인 (있으면 크롤링 대신 그것을 쓴다)
  3) 시딩: 소량(기본 10개)만 수집해 스키마 검증 후 확대

사용: .venv/bin/python crawler.py urls.txt [--max 10] [--delay 3]
출력: csv/oliveyoung_crawl.json  (merge_oliveyoung.py의 load_crawled가 읽음)

레코드 스키마(제품 1건):
  필수: brand, product_name, oy_id, url
  선택: brand_en, category, subcategory, skin_types[], concerns[]
  (글로벌 수집이면 brand_en, product_name_en 필수 — oliveyoung_global_crawl.json으로 저장)
"""
import argparse
import json
import time
from pathlib import Path
from urllib import robotparser

import requests
from bs4 import BeautifulSoup

DIR = Path(__file__).resolve().parent / "csv"
UA = "adropofseoul-research-bot/0.1 (contact: jj@whatap.io)"


def check_robots(base_url: str, path: str = "/") -> bool:
    """robots.txt를 읽어 해당 경로 수집 허용 여부를 출력·반환."""
    rp = robotparser.RobotFileParser()
    rp.set_url(base_url.rstrip("/") + "/robots.txt")
    rp.read()
    ok = rp.can_fetch(UA, base_url.rstrip("/") + path)
    print(f"robots.txt: {'허용' if ok else '차단'} — {base_url}{path}")
    return ok


def fetch(url: str, delay: float = 3.0) -> str:
    """요청 간 지연 + User-Agent 명시. 4xx/5xx는 예외."""
    time.sleep(delay)
    resp = requests.get(url, headers={"User-Agent": UA}, timeout=20)
    resp.raise_for_status()
    return resp.text


def parse_product(html: str, url: str) -> dict:
    """상품 상세 HTML → 레코드 dict.

    TODO(시딩 단계에서 구현): 실제 페이지 구조를 보고 셀렉터를 채운다.
    구현 전까지는 NotImplementedError — 크롤러가 실수로 돌아가는 것을 막는 안전장치.
    """
    soup = BeautifulSoup(html, "html.parser")  # noqa: F841 — 구현 시 사용
    raise NotImplementedError("parse_product: 셀렉터 미구현 — 시딩 단계에서 채울 것")


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description="올리브영 수집 뼈대 (기본 비활성)")
    ap.add_argument("url_file", help="상품 URL 목록 파일(줄당 1개)")
    ap.add_argument("--max", type=int, default=10, help="최대 수집 건수 (시딩 기본 10)")
    ap.add_argument("--delay", type=float, default=3.0, help="요청 간 지연(초)")
    args = ap.parse_args(argv)

    urls = [u.strip() for u in Path(args.url_file).read_text().splitlines() if u.strip()]
    records = [parse_product(fetch(u, args.delay), u) for u in urls[: args.max]]

    out = DIR / "oliveyoung_crawl.json"
    out.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(records)}건 저장 → {out}")


if __name__ == "__main__":
    main()
