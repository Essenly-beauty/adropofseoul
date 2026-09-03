import csv
import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSV_DIR = ROOT / "data" / "beauty-pipeline" / "csv"


def read_csv(name):
    with (CSV_DIR / name).open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def unique_join(values):
    return ", ".join(dict.fromkeys(value for value in values if value))


products = read_csv("products.csv")
skin_types = defaultdict(list)
skin_rankings = defaultdict(list)
for row in read_csv("skin_types.csv"):
    skin_types[row["product_id"]].append(row["skin_type_raw"])
    label = row["skin_type_raw"]
    if row["rank"]:
        label += f" {row['rank']}위"
    skin_rankings[row["product_id"]].append(label)

concerns = defaultdict(list)
for row in read_csv("concerns.csv"):
    concerns[row["product_id"]].append(row["concern_raw"])

textures = defaultdict(list)
for row in read_csv("textures.csv"):
    textures[row["product_id"]].append(row["texture"])

age_groups = defaultdict(list)
for row in read_csv("age_groups.csv"):
    label = row["age_group"]
    if row["rank"]:
        label += f" {row['rank']}위"
    age_groups[row["product_id"]].append(label)

awards = defaultdict(list)
for row in read_csv("awards.csv"):
    parts = [row["award_theme"], row["category"], row["subcategory"], row["concern"]]
    label = " · ".join(dict.fromkeys(part for part in parts if part))
    if row["award_rank"]:
        label += f" {row['award_rank']}위"
    awards[row["product_id"]].append(label)

rankings = defaultdict(list)
for row in read_csv("rankings.csv"):
    label = row["ranking_type"]
    if row["key"]:
        label += f" · {row['key']}"
    if row["rank"]:
        label += f" {row['rank']}위"
    rankings[row["product_id"]].append(label)

headers = [
    "skin_types",
    "skin_type_rankings",
    "concern_keywords",
    "texture",
    "age_group_rankings",
    "awards_summary",
    "ranking_summary",
]
rows = [headers]
for product in products:
    product_id = product["product_id"]
    rows.append(
        [
            unique_join(skin_types[product_id]),
            unique_join(skin_rankings[product_id]),
            unique_join(concerns[product_id]),
            unique_join(textures[product_id]),
            unique_join(age_groups[product_id]),
            unique_join(awards[product_id]),
            unique_join(rankings[product_id]),
        ]
    )

print(json.dumps(rows, ensure_ascii=False))
