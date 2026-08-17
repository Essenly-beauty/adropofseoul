# -*- coding: utf-8 -*-
from pathlib import Path

import pandas as pd

from conftest import run, write_masters


def test_reports_product_level_readiness_without_approving(pipeline: Path):
    write_masters(
        pipeline / "csv",
        {
            "products.csv": (
                "product_id,brand,product_name,product_name_en,category,subcategory,"
                "is_rising,rising_rank,category_rank,brand_rank\n"
                "P00001,토리든,다이브인 토너,Dive-In Toner,스킨케어,스킨/토너,,,,\n"
                "P00002,아누아,어성초 토너,,스킨케어,스킨/토너,,,,\n"
            ),
            "product_sources.csv": (
                "product_id,source,source_product_id,url\n"
                "P00001,화해,111,https://www.hwahae.co.kr/goods/p/111\n"
                "P00001,올리브영글로벌,G111,https://global.oliveyoung.com/p/111\n"
            ),
        },
    )

    result = run(pipeline, "coverage_report.py")
    assert result.returncode == 0, result.stdout + result.stderr

    report = pd.read_csv(pipeline / "csv" / "product_coverage_report.csv")
    assert list(report.product_id) == ["P00001", "P00002"]
    first = report.set_index("product_id").loc["P00001"]
    assert bool(first.recommendation_review_candidate)
    assert bool(first.commerce_review_candidate)
    second = report.set_index("product_id").loc["P00002"]
    assert not bool(second.recommendation_review_candidate)
    assert "product_name_en" in second.missing_for_review
