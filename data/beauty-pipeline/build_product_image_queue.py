"""Build or refresh the product image sourcing and review queue."""

from __future__ import annotations

import csv
from pathlib import Path


DIR = Path(__file__).resolve().parent / "csv"
ENCODING = "utf-8-sig"
FIELDS = [
    "product_id",
    "brand_ko",
    "product_name_ko",
    "official_product_page_url",
    "source_image_url",
    "source_file_name",
    "clean_file_name",
    "final_file_name",
    "source_type",
    "match_status",
    "processing_status",
    "review_status",
    "drive_source_url",
    "drive_clean_url",
    "drive_final_url",
    "notes",
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding=ENCODING, newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    products = read_csv(DIR / "product_research.csv")
    output = DIR / "product_images.csv"
    existing = {
        row["product_id"]: row for row in read_csv(output)
    } if output.exists() else {}

    rows = []
    for product in products:
        product_id = product["product_id"]
        row = existing.get(product_id, {})
        official_url = product["brand_official_product_url_ko"].strip()
        rows.append(
            {
                "product_id": product_id,
                "brand_ko": product["brand_ko"],
                "product_name_ko": product["product_name_ko"],
                "official_product_page_url": official_url,
                "source_image_url": row.get("source_image_url", ""),
                "source_file_name": row.get("source_file_name", ""),
                "clean_file_name": row.get("clean_file_name", ""),
                "final_file_name": row.get("final_file_name", ""),
                "source_type": row.get(
                    "source_type", "brand_official" if official_url else "fallback_required"
                ),
                "match_status": row.get("match_status", "pending"),
                "processing_status": row.get("processing_status", "pending"),
                "review_status": row.get("review_status", "pending"),
                "drive_source_url": row.get("drive_source_url", ""),
                "drive_clean_url": row.get("drive_clean_url", ""),
                "drive_final_url": row.get("drive_final_url", ""),
                "notes": row.get("notes", ""),
            }
        )

    with output.open("w", encoding=ENCODING, newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {len(rows)} rows to {output}")


if __name__ == "__main__":
    main()
