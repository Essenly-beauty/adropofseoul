"""Remove backgrounds without regenerating products and standardize catalog assets."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from PIL import Image
from rembg import new_session, remove


DIR = Path(__file__).resolve().parent / "csv"
ENCODING = "utf-8-sig"
CANVAS_SIZE = 1200
SUBJECT_MAX = 960


def fit_to_canvas(image: Image.Image, background: tuple[int, int, int, int]) -> Image.Image:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if not bounds:
        raise ValueError("background removal produced an empty image")
    subject = image.crop(bounds)
    subject.thumbnail((SUBJECT_MAX, SUBJECT_MAX), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), background)
    position = ((CANVAS_SIZE - subject.width) // 2, (CANVAS_SIZE - subject.height) // 2)
    canvas.alpha_composite(subject, position)
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--clean-dir", type=Path, required=True)
    parser.add_argument("--final-dir", type=Path, required=True)
    parser.add_argument("--model", default="isnet-general-use")
    args = parser.parse_args()
    args.clean_dir.mkdir(parents=True, exist_ok=True)
    args.final_dir.mkdir(parents=True, exist_ok=True)

    queue_path = DIR / "product_images.csv"
    with queue_path.open(encoding=ENCODING, newline="") as handle:
        reader = csv.DictReader(handle)
        fields = list(reader.fieldnames or [])
        rows = list(reader)
    by_id = {row["product_id"]: row for row in rows}

    def save_queue() -> None:
        with queue_path.open("w", encoding=ENCODING, newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)

    session = new_session(args.model)
    processed = 0

    for source_path in sorted(args.source_dir.glob("P*_source.*")):
        product_id = source_path.name.split("_", 1)[0]
        row = by_id.get(product_id)
        if not row or row["processing_status"] != "source_collected":
            continue
        try:
            source = Image.open(source_path).convert("RGBA")
            cutout = remove(source, session=session, post_process_mask=True)
            clean = fit_to_canvas(cutout, (255, 255, 255, 0))
            final = Image.new("RGB", clean.size, "white")
            final.paste(clean, mask=clean.getchannel("A"))
            clean_name = f"{product_id}_clean.png"
            final_name = f"{product_id}_final.webp"
            clean.save(args.clean_dir / clean_name, optimize=True)
            final.save(args.final_dir / final_name, "WEBP", quality=92, method=6)
            row["clean_file_name"] = clean_name
            row["final_file_name"] = final_name
            row["processing_status"] = "processed_needs_review"
            row["review_status"] = "pending"
            save_queue()
            processed += 1
            print(f"processed {product_id}", flush=True)
        except Exception as error:
            row["processing_status"] = "processing_failed"
            row["notes"] = str(error)[:300]
            save_queue()
            print(f"failed {product_id}: {error}", flush=True)

    save_queue()
    print(f"processed {processed} images")


if __name__ == "__main__":
    main()
