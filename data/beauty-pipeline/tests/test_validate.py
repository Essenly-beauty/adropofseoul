# -*- coding: utf-8 -*-
from pathlib import Path

from conftest import run, write_masters


def test_validate_passes_on_clean_fixture(pipeline: Path):
    r = run(pipeline, "validate.py")
    assert r.returncode == 0, r.stdout + r.stderr
    assert "검증 통과" in r.stdout


def test_validate_fails_on_duplicate_product_id(pipeline: Path):
    write_masters(
        pipeline / "csv",
        {
            "products.csv": (
                "product_id,brand,product_name,product_name_en,category,subcategory,"
                "is_rising,rising_rank,category_rank,brand_rank\n"
                "P00001,토리든,다이브인 토너,,,,,,,\n"
                "P00001,토리든,다이브인 토너 리필,,,,,,,\n"
            )
        },
    )
    r = run(pipeline, "validate.py")
    assert r.returncode == 1
    assert "product_id 중복" in r.stdout


def test_validate_fails_on_orphan_source(pipeline: Path):
    write_masters(
        pipeline / "csv",
        {
            "product_sources.csv": (
                "product_id,source,source_product_id,url\n"
                "P09999,화해,999,https://example.com/999\n"
            )
        },
    )
    r = run(pipeline, "validate.py")
    assert r.returncode == 1
    assert "고아" in r.stdout


def test_validate_fails_on_unmapped_raw_value(pipeline: Path):
    write_masters(
        pipeline / "csv",
        {"concerns.csv": "product_id,source,concern_raw\nP00001,화해,미등록값\n"},
    )
    r = run(pipeline, "validate.py")
    assert r.returncode == 1
    assert "미등록 원본값" in r.stdout
