# -*- coding: utf-8 -*-
"""Build the first human-review queue for Beauty Profile product previews.

This script is deliberately conservative: it ranks source records for review,
but never marks a product public or approved. The output is deterministic and
may be regenerated from the CSV masters at any time.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd


DIR = Path(__file__).resolve().parent / "csv"
OUTPUT = DIR / "product_promotion_queue.csv"
SRC_GLOBAL = "올리브영글로벌"

QUOTAS = {
    "cleanser": 6,
    "toner": 6,
    "serum": 10,
    "moisturizer": 10,
    "sunscreen": 5,
    "mask_exfoliant": 5,
}

SKIN_CONCERNS = {
    "진정",
    "보습",
    "모공",
    "수분",
    "모이스처",
    "브라이트닝",
    "안티에이징",
    "트러블",
    "각질",
    "클렌징",
    "노세범",
    "톤업",
    "워터프루프",
    "선케어 · 선크림",
}


def rd(name: str) -> pd.DataFrame:
    return pd.read_csv(DIR / name, dtype=str).fillna("")


def routine_step(category: str, subcategory: str, name: str) -> str:
    category, subcategory, name = category.strip(), subcategory.strip(), name.strip()
    joined = f"{category} {subcategory} {name}"

    if "선케어" in joined or any(k in name for k in ["선크림", "선스틱", "선세럼", "선쿠션"]):
        return "sunscreen"
    if category == "클렌징/필링" or "클렌징" in subcategory:
        if any(k in subcategory for k in ["스크럽", "필링"]):
            return "mask_exfoliant"
        return "cleanser"
    if category in {"마스크/팩", "필링", "팩"} or any(
        k in subcategory for k in ["마스크", "팩", "패치", "필링", "스크럽"]
    ):
        return "mask_exfoliant"
    if any(k in subcategory for k in ["스킨/토너", "토너 패드"]) or "토너" in name:
        return "toner"
    if any(k in subcategory for k in ["에센스", "앰플", "세럼"]) or any(
        k in name for k in ["에센스", "앰플", "세럼"]
    ):
        return "serum"
    if any(k in subcategory for k in ["크림", "로션", "에멀젼", "젤", "오일", "밤"]):
        return "moisturizer"
    if any(k in name for k in ["크림", "로션", "에멀젼", "젤크림", "오일", "밤"]):
        return "moisturizer"
    if "클렌징" in name:
        return "cleanser"
    return ""


def joined_values(df: pd.DataFrame, column: str) -> dict[str, str]:
    return (
        df.groupby("product_id")[column]
        .apply(lambda values: "|".join(dict.fromkeys(v for v in values if v)))
        .to_dict()
    )


def main() -> int:
    products = rd("products.csv")
    brands = rd("brands.csv")
    sources = rd("product_sources.csv")
    skin = rd("skin_types.csv")
    concerns = rd("concerns.csv")
    textures = rd("textures.csv")
    rankings = rd("rankings.csv")
    awards = rd("awards.csv")

    picks = {
        value.strip()
        for value in (DIR / "picks.txt").read_text(encoding="utf-8").splitlines()
        if value.strip()
    }
    brand_en = {
        row.brand: row.brand_en
        for row in brands.itertuples(index=False)
        if row.brand and row.brand_en
    }
    global_rows = sources[sources.source == SRC_GLOBAL]
    global_urls = joined_values(global_rows, "url")
    skin_values = joined_values(skin, "skin_type_raw")
    concern_values = joined_values(
        concerns[concerns.concern_raw.isin(SKIN_CONCERNS)], "concern_raw"
    )
    texture_values = joined_values(textures, "texture")
    award_counts = awards.groupby("product_id").size().to_dict()
    skin_counts = skin.groupby("product_id").size().to_dict()

    numeric_ranks = rankings.assign(
        numeric_rank=pd.to_numeric(rankings["rank"], errors="coerce")
    ).dropna(subset=["numeric_rank"])
    best_ranks = numeric_ranks.groupby("product_id").numeric_rank.min().to_dict()

    candidates = []
    for product in products.itertuples(index=False):
        pid = product.product_id
        step = routine_step(product.category, product.subcategory, product.product_name)
        concern = concern_values.get(pid, "")
        if step not in QUOTAS or (not concern and pid not in picks):
            continue

        has_name_en = bool(product.product_name_en.strip())
        has_brand_en = bool(brand_en.get(product.brand, "").strip())
        has_offer = pid in global_urls
        is_pick = pid in picks
        best_rank = best_ranks.get(pid)
        awards_count = int(award_counts.get(pid, 0))

        score = 0.0
        score += 50 if is_pick else 0
        score += 20 if has_offer else 0
        score += 15 if has_name_en else 0
        score += 8 if has_brand_en else 0
        score += min(int(skin_counts.get(pid, 0)), 5) * 2
        score += 5 if concern else 0
        score += min(awards_count, 3) * 2
        if best_rank is not None:
            score += max(0, 16 - float(best_rank))

        candidates.append(
            {
                "product_id": pid,
                "brand_ko": product.brand,
                "brand_en": brand_en.get(product.brand, ""),
                "product_name_ko": product.product_name,
                "product_name_en": product.product_name_en,
                "category_raw": product.category,
                "subcategory_raw": product.subcategory,
                "routine_step": step,
                "skin_types_raw": skin_values.get(pid, ""),
                "concerns_raw": concern,
                "texture_raw": texture_values.get(pid, ""),
                "best_source_rank": "" if best_rank is None else int(best_rank),
                "award_count": awards_count,
                "oliveyoung_global_url": global_urls.get(pid, ""),
                "existing_pick": is_pick,
                "selection_score": score,
            }
        )

    frame = pd.DataFrame(candidates)
    selected = []
    for step, quota in QUOTAS.items():
        pool = frame[frame.routine_step == step].copy()
        pool = pool.sort_values(
            ["selection_score", "product_id"], ascending=[False, True]
        )

        # Preserve products that have already crossed the existing public Picks
        # review. Then spread primary-concern coverage across the remaining
        # slots before filling by score.
        used_concerns: set[str] = set()
        chosen_ids: set[str] = set()
        for row in pool[pool.existing_pick].itertuples(index=False):
            selected.append(row._asdict())
            chosen_ids.add(row.product_id)
            if row.concerns_raw:
                used_concerns.add(row.concerns_raw.split("|")[0])
            if len(chosen_ids) >= quota:
                break

        for row in pool.itertuples(index=False):
            if row.product_id in chosen_ids:
                continue
            primary = row.concerns_raw.split("|")[0] if row.concerns_raw else ""
            if primary and primary not in used_concerns:
                selected.append(row._asdict())
                chosen_ids.add(row.product_id)
                used_concerns.add(primary)
            if len(chosen_ids) >= quota:
                break

        if len(chosen_ids) < quota:
            for row in pool.itertuples(index=False):
                if row.product_id in chosen_ids:
                    continue
                selected.append(row._asdict())
                chosen_ids.add(row.product_id)
                if len(chosen_ids) >= quota:
                    break

    queue = pd.DataFrame(selected)
    if queue.product_id.duplicated().any():
        raise RuntimeError("promotion queue contains duplicate product IDs")

    queue["normalized_skin_types"] = ""
    queue["normalized_concerns"] = ""
    queue["texture_finish_review"] = ""
    queue["caution_review"] = ""
    queue["image_status"] = "needs_review"
    queue["editorial_status"] = "needs_review"
    queue["review_notes"] = ""
    queue["missing_for_promotion"] = queue.apply(
        lambda row: "|".join(
            label
            for value, label in [
                (row.product_name_en, "product_name_en"),
                (row.brand_en, "brand_en"),
                (row.oliveyoung_global_url, "oliveyoung_global_offer"),
                (row.texture_raw, "texture_finish"),
            ]
            if not str(value).strip()
        ),
        axis=1,
    )

    column_order = [
        "product_id",
        "routine_step",
        "brand_ko",
        "brand_en",
        "product_name_ko",
        "product_name_en",
        "category_raw",
        "subcategory_raw",
        "skin_types_raw",
        "concerns_raw",
        "texture_raw",
        "best_source_rank",
        "award_count",
        "oliveyoung_global_url",
        "existing_pick",
        "selection_score",
        "normalized_skin_types",
        "normalized_concerns",
        "texture_finish_review",
        "caution_review",
        "image_status",
        "editorial_status",
        "missing_for_promotion",
        "review_notes",
    ]
    queue = queue[column_order].sort_values(
        ["routine_step", "selection_score", "product_id"],
        ascending=[True, False, True],
    )
    queue.to_csv(OUTPUT, index=False, encoding="utf-8-sig")

    print(f"검수 후보 {len(queue)}건 → {OUTPUT}")
    for step in QUOTAS:
        print(f"  {step}: {int((queue.routine_step == step).sum())}")
    print(f"  기존 picks 포함: {int(queue.existing_pick.sum())}/{len(picks)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
