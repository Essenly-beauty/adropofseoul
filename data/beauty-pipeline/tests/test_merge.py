# -*- coding: utf-8 -*-
import json
from pathlib import Path

import pandas as pd

from conftest import run


def rd(p: Path, name: str) -> pd.DataFrame:
    return pd.read_csv(p / "csv" / name, dtype=str).fillna("")


def write_crawl(p: Path, records: list[dict]) -> None:
    (p / "csv" / "oliveyoung_crawl.json").write_text(
        json.dumps(records, ensure_ascii=False), encoding="utf-8"
    )


CRAWL = [
    {  # 기존 P00001과 키 일치 → 소스만 추가
        "brand": "토리든",
        "product_name": "다이브인 토너",
        "oy_id": "A100",
        "url": "https://global.example/A100",
        "skin_types": ["Dry"],
        "concerns": ["Hydration"],
    },
    {  # 신규 브랜드 → 신규 제품 P00003
        "brand": "라운드랩",
        "product_name": "자작나무 토너",
        "oy_id": "A200",
        "url": "https://global.example/A200",
        "brand_en": "ROUND LAB",
    },
    {  # 같은 브랜드·다른 이름 → review_queue
        "brand": "토리든",
        "product_name": "밸런스풀 젤",
        "oy_id": "A300",
        "url": "https://global.example/A300",
    },
]


def test_merge_roundtrip(pipeline: Path):
    write_crawl(pipeline, CRAWL)
    r = run(pipeline, "merge_oliveyoung.py")
    assert r.returncode == 0, r.stdout + r.stderr

    products = rd(pipeline, "products.csv")
    assert len(products) == 3
    new = products[products.brand == "라운드랩"]
    assert list(new.product_id) == ["P00003"]  # 다음 번호 부여

    sources = rd(pipeline, "product_sources.csv")
    oy = sources[sources.source == "올리브영"]
    assert set(oy.source_product_id) == {"A100", "A200"}
    assert set(oy[oy.source_product_id == "A100"].product_id) == {"P00001"}

    review = rd(pipeline, "review_queue.csv")
    assert list(review.oy_id) == ["A300"]

    skin = rd(pipeline, "skin_types.csv")
    assert ("올리브영" in set(skin.source)) and ("Dry" in set(skin.skin_type_raw))
    sk_map = rd(pipeline, "skin_type_map.csv")
    assert ("올리브영", "Dry") in set(zip(sk_map.source, sk_map.raw_value))

    brands = rd(pipeline, "brands.csv")
    row = brands[brands.brand == "라운드랩"]
    assert list(row.brand_en) == ["ROUND LAB"]


def test_merge_rerun_is_idempotent(pipeline: Path):
    write_crawl(pipeline, CRAWL)
    assert run(pipeline, "merge_oliveyoung.py").returncode == 0
    assert run(pipeline, "merge_oliveyoung.py").returncode == 0  # 재실행

    products = rd(pipeline, "products.csv")
    assert len(products) == 3  # 재실행해도 신규 중복 생성 없음
    sources = rd(pipeline, "product_sources.csv")
    assert len(sources) == len(sources.drop_duplicates())


def test_load_crawled_rejects_missing_fields(pipeline: Path):
    write_crawl(pipeline, [{"brand": "토리든", "product_name": "", "oy_id": "A1", "url": "u"}])
    r = run(pipeline, "merge_oliveyoung.py")
    assert r.returncode != 0
    assert "필수 필드 누락" in (r.stdout + r.stderr)
