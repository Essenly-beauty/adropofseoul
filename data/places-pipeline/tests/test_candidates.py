# -*- coding: utf-8 -*-
"""candidates.py 다운로드/파싱 단위 테스트. 네트워크 호출 없음 — 전부 fixture 기반."""
import sys
from pathlib import Path

PIPELINE = Path(__file__).resolve().parent.parent
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "localdata_sample.csv"

sys.path.insert(0, str(PIPELINE))

# 실제 컬럼 헤더(2026-07-23, ?orgCode=3130000 응답에서 캡처, CP949 디코딩 후 그대로)
REAL_HEADER = [
    "개방자치단체코드", "관리번호", "인허가일자", "영업상태명", "폐업일자", "소재지면적",
    "소재지우편번호", "도로명우편번호", "사업장명", "업태구분명", "데이터갱신구분",
    "건물소유구분명", "건물지상층수", "건물지하층수", "남성종사자수", "다중이용업소여부",
    "데이터갱신시점", "도로명주소", "사용끝지상층", "사용끝지하층", "사용시작지상층",
    "사용시작지하층", "상세영업상태명", "상세영업상태코드", "여성종사자수", "영업상태코드",
    "위생업태명", "의자수", "전화번호", "조건부허가시작일자", "조건부허가신고사유",
    "조건부허가종료일자", "좌표정보(X)", "좌표정보(Y)", "지번주소", "침대수", "최종수정시점",
]


def test_districts_has_three_entries_with_correct_org_codes():
    import candidates

    assert set(candidates.DISTRICTS.keys()) == {"gangnam", "mapo", "junggu"}
    assert candidates.DISTRICTS["gangnam"]["org"] == "3220000"
    assert candidates.DISTRICTS["mapo"]["org"] == "3130000"
    assert candidates.DISTRICTS["junggu"]["org"] == "3010000"
    # hub + neighborhoods present (used downstream by Task 2)
    assert candidates.DISTRICTS["mapo"]["hub"] == "hongdae"
    assert "서교동" in candidates.DISTRICTS["mapo"]["neighborhoods"]


def test_parse_rows_decodes_cp949_and_strips_whitespace():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    assert len(rows) == 4

    # row 4 is the deliberately-padded row (trailing spaces in real data)
    padded = rows[3]
    assert padded["사업장명"] == "트레일링 테스트"  # no trailing spaces after strip
    assert padded["지번주소"] == "서울특별시 마포구 아현동 8-27"
    assert padded["좌표정보(X)"] == "194240.686214141"
    assert padded["좌표정보(Y)"] == "450282.191637742"


def test_parse_rows_keys_match_real_header():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    assert list(rows[0].keys()) == REAL_HEADER


def test_parse_rows_open_salon_row():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    salon = rows[0]
    assert salon["사업장명"] == "청담헤어살롱"
    assert salon["업태구분명"] == "일반미용업"
    assert salon["상세영업상태명"] == "영업"
    assert "청담동" in salon["도로명주소"]


def test_parse_rows_closed_row():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    closed = rows[1]
    assert closed["상세영업상태명"] == "폐업"
    assert closed["영업상태코드"] == "03"


def test_parse_rows_nail_row_comma_combined_field():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    nail = rows[2]
    assert nail["업태구분명"] == "네일아트업"
    assert "네일미용업" in nail["위생업태명"]


def test_download_district_sends_referer_header(monkeypatch, tmp_path):
    """download_district must send the Referer header (mandatory per spec) — verified
    via a stubbed requests.get, no real network call."""
    import candidates

    captured = {}

    class FakeResponse:
        status_code = 200
        content = b"header\nrow\n"

        def raise_for_status(self):
            pass

    def fake_get(url, headers=None, params=None, timeout=None, **kwargs):
        captured["url"] = url
        captured["headers"] = headers
        captured["params"] = params
        captured["timeout"] = timeout
        return FakeResponse()

    monkeypatch.setattr(candidates.requests, "get", fake_get)

    path = candidates.download_district("mapo", str(tmp_path))

    assert captured["headers"]["Referer"] == "https://www.data.go.kr/"
    assert captured["params"]["orgCode"] == "3130000"
    assert Path(path).exists()
    assert Path(path).read_bytes() == b"header\nrow\n"
