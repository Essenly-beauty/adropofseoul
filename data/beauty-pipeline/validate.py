# -*- coding: utf-8 -*-
"""마스터 CSV 무결성 리포트. 통과 exit 0 / 실패 exit 1.

검사: product_id 유일 · 매칭 키(keyf) 중복 0 · 고아 product_id 0(모든 부속 테이블)
     · skin/concern 원본값의 맵 등록 여부
"""
import sys
from pathlib import Path

import pandas as pd

from merge_oliveyoung import keyf

DIR = Path(__file__).resolve().parent / "csv"


def rd(name: str) -> pd.DataFrame:
    return pd.read_csv(DIR / name, dtype=str).fillna("")


def main() -> int:
    products = rd("products.csv")
    problems: list[str] = []

    dup_ids = products.product_id[products.product_id.duplicated()].tolist()
    if dup_ids:
        problems.append(f"product_id 중복: {sorted(set(dup_ids))}")

    keys = [keyf(b, n) for b, n in zip(products.brand, products.product_name)]
    seen, dups = set(), set()
    for k in keys:
        (dups if k in seen else seen).add(k)
    if dups:
        problems.append(f"매칭 키 중복 {len(dups)}건: {sorted(dups)[:5]}")

    pids = set(products.product_id)
    for name in [
        "product_sources.csv",
        "skin_types.csv",
        "concerns.csv",
        "age_groups.csv",
        "awards.csv",
        "rankings.csv",
        "textures.csv",
    ]:
        orphan = sorted(set(rd(name).product_id) - pids)
        if orphan:
            problems.append(f"{name}: 고아 product_id {len(orphan)}건 {orphan[:5]}")

    for data_name, col, map_name in [
        ("skin_types.csv", "skin_type_raw", "skin_type_map.csv"),
        ("concerns.csv", "concern_raw", "concern_map.csv"),
    ]:
        df, m = rd(data_name), rd(map_name)
        mapped = set(zip(m.source, m.raw_value))
        missing = sorted({(s, v) for s, v in zip(df.source, df[col])} - mapped)
        if missing:
            problems.append(
                f"{data_name}→{map_name}: 미등록 원본값 {len(missing)}건 {missing[:5]}"
            )

    if problems:
        print("검증 실패:")
        for p in problems:
            print(" -", p)
        return 1
    print(f"검증 통과 · 제품 {len(products)} · 키 중복 0 · 고아 0 · 맵 커버 OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
