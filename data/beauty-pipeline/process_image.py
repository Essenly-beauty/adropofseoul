# -*- coding: utf-8 -*-
"""[픽 이미지 도구] 권리 확보 원본 → 누끼(rembg) → 흰배경 정사각 WebP 규격화.

입력 : images/raw/<P#####>.<png|jpg|jpeg|webp>  (git ignore — 사람이 채운다)
출력 : images/out/<slug>.webp  (1200×1200, 콘텐츠 80%, 흰 배경)
slug : csv/picks_export.json 의 product_id→slug 매핑 (export_picks.py 먼저 실행)

저작권: raw 폴더에는 브랜드 프레스킷·직접 촬영 등 사용 권리가 확보된 원본만 넣는다.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
RAW, OUT = ROOT / "images" / "raw", ROOT / "images" / "out"
SIZE, FILL = 1200, 0.8


def _rembg_remove(img: Image.Image) -> Image.Image:
    from rembg import remove  # 지연 임포트 — 테스트/미설치 환경 보호

    return remove(img)


def process_file(src: Path, dst: Path, remove_fn=None) -> None:
    remove_fn = remove_fn or _rembg_remove
    img = remove_fn(Image.open(src).convert("RGBA"))

    bbox = img.getbbox()  # 투명 여백 트리밍
    if bbox:
        img = img.crop(bbox)

    target = int(SIZE * FILL)
    scale = target / max(img.width, img.height)
    img = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))))

    canvas = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 255))
    canvas.paste(img, ((SIZE - img.width) // 2, (SIZE - img.height) // 2), img)

    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(dst, "WEBP", quality=90)


def main() -> int:
    export = ROOT / "csv" / "picks_export.json"
    if not export.exists():
        raise SystemExit("picks_export.json 없음 — export_picks.py 먼저 실행")
    slug = {r["product_id"]: r["slug"] for r in json.loads(export.read_text(encoding="utf-8"))}

    raws = sorted(RAW.glob("*.*")) if RAW.exists() else []
    if not raws:
        raise SystemExit(f"원본 없음: {RAW} 에 P#####.png|jpg 를 넣으세요")

    done = 0
    for src in raws:
        pid = src.stem
        if pid not in slug:
            print(f"건너뜀: {src.name} — picks_export.json에 없는 ID")
            continue
        dst = OUT / f"{slug[pid]}.webp"
        process_file(src, dst)
        print(f"{src.name} → {dst.relative_to(ROOT)}")
        done += 1
    print(f"{done}건 처리")
    return 0


if __name__ == "__main__":
    sys.exit(main())
