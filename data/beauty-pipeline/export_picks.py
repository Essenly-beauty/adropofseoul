# -*- coding: utf-8 -*-
"""[픽 승격 1단계] picks.txt의 제품을 앱 시드용 영문 JSON으로 내보낸다.

입력 : csv/picks.txt (P##### 한 줄에 하나, 사람이 관리)
출력 : csv/picks_export.json — scripts/seed-picks.mjs 가 읽는다.
환경 : OY_REWARD_CODE 가 있으면 올리브영 글로벌 제휴 딥링크(/partner/gate)로 변환.

원칙: 마스터 CSV는 읽기 전용. description(편집 한 줄)은 넣지 않는다 — admin에서 사람이 작성.
"""
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import quote, urlparse

import pandas as pd

DIR = Path(__file__).resolve().parent / "csv"
SRC_GLOBAL = "올리브영글로벌"

AWARD_EN = {"올리브영 어워즈": "Olive Young Awards", "영국 뷰티 어워즈": "UK Beauty Awards"}
CATEGORY_EN = {
    "크림": "Cream",
    "에센스/세럼": "Essence/Serum",
    "바디보습": "Body Moisture",
    "Skin Hydration Hero": "Skin Hydration Hero",
}


def slugify(*parts) -> str:
    s = " ".join(parts).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def oy_deeplink(url: str, code: str) -> str:
    if not code:
        return url
    p = urlparse(url)
    rel = p.path + ("?" + p.query if p.query else "")
    return (
        "https://global.oliveyoung.com/partner/gate"
        f"?url={quote(rel, safe='')}&rwardCode={code}"
    )


def award_badge(rows: pd.DataFrame):
    """어워드 행들 중 '<이름> YYYY' 테마의 최신 연도 1건을 영문 배지로."""
    best = None  # (year, badge)
    for _, r in rows.iterrows():
        m = re.match(r"^(.+?) (\d{4})$", r.award_theme.strip())
        if not m or m.group(1) not in AWARD_EN:
            continue
        year = int(m.group(2))
        badge = f"{AWARD_EN[m.group(1)]} {year}"
        cat = CATEGORY_EN.get(r.category.strip())
        if cat:
            badge += f" · {cat}"
        if r.award_rank.strip():
            badge += f" · #{r.award_rank.strip()}"
        if best is None or year > best[0]:
            best = (year, badge)
    return best[1] if best else None


def main() -> int:
    rd = lambda name: pd.read_csv(DIR / name, dtype=str).fillna("")  # noqa: E731
    products, brands = rd("products.csv"), rd("brands.csv")
    sources, skin, concern, awards = (
        rd("product_sources.csv"), rd("skin_types.csv"),
        rd("concerns.csv"), rd("awards.csv"),
    )
    picks_path = DIR / "picks.txt"
    if not picks_path.exists():
        raise SystemExit(f"픽 목록 없음: {picks_path}")
    picks = [x.strip() for x in picks_path.read_text(encoding="utf-8").splitlines() if x.strip()]

    en_brand = {b: e for b, e in zip(brands.brand, brands.brand_en) if e.strip()}
    pidx = products.set_index("product_id")
    code = os.environ.get("OY_REWARD_CODE", "").strip()

    problems, out = [], []
    for pid in picks:
        if pid not in pidx.index:
            problems.append(f"{pid}: 마스터에 없는 product_id")
            continue
        row = pidx.loc[pid]
        name, brand_en = row.product_name_en.strip(), en_brand.get(row.brand, "")
        if not name:
            problems.append(f"{pid}: product_name_en 비어 있음 (글로벌 시딩 필요)")
            continue
        if not brand_en:
            problems.append(f"{pid}: brands.csv에 brand_en 없음 ({row.brand})")
            continue

        gl = sources[(sources.product_id == pid) & (sources.source == SRC_GLOBAL)]
        offers = [
            {"retailer": "oliveyoung_global", "url": oy_deeplink(u, code)}
            for u in gl.url
        ]

        raw_tags = list(skin[(skin.product_id == pid) & (skin.source == SRC_GLOBAL)].skin_type_raw)
        raw_tags += list(concern[(concern.product_id == pid) & (concern.source == SRC_GLOBAL)].concern_raw)
        tags = list(dict.fromkeys(t for t in raw_tags if t))

        out.append({
            "product_id": pid,
            "slug": slugify(brand_en, name),
            "brand": brand_en,
            "name": name,
            "tags": tags,
            "award_badge": award_badge(awards[awards.product_id == pid]),
            "offers": offers,
            "disclosure_required": True,
        })

    if problems:
        print("승격 불가 항목:")
        for p in problems:
            print(" -", p)
        return 1

    dst = DIR / "picks_export.json"
    dst.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(out)}건 내보냄 → {dst}")
    for rec in out:
        print(f"  {rec['product_id']} → {rec['slug']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
