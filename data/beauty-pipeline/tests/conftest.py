# -*- coding: utf-8 -*-
"""테스트 공통: 마스터를 절대 건드리지 않도록 스크립트+소형 마스터를 tmp에 복사해 실행."""
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional

import pytest

PIPELINE = Path(__file__).resolve().parent.parent
SCRIPTS = [
    "merge_oliveyoung.py",
    "apply_global.py",
    "inventory_raw_values.py",
    "reconcile_global.py",
    "validate.py",
    "crawler.py",
]

MASTERS = {
    "products.csv": (
        "product_id,brand,product_name,product_name_en,category,subcategory,"
        "is_rising,rising_rank,category_rank,brand_rank\n"
        "P00001,토리든,다이브인 토너,,스킨케어,스킨/토너,,,,\n"
        "P00002,아누아,어성초 토너,,스킨케어,스킨/토너,,,,\n"
    ),
    "brands.csv": "brand,brand_en,status\n토리든,Torriden,확인\n아누아,ANUA,확인\n",
    "product_sources.csv": (
        "product_id,source,source_product_id,url\n"
        "P00001,화해,111,https://www.hwahae.co.kr/goods/p/111\n"
    ),
    "skin_types.csv": "product_id,source,skin_type_raw,rank\nP00001,화해,건성,1\n",
    "concerns.csv": "product_id,source,concern_raw\nP00001,화해,보습\n",
    "skin_type_map.csv": "source,raw_value,std_value\n화해,건성,건성\n",
    "concern_map.csv": "source,raw_value,std_value\n화해,보습,보습\n",
    "age_groups.csv": "product_id,age_group,rank\n",
    "awards.csv": (
        "product_id,brand,product_name,award_theme,category,subcategory,concern,award_rank\n"
    ),
    "rankings.csv": "product_id,brand,product_name,ranking_type,key,rank\n",
    "textures.csv": "product_id,texture\n",
}


def write_masters(csv_dir: Path, overrides: Optional[dict[str, str]] = None) -> None:
    csv_dir.mkdir(parents=True, exist_ok=True)
    data = {**MASTERS, **(overrides or {})}
    for name, content in data.items():
        (csv_dir / name).write_text(content, encoding="utf-8-sig")


@pytest.fixture
def pipeline(tmp_path: Path) -> Path:
    """스크립트 사본 + 소형 마스터가 든 임시 작업 폴더."""
    for s in SCRIPTS:
        src = PIPELINE / s
        if src.exists():  # 아직 안 만든 스크립트는 건너뜀 (작업 진행 중)
            shutil.copy(src, tmp_path / s)
    write_masters(tmp_path / "csv")
    return tmp_path


def run(script_dir: Path, name: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(script_dir / name), *args],
        capture_output=True,
        text=True,
        cwd=script_dir,
    )
