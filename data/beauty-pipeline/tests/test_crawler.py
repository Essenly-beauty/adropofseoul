# -*- coding: utf-8 -*-
"""크롤러는 뼈대만: 네트워크에 절대 나가지 않는 것을 검증."""
import sys
from pathlib import Path

import pytest

from conftest import PIPELINE, run

sys.path.insert(0, str(PIPELINE))


def test_no_args_prints_usage_and_exits(pipeline: Path):
    r = run(pipeline, "crawler.py")
    assert r.returncode == 2  # argparse: 필수 인자 누락
    assert "usage" in r.stderr.lower()


def test_parse_product_is_explicit_stub():
    import crawler

    with pytest.raises(NotImplementedError):
        crawler.parse_product("<html></html>", "https://example.com/p/1")


def test_fetch_declares_bot_user_agent():
    import crawler

    assert "adropofseoul" in crawler.UA
    assert "jj@whatap.io" in crawler.UA
