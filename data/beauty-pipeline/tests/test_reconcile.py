# -*- coding: utf-8 -*-
import json
from pathlib import Path

import pandas as pd

from conftest import run

GLOBAL_CRAWL = [
    {  # brands.csv의 Torriden → 토리든 후보(P00001) 제시
        "oy_id": "G100",
        "brand_en": "Torriden",
        "product_name_en": "DIVE-IN Toner",
        "url": "https://global.example/G100",
    },
    {  # brands.csv에 없는 브랜드 → 후보 없음 (사람이 NEW 판정 예정)
        "oy_id": "G200",
        "brand_en": "NewBrandX",
        "product_name_en": "Wonder Cream",
        "url": "https://global.example/G200",
    },
]


def write_global_crawl(p: Path, records: list[dict]) -> None:
    (p / "csv" / "oliveyoung_global_crawl.json").write_text(
        json.dumps(records, ensure_ascii=False), encoding="utf-8"
    )


def test_reconcile_emits_candidates_not_verdicts(pipeline: Path):
    write_global_crawl(pipeline, GLOBAL_CRAWL)
    r = run(pipeline, "reconcile_global.py")
    assert r.returncode == 0, r.stdout + r.stderr

    rec = pd.read_csv(pipeline / "csv" / "reconcile_global.csv", dtype=str).fillna("")
    assert list(rec.columns) == [
        "oy_global_id",
        "brand_en",
        "product_name_en",
        "url",
        "matched_product_id",
        "candidate_pids",
        "candidate_names",
    ]
    assert (rec.matched_product_id == "").all()  # 절대 추측하지 않음

    g100 = rec[rec.oy_global_id == "G100"].iloc[0]
    assert g100.candidate_pids == "P00001"
    assert g100.candidate_names == "다이브인 토너"

    g200 = rec[rec.oy_global_id == "G200"].iloc[0]
    assert g200.candidate_pids == "" and g200.candidate_names == ""

    assert "브랜드 미매칭 1" in r.stdout


def test_reconcile_brand_match_is_case_insensitive(pipeline: Path):
    write_global_crawl(
        pipeline,
        [
            {
                "oy_id": "G300",
                "brand_en": "  torriden ",
                "product_name_en": "Any",
                "url": "u",
            }
        ],
    )
    r = run(pipeline, "reconcile_global.py")
    assert r.returncode == 0, r.stdout + r.stderr
    rec = pd.read_csv(pipeline / "csv" / "reconcile_global.csv", dtype=str).fillna("")
    assert rec.iloc[0].candidate_pids == "P00001"
