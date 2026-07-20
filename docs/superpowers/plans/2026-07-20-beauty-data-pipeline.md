# Beauty Data Pipeline Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the missing pieces of the Hwahae↔Oliveyoung product-data merge pipeline as a self-contained workspace at `data/beauty-pipeline/` — no live crawling, no app/Supabase changes.

**Architecture:** A Python/pandas CSV pipeline folder inside the Next.js repo. Master CSVs live in `csv/`; every script resolves data via `DIR = Path(__file__).resolve().parent / "csv"` so scripts run from anywhere. Generated working files (`oliveyoung_crawl.json`, `reconcile_global.csv`, `*.bak.csv`, `review_queue.csv`) also land in `csv/`. Tests never touch the committed masters — they copy scripts + tiny fixture CSVs into a pytest `tmp_path` and run the scripts via subprocess.

**Tech Stack:** Python 3 (venv at `data/beauty-pipeline/.venv`), pandas, requests, beautifulsoup4, pytest.

## Global Constraints

- Source files come from `/Users/jj_whatap/Downloads/files (2)/` (scripts) and `/Users/jj_whatap/Downloads/files (2)/화해_제품_분류_csv/` (12 CSVs). Copy them; never modify the originals in Downloads.
- All CSVs are UTF-8 with BOM (`utf-8-sig`). Preserve that encoding everywhere.
- `product_id`(`P#####`)는 불변. 신규는 항상 다음 번호. (brief 절대 규칙 1)
- 기존 스크립트(`merge_oliveyoung.py`, `apply_global.py`, `inventory_raw_values.py`)의 병합 로직은 건드리지 않는다. 허용된 변경: ① `DIR` 상수 1줄, ② `merge_oliveyoung.py`의 `load_crawled()` 구현(+ `json` import).
- `reconcile_global.py`는 `matched_product_id`를 **절대 채우지 않는다** ("NEW"도 미리 넣지 않음).
- 크롤러는 기본 비활성: 인자 없이 실행하면 usage만 출력하고 종료. 테스트는 네트워크에 절대 나가지 않는다.
- Python 커밋 시 husky/lint-staged가 prettier를 돌리지만 `.py`는 ignore-unknown으로 통과함 — 특별 조치 불필요.
- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: Workspace setup (folder, CSVs, existing scripts, venv, CLAUDE.md)

**Files:**

- Create: `data/beauty-pipeline/` (folder)
- Create: `data/beauty-pipeline/csv/` — 12 CSVs copied from Downloads
- Create: `data/beauty-pipeline/merge_oliveyoung.py` (copy + DIR line change only — `load_crawled` stays `NotImplementedError` until Task 3)
- Create: `data/beauty-pipeline/apply_global.py` (copy + DIR line change only)
- Create: `data/beauty-pipeline/inventory_raw_values.py` (copy + DIR line change only)
- Create: `data/beauty-pipeline/requirements.txt`
- Create: `data/beauty-pipeline/.gitignore`
- Create: `data/beauty-pipeline/CLAUDE.md`

**Interfaces:**

- Produces: `data/beauty-pipeline/csv/*.csv` (masters), a working venv at `data/beauty-pipeline/.venv/bin/python`, and the three existing scripts with `DIR = Path(__file__).resolve().parent / "csv"`. All later tasks depend on this layout.

- [ ] **Step 1: Create folders and copy files**

```bash
cd /Users/jj_whatap/up/adropofseoul
mkdir -p data/beauty-pipeline/csv
cp "/Users/jj_whatap/Downloads/files (2)/화해_제품_분류_csv/"*.csv data/beauty-pipeline/csv/
cp "/Users/jj_whatap/Downloads/files (2)/merge_oliveyoung.py" data/beauty-pipeline/
cp "/Users/jj_whatap/Downloads/files (2)/apply_global.py" data/beauty-pipeline/
cp "/Users/jj_whatap/Downloads/files (2)/inventory_raw_values.py" data/beauty-pipeline/
ls data/beauty-pipeline/csv/ | wc -l   # expect 11 (12 files minus zip; verify: age_groups awards brands concern_map concerns product_sources products rankings skin_type_map skin_types textures)
```

Expected: 11 CSV files listed (the source folder holds 11 CSVs; "12" in the spec counted the zip).

- [ ] **Step 2: Change the DIR constant in each copied script**

In `data/beauty-pipeline/merge_oliveyoung.py` replace:

```python
DIR = Path(".")               # CSV들이 있는 폴더
```

with:

```python
DIR = Path(__file__).resolve().parent / "csv"   # 마스터 CSV 폴더
```

In `data/beauty-pipeline/apply_global.py` replace:

```python
DIR = Path("."); ENC = "utf-8-sig"
```

with:

```python
DIR = Path(__file__).resolve().parent / "csv"; ENC = "utf-8-sig"
```

In `data/beauty-pipeline/inventory_raw_values.py` replace:

```python
DIR = Path("."); ENC = "utf-8-sig"
```

with:

```python
DIR = Path(__file__).resolve().parent / "csv"; ENC = "utf-8-sig"
```

- [ ] **Step 3: Write requirements.txt**

`data/beauty-pipeline/requirements.txt`:

```
pandas>=2.0
requests>=2.31
beautifulsoup4>=4.12
pytest>=8.0
```

- [ ] **Step 4: Write .gitignore**

`data/beauty-pipeline/.gitignore`:

