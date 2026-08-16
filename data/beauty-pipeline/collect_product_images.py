"""Collect likely representative images from verified official product pages."""

from __future__ import annotations

import argparse
import csv
import json
import mimetypes
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


DIR = Path(__file__).resolve().parent / "csv"
ENCODING = "utf-8-sig"
USER_AGENT = "Mozilla/5.0 (compatible; A-Drop-of-Seoul image research)"
SAMPLE_IDS = {
    "P00002", "P00003", "P00004", "P00006", "P00007",
    "P00008", "P00009", "P00010", "P00011", "P00012",
}


def extract_candidates(html: str, page_url: str) -> list[str]:
    candidates: list[str] = []
    for tag in re.findall(r"<meta\b[^>]*>", html, flags=re.I):
        if not re.search(r"(?:og:image|twitter:image)", tag, flags=re.I):
            continue
        match = re.search(r"content=[\"']([^\"']+)", tag, flags=re.I)
        if match:
            candidates.append(urljoin(page_url, match.group(1).replace("&amp;", "&")))

    scripts = re.findall(
        r"<script\b[^>]*type=[\"']application/ld\+json[\"'][^>]*>(.*?)</script>",
        html,
        flags=re.I | re.S,
    )
    for script in scripts:
        try:
            payload = json.loads(script)
        except (json.JSONDecodeError, TypeError):
            continue
        items = payload if isinstance(payload, list) else [payload]
        for item in items:
            if not isinstance(item, dict):
                continue
            image = item.get("image")
            if isinstance(image, str):
                candidates.append(urljoin(page_url, image))
            elif isinstance(image, list):
                candidates.extend(urljoin(page_url, value) for value in image if isinstance(value, str))

    for tag in re.findall(r"<img\b[^>]*>", html, flags=re.I):
        for attr in ("data-src", "ec-data-src", "src"):
            match = re.search(rf"\b{attr}=[\"']([^\"']+)", tag, flags=re.I)
            if match and not match.group(1).startswith("data:"):
                candidates.append(urljoin(page_url, match.group(1).replace("&amp;", "&")))

    unique = []
    for candidate in candidates:
        if (
            candidate.startswith("http")
            and not re.search(r"[\s{}()]", candidate)
            and candidate not in unique
        ):
            unique.append(candidate)
    return unique


def candidate_score(url: str) -> int:
    lowered = url.lower()
    score = 0
    for marker, points in (
        ("detail", 8), ("product", 6), ("goods", 5), ("zoom", 5),
        ("big", 4), ("large", 4), ("main", 3), ("thumb", -3),
        ("banner", -8), ("logo", -10), ("icon", -10), ("common", -4),
    ):
        if marker in lowered:
            score += points
    return score


def extension(content_type: str, url: str) -> str:
    guessed = mimetypes.guess_extension(content_type.split(";")[0].strip())
    if guessed in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return ".jpg" if guessed == ".jpeg" else guessed
    suffix = Path(urlparse(url).path).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"} else ".jpg"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--sample", action="store_true")
    parser.add_argument("--retry-failed", action="store_true")
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    queue_path = DIR / "product_images.csv"
    with queue_path.open(encoding=ENCODING, newline="") as handle:
        reader = csv.DictReader(handle)
        fields = list(reader.fieldnames or [])
        rows = list(reader)

    def save_queue() -> None:
        with queue_path.open("w", encoding=ENCODING, newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)

    collected = 0
    for row in rows:
        if args.sample and row["product_id"] not in SAMPLE_IDS:
            continue
        if row["processing_status"] not in {"pending", "collection_failed"}:
            continue
        if row["processing_status"] == "collection_failed" and not args.retry_failed:
            continue
        page_url = row["official_product_page_url"].strip()
        if not page_url:
            row["processing_status"] = "source_lookup_required"
            row["notes"] = "verified official product page URL unavailable"
            continue
        try:
            request = Request(page_url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=30) as response:
                html = response.read().decode(response.headers.get_content_charset() or "utf-8", errors="replace")
            candidates = sorted(
                extract_candidates(html, page_url),
                key=candidate_score,
                reverse=True,
            )
            if not candidates:
                raise ValueError("no image candidates")
            image_url = candidates[0]
            image_request = Request(image_url, headers={"User-Agent": USER_AGENT, "Referer": page_url})
            with urlopen(image_request, timeout=30) as image_response:
                content_type = image_response.headers.get("content-type", "")
                if not content_type.startswith("image/"):
                    raise ValueError("selected URL is not an image")
                content = image_response.read()
            suffix = extension(content_type, image_url)
            file_name = f"{row['product_id']}_source{suffix}"
            (args.output_dir / file_name).write_bytes(content)
            row["source_image_url"] = image_url
            row["source_file_name"] = file_name
            row["match_status"] = "needs_review"
            row["processing_status"] = "source_collected"
            row["notes"] = f"auto-selected from {len(candidates)} page image candidates"
            collected += 1
            save_queue()
            print(f"collected {row['product_id']} {file_name}", flush=True)
        except Exception as error:
            row["processing_status"] = "collection_failed"
            row["notes"] = re.sub(r"\s+", " ", str(error))[:300]
            save_queue()
            print(f"failed {row['product_id']}: {error}", flush=True)

    save_queue()
    print(f"collected {collected} images")


if __name__ == "__main__":
    main()
