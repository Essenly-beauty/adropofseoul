# -*- coding: utf-8 -*-
"""candidates.py 다운로드/파싱 단위 테스트. 네트워크 호출 없음 — 전부 fixture 기반."""
import csv
import io
import json
import sys
from pathlib import Path

PIPELINE = Path(__file__).resolve().parent.parent
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "localdata_sample.csv"
PLACES_FIXTURE = Path(__file__).resolve().parent / "fixtures" / "places_sample.json"

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
    assert len(rows) == 8  # 4 from Task 1 + 4 category-mapping fixtures added in Task 2

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


# ---------------------------------------------------------------------------
# Task 2: category mapping (map_category)
# ---------------------------------------------------------------------------


def test_category_rules_match_spec_table_exactly():
    import candidates

    assert candidates.CATEGORY_RULES == [
        ("salon", ["일반미용업", "종합미용업", "미용업"]),
        ("nail_lash", ["네일아트업", "네일미용업"]),
        ("facial", ["피부미용업", "두피관리업"]),
        ("makeup", ["메이크업업", "화장ㆍ분장", "화장·분장"]),
    ]


def test_map_category_upcode_direct_hit_salon():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    assert candidates.map_category(rows[0]) == "salon"  # 업태구분명 == 일반미용업


def test_map_category_upcode_direct_hit_nail_lash():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    # 업태구분명 == 네일아트업; 위생업태명 also carries 피부미용업/화장ㆍ분장 combos
    # but 업태구분명 is checked (and resolved) before ever falling back to 위생업태명.
    assert candidates.map_category(rows[2]) == "nail_lash"


def test_map_category_bare_biyongeop_whole_value_via_sanitation():
    """위생업태명 == '미용업' 그 자체(콤마 없는 전체 값)일 때만 salon 매치 — bare 토큰은
    부분 문자열이 아니라 값 전체(또는 콤마 분리 파트 전체)와 완전히 같아야 한다."""
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    row = rows[4]  # 업태구분명=이용업(비매핑), 위생업태명=미용업
    assert row["위생업태명"] == "미용업"
    assert candidates.map_category(row) == "salon"


def test_map_category_bare_biyongeop_must_not_substring_match_nail():
    """'네일미용업'은 '미용업'을 부분 문자열로 포함하지만 salon으로 매치되면 안 된다 —
    반드시 nail_lash(정확 토큰 매치)로 떨어져야 한다."""
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    row = rows[5]  # 업태구분명=이용업(비매핑), 위생업태명=네일미용업
    assert row["위생업태명"] == "네일미용업"
    assert candidates.map_category(row) == "nail_lash"


def test_map_category_comma_combined_sanitation_first_part_wins():
    """위생업태명 '피부미용업, 네일미용업'은 첫 콤마 파트(피부미용업)가 전체 규칙을 통과해
    facial로 확정된다 — CATEGORY_RULES 테이블 순서상 nail_lash가 facial보다 앞이지만,
    위생업태명 안에서는 파트 등장 순서가 우선한다(문서화된 해석)."""
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    row = rows[6]  # 업태구분명=이용업(비매핑), 위생업태명="피부미용업, 네일미용업"
    assert row["위생업태명"] == "피부미용업, 네일미용업"
    assert candidates.map_category(row) == "facial"


def test_map_category_unmapped_row_returns_none():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    row = rows[7]  # 업태구분명=이용업, 위생업태명=이용업 — 둘 다 어떤 규칙에도 안 걸림
    assert candidates.map_category(row) is None


# ---------------------------------------------------------------------------
# Task 2: open/closed filter (is_open)
# ---------------------------------------------------------------------------


def test_is_open_true_for_open_row():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    assert candidates.is_open(rows[0]) is True


def test_is_open_false_for_closed_row():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    assert candidates.is_open(rows[1]) is False


# ---------------------------------------------------------------------------
# Task 2: neighborhood filter (match_neighborhood)
# ---------------------------------------------------------------------------


def test_match_neighborhood_matches_road_address():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    row = rows[0]  # 도로명주소에 "(청담동)" 포함
    assert candidates.match_neighborhood(row, ["청담동", "압구정", "신사동"]) is True


def test_match_neighborhood_falls_back_to_jibun_address():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    row = rows[1]  # 도로명주소 없음(폐업 행), 지번주소에만 "염리동" 존재
    assert row["도로명주소"] == ""
    assert candidates.match_neighborhood(row, ["염리동"]) is True