```
.venv/
__pycache__/
csv/*.bak.csv
csv/review_queue.csv
```

- [ ] **Step 5: Write CLAUDE.md**

`data/beauty-pipeline/CLAUDE.md` — the brief's rules adapted to this folder layout:

````markdown
# 뷰티 제품 데이터 파이프라인 (화해 마스터 + 올리브영 병합)

이 폴더는 K-뷰티 제품 CSV 마스터와 올리브영 병합 도구다. 앱(Next.js/Supabase)과는 독립적이다.

## 폴더 구성

- `csv/` — 마스터 CSV (UTF-8 BOM). 생성 파일(`*.bak.csv`, `review_queue.csv`, 크롤 JSON, `reconcile_global.csv`)도 여기 생긴다.
- `merge_oliveyoung.py` — 국내(한글) 자동 병합. 입력: `csv/oliveyoung_crawl.json`
- `reconcile_global.py` — 글로벌(영문) 1단계: 사람이 판정할 대조표 생성. 입력: `csv/oliveyoung_global_crawl.json`
- `apply_global.py` — 글로벌 2단계: 판정된 `csv/reconcile_global.csv` 적용
- `inventory_raw_values.py` — 크롤 JSON의 skin/concern 원본값을 맵 CSV에 사전 등록
- `crawler.py` — 수집 뼈대(기본 비활성, parse_product 미구현)
- `validate.py` — 마스터 무결성 리포트 (exit 0/1)
- `tests/` — pytest. 마스터를 절대 건드리지 않고 tmp 폴더 사본으로 검증.

## 실행

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python validate.py
.venv/bin/python -m pytest tests/ -v
```

## 절대 규칙 (어기지 말 것)

1. `csv/products.csv`의 `product_id`(P00001~)는 **불변**. 재정렬·재부여 금지. 신규는 항상 다음 번호.
2. 자동 병합은 **제품 매칭 키 일치**일 때만. 애매하면 `csv/review_queue.csv`로.
3. 기존 제품이면 `products.csv`는 수정하지 말고 `product_sources.csv`에 소스 행만 추가.
4. 각 CSV를 덮어쓰기 전 `*.bak.csv`로 백업. 검증 실패 시 저장 중단.
5. 매칭 키 함수는 `merge_oliveyoung.py`의 `keyf()`가 유일한 기준. 복제하지 말고 import.

## 스키마 (CSV 1개 = 테이블 1개, 조인 키 = product_id)

- `products.csv` : product_id, brand, product_name, product_name_en, category, subcategory, is_rising, rising_rank, category_rank, brand_rank
- `product_sources.csv` : product_id, source, source_product_id, url
- `brands.csv` : brand, brand_en, status
- `skin_types.csv` : product_id, source, skin_type_raw, rank (원본값 보존)
- `age_groups.csv` : product_id, age_group, rank
- `concerns.csv` : product_id, source, concern_raw (원본값 보존)
- `skin_type_map.csv` / `concern_map.csv` : source, raw_value, std_value (표준화 규칙; std는 나중에 사람이 채움)
- `awards.csv` / `textures.csv` / `rankings.csv` : 화해 전용 — 올리브영 병합 시 건드리지 않음

### 원본 보존 원칙 (중요)

- skin/concern은 소스 원본값 그대로 저장 (예: 글로벌 "Dry"를 건성으로 바꾸지 않는다).
- 표준화는 `*_map.csv`에서만. 추천 로직은 raw → map → std로 읽는다.
- 새 (source, 원본값)은 스크립트가 map에 자동 등록(std 공란). `inventory_raw_values.py`로 병합 전 이형을 미리 볼 수 있다.

## 수집 필드 (제품 1건당)

- 국내: 필수 brand, product_name, oy_id, url / 선택 brand_en, category, subcategory, skin_types[], concerns[]
- 글로벌: brand_en, product_name_en, oy_id, url / 선택 category, skin_types[], concerns[]
- brand_en은 brands.csv에서 해당 브랜드가 비어 있을 때만 채운다 (기존 값 덮어쓰기 금지).

## 흐름

### 국내 (한글 자동 병합)

1. 수집 준비: robots.txt/이용약관 확인, 요청 간 지연, User-Agent 명시. 공식 API·제휴 피드 우선 확인.
2. 시딩 샌드박스: 5~10개만 수집 → `csv/oliveyoung_crawl.json` → 필드가 스키마에 맞는지 사람이 확인.
3. `merge_oliveyoung.py` 실행 → 검증 리포트(신규/병합/리뷰 건수) 확인.
4. `csv/review_queue.csv`를 사람이 판정.

### 글로벌 (영문, 2단계)

1. `reconcile_global.py` → `csv/reconcile_global.csv` 생성 (matched_product_id는 항상 공란, candidate_* 열은 참고용).
2. 사람(LLM 제안 허용)이 `matched_product_id`에 P##### 또는 NEW 기입. 애매하면 절대 추측 금지.
3. `apply_global.py` → 매칭이면 product_name_en 채움+소스 추가, NEW면 다음 내부 ID로 신규 등록.
   ※ brand_en이 brands.csv에 미리 채워져 있을수록 글로벌 매칭률이 올라간다.

## 완료 기준

- product_id 유일, 매칭 키 중복 0, 고아 소스 행 0 (`validate.py` 통과)
- 신규 제품은 P00360부터 연속 부여
- 리뷰 대기 항목은 자동 병합되지 않고 `review_queue.csv`에 남는다
````

- [ ] **Step 6: Create venv and install deps**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt
.venv/bin/python -c "import pandas, requests, bs4, pytest; print('deps OK')"
```

