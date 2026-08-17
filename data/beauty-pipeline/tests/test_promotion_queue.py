# -*- coding: utf-8 -*-
from pathlib import Path

import pandas as pd

from conftest import run, write_masters


def test_builds_review_only_queue_and_preserves_existing_pick(pipeline: Path):
    write_masters(pipeline / "csv")
    (pipeline / "csv" / "picks.txt").write_text("P00002\n", encoding="utf-8")

    result = run(pipeline, "build_promotion_queue.py")
    assert result.returncode == 0, result.stdout + result.stderr

    queue = pd.read_csv(pipeline / "csv" / "product_promotion_queue.csv")
    assert set(queue.product_id) == {"P00001", "P00002"}
    assert queue.product_id.is_unique
    assert set(queue.routine_step) == {"toner"}
    assert set(queue.editorial_status) == {"needs_review"}

    pick = queue.set_index("product_id").loc["P00002"]
    assert bool(pick.existing_pick)
    assert "product_name_en" in pick.missing_for_promotion


def test_queue_is_deterministic(pipeline: Path):
    write_masters(pipeline / "csv")
    (pipeline / "csv" / "picks.txt").write_text("P00001\n", encoding="utf-8")

    first = run(pipeline, "build_promotion_queue.py")
    assert first.returncode == 0, first.stdout + first.stderr
    first_bytes = (pipeline / "csv" / "product_promotion_queue.csv").read_bytes()

    second = run(pipeline, "build_promotion_queue.py")
    assert second.returncode == 0, second.stdout + second.stderr
    assert (pipeline / "csv" / "product_promotion_queue.csv").read_bytes() == first_bytes
