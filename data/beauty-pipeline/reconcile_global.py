# -*- coding: utf-8 -*-
"""
[올리브영 글로벌 1단계] 크롤 결과와 마스터를 대조해 사람이 판정할 대조표를 만든다.

입력 : csv/oliveyoung_global_crawl.json (레코드: oy_id, brand_en, product_name_en, url)
출력 : csv/reconcile_global.csv
       (oy_global_id, brand_en, product_name_en, url,
        matched_product_id[항상 공란], candidate_pids, candidate_names)

원칙 : matched_product_id는 이 스크립트가 절대 채우지 않는다(추측 금지, "NEW"도 안 됨).
       사람(LLM 제안 허용)이 P##### 또는 NEW를 적은 뒤 apply_global.py를 실행한다.
"""
import json
from pathlib import Path

import pandas as pd

DIR = Path(__file__).resolve().parent / "csv"
ENC = "utf-8-sig"

COLUMNS = [
    "oy_global_id",
    "brand_en",
    "product_name_en",
    "url",
    "matched_product_id",
    "candidate_pids",
    "candidate_names",
]


def main() -> None:
    brands = pd.read_csv(DIR / "brands.csv", dtype=str).fillna("")
    products = pd.read_csv(DIR / "products.csv", dtype=str).fillna("")
    crawl_path = DIR / "oliveyoung_global_crawl.json"
    if not crawl_path.exists():
        raise SystemExit(f"크롤 결과 없음: {crawl_path}")
    crawled = json.load(open(crawl_path, encoding="utf-8"))

    # brand_en(소문자·공백제거) → 한글 브랜드 다리 (apply_global.py와 동일 규칙)
    en2ko = {e.strip().lower(): b for b, e in zip(brands.brand, brands.brand_en) if e.strip()}

    rows, brand_miss = [], 0
    for r in crawled:
        ko = en2ko.get(r["brand_en"].strip().lower(), "")
        cand = products[products.brand == ko] if ko else products.iloc[0:0]
        if not ko:
            brand_miss += 1
        rows.append(
            {
                "oy_global_id": r["oy_id"],
                "brand_en": r["brand_en"],
                "product_name_en": r["product_name_en"],
                "url": r["url"],
                "matched_product_id": "",  # 사람이 채운다
                "candidate_pids": " | ".join(cand.product_id),
                "candidate_names": " | ".join(cand.product_name),
            }
        )

    pd.DataFrame(rows, columns=COLUMNS).to_csv(
        DIR / "reconcile_global.csv", index=False, encoding=ENC
    )
    with_cand = sum(1 for r in rows if r["candidate_pids"])
    print(f"크롤 {len(rows)}건 · 후보 있음 {with_cand} · 브랜드 미매칭 {brand_miss} (→ 대부분 NEW)")
    print("→ reconcile_global.csv 의 matched_product_id 를 채운 뒤 apply_global.py 실행")


if __name__ == "__main__":
    main()