Expected: `deps OK`

- [ ] **Step 7: Smoke-check — masters readable with Korean intact via the new DIR**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python - <<'PY'
from pathlib import Path
import pandas as pd
DIR = Path("csv")
p = pd.read_csv(DIR/"products.csv", dtype=str).fillna("")
assert p.product_id.is_unique and len(p) == 359, len(p)
assert p.iloc[0]["brand"] == "마녀공장", p.iloc[0]["brand"]
print("masters OK:", len(p), "products")
PY
```

Expected: `masters OK: 359 products`

- [ ] **Step 8: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add data/beauty-pipeline
git commit -m "feat(data): beauty pipeline workspace — masters, existing scripts, CLAUDE.md

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Test infrastructure + `validate.py`

**Files:**

- Create: `data/beauty-pipeline/tests/conftest.py` (주의: `tests/__init__.py`는 만들지 않는다 — 있으면 pytest가 패키지 임포트 모드로 바뀌어 `from conftest import ...`가 깨진다)
- Create: `data/beauty-pipeline/tests/test_validate.py`
- Create: `data/beauty-pipeline/validate.py`

**Interfaces:**

- Consumes: Task 1 layout (`csv/` masters, scripts with `DIR = Path(__file__).resolve().parent / "csv"`), `keyf(brand, name) -> str` from `merge_oliveyoung.py`.
- Produces: `validate.py` with `main() -> int` (0 pass / 1 fail), runnable as a script. `tests/conftest.py` exports fixtures `pipeline(tmp_path) -> Path` (tmp workspace with scripts copied and fixture masters written into `<tmp>/csv/`) and helper `run(script_dir, name, *args) -> subprocess.CompletedProcess`. Fixture master content constant `MASTERS: dict[str, str]`. All later test tasks reuse these.

- [ ] **Step 1: Write conftest.py with the tmp-workspace fixture**

`data/beauty-pipeline/tests/conftest.py`:

```python
# -*- coding: utf-8 -*-
"""테스트 공통: 마스터를 절대 건드리지 않도록 스크립트+소형 마스터를 tmp에 복사해 실행."""
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

PIPELINE = Path(__file__).resolve().parent.parent
SCRIPTS = [
    "merge_oliveyoung.py",
    "apply_global.py",
    "inventory_raw_values.py",
    "reconcile_global.py",
    "validate.py",
    "crawler.py",
]

MASTERS = {
    "products.csv": (
        "product_id,brand,product_name,product_name_en,category,subcategory,"
        "is_rising,rising_rank,category_rank,brand_rank\n"
        "P00001,토리든,다이브인 토너,,스킨케어,스킨/토너,,,,\n"
        "P00002,아누아,어성초 토너,,스킨케어,스킨/토너,,,,\n"
    ),
    "brands.csv": "brand,brand_en,status\n토리든,Torriden,확인\n아누아,ANUA,확인\n",
    "product_sources.csv": (
        "product_id,source,source_product_id,url\n"
        "P00001,화해,111,https://www.hwahae.co.kr/goods/p/111\n"
    ),
    "skin_types.csv": "product_id,source,skin_type_raw,rank\nP00001,화해,건성,1\n",
    "concerns.csv": "product_id,source,concern_raw\nP00001,화해,보습\n",
    "skin_type_map.csv": "source,raw_value,std_value\n화해,건성,건성\n",
    "concern_map.csv": "source,raw_value,std_value\n화해,보습,보습\n",
    "age_groups.csv": "product_id,age_group,rank\n",
    "awards.csv": (
        "product_id,brand,product_name,award_theme,category,subcategory,concern,award_rank\n"
    ),
    "rankings.csv": "product_id,brand,product_name,ranking_type,key,rank\n",
    "textures.csv": "product_id,texture\n",
}


def write_masters(csv_dir: Path, overrides: dict[str, str] | None = None) -> None:
    csv_dir.mkdir(parents=True, exist_ok=True)
    data = {**MASTERS, **(overrides or {})}
    for name, content in data.items():
        (csv_dir / name).write_text(content, encoding="utf-8-sig")


@pytest.fixture
def pipeline(tmp_path: Path) -> Path:
    """스크립트 사본 + 소형 마스터가 든 임시 작업 폴더."""
    for s in SCRIPTS:
        src = PIPELINE / s
        if src.exists():  # 아직 안 만든 스크립트는 건너뜀 (작업 진행 중)
            shutil.copy(src, tmp_path / s)
    write_masters(tmp_path / "csv")
    return tmp_path


def run(script_dir: Path, name: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(script_dir / name), *args],
        capture_output=True,
        text=True,
        cwd=script_dir,
    )
```

- [ ] **Step 2: Write the failing tests for validate.py**

`data/beauty-pipeline/tests/test_validate.py`:

```python
# -*- coding: utf-8 -*-
from pathlib import Path

from conftest import run, write_masters


def test_validate_passes_on_clean_fixture(pipeline: Path):
    r = run(pipeline, "validate.py")
    assert r.returncode == 0, r.stdout + r.stderr
    assert "검증 통과" in r.stdout