def test_match_neighborhood_no_match_returns_false():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    row = rows[0]
    assert candidates.match_neighborhood(row, ["명동", "충무로", "을지로"]) is False


# ---------------------------------------------------------------------------
# Task 2: existing-place dedupe hint (existing_slug_hint)
# ---------------------------------------------------------------------------


def test_existing_slug_hint_matches_via_normalized_name_kr():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    places = json.loads(PLACES_FIXTURE.read_text(encoding="utf-8"))
    row = rows[0]  # 사업장명=청담헤어살롱; fixture nameKr="청담헤어살롱 (강남점)"
    assert candidates.existing_slug_hint(row, places) == "cheongdam-hair-salon-existing"


def test_existing_slug_hint_matches_via_address_containment():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    places = json.loads(PLACES_FIXTURE.read_text(encoding="utf-8"))
    row = rows[1]  # 이름은 안 겹치지만 지번주소가 fixture address에 포함됨
    assert candidates.existing_slug_hint(row, places) == "mapo-yeomni-existing-by-address"


def test_existing_slug_hint_returns_none_when_no_match():
    import candidates

    rows = candidates.parse_rows(str(FIXTURE))
    places = json.loads(PLACES_FIXTURE.read_text(encoding="utf-8"))
    row = rows[2]  # 홍대네일아트 — fixture에 이름/주소 모두 겹치지 않음
    assert candidates.existing_slug_hint(row, places) is None


# ---------------------------------------------------------------------------
# Task 2: CSV emitter (emit_candidates)
# ---------------------------------------------------------------------------


def test_emit_candidates_writes_exact_columns_and_returns_counts(tmp_path):
    import candidates

    rows = [
        {
            "관리번호": "3220000-101-2020-00001",
            "사업장명": "청담헤어살롱",
            "category": "salon",
            "업태구분명": "일반미용업",
            "위생업태명": "미용업",
            "도로명주소": "서울특별시 강남구 도산대로 102, 2층 (청담동)",
            "지번주소": "서울특별시 강남구 청담동 100-1",
            "전화번호": "0212345678",
            "인허가일자": "2020-05-14",
            "상세영업상태명": "영업",
            "existing_slug": "cheongdam-hair-salon-existing",
        },
        {
            "관리번호": "3130000-226-2024-00010",
            "사업장명": "홍대네일아트",
            "category": "nail_lash",
            "업태구분명": "네일아트업",
            "위생업태명": "피부미용업, 네일미용업, 화장ㆍ분장 미용업",
            "도로명주소": "서울특별시 마포구 와우산로 20, 2층 (서교동)",
            "지번주소": "서울특별시 마포구 서교동 200-5",
            "전화번호": "",
            "인허가일자": "2024-02-10",
            "상세영업상태명": "영업",
            "existing_slug": "",
        },
    ]

    out_path = tmp_path / "candidates_gangnam.csv"
    counts = candidates.emit_candidates(rows, "gangnam", str(out_path))

    assert counts == {"salon": 1, "nail_lash": 1}

    with out_path.open(encoding="utf-8") as fh:
        reader = csv.reader(fh)
        header = next(reader)
        data_rows = list(reader)

    assert header == [
        "관리번호",
        "사업장명",
        "category",
        "업태구분명",
        "위생업태명",
        "도로명주소",
        "지번주소",
        "전화",
        "인허가일자",
        "영업상태",
        "hub",
        "existing_slug",
        "status",
    ]
    assert len(data_rows) == 2

    first = dict(zip(header, data_rows[0]))
    assert first["관리번호"] == "3220000-101-2020-00001"
    assert first["사업장명"] == "청담헤어살롱"
    assert first["category"] == "salon"
    assert first["전화"] == "0212345678"  # mapped from 전화번호
    assert first["영업상태"] == "영업"  # mapped from 상세영업상태명
    assert first["hub"] == "gangnam-cheongdam"  # from DISTRICTS["gangnam"]["hub"]
    assert first["existing_slug"] == "cheongdam-hair-salon-existing"
    assert first["status"] == "PENDING_REVIEW"

    second = dict(zip(header, data_rows[1]))
    assert second["hub"] == "gangnam-cheongdam"
    assert second["existing_slug"] == ""
    assert second["status"] == "PENDING_REVIEW"
