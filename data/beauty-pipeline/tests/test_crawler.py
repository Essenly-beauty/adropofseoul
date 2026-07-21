# -*- coding: utf-8 -*-
"""크롤러 테스트 — 네트워크에 절대 나가지 않는다(픽스처 HTML만 사용)."""
import sys
from pathlib import Path

import pytest

from conftest import PIPELINE, run

sys.path.insert(0, str(PIPELINE))

FIXTURE = PIPELINE / "tests" / "fixtures" / "oy_global_product_sample.html"
SAMPLE_URL = "https://global.oliveyoung.com/product/detail?prdtNo=GA210000002"


def test_no_args_prints_usage_and_exits(pipeline: Path):
    r = run(pipeline, "crawler.py")
    assert r.returncode == 2  # argparse: 필수 인자 누락
    assert "usage" in r.stderr.lower()


def test_fetch_declares_bot_user_agent():
    import crawler

    assert "adropofseoul" in crawler.UA
    assert "jj@whatap.io" in crawler.UA


def test_parse_product_extracts_global_fields():
    import crawler

    html = FIXTURE.read_text(encoding="utf-8")
    rec = crawler.parse_product(html, SAMPLE_URL, known_brands=["CAREZONE", "ANUA"])
    assert rec == {
        "oy_id": "GA210000002",
        "url": SAMPLE_URL,
        "brand_en": "CAREZONE",
        "product_name_en": "Daily & Family Sun Care Cream SPF50+",
    }


def test_parse_product_matches_brand_case_insensitively():
    import crawler

    html = FIXTURE.read_text(encoding="utf-8")
    rec = crawler.parse_product(html, SAMPLE_URL, known_brands=["carezone"])
    assert rec["brand_en"] == "CAREZONE"  # 표기는 페이지 원문 유지


def test_parse_product_rejects_unknown_brand():
    import crawler

    html = FIXTURE.read_text(encoding="utf-8")
    with pytest.raises(ValueError, match="브랜드 미매칭"):
        crawler.parse_product(html, SAMPLE_URL, known_brands=["ANUA"])


def test_load_known_brands_reads_brand_en_column(pipeline: Path):
    import crawler

    brands = crawler.load_known_brands(pipeline / "csv" / "brands.csv")
    assert brands == ["Torriden", "ANUA"]  # 픽스처 brands.csv의 brand_en 열


def test_main_rejects_empty_url_file(pipeline: Path, tmp_path: Path):
    urls = tmp_path / "urls.txt"
    urls.write_text("\n", encoding="utf-8")
    r = run(pipeline, "crawler.py", str(urls))
    assert r.returncode != 0
    assert "URL" in (r.stdout + r.stderr)
    assert not (pipeline / "csv" / "oliveyoung_global_crawl.json").exists()
