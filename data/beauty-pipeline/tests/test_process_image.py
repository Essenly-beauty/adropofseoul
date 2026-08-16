# -*- coding: utf-8 -*-
"""이미지 규격화 검증 — rembg는 주입으로 대체(테스트는 네트워크·모델 불필요)."""
import sys
from pathlib import Path

from PIL import Image

from conftest import PIPELINE

sys.path.insert(0, str(PIPELINE))


def make_raw(tmp_path: Path) -> Path:
    """가장자리 투명 + 중앙 100x50 빨간 사각형 RGBA 원본."""
    img = Image.new("RGBA", (300, 200), (0, 0, 0, 0))
    for x in range(100, 200):
        for y in range(75, 125):
            img.putpixel((x, y), (255, 0, 0, 255))
    p = tmp_path / "P00001.png"
    img.save(p)
    return p


def test_process_file_outputs_padded_square_webp(tmp_path: Path):
    import process_image

    src = make_raw(tmp_path)
    dst = tmp_path / "torriden-dive-in-serum-50ml.webp"
    process_image.process_file(src, dst, remove_fn=lambda im: im)  # 누끼 no-op 주입

    out = Image.open(dst)
    assert out.size == (1200, 1200) and out.format == "WEBP"
    assert out.mode == "RGB"  # 흰 배경 합성

    # 콘텐츠(비흰색)의 최대 변이 캔버스의 80% (=960px)
    rgb = out.convert("RGB")
    non_white = [
        (x, y)
        for x in range(0, 1200, 4)
        for y in range(0, 1200, 4)
        if rgb.getpixel((x, y)) != (255, 255, 255)
    ]
    xs = [p[0] for p in non_white]
    ys = [p[1] for p in non_white]
    width = max(xs) - min(xs)
    assert 940 <= width <= 964  # 4px 샘플링 오차 허용
    # 중앙 배치: 좌우 여백 대칭(±8px)
    assert abs(min(xs) - (1199 - max(xs))) <= 8
    assert abs(min(ys) - (1199 - max(ys))) <= 8


def test_process_file_trims_transparent_border(tmp_path: Path):
    """원본의 투명 여백 크기와 무관하게 같은 결과가 나온다."""
    import process_image

    small = Image.new("RGBA", (120, 70), (0, 0, 0, 0))
    for x in range(10, 110):
        for y in range(10, 60):
            small.putpixel((x, y), (255, 0, 0, 255))
    src2 = tmp_path / "P00002.png"
    small.save(src2)

    d1, d2 = tmp_path / "a.webp", tmp_path / "b.webp"
    process_image.process_file(make_raw(tmp_path), d1, remove_fn=lambda im: im)
    process_image.process_file(src2, d2, remove_fn=lambda im: im)
    assert Image.open(d1).size == Image.open(d2).size == (1200, 1200)