def test_validate_fails_on_duplicate_product_id(pipeline: Path):
    write_masters(
        pipeline / "csv",
        {
            "products.csv": (
                "product_id,brand,product_name,product_name_en,category,subcategory,"
                "is_rising,rising_rank,category_rank,brand_rank\n"
                "P00001,토리든,다이브인 토너,,,,,,,\n"
                "P00001,토리든,다이브인 토너 리필,,,,,,,\n"
            )
        },
    )
    r = run(pipeline, "validate.py")
    assert r.returncode == 1
    assert "product_id 중복" in r.stdout


def test_validate_fails_on_orphan_source(pipeline: Path):
    write_masters(
        pipeline / "csv",
        {
            "product_sources.csv": (
                "product_id,source,source_product_id,url\n"
                "P09999,화해,999,https://example.com/999\n"
            )
        },
    )
    r = run(pipeline, "validate.py")
    assert r.returncode == 1
    assert "고아" in r.stdout


def test_validate_fails_on_unmapped_raw_value(pipeline: Path):
    write_masters(
        pipeline / "csv",
        {"concerns.csv": "product_id,source,concern_raw\nP00001,화해,미등록값\n"},
    )
    r = run(pipeline, "validate.py")
    assert r.returncode == 1
    assert "미등록 원본값" in r.stdout
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/test_validate.py -v
```

Expected: 4 FAILED (validate.py가 없어 subprocess가 파일을 못 찾음 — returncode 2, assertion 실패)

- [ ] **Step 4: Write validate.py**

`data/beauty-pipeline/validate.py`:

```python
# -*- coding: utf-8 -*-
"""마스터 CSV 무결성 리포트. 통과 exit 0 / 실패 exit 1.

검사: product_id 유일 · 매칭 키(keyf) 중복 0 · 고아 product_id 0(모든 부속 테이블)
     · skin/concern 원본값의 맵 등록 여부
"""
import sys
from pathlib import Path

import pandas as pd

from merge_oliveyoung import keyf

DIR = Path(__file__).resolve().parent / "csv"


def rd(name: str) -> pd.DataFrame:
    return pd.read_csv(DIR / name, dtype=str).fillna("")


