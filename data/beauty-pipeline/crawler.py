# -*- coding: utf-8 -*-
"""올리브영 글로벌 수집기 — 시딩 전용.

사전 조사 결과 (2026-07-21, 이슈 #11):
  - 국내(www.oliveyoung.co.kr): 봇 차단 대기실로 비브라우저 트래픽 거부 → 수집하지 않는다.
  - 글로벌(global.oliveyoung.com): robots.txt가 일반 봇에 /product 허용, 약관에 크롤링
    금지 조항 없음. 사실 데이터(브랜드/제품명/ID/URL)만 소량 수집한다.
  - 상세 페이지 본문은 JS 렌더링이라, 서버가 내려주는 og:title 메타에서만 추출한다.

사용: .venv/bin/python crawler.py urls.txt [--max 10] [--delay 3]
출력: csv/oliveyoung_global_crawl.json  (reconcile_global.py가 읽음)

레코드 스키마(제품 1건): oy_id, url, brand_en, product_name_en
  브랜드는 brands.csv의 brand_en 목록과 og:title 접두 매칭으로 분리한다.
  목록에 없는 브랜드는 ValueError — 시딩 단계에선 아는 브랜드만 수집한다.
"""
import argparse
import json
import time
from pathlib import Path
from urllib import robotparser
from urllib.parse import parse_qs, urlparse

import pandas as pd
import requests
from bs4 import BeautifulSoup

DIR = Path(__file__).resolve().parent / "csv"
UA = "adropofseoul-research-bot/0.1 (contact: jj@whatap.io)"
TITLE_SUFFIX = " | OLIVE YOUNG Global"


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


def load_known_brands(brands_csv: Path) -> list:
    """brands.csv의 brand_en 열(비어 있지 않은 값)을 CSV 순서대로 반환."""
    brands = pd.read_csv(brands_csv, dtype=str).fillna("")
    return [b.strip() for b in brands.brand_en if b.strip()]


def parse_product(html: str, url: str, known_brands: list) -> dict:
    """상품 상세 HTML → 글로벌 레코드 dict.

    og:title("BRAND Product Name | OLIVE YOUNG Global")에서 브랜드를
    known_brands 접두 매칭(대소문자 무시, 긴 것 우선)으로 분리한다.
    """
    soup = BeautifulSoup(html, "html.parser")
    og = soup.find("meta", property="og:title")
    if not og or not og.get("content"):
        raise ValueError(f"og:title 없음: {url}")
    title = og["content"].strip()
    if title.endswith(TITLE_SUFFIX):
        title = title[: -len(TITLE_SUFFIX)].strip()

    qs = parse_qs(urlparse(url).query)
    if not qs.get("prdtNo"):
        raise ValueError(f"URL에 prdtNo 없음: {url}")
    oy_id = qs["prdtNo"][0]

    low = title.lower()
    for b in sorted(known_brands, key=len, reverse=True):
        prefix = b.strip().lower() + " "
        if low.startswith(prefix):
            brand_en = title[: len(b.strip())]  # 페이지 원문 표기 유지
            name = title[len(prefix):].strip()
            return {
                "oy_id": oy_id,
                "url": url,
                "brand_en": brand_en,
                "product_name_en": name,
            }
    raise ValueError(f"브랜드 미매칭: '{title}' ({url}) — brands.csv brand_en에 없음")


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description="올리브영 글로벌 시딩 수집기")
    ap.add_argument("url_file", help="상품 URL 목록 파일(줄당 1개)")
    ap.add_argument("--max", type=int, default=10, help="최대 수집 건수 (시딩 기본 10)")
    ap.add_argument("--delay", type=float, default=3.0, help="요청 간 지연(초)")
    args = ap.parse_args(argv)

    urls = [u.strip() for u in Path(args.url_file).read_text().splitlines() if u.strip()]
    if not urls:
        raise SystemExit(f"URL 목록이 비어 있음: {args.url_file}")

    known = load_known_brands(DIR / "brands.csv")
    records = [parse_product(fetch(u, args.delay), u, known) for u in urls[: args.max]]

    out = DIR / "oliveyoung_global_crawl.json"
    out.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(records)}건 저장 → {out}")


if __name__ == "__main__":
    main()
