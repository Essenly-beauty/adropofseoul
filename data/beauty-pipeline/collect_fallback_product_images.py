"""Collect fallback catalog images for products without an accepted official image."""

from __future__ import annotations

import argparse
import csv
import mimetypes
import re
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from collect_product_images import ENCODING, USER_AGENT, candidate_score, extract_candidates


DIR = Path(__file__).resolve().parent / "csv"
RETRY_STATUSES = {
    "source_lookup_required",
    "collection_failed",
    "processing_failed",
    "replacement_required",
    "fallback_collection_failed",
}


def suffix_for(content_type: str, url: str) -> str:
    guessed = mimetypes.guess_extension(content_type.split(";", 1)[0].strip())
    if guessed in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return ".jpg" if guessed == ".jpeg" else guessed
    suffix = Path(urlparse(url).path).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"} else ".jpg"


def save(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding=ENCODING, newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    queue_path = DIR / "product_images.csv"
    with queue_path.open(encoding=ENCODING, newline="") as handle:
        reader = csv.DictReader(handle)
        fields = list(reader.fieldnames or [])
        rows = list(reader)
    with (DIR / "product_research.csv").open(encoding=ENCODING, newline="") as handle:
        research = {row["product_id"]: row for row in csv.DictReader(handle)}

    collected = 0
    for row in rows:
        if row["processing_status"] not in RETRY_STATUSES:
            continue
        evidence = research.get(row["product_id"], {})
        pages = []
        for source_type, field in (
            ("brand_official_alternative", "brand_official_product_url"),
            ("brand_official_alternative", "brand_official_product_url_ko"),
            ("oliveyoung_global", "oliveyoung_global_url"),
            ("review_retailer", "review_source_urls"),
            ("hwahae", "hwahae_url"),
        ):
            for page_url in evidence.get(field, "").split("|"):
                page_url = page_url.strip()
                if (
                    page_url
                    and page_url != row["official_product_page_url"].strip()
                    and not any(blocked in page_url for blocked in ("reddit.com", "youtube.com", "youtu.be"))
                ):
                    pages.append((source_type, page_url))
        error_messages = []
        for source_type, page_url in pages:
            if not page_url:
                continue
            try:
                request = Request(page_url, headers={"User-Agent": USER_AGENT})
                with urlopen(request, timeout=30) as response:
                    charset = response.headers.get_content_charset() or "utf-8"
                    html = response.read().decode(charset, errors="replace")
                candidates = sorted(extract_candidates(html, page_url), key=candidate_score, reverse=True)
                if not candidates:
                    raise ValueError("no image candidates")
                image_url = candidates[0]
                image_request = Request(image_url, headers={"User-Agent": USER_AGENT, "Referer": page_url})
                with urlopen(image_request, timeout=30) as response:
                    content_type = response.headers.get("content-type", "")
                    if not content_type.startswith("image/"):
                        raise ValueError("selected URL is not an image")
                    content = response.read()
                suffix = suffix_for(content_type, image_url)
                file_name = f"{row['product_id']}_source{suffix}"
                for old_path in args.output_dir.glob(f"{row['product_id']}_source.*"):
                    old_path.unlink()
                (args.output_dir / file_name).write_bytes(content)
                row["source_image_url"] = image_url
                row["source_file_name"] = file_name
                row["source_type"] = source_type
                row["match_status"] = "needs_review"
                row["processing_status"] = "source_collected"
                row["review_status"] = "pending"
                row["clean_file_name"] = ""
                row["final_file_name"] = ""
                row["notes"] = f"fallback selected from {source_type}"
                save(queue_path, fields, rows)
                collected += 1
                print(f"collected {row['product_id']} from {source_type}", flush=True)
                break
            except Exception as error:
                error_messages.append(f"{source_type}: {error}")
        else:
            row["processing_status"] = "fallback_collection_failed"
            row["notes"] = re.sub(r"\s+", " ", " | ".join(error_messages))[:300]
            save(queue_path, fields, rows)
            print(f"failed {row['product_id']}: {row['notes']}", flush=True)
    print(f"collected {collected} fallback images")


if __name__ == "__main__":
    main()
