# -*- coding: utf-8 -*-
import json
from pathlib import Path

import pandas as pd

from conftest import run


def rd(p: Path, name: str) -> pd.DataFrame:
    return pd.read_csv(p / "csv" / name, dtype=str).fillna("")


def setup_reconciled(p: Path) -> None:
    """reconcile 실행 후 사람 판정(G100→P00001, G200→NEW)까지 흉내낸다."""
    records = [
        {
            "oy_id": "G100",
            "brand_en": "Torriden",
            "product_name_en": "DIVE-IN Toner",
            "url": "https://global.example/G100",
            "skin_types": ["Dry"],
            "concerns": ["Hydration"],
        },
        {
            "oy_id": "G200",
            "brand_en": "NewBrandX",
            "product_name_en": "Wonder Cream",
            "url": "https://global.example/G200",
        },
    ]
    (p / "csv" / "oliveyoung_global_crawl.json").write_text(
        json.dumps(records, ensure_ascii=False), encoding="utf-8"
    )
    assert run(p, "reconcile_global.py").returncode == 0

    rec_path = p / "csv" / "reconcile_global.csv"
    rec = pd.read_csv(rec_path, dtype=str).fillna("")
    rec.loc[rec.oy_global_id == "G100", "matched_product_id"] = "P00001"
    rec.loc[rec.oy_global_id == "G200", "matched_product_id"] = "NEW"
    rec.to_csv(rec_path, index=False, encoding="utf-8-sig")


def test_apply_global_roundtrip(pipeline: Path):
    setup_reconciled(pipeline)
    r = run(pipeline, "apply_global.py")
    assert r.returncode == 0, r.stdout + r.stderr

    products = rd(pipeline, "products.csv")
    p1 = products[products.product_id == "P00001"].iloc[0]
    assert p1.product_name_en == "DIVE-IN Toner"  # 매칭 → 영문명 채움

    new = products[products.product_name_en == "Wonder Cream"]
    assert list(new.product_id) == ["P00003"]  # NEW → 다음 번호
    assert list(new.brand) == ["NewBrandX"]  # 한글명 없으니 영문 그대로

    sources = rd(pipeline, "product_sources.csv")
    gl = sources[sources.source == "올리브영글로벌"]
    assert set(gl.source_product_id) == {"G100", "G200"}

    brands = rd(pipeline, "brands.csv")
    assert "NewBrandX" in set(brands.brand)  # 신규 브랜드 등록

    skin = rd(pipeline, "skin_types.csv")
    assert ("올리브영글로벌" in set(skin.source)) and ("Dry" in set(skin.skin_type_raw))


def test_apply_global_source_idempotent_for_matched(pipeline: Path):
    """매칭 행만 있을 때 재실행해도 소스가 중복되지 않는다."""
    setup_reconciled(pipeline)
    rec_path = pipeline / "csv" / "reconcile_global.csv"
    rec = pd.read_csv(rec_path, dtype=str).fillna("")
    rec = rec[rec.oy_global_id == "G100"]  # 매칭 건만 남김
    rec.to_csv(rec_path, index=False, encoding="utf-8-sig")

    assert run(pipeline, "apply_global.py").returncode == 0
    assert run(pipeline, "apply_global.py").returncode == 0  # 재실행

    sources = rd(pipeline, "product_sources.csv")
    gl = sources[sources.source == "올리브영글로벌"]
    assert len(gl) == 1  # G100 소스 행이 한 번만

    products = rd(pipeline, "products.csv")
    assert list(products.product_id) == ["P00001", "P00002"]  # 신규 생성 없음


def test_apply_global_refuses_blank_verdict(pipeline: Path):
    setup_reconciled(pipeline)
    rec_path = pipeline / "csv" / "reconcile_global.csv"
    rec = pd.read_csv(rec_path, dtype=str).fillna("")
    rec.loc[rec.oy_global_id == "G200", "matched_product_id"] = ""  # 미판정 상태
    rec.to_csv(rec_path, index=False, encoding="utf-8-sig")

    r = run(pipeline, "apply_global.py")
    assert r.returncode != 0
    # apply_global.py의 SystemExit 메시지에 확실히 포함되는 ASCII 부분으로 단언
    assert "matched_product_id" in (r.stdout + r.stderr)
