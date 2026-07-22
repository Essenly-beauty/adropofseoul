# -*- coding: utf-8 -*-
import json
from pathlib import Path

from conftest import run, write_masters

GLOBAL_MASTERS = {
    "products.csv": (
        "product_id,brand,product_name,product_name_en,category,subcategory,"
        "is_rising,rising_rank,category_rank,brand_rank\n"
        "P00001,토리든,다이브인 토너,Dive-In Serum 50ml,스킨케어,스킨/토너,,,,\n"
        "P00002,아누아,어성초 토너,,스킨케어,스킨/토너,,,,\n"
    ),
    "product_sources.csv": (
        "product_id,source,source_product_id,url\n"
        "P00001,화해,111,https://www.hwahae.co.kr/goods/p/111\n"
        "P00001,올리브영글로벌,GA123,https://global.oliveyoung.com/product/detail?prdtNo=GA123\n"
    ),
    "skin_types.csv": (
        "product_id,source,skin_type_raw,rank\n"
        "P00001,화해,건성,1\n"
        "P00001,올리브영글로벌,Dry,\n"
    ),
    "concerns.csv": (
        "product_id,source,concern_raw\n"
        "P00001,화해,보습\n"
        "P00001,올리브영글로벌,Hydration\n"
        "P00001,올리브영글로벌,Dry\n"
    ),
    "awards.csv": (
        "product_id,brand,product_name,award_theme,category,subcategory,concern,award_rank\n"
        "P00001,토리든,다이브인 토너,올리브영 어워즈 2023,에센스/세럼,,,\n"
        "P00001,토리든,다이브인 토너,올리브영 어워즈 2024,에센스/세럼,5년 연속 수상,,1\n"
    ),
}


def setup(pipeline: Path, picks: str = "P00001\n") -> None:
    write_masters(pipeline / "csv", GLOBAL_MASTERS)
    (pipeline / "csv" / "picks.txt").write_text(picks, encoding="utf-8")


def load(pipeline: Path):
    return json.loads(
        (pipeline / "csv" / "picks_export.json").read_text(encoding="utf-8")
    )


def test_exports_full_record(pipeline: Path):
    setup(pipeline)
    r = run(pipeline, "export_picks.py")
    assert r.returncode == 0, r.stdout + r.stderr
    [rec] = load(pipeline)
    assert rec == {
        "product_id": "P00001",
        "slug": "torriden-dive-in-serum-50ml",
        "brand": "Torriden",
        "name": "Dive-In Serum 50ml",
        "tags": ["Dry", "Hydration"],  # 글로벌 소스만, 중복 제거, 등장 순서
        "award_badge": "Olive Young Awards 2024 · Essence/Serum · #1",  # 최신 연도 1건
        "offers": [
            {
                "retailer": "oliveyoung_global",
                "url": "https://global.oliveyoung.com/product/detail?prdtNo=GA123",
            }
        ],
        "disclosure_required": True,
    }


def test_reward_code_builds_deeplink(pipeline: Path):
    import os
    import subprocess
    import sys

    setup(pipeline)
    env = {**os.environ, "OY_REWARD_CODE": "ESSENLY1"}
    r = subprocess.run(
        [sys.executable, str(pipeline / "export_picks.py")],
        capture_output=True, text=True, cwd=pipeline, env=env,
    )
    assert r.returncode == 0, r.stdout + r.stderr
    [rec] = load(pipeline)
    assert rec["offers"][0]["url"] == (
        "https://global.oliveyoung.com/partner/gate"
        "?url=%2Fproduct%2Fdetail%3FprdtNo%3DGA123&rwardCode=ESSENLY1"
    )


def test_fails_on_missing_english_name(pipeline: Path):
    setup(pipeline, picks="P00002\n")  # product_name_en 없음
    r = run(pipeline, "export_picks.py")
    assert r.returncode == 1
    assert "P00002" in (r.stdout + r.stderr)


def test_fails_on_unknown_product_id(pipeline: Path):
    setup(pipeline, picks="P09999\n")
    r = run(pipeline, "export_picks.py")
    assert r.returncode == 1
    assert "P09999" in (r.stdout + r.stderr)
