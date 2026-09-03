import csv
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSV_DIR = ROOT / "data" / "beauty-pipeline" / "csv"
OUTPUT = ROOT / "data" / "beauty-pipeline" / "products_with_sources.csv"


def read_csv(name):
    with (CSV_DIR / name).open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


products = read_csv("products.csv")
sources = read_csv("product_sources.csv")
sources_by_product = defaultdict(list)
for source in sources:
    sources_by_product[source["product_id"]].append(source)

source_columns = []
for index in range(1, 4):
    source_columns.extend(
        [f"source_{index}", f"source_product_id_{index}", f"url_{index}"]
    )

fieldnames = list(products[0].keys()) + source_columns
with OUTPUT.open("w", encoding="utf-8-sig", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=fieldnames)
    writer.writeheader()
    for product in products:
        merged = dict(product)
        for index, source in enumerate(sources_by_product[product["product_id"]], start=1):
            merged[f"source_{index}"] = source["source"]
            merged[f"source_product_id_{index}"] = source["source_product_id"]
            merged[f"url_{index}"] = source["url"]
        writer.writerow(merged)

print(OUTPUT)
print(f"products={len(products)} sources={len(sources)}")