def main() -> int:
    products = rd("products.csv")
    problems: list[str] = []

    dup_ids = products.product_id[products.product_id.duplicated()].tolist()
    if dup_ids:
        problems.append(f"product_id 중복: {sorted(set(dup_ids))}")

    keys = [keyf(b, n) for b, n in zip(products.brand, products.product_name)]
    seen, dups = set(), set()
    for k in keys:
        (dups if k in seen else seen).add(k)
    if dups:
        problems.append(f"매칭 키 중복 {len(dups)}건: {sorted(dups)[:5]}")

    pids = set(products.product_id)
    for name in [
        "product_sources.csv",
        "skin_types.csv",
        "concerns.csv",
        "age_groups.csv",
        "awards.csv",
        "rankings.csv",
        "textures.csv",
    ]:
        orphan = sorted(set(rd(name).product_id) - pids)
        if orphan:
            problems.append(f"{name}: 고아 product_id {len(orphan)}건 {orphan[:5]}")

    for data_name, col, map_name in [
        ("skin_types.csv", "skin_type_raw", "skin_type_map.csv"),
        ("concerns.csv", "concern_raw", "concern_map.csv"),
    ]:
        df, m = rd(data_name), rd(map_name)
        mapped = set(zip(m.source, m.raw_value))
        missing = sorted({(s, v) for s, v in zip(df.source, df[col])} - mapped)
        if missing:
            problems.append(
                f"{data_name}→{map_name}: 미등록 원본값 {len(missing)}건 {missing[:5]}"
            )

    if problems:
        print("검증 실패:")
        for p in problems:
            print(" -", p)
        return 1
    print(f"검증 통과 · 제품 {len(products)} · 키 중복 0 · 고아 0 · 맵 커버 OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/test_validate.py -v
```

Expected: 4 passed

- [ ] **Step 6: Run validate.py against the real masters**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python validate.py
```

Expected: `검증 통과 · 제품 359 …` (exit 0).
**If it fails:** STOP — do not "fix" the master CSVs. Report the exact failure lines to the user and wait for direction. (Known possibility: 화해 데이터의 매칭 키 중복이나 맵 미등록값이 실제로 존재할 수 있음. 이는 데이터 이슈이지 코드 버그가 아님.)

- [ ] **Step 7: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add data/beauty-pipeline/validate.py data/beauty-pipeline/tests
git commit -m "feat(data): validate.py — master CSV integrity report + test infra

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `load_crawled()` + domestic merge round-trip test

**Files:**

- Modify: `data/beauty-pipeline/merge_oliveyoung.py` (imports line + `load_crawled` body only)
- Test: `data/beauty-pipeline/tests/test_merge.py`

**Interfaces:**

- Consumes: `pipeline` fixture and `run()` from `tests/conftest.py`; `DIR` already points to `csv/`.
- Produces: `load_crawled() -> list[dict]` reading `csv/oliveyoung_crawl.json`, validating required fields (`brand`, `product_name`, `oy_id`, `url`), raising `SystemExit` with offending records otherwise. Task 6's crawler writes the file this reads.

- [ ] **Step 1: Write the failing round-trip tests**

`data/beauty-pipeline/tests/test_merge.py`:

```python
# -*- coding: utf-8 -*-
import json
from pathlib import Path

import pandas as pd

from conftest import run


def rd(p: Path, name: str) -> pd.DataFrame:
    return pd.read_csv(p / "csv" / name, dtype=str).fillna("")


def write_crawl(p: Path, records: list[dict]) -> None:
    (p / "csv" / "oliveyoung_crawl.json").write_text(
        json.dumps(records, ensure_ascii=False), encoding="utf-8"
    )


CRAWL = [
    {  # 기존 P00001과 키 일치 → 소스만 추가
        "brand": "토리든",
        "product_name": "다이브인 토너",
        "oy_id": "A100",
        "url": "https://global.example/A100",
        "skin_types": ["Dry"],
        "concerns": ["Hydration"],
    },
    {  # 신규 브랜드 → 신규 제품 P00003
        "brand": "라운드랩",
        "product_name": "자작나무 토너",
        "oy_id": "A200",
        "url": "https://global.example/A200",
        "brand_en": "ROUND LAB",
    },
    {  # 같은 브랜드·다른 이름 → review_queue
        "brand": "토리든",
        "product_name": "밸런스풀 젤",
        "oy_id": "A300",
        "url": "https://global.example/A300",
    },
]


def test_merge_roundtrip(pipeline: Path):
    write_crawl(pipeline, CRAWL)
    r = run(pipeline, "merge_oliveyoung.py")
    assert r.returncode == 0, r.stdout + r.stderr

    products = rd(pipeline, "products.csv")
    assert len(products) == 3
    new = products[products.brand == "라운드랩"]
    assert list(new.product_id) == ["P00003"]  # 다음 번호 부여

    sources = rd(pipeline, "product_sources.csv")
    oy = sources[sources.source == "올리브영"]
    assert set(oy.source_product_id) == {"A100", "A200"}
    assert set(oy[oy.source_product_id == "A100"].product_id) == {"P00001"}

    review = rd(pipeline, "review_queue.csv")
    assert list(review.oy_id) == ["A300"]

    skin = rd(pipeline, "skin_types.csv")
    assert ("올리브영" in set(skin.source)) and ("Dry" in set(skin.skin_type_raw))
    sk_map = rd(pipeline, "skin_type_map.csv")
    assert ("올리브영", "Dry") in set(zip(sk_map.source, sk_map.raw_value))

    brands = rd(pipeline, "brands.csv")
    row = brands[brands.brand == "라운드랩"]
    assert list(row.brand_en) == ["ROUND LAB"]


def test_merge_rerun_is_idempotent(pipeline: Path):
    write_crawl(pipeline, CRAWL)
    assert run(pipeline, "merge_oliveyoung.py").returncode == 0
    assert run(pipeline, "merge_oliveyoung.py").returncode == 0  # 재실행

    products = rd(pipeline, "products.csv")
    assert len(products) == 3  # 재실행해도 신규 중복 생성 없음
    sources = rd(pipeline, "product_sources.csv")
    assert len(sources) == len(sources.drop_duplicates())


def test_load_crawled_rejects_missing_fields(pipeline: Path):
    write_crawl(pipeline, [{"brand": "토리든", "product_name": "", "oy_id": "A1", "url": "u"}])
    r = run(pipeline, "merge_oliveyoung.py")
    assert r.returncode != 0
    assert "필수 필드 누락" in (r.stdout + r.stderr)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/test_merge.py -v
```

Expected: 3 FAILED — `NotImplementedError` from `load_crawled` (returncode != 0)

- [ ] **Step 3: Implement load_crawled**

In `data/beauty-pipeline/merge_oliveyoung.py`, change the imports line:

```python
import re, shutil
```

to:

```python
import json, re, shutil
```

and replace:

```python
def load_crawled() -> list[dict]:
    # TODO: 크롤러 결과(JSON/CSV)를 읽어 dict 리스트로 반환
    #   예) return json.load(open("oliveyoung_crawl.json", encoding="utf-8"))
    raise NotImplementedError
```

with:

```python
def load_crawled() -> list[dict]:
    """csv/oliveyoung_crawl.json 을 읽어 dict 리스트로 반환. 필수 필드 검증."""
    path = DIR / "oliveyoung_crawl.json"
    if not path.exists():
        raise SystemExit(f"크롤 결과 없음: {path} — crawler.py로 먼저 수집하세요")
    data = json.load(open(path, encoding="utf-8"))
    required = ("brand", "product_name", "oy_id", "url")
    bad = [r for r in data if not all(str(r.get(k, "")).strip() for k in required)]
    if bad:
        raise SystemExit(f"필수 필드 누락 레코드 {len(bad)}건 (필수: {required}): {bad[:3]}")
    return data
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/test_merge.py tests/test_validate.py -v
```

Expected: 7 passed (병합 3 + 검증 4 — 회귀 확인 포함)

- [ ] **Step 5: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add data/beauty-pipeline/merge_oliveyoung.py data/beauty-pipeline/tests/test_merge.py
git commit -m "feat(data): wire load_crawled() to oliveyoung_crawl.json + merge round-trip tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `reconcile_global.py`

**Files:**

- Create: `data/beauty-pipeline/reconcile_global.py`
- Test: `data/beauty-pipeline/tests/test_reconcile.py`

**Interfaces:**

- Consumes: `csv/brands.csv`, `csv/products.csv`, `csv/oliveyoung_global_crawl.json` (records: `oy_id`, `brand_en`, `product_name_en`, `url`).
- Produces: `csv/reconcile_global.csv` with columns `oy_global_id, brand_en, product_name_en, url, matched_product_id, candidate_pids, candidate_names` — `matched_product_id` always empty; `candidate_*` are `|`-joined. `apply_global.py` (Task 5) consumes this file after a human fills `matched_product_id`.

- [ ] **Step 1: Write the failing tests**

`data/beauty-pipeline/tests/test_reconcile.py`:

```python
# -*- coding: utf-8 -*-
import json
from pathlib import Path

import pandas as pd

from conftest import run

GLOBAL_CRAWL = [
    {  # brands.csv의 Torriden → 토리든 후보(P00001) 제시
        "oy_id": "G100",
        "brand_en": "Torriden",
        "product_name_en": "DIVE-IN Toner",
        "url": "https://global.example/G100",
    },
    {  # brands.csv에 없는 브랜드 → 후보 없음 (사람이 NEW 판정 예정)
        "oy_id": "G200",
        "brand_en": "NewBrandX",
        "product_name_en": "Wonder Cream",
        "url": "https://global.example/G200",
    },
]


def write_global_crawl(p: Path, records: list[dict]) -> None:
    (p / "csv" / "oliveyoung_global_crawl.json").write_text(
        json.dumps(records, ensure_ascii=False), encoding="utf-8"
    )


def test_reconcile_emits_candidates_not_verdicts(pipeline: Path):
    write_global_crawl(pipeline, GLOBAL_CRAWL)
    r = run(pipeline, "reconcile_global.py")
    assert r.returncode == 0, r.stdout + r.stderr

    rec = pd.read_csv(pipeline / "csv" / "reconcile_global.csv", dtype=str).fillna("")
    assert list(rec.columns) == [
        "oy_global_id",
        "brand_en",
        "product_name_en",
        "url",
        "matched_product_id",
        "candidate_pids",
        "candidate_names",
    ]
    assert (rec.matched_product_id == "").all()  # 절대 추측하지 않음

    g100 = rec[rec.oy_global_id == "G100"].iloc[0]
    assert g100.candidate_pids == "P00001"
    assert g100.candidate_names == "다이브인 토너"

    g200 = rec[rec.oy_global_id == "G200"].iloc[0]
    assert g200.candidate_pids == "" and g200.candidate_names == ""

    assert "브랜드 미매칭 1" in r.stdout


def test_reconcile_brand_match_is_case_insensitive(pipeline: Path):
    write_global_crawl(
        pipeline,
        [
            {
                "oy_id": "G300",
                "brand_en": "  torriden ",
                "product_name_en": "Any",
                "url": "u",
            }
        ],
    )
    r = run(pipeline, "reconcile_global.py")
    assert r.returncode == 0, r.stdout + r.stderr
    rec = pd.read_csv(pipeline / "csv" / "reconcile_global.csv", dtype=str).fillna("")
    assert rec.iloc[0].candidate_pids == "P00001"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/test_reconcile.py -v
```

Expected: 2 FAILED (reconcile_global.py 없음)

- [ ] **Step 3: Write reconcile_global.py**

`data/beauty-pipeline/reconcile_global.py`:

```python
# -*- coding: utf-8 -*-
"""
[올리브영 글로벌 1단계] 크롤 결과와 마스터를 대조해 사람이 판정할 대조표를 만든다.

입력 : csv/oliveyoung_global_crawl.json (레코드: oy_id, brand_en, product_name_en, url)
출력 : csv/reconcile_global.csv
       (oy_global_id, brand_en, product_name_en, url,
        matched_product_id[항상 공란], candidate_pids, candidate_names)

원칙 : matched_product_id는 이 스크립트가 절대 채우지 않는다(추측 금지, "NEW"도 안 됨).
       사람(LLM 제안 허용)이 P##### 또는 NEW를 적은 뒤 apply_global.py를 실행한다.
"""
import json
from pathlib import Path

import pandas as pd

DIR = Path(__file__).resolve().parent / "csv"
ENC = "utf-8-sig"

COLUMNS = [
    "oy_global_id",
    "brand_en",
    "product_name_en",
    "url",
    "matched_product_id",
    "candidate_pids",
    "candidate_names",
]


def main() -> None:
    brands = pd.read_csv(DIR / "brands.csv", dtype=str).fillna("")
    products = pd.read_csv(DIR / "products.csv", dtype=str).fillna("")
    crawl_path = DIR / "oliveyoung_global_crawl.json"
    if not crawl_path.exists():
        raise SystemExit(f"크롤 결과 없음: {crawl_path}")
    crawled = json.load(open(crawl_path, encoding="utf-8"))

    # brand_en(소문자·공백제거) → 한글 브랜드 다리 (apply_global.py와 동일 규칙)
    en2ko = {e.strip().lower(): b for b, e in zip(brands.brand, brands.brand_en) if e.strip()}

    rows, brand_miss = [], 0
    for r in crawled:
        ko = en2ko.get(r["brand_en"].strip().lower(), "")
        cand = products[products.brand == ko] if ko else products.iloc[0:0]
        if not ko:
            brand_miss += 1
        rows.append(
            {
                "oy_global_id": r["oy_id"],
                "brand_en": r["brand_en"],
                "product_name_en": r["product_name_en"],
                "url": r["url"],
                "matched_product_id": "",  # 사람이 채운다
                "candidate_pids": " | ".join(cand.product_id),
                "candidate_names": " | ".join(cand.product_name),
            }
        )

    pd.DataFrame(rows, columns=COLUMNS).to_csv(
        DIR / "reconcile_global.csv", index=False, encoding=ENC
    )
    with_cand = sum(1 for r in rows if r["candidate_pids"])
    print(f"크롤 {len(rows)}건 · 후보 있음 {with_cand} · 브랜드 미매칭 {brand_miss} (→ 대부분 NEW)")
    print("→ reconcile_global.csv 의 matched_product_id 를 채운 뒤 apply_global.py 실행")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/test_reconcile.py -v
```

Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add data/beauty-pipeline/reconcile_global.py data/beauty-pipeline/tests/test_reconcile.py
git commit -m "feat(data): reconcile_global.py — candidate table for human matching, never guesses

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Global apply round-trip test (tests only — apply_global.py stays untouched)

**Files:**

- Test: `data/beauty-pipeline/tests/test_apply_global.py`

**Interfaces:**

- Consumes: `write_global_crawl` pattern from Task 4 (re-declared locally — tests must not import from other test modules), `pipeline`/`run` from conftest, `csv/reconcile_global.csv` produced by `reconcile_global.py`.
- Produces: proof that reconcile → human verdict → apply round-trips correctly on fixtures.

- [ ] **Step 1: Write the failing test**

`data/beauty-pipeline/tests/test_apply_global.py`:

```python
# -*- coding: utf-8 -*-
import json
from pathlib import Path

import pandas as pd

from conftest import run


def rd(p: Path, name: str) -> pd.DataFrame:
    return pd.read_csv(p / "csv" / name, dtype=str).fillna("")


def setup_reconciled(p: Path) -> None:
    """reconcile 실행 후 사람 판정(G100→P00001, G200→NEW)까지 흉내낸다."""
    records = [
        {
            "oy_id": "G100",
            "brand_en": "Torriden",
            "product_name_en": "DIVE-IN Toner",
            "url": "https://global.example/G100",
            "skin_types": ["Dry"],
            "concerns": ["Hydration"],
        },
        {
            "oy_id": "G200",
            "brand_en": "NewBrandX",
            "product_name_en": "Wonder Cream",
            "url": "https://global.example/G200",
        },
    ]
    (p / "csv" / "oliveyoung_global_crawl.json").write_text(
        json.dumps(records, ensure_ascii=False), encoding="utf-8"
    )
    assert run(p, "reconcile_global.py").returncode == 0

    rec_path = p / "csv" / "reconcile_global.csv"
    rec = pd.read_csv(rec_path, dtype=str).fillna("")
    rec.loc[rec.oy_global_id == "G100", "matched_product_id"] = "P00001"
    rec.loc[rec.oy_global_id == "G200", "matched_product_id"] = "NEW"
    rec.to_csv(rec_path, index=False, encoding="utf-8-sig")


def test_apply_global_roundtrip(pipeline: Path):
    setup_reconciled(pipeline)
    r = run(pipeline, "apply_global.py")
    assert r.returncode == 0, r.stdout + r.stderr

    products = rd(pipeline, "products.csv")
    p1 = products[products.product_id == "P00001"].iloc[0]
    assert p1.product_name_en == "DIVE-IN Toner"  # 매칭 → 영문명 채움

    new = products[products.product_name_en == "Wonder Cream"]
    assert list(new.product_id) == ["P00003"]  # NEW → 다음 번호
    assert list(new.brand) == ["NewBrandX"]  # 한글명 없으니 영문 그대로

    sources = rd(pipeline, "product_sources.csv")
    gl = sources[sources.source == "올리브영글로벌"]
    assert set(gl.source_product_id) == {"G100", "G200"}

    brands = rd(pipeline, "brands.csv")
    assert "NewBrandX" in set(brands.brand)  # 신규 브랜드 등록

    skin = rd(pipeline, "skin_types.csv")
    assert ("올리브영글로벌" in set(skin.source)) and ("Dry" in set(skin.skin_type_raw))


def test_apply_global_source_idempotent_for_matched(pipeline: Path):
    """매칭 행만 있을 때 재실행해도 소스가 중복되지 않는다."""
    setup_reconciled(pipeline)
    rec_path = pipeline / "csv" / "reconcile_global.csv"
    rec = pd.read_csv(rec_path, dtype=str).fillna("")
    rec = rec[rec.oy_global_id == "G100"]  # 매칭 건만 남김
    rec.to_csv(rec_path, index=False, encoding="utf-8-sig")

    assert run(pipeline, "apply_global.py").returncode == 0
    assert run(pipeline, "apply_global.py").returncode == 0  # 재실행

    sources = rd(pipeline, "product_sources.csv")
    gl = sources[sources.source == "올리브영글로벌"]
    assert len(gl) == 1  # G100 소스 행이 한 번만

    products = rd(pipeline, "products.csv")
    assert list(products.product_id) == ["P00001", "P00002"]  # 신규 생성 없음


def test_apply_global_refuses_blank_verdict(pipeline: Path):
    setup_reconciled(pipeline)
    rec_path = pipeline / "csv" / "reconcile_global.csv"
    rec = pd.read_csv(rec_path, dtype=str).fillna("")
    rec.loc[rec.oy_global_id == "G200", "matched_product_id"] = ""  # 미판정 상태
    rec.to_csv(rec_path, index=False, encoding="utf-8-sig")

    r = run(pipeline, "apply_global.py")
    assert r.returncode != 0
    # apply_global.py의 SystemExit 메시지에 확실히 포함되는 ASCII 부분으로 단언
    assert "matched_product_id" in (r.stdout + r.stderr)
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/test_apply_global.py -v
```

Expected: 3 passed — apply_global.py는 이미 구현돼 있으므로 이 태스크는 테스트가 곧바로 통과해야 정상. **If any fail:** the failure is telling us the fixture or our understanding is wrong — investigate the assertion, do NOT modify `apply_global.py` merge logic. (허용 예외: 테스트가 apply_global의 실제 동작과 다른 걸 기대하면 테스트를 실제 동작에 맞춰 고친다.)

- [ ] **Step 3: Full suite regression**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/ -v
```

Expected: 12 passed (validate 4 + merge 3 + reconcile 2 + apply 3)

- [ ] **Step 4: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add data/beauty-pipeline/tests/test_apply_global.py
git commit -m "test(data): global reconcile→apply round-trip coverage

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `crawler.py` scaffold (inert by default)

**Files:**

- Create: `data/beauty-pipeline/crawler.py`
- Test: `data/beauty-pipeline/tests/test_crawler.py`

**Interfaces:**

- Consumes: nothing from other tasks (standalone module); `requests`/`bs4` from venv.
- Produces: `crawler.py` with `check_robots(base_url, path="/") -> bool`, `fetch(url, delay=3.0) -> str`, `parse_product(html, url) -> dict` (**NotImplementedError stub**), `main(argv=None)`. When implemented later, `main` writes `csv/oliveyoung_crawl.json` — the exact file Task 3's `load_crawled()` reads.

- [ ] **Step 1: Write the failing tests**

`data/beauty-pipeline/tests/test_crawler.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/test_crawler.py -v
```

Expected: 3 FAILED (crawler.py 없음 / import 실패)

- [ ] **Step 3: Write crawler.py**

`data/beauty-pipeline/crawler.py`:

```python
# -*- coding: utf-8 -*-
"""올리브영 수집 뼈대 — 기본 비활성. parse_product가 미구현이라 실수로 돌 수 없다.

실행 전 체크리스트 (brief 1단계):
  1) robots.txt / 이용약관 확인 → check_robots() 사용
  2) 공식 API·제휴 피드가 있는지 먼저 확인 (있으면 크롤링 대신 그것을 쓴다)
  3) 시딩: 소량(기본 10개)만 수집해 스키마 검증 후 확대

사용: .venv/bin/python crawler.py urls.txt [--max 10] [--delay 3]
출력: csv/oliveyoung_crawl.json  (merge_oliveyoung.py의 load_crawled가 읽음)

레코드 스키마(제품 1건):
  필수: brand, product_name, oy_id, url
  선택: brand_en, category, subcategory, skin_types[], concerns[]
  (글로벌 수집이면 brand_en, product_name_en 필수 — oliveyoung_global_crawl.json으로 저장)
"""
import argparse
import json
import time
from pathlib import Path
from urllib import robotparser

import requests
from bs4 import BeautifulSoup

DIR = Path(__file__).resolve().parent / "csv"
UA = "adropofseoul-research-bot/0.1 (contact: jj@whatap.io)"


def check_robots(base_url: str, path: str = "/") -> bool:
    """robots.txt를 읽어 해당 경로 수집 허용 여부를 출력·반환."""
    rp = robotparser.RobotFileParser()
    rp.set_url(base_url.rstrip("/") + "/robots.txt")
    rp.read()
    ok = rp.can_fetch(UA, base_url.rstrip("/") + path)
    print(f"robots.txt: {'허용' if ok else '차단'} — {base_url}{path}")
    return ok


def fetch(url: str, delay: float = 3.0) -> str:
    """요청 간 지연 + User-Agent 명시. 4xx/5xx는 예외."""
    time.sleep(delay)
    resp = requests.get(url, headers={"User-Agent": UA}, timeout=20)
    resp.raise_for_status()
    return resp.text


def parse_product(html: str, url: str) -> dict:
    """상품 상세 HTML → 레코드 dict.

    TODO(시딩 단계에서 구현): 실제 페이지 구조를 보고 셀렉터를 채운다.
    구현 전까지는 NotImplementedError — 크롤러가 실수로 돌아가는 것을 막는 안전장치.
    """
    soup = BeautifulSoup(html, "html.parser")  # noqa: F841 — 구현 시 사용
    raise NotImplementedError("parse_product: 셀렉터 미구현 — 시딩 단계에서 채울 것")


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description="올리브영 수집 뼈대 (기본 비활성)")
    ap.add_argument("url_file", help="상품 URL 목록 파일(줄당 1개)")
    ap.add_argument("--max", type=int, default=10, help="최대 수집 건수 (시딩 기본 10)")
    ap.add_argument("--delay", type=float, default=3.0, help="요청 간 지연(초)")
    args = ap.parse_args(argv)

    urls = [u.strip() for u in Path(args.url_file).read_text().splitlines() if u.strip()]
    records = [parse_product(fetch(u, args.delay), u) for u in urls[: args.max]]

    out = DIR / "oliveyoung_crawl.json"
    out.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(records)}건 저장 → {out}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run the full suite**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/ -v && .venv/bin/python validate.py
```

Expected: 15 passed, then `검증 통과 · 제품 359 …`

- [ ] **Step 5: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add data/beauty-pipeline/crawler.py data/beauty-pipeline/tests/test_crawler.py
git commit -m "feat(data): crawler scaffold — inert by default, parse_product stubbed

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
