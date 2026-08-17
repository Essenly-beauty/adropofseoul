# -*- coding: utf-8 -*-
"""Build a read-only, product-level coverage report for recommendation planning.

The report is diagnostic only. It never promotes a product to the public app and
does not treat source popularity as evidence of personal suitability.
"""

from pathlib import Path

import pandas as pd


DIR = Path(__file__).resolve().parent / "csv"
OUTPUT = DIR / "product_coverage_report.csv"
SRC_GLOBAL = "올리브영글로벌"


def rd(name: str) -> pd.DataFrame:
    return pd.read_csv(DIR / name, dtype=str).fillna("")


def ids(df: pd.DataFrame, predicate=None) -> set[str]:
    if predicate is not None:
        df = df[predicate(df)]
    return set(df.product_id)


def main() -> int:
    products = rd("products.csv")
    brands = rd("brands.csv")
    sources = rd("product_sources.csv")
    skin = rd("skin_types.csv")
    concerns = rd("concerns.csv")
    textures = rd("textures.csv")
    ages = rd("age_groups.csv")
    rankings = rd("rankings.csv")
    awards = rd("awards.csv")

    brand_en = {
        brand: english
        for brand, english in zip(brands.brand, brands.brand_en)
        if brand and english
    }
    source_ids = ids(sources)
    global_offer_ids = ids(sources, lambda d: d.source == SRC_GLOBAL)
    hwahae_source_ids = ids(sources, lambda d: d.source == "화해")
    skin_ids = ids(skin)
    concern_ids = ids(concerns)
    texture_ids = ids(textures)
    age_ids = ids(ages)
    ranking_ids = ids(rankings)
    award_ids = ids(awards)

    rows = []
    for product in products.itertuples(index=False):
        pid = product.product_id
        has_name_en = bool(product.product_name_en.strip())
        has_brand_en = bool(brand_en.get(product.brand, "").strip())
        has_category = bool(product.category.strip())
        has_subcategory = bool(product.subcategory.strip())
        has_skin = pid in skin_ids
        has_concern = pid in concern_ids
        has_global_offer = pid in global_offer_ids

        # "Candidate" means ready for human review, not safe to auto-publish.
        # An English identity and a concern/skin signal are the minimum needed
        # for an international, explainable recommendation preview.
        recommendation_candidate = (
            has_name_en
            and has_brand_en
            and has_category
            and (has_skin or has_concern)
        )
        commerce_candidate = recommendation_candidate and has_global_offer

        missing = []
        for present, label in [
            (has_name_en, "product_name_en"),
            (has_brand_en, "brand_en"),
            (has_category, "category"),
            (has_subcategory, "subcategory"),
            (has_skin, "skin_type_signal"),
            (has_concern, "concern_signal"),
            (pid in texture_ids, "texture"),
            (has_global_offer, "oliveyoung_global_offer"),
        ]:
            if not present:
                missing.append(label)

        rows.append(
            {
                "product_id": pid,
                "brand_ko": product.brand,
                "brand_en": brand_en.get(product.brand, ""),
                "product_name_ko": product.product_name,
                "product_name_en": product.product_name_en,
                "category": product.category,
                "subcategory": product.subcategory,
                "has_hwahae_source": pid in hwahae_source_ids,
                "has_any_source": pid in source_ids,
                "has_skin_type_signal": has_skin,
                "has_concern_signal": has_concern,
                "has_texture": pid in texture_ids,
                "has_age_signal": pid in age_ids,
                "has_ranking": pid in ranking_ids,
                "has_award": pid in award_ids,
                "has_oliveyoung_global_offer": has_global_offer,
                "recommendation_review_candidate": recommendation_candidate,
                "commerce_review_candidate": commerce_candidate,
                "missing_for_review": "|".join(missing),
            }
        )

    report = pd.DataFrame(rows)
    report.to_csv(OUTPUT, index=False, encoding="utf-8-sig")

    print(f"제품 {len(report)}건 → {OUTPUT}")
    print(
        "추천 검수 후보 "
        f"{int(report.recommendation_review_candidate.sum())}건 · "
        "올리브영 구매 연결 후보 "
        f"{int(report.commerce_review_candidate.sum())}건"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
