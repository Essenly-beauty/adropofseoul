# Picks Product Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 파이프라인 CSV의 시딩 8개 제품을 Supabase로 승격해 `/beauty/picks`에 리테일러별 링크·태그·어워드 배지가 달린 카드로 노출한다.

**Architecture:** DB에 리테일러 무관 `product_offers` 테이블 + `products.tags/award_badge` 컬럼을 추가하고, 승격은 2단계(파이프라인 `export_picks.py` → 앱 `scripts/seed-picks.mjs` REST upsert)로 나눈다. 이미지는 로컬 rembg 도구(`process_image.py`)로 규격화해 Supabase storage에 올린다. 카드는 기존 ProductCard를 확장한다.

**Tech Stack:** Postgres/Supabase (RLS), Python 3.9 venv(`data/beauty-pipeline/.venv` — pandas/pytest 기존, rembg/Pillow 추가), Node .mjs 시드 스크립트(REST fetch 패턴), Next.js + vitest.

## Global Constraints

- 커밋 트레일러: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- 파이프라인 venv는 **Python 3.9.6** — 타입힌트에 `X | None` 금지, `typing.Optional` 사용.
- 파이프라인 테스트는 마스터 CSV(`data/beauty-pipeline/csv/`)를 절대 변경하지 않는다 — `tests/conftest.py`의 `pipeline` 픽스처(tmp 사본) + `write_masters(csv_dir, overrides)` 사용.
- `export_picks.py`는 마스터를 읽기만 한다(쓰기 금지). 출력은 `csv/picks_export.json` 하나.
- 카드에 평점·리뷰수를 어떤 형태로도 표시하지 않는다.
- 앱 게이트: `npx vitest run` 전체 통과 + `npx tsc --noEmit` 클린 후 커밋.
- 작업 브랜치: `feat/picks-product-cards` (이미 체크아웃됨). 다른 브랜치로 checkout/switch 금지.
- husky/lint-staged가 커밋 시 prettier를 돌림 — .py/.json은 ignore-unknown으로 통과, .ts/.tsx는 포맷될 수 있음(정상).

---

### Task 1: DB 마이그레이션 — product_offers + products 컬럼

**Files:**

- Create: `supabase/migrations/20260722090000_product_offers.sql`

**Interfaces:**

- Produces: `product_offers(id, product_id, retailer, url, price, currency, is_active, sort, created_at, updated_at)` 테이블, `products.award_badge text`, `products.tags text[] not null default '{}'`. Task 5(서비스)와 Task 7(시드)이 이 스키마에 의존.

- [ ] **Step 1: 마이그레이션 SQL 작성**

`supabase/migrations/20260722090000_product_offers.sql`:

```sql
-- Multi-retailer affiliate offers for picks products.
-- Read: public, but only offers of published products. Write: admin only.

alter table products add column award_badge text;
alter table products add column tags text[] not null default '{}';

create table product_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  retailer text not null check (retailer in ('oliveyoung_global', 'amazon_us')),
  url text not null,
  price text,
  currency text,
  is_active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, retailer)
);

create index product_offers_product_id_idx on product_offers (product_id);

create trigger product_offers_set_updated_at before update on product_offers
  for each row execute function set_updated_at();

alter table product_offers enable row level security;

create policy product_offers_public_read on product_offers
  for select to anon, authenticated
  using (
    exists (
      select 1 from products p
      where p.id = product_offers.product_id and p.is_published = true
    )
  );

create policy product_offers_admin_all on product_offers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
```

- [ ] **Step 2: 정합성 눈검증**

`supabase/migrations/20260721150000_admin_claim_rls.sql`을 열어 `is_admin()`이 존재하고 다른 테이블 정책과 같은 패턴인지 확인. `0001_init.sql`의 `set_updated_at()` 함수명이 일치하는지 확인.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260722090000_product_offers.sql
git commit -m "feat(db): product_offers table + products award_badge/tags

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

(라이브 DB 적용은 Task 7에서 시드 직전에 수행.)

---

### Task 2: 파이프라인 `export_picks.py` (TDD)

**Files:**

- Create: `data/beauty-pipeline/export_picks.py`
- Modify: `data/beauty-pipeline/tests/conftest.py` — `SCRIPTS` 리스트에 `"export_picks.py"` 추가 (이게 없으면 `pipeline` 픽스처가 tmp 폴더로 스크립트를 복사하지 않아 `run()`이 파일을 못 찾는다)
- Test: `data/beauty-pipeline/tests/test_export_picks.py`

**Interfaces:**

- Consumes: `tests/conftest.py`의 `pipeline` 픽스처, `run()`, `write_masters(csv_dir, overrides)`; 마스터 CSV 스키마.
- Produces: CLI `python export_picks.py` — `csv/picks.txt`(P##### 목록)를 읽어 `csv/picks_export.json` 생성. JSON 스키마(제품별):
  `{"product_id": str, "slug": str, "brand": str, "name": str, "tags": [str], "award_badge": str|null, "offers": [{"retailer": "oliveyoung_global", "url": str}], "disclosure_required": true}`
  Task 4(이미지 slug 매핑)와 Task 7(시드 입력)이 이 파일을 읽는다.

- [ ] **Step 1: 실패하는 테스트 작성**

`data/beauty-pipeline/tests/test_export_picks.py`:

```python
# -*- coding: utf-8 -*-
import json
from pathlib import Path

from conftest import run, write_masters

GLOBAL_MASTERS = {
    "products.csv": (
        "product_id,brand,product_name,product_name_en,category,subcategory,"
        "is_rising,rising_rank,category_rank,brand_rank\n"
        "P00001,토리든,다이브인 토너,Dive-In Serum 50ml,스킨케어,스킨/토너,,,,\n"
        "P00002,아누아,어성초 토너,,스킨케어,스킨/토너,,,,\n"
    ),
    "product_sources.csv": (
        "product_id,source,source_product_id,url\n"
        "P00001,화해,111,https://www.hwahae.co.kr/goods/p/111\n"
        "P00001,올리브영글로벌,GA123,https://global.oliveyoung.com/product/detail?prdtNo=GA123\n"
    ),
    "skin_types.csv": (
        "product_id,source,skin_type_raw,rank\n"
        "P00001,화해,건성,1\n"
        "P00001,올리브영글로벌,Dry,\n"
    ),
    "concerns.csv": (
        "product_id,source,concern_raw\n"
        "P00001,화해,보습\n"
        "P00001,올리브영글로벌,Hydration\n"
        "P00001,올리브영글로벌,Dry\n"
    ),
    "awards.csv": (
        "product_id,brand,product_name,award_theme,category,subcategory,concern,award_rank\n"
        "P00001,토리든,다이브인 토너,올리브영 어워즈 2023,에센스/세럼,,,\n"
        "P00001,토리든,다이브인 토너,올리브영 어워즈 2024,에센스/세럼,5년 연속 수상,,1\n"
    ),
}


def setup(pipeline: Path, picks: str = "P00001\n") -> None:
    write_masters(pipeline / "csv", GLOBAL_MASTERS)
    (pipeline / "csv" / "picks.txt").write_text(picks, encoding="utf-8")


def load(pipeline: Path):
    return json.loads(
        (pipeline / "csv" / "picks_export.json").read_text(encoding="utf-8")
    )


def test_exports_full_record(pipeline: Path):
    setup(pipeline)
    r = run(pipeline, "export_picks.py")
    assert r.returncode == 0, r.stdout + r.stderr
    [rec] = load(pipeline)
    assert rec == {
        "product_id": "P00001",
        "slug": "torriden-dive-in-serum-50ml",
        "brand": "Torriden",
        "name": "Dive-In Serum 50ml",
        "tags": ["Dry", "Hydration"],  # 글로벌 소스만, 중복 제거, 등장 순서
        "award_badge": "Olive Young Awards 2024 · Essence/Serum · #1",  # 최신 연도 1건
        "offers": [
            {
                "retailer": "oliveyoung_global",
                "url": "https://global.oliveyoung.com/product/detail?prdtNo=GA123",
            }
        ],
        "disclosure_required": True,
    }


def test_reward_code_builds_deeplink(pipeline: Path):
    import os
    import subprocess
    import sys

    setup(pipeline)
    env = {**os.environ, "OY_REWARD_CODE": "ESSENLY1"}
    r = subprocess.run(
        [sys.executable, str(pipeline / "export_picks.py")],
        capture_output=True, text=True, cwd=pipeline, env=env,
    )
    assert r.returncode == 0, r.stdout + r.stderr
    [rec] = load(pipeline)
    assert rec["offers"][0]["url"] == (
        "https://global.oliveyoung.com/partner/gate"
        "?url=%2Fproduct%2Fdetail%3FprdtNo%3DGA123&rwardCode=ESSENLY1"
    )


def test_fails_on_missing_english_name(pipeline: Path):
    setup(pipeline, picks="P00002\n")  # product_name_en 없음
    r = run(pipeline, "export_picks.py")
    assert r.returncode == 1
    assert "P00002" in (r.stdout + r.stderr)


def test_fails_on_unknown_product_id(pipeline: Path):
    setup(pipeline, picks="P09999\n")
    r = run(pipeline, "export_picks.py")
    assert r.returncode == 1
    assert "P09999" in (r.stdout + r.stderr)
```

참고: 픽스처 `brands.csv`(conftest 기본)에 `토리든,Torriden,확인`이 이미 있다. `write_masters`는 기본 MASTERS 위에 overrides를 덮는 방식.

- [ ] **Step 2: 실패 확인**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/test_export_picks.py -v
```

Expected: 4 FAILED (export_picks.py 없음 → returncode 2)

- [ ] **Step 3: 구현**

`data/beauty-pipeline/export_picks.py`:

```python
# -*- coding: utf-8 -*-
"""[픽 승격 1단계] picks.txt의 제품을 앱 시드용 영문 JSON으로 내보낸다.

입력 : csv/picks.txt (P##### 한 줄에 하나, 사람이 관리)
출력 : csv/picks_export.json — scripts/seed-picks.mjs 가 읽는다.
환경 : OY_REWARD_CODE 가 있으면 올리브영 글로벌 제휴 딥링크(/partner/gate)로 변환.

원칙: 마스터 CSV는 읽기 전용. description(편집 한 줄)은 넣지 않는다 — admin에서 사람이 작성.
"""
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import quote, urlparse

import pandas as pd

DIR = Path(__file__).resolve().parent / "csv"
SRC_GLOBAL = "올리브영글로벌"

AWARD_EN = {"올리브영 어워즈": "Olive Young Awards", "영국 뷰티 어워즈": "UK Beauty Awards"}
CATEGORY_EN = {
    "크림": "Cream",
    "에센스/세럼": "Essence/Serum",
    "바디보습": "Body Moisture",
    "Skin Hydration Hero": "Skin Hydration Hero",
}


def slugify(*parts) -> str:
    s = " ".join(parts).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def oy_deeplink(url: str, code: str) -> str:
    if not code:
        return url
    p = urlparse(url)
    rel = p.path + ("?" + p.query if p.query else "")
    return (
        "https://global.oliveyoung.com/partner/gate"
        f"?url={quote(rel, safe='')}&rwardCode={code}"
    )


def award_badge(rows: pd.DataFrame):
    """어워드 행들 중 '<이름> YYYY' 테마의 최신 연도 1건을 영문 배지로."""
    best = None  # (year, badge)
    for _, r in rows.iterrows():
        m = re.match(r"^(.+?) (\d{4})$", r.award_theme.strip())
        if not m or m.group(1) not in AWARD_EN:
            continue
        year = int(m.group(2))
        badge = f"{AWARD_EN[m.group(1)]} {year}"
        cat = CATEGORY_EN.get(r.category.strip())
        if cat:
            badge += f" · {cat}"
        if r.award_rank.strip():
            badge += f" · #{r.award_rank.strip()}"
        if best is None or year > best[0]:
            best = (year, badge)
    return best[1] if best else None


def main() -> int:
    rd = lambda name: pd.read_csv(DIR / name, dtype=str).fillna("")  # noqa: E731
    products, brands = rd("products.csv"), rd("brands.csv")
    sources, skin, concern, awards = (
        rd("product_sources.csv"), rd("skin_types.csv"),
        rd("concerns.csv"), rd("awards.csv"),
    )
    picks_path = DIR / "picks.txt"
    if not picks_path.exists():
        raise SystemExit(f"픽 목록 없음: {picks_path}")
    picks = [x.strip() for x in picks_path.read_text(encoding="utf-8").splitlines() if x.strip()]

    en_brand = {b: e for b, e in zip(brands.brand, brands.brand_en) if e.strip()}
    pidx = products.set_index("product_id")
    code = os.environ.get("OY_REWARD_CODE", "").strip()

    problems, out = [], []
    for pid in picks:
        if pid not in pidx.index:
            problems.append(f"{pid}: 마스터에 없는 product_id")
            continue
        row = pidx.loc[pid]
        name, brand_en = row.product_name_en.strip(), en_brand.get(row.brand, "")
        if not name:
            problems.append(f"{pid}: product_name_en 비어 있음 (글로벌 시딩 필요)")
            continue
        if not brand_en:
            problems.append(f"{pid}: brands.csv에 brand_en 없음 ({row.brand})")
            continue

        gl = sources[(sources.product_id == pid) & (sources.source == SRC_GLOBAL)]
        offers = [
            {"retailer": "oliveyoung_global", "url": oy_deeplink(u, code)}
            for u in gl.url
        ]

        raw_tags = list(skin[(skin.product_id == pid) & (skin.source == SRC_GLOBAL)].skin_type_raw)
        raw_tags += list(concern[(concern.product_id == pid) & (concern.source == SRC_GLOBAL)].concern_raw)
        tags = list(dict.fromkeys(t for t in raw_tags if t))

        out.append({
            "product_id": pid,
            "slug": slugify(brand_en, name),
            "brand": brand_en,
            "name": name,
            "tags": tags,
            "award_badge": award_badge(awards[awards.product_id == pid]),
            "offers": offers,
            "disclosure_required": True,
        })

    if problems:
        print("승격 불가 항목:")
        for p in problems:
            print(" -", p)
        return 1

    dst = DIR / "picks_export.json"
    dst.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(out)}건 내보냄 → {dst}")
    for rec in out:
        print(f"  {rec['product_id']} → {rec['slug']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: 통과 확인 + 전체 파이프라인 회귀**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/ -q
```

Expected: 24 passed (기존 20 + 신규 4)

- [ ] **Step 5: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add data/beauty-pipeline/export_picks.py data/beauty-pipeline/tests/test_export_picks.py
git commit -m "feat(data): export_picks.py — picks.txt to app-seed JSON (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 실데이터 픽 목록 + export 실행

**Files:**

- Create: `data/beauty-pipeline/csv/picks.txt`
- Create(생성물): `data/beauty-pipeline/csv/picks_export.json`

**Interfaces:**

- Consumes: Task 2 CLI.
- Produces: 커밋된 `picks_export.json` — Task 7 시드의 실입력. slug 8개가 여기서 확정된다.

- [ ] **Step 1: 픽 목록 작성 (시딩된 8개)**

`data/beauty-pipeline/csv/picks.txt`:

```
P00249
P00075
P00256
P00097
P00017
P00262
P00348
P00172
```

- [ ] **Step 2: export 실행 (리워드코드 없이 — 코드는 나중에 받으면 재실행)**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python export_picks.py
```

Expected: `8건 내보냄` + slug 8줄 (예: `P00249 → torriden-dive-in-serum-50ml`). 실패 시 STOP — 마스터를 고치지 말고 실패 항목을 보고.

- [ ] **Step 3: 결과 눈검증**

`csv/picks_export.json`을 열어 8개 레코드 각각 brand/name/offers URL이 마스터와 일치하는지, `award_badge`가 4개 제품(P00249/P00097/P00256/P00172)+P00075(UK)+P00017에 있는지 확인.

- [ ] **Step 4: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add data/beauty-pipeline/csv/picks.txt data/beauty-pipeline/csv/picks_export.json
git commit -m "feat(data): first picks export — 8 seeded products

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 파이프라인 `process_image.py` (rembg 누끼 규격화, TDD)

**Files:**

- Create: `data/beauty-pipeline/process_image.py`
- Modify: `data/beauty-pipeline/requirements.txt` (rembg, Pillow 추가)
- Modify: `data/beauty-pipeline/.gitignore` (`images/` 추가)
- Test: `data/beauty-pipeline/tests/test_process_image.py`

**Interfaces:**

- Consumes: Task 3의 `csv/picks_export.json` (P#####→slug 매핑).
- Produces: `process_file(src: Path, dst: Path, remove_fn=None)` — 원본→흰배경 정사각 1200² WebP. CLI: `python process_image.py` 가 `images/raw/<P#####>.*` 전부를 `images/out/<slug>.webp`로 처리.

- [ ] **Step 1: 의존성 추가 + 설치**

`data/beauty-pipeline/requirements.txt`에 두 줄 추가:

```
Pillow>=10
rembg>=2.0.50
```

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/pip install -q -r requirements.txt
.venv/bin/python -c "import PIL; print('Pillow OK')"
```

주의: rembg가 py3.9에서 해석 실패하면 `rembg==2.0.57`로 핀 고정 시도. 그래도 실패하면 STOP하고 보고 (테스트는 rembg 없이도 돌게 설계됨 — 아래 참조).

- [ ] **Step 2: .gitignore에 이미지 폴더 추가**

`data/beauty-pipeline/.gitignore`에 추가:

```
images/
```

(원본은 권리 확보본이라 커밋하지 않고, out은 storage로 올라가므로 로컬 전용.)

- [ ] **Step 3: 실패하는 테스트 작성**

`data/beauty-pipeline/tests/test_process_image.py`:

```python
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
```

- [ ] **Step 4: 실패 확인**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/test_process_image.py -v
```

Expected: 2 FAILED (`ModuleNotFoundError: process_image`)

- [ ] **Step 5: 구현**

`data/beauty-pipeline/process_image.py`:

```python
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
```

- [ ] **Step 6: 통과 확인 + 회귀**

```bash
cd /Users/jj_whatap/up/adropofseoul/data/beauty-pipeline
.venv/bin/python -m pytest tests/ -q
```

Expected: 26 passed

- [ ] **Step 7: Commit**

```bash
cd /Users/jj_whatap/up/adropofseoul
git add data/beauty-pipeline/process_image.py data/beauty-pipeline/tests/test_process_image.py data/beauty-pipeline/requirements.txt data/beauty-pipeline/.gitignore
git commit -m "feat(data): process_image.py — rembg cutout to uniform 1200sq WebP (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 앱 서비스 — offers/tags/awardBadge (TDD)

**Files:**

- Modify: `services/types.ts` (Product 확장 + ProductOffer)
- Modify: `services/products.ts` (COLUMNS, ProductRow, mapProductRow)
- Test: `services/products.test.ts` (확장)

**Interfaces:**

- Consumes: Task 1 스키마.
- Produces: `type ProductOffer = { retailer: "oliveyoung_global" | "amazon_us"; url: string }`; `Product`에 `offers: ProductOffer[]`, `tags: string[]`, `awardBadge: string | null`. Task 6 카드가 이 타입을 사용.

- [ ] **Step 1: 실패하는 테스트 추가**

`services/products.test.ts`의 `describe("mapProductRow")` 안에 추가:

```ts
it("maps offers (active only, sorted), tags, award badge", () => {
  const p = mapProductRow({
    ...row,
    tags: ["Dry", "Hydration"],
    award_badge: "Olive Young Awards 2024 · Essence/Serum",
    product_offers: [
      {
        retailer: "amazon_us",
        url: "https://amzn.example/x",
        is_active: true,
        sort: 2,
      },
      {
        retailer: "oliveyoung_global",
        url: "https://oy.example/g",
        is_active: true,
        sort: 1,
      },
      {
        retailer: "amazon_us",
        url: "https://amzn.example/dead",
        is_active: false,
        sort: 0,
      },
    ],
  } as never);
  expect(p.offers).toEqual([
    { retailer: "oliveyoung_global", url: "https://oy.example/g" },
    { retailer: "amazon_us", url: "https://amzn.example/x" },
  ]);
  expect(p.tags).toEqual(["Dry", "Hydration"]);
  expect(p.awardBadge).toBe("Olive Young Awards 2024 · Essence/Serum");
});

it("defaults offers/tags/awardBadge when columns absent", () => {
  const p = mapProductRow(row as never);
  expect(p.offers).toEqual([]);
  expect(p.tags).toEqual([]);
  expect(p.awardBadge).toBeNull();
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd /Users/jj_whatap/up/adropofseoul && npx vitest run services/products.test.ts
```

Expected: 신규 2개 FAIL (offers undefined)

- [ ] **Step 3: 구현**

`services/types.ts`의 `Product` 위에 추가:

```ts
export type ProductOffer = {
  retailer: "oliveyoung_global" | "amazon_us";
  url: string;
};
```

`Product` 타입에 필드 3개 추가:

```ts
  offers: ProductOffer[];
  tags: string[];
  awardBadge: string | null;
```

`services/products.ts` — `ProductRow`에 추가:

```ts
  tags: string[] | null;
  award_badge: string | null;
  product_offers:
    | { retailer: string; url: string; is_active: boolean; sort: number }[]
    | null;
```

`COLUMNS` 상수 교체:

```ts
const COLUMNS =
  "id,name,brand,slug,category,description,price,image,affiliate_url,where_to_buy,best_for,ingredients,rating,disclosure_required,tags,award_badge,product_offers(retailer,url,is_active,sort)";
```

`mapProductRow` return에 추가:

```ts
    offers: (row.product_offers ?? [])
      .filter((o) => o.is_active)
      .sort((a, b) => a.sort - b.sort)
      .map((o) => ({ retailer: o.retailer, url: o.url }) as ProductOffer),
    tags: row.tags ?? [],
    awardBadge: row.award_badge ?? null,
```

(파일 상단 import에 `ProductOffer` 타입 추가: `import type { Product, ProductOffer } from "./types";`)

- [ ] **Step 4: 통과 + 전체 게이트**

```bash
npx vitest run && npx tsc --noEmit
```

Expected: 전체 통과(185+), tsc 클린. `Product` 타입 확장으로 다른 테스트의 목 객체가 깨지면 해당 목에 `offers: [], tags: [], awardBadge: null` 추가.

- [ ] **Step 5: Commit**

```bash
git add services/types.ts services/products.ts services/products.test.ts
git commit -m "feat(services): product offers/tags/awardBadge via nested select

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: ProductCard 확장 (TDD)

**Files:**

- Modify: `components/editorial/ProductCard.tsx`
- Test: `components/editorial/ProductCard.test.tsx` (확장)

**Interfaces:**

- Consumes: Task 5의 `Product.offers/tags/awardBadge`.
- Produces: 리테일러별 링크·태그 칩·어워드 배지가 있는 카드. 평점 미표시 유지.

- [ ] **Step 1: 실패하는 테스트 추가**

`components/editorial/ProductCard.test.tsx`를 읽고, 기존 목 제품 객체에 `offers: [], tags: [], awardBadge: null`을 추가한 뒤(§Task 5 타입 확장 대응), 테스트 추가:

```tsx
it("renders one link per active offer with retailer label", () => {
  render(
    <ProductCard
      product={{
        ...base,
        offers: [
          { retailer: "oliveyoung_global", url: "https://oy.example/g" },
          { retailer: "amazon_us", url: "https://amzn.example/x" },
        ],
      }}
    />
  );
  const oy = screen.getByRole("link", { name: /olive young/i });
  expect(oy).toHaveAttribute("href", "https://oy.example/g");
  expect(screen.getByRole("link", { name: /amazon/i })).toHaveAttribute(
    "href",
    "https://amzn.example/x"
  );
});

it("falls back to affiliateUrl single Shop link when no offers", () => {
  render(
    <ProductCard
      product={{ ...base, offers: [], affiliateUrl: "https://old.example" }}
    />
  );
  expect(screen.getByRole("link", { name: /shop/i })).toHaveAttribute(
    "href",
    "https://old.example"
  );
});

it("shows at most 3 tags and the award badge", () => {
  render(
    <ProductCard
      product={{
        ...base,
        tags: ["Dry", "Hydration", "Soothing", "Extra"],
        awardBadge: "Olive Young Awards 2024",
      }}
    />
  );
  expect(screen.getByText("Dry · Hydration · Soothing")).toBeInTheDocument();
  expect(screen.queryByText(/Extra/)).not.toBeInTheDocument();
  expect(screen.getByText("Olive Young Awards 2024")).toBeInTheDocument();
});

it("never renders a rating number", () => {
  render(<ProductCard product={{ ...base, rating: 4.6 }} />);
  expect(screen.queryByText(/4\.6/)).not.toBeInTheDocument();
});
```

(`base`는 파일의 기존 목 제품 상수명에 맞춘다 — 이름이 다르면 그 이름 사용.)

- [ ] **Step 2: 실패 확인**

```bash
npx vitest run components/editorial/ProductCard.test.tsx
```

Expected: 신규 4개 중 offers/tags/badge 3개 FAIL (rating 테스트는 이미 통과할 수 있음 — 그래도 회귀 방지로 유지)

- [ ] **Step 3: 구현**

`components/editorial/ProductCard.tsx` 교체:

```tsx
import type { Product } from "@/services/types";
import { TonalFrame } from "./TonalFrame";

const RETAILER_LABELS: Record<string, string> = {
  oliveyoung_global: "Olive Young",
  amazon_us: "Amazon",
};

export function ProductCard({ product }: { product: Product }) {
  const shopLinks =
    product.offers.length > 0
      ? product.offers.map((o) => ({
          label: RETAILER_LABELS[o.retailer] ?? "Shop",
          url: o.url,
        }))
      : product.affiliateUrl
        ? [{ label: "Shop", url: product.affiliateUrl }]
        : [];

  return (
    <div className="group">
      <div className="relative">
        <TonalFrame
          src={product.image}
          alt={product.name}
          label={product.category ?? undefined}
          ratio="aspect-square"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {product.awardBadge && (
          <span className="absolute left-2 top-2 rounded-sm bg-surface/90 px-2 py-1 text-[10px] uppercase tracking-label">
            {product.awardBadge}
          </span>
        )}
      </div>
      {product.brand && (
        <p className="mt-3.5 text-[10.5px] uppercase tracking-label text-text-muted">
          {product.brand}
        </p>
      )}
      <h3 className="mt-1 font-serif text-lg leading-tight">{product.name}</h3>
      {product.tags.length > 0 && (
        <p className="mt-1 text-[11px] text-text-muted">
          {product.tags.slice(0, 3).join(" · ")}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        {product.price && (
          <span className="text-sm tabular-nums">{product.price}</span>
        )}
        {shopLinks.length > 0 && (
          <span className="flex flex-wrap justify-end gap-x-3 gap-y-1">
            {shopLinks.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-[11px] uppercase tracking-label text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
              >
                {l.label} →
              </a>
            ))}
          </span>
        )}
      </div>
      {product.disclosureRequired && (
        <p className="mt-2 text-[11px] text-text-muted">
          Contains affiliate links. We may earn a commission.
        </p>
      )}
    </div>
  );
}
```

`bg-surface` 클래스가 tailwind 설정에 없으면 `bg-white/90`으로 대체 (구현 시 `tailwind.config.ts` 확인).

- [ ] **Step 4: 통과 + 전체 게이트**

```bash
npx vitest run && npx tsc --noEmit
```

Expected: 전체 통과, tsc 클린.

- [ ] **Step 5: Commit**

```bash
git add components/editorial/ProductCard.tsx components/editorial/ProductCard.test.tsx
git commit -m "feat(picks): retailer links, tag chips, award badge on ProductCard

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: `scripts/seed-picks.mjs` + 라이브 반영 (체크포인트)

**Files:**

- Create: `scripts/seed-picks.mjs`

**Interfaces:**

- Consumes: Task 3의 `data/beauty-pipeline/csv/picks_export.json`, Task 4의 `data/beauty-pipeline/images/out/*.webp`(있으면), Task 1 스키마(라이브 적용 필요), `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.
- Produces: 라이브 products/product_offers/storage 반영. `/beauty/picks`에 8개 카드.

- [ ] **Step 1: 스크립트 작성**

`scripts/seed-picks.mjs` (env 로딩은 `seed-ingredients.mjs`의 `env()` 패턴 복사):

```js
// Promotes data/beauty-pipeline/csv/picks_export.json into products/product_offers,
// uploading data/beauty-pipeline/images/out/<slug>.webp to storage when present.
// Usage: node scripts/seed-picks.mjs   (reads .env.local for URL + service key)
// Existing products: only tags/award_badge/offers/image are updated — name/brand/
// description edited in admin are preserved.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function env(key) {
  if (process.env[key]) return process.env[key];
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split(
    "\n"
  )) {
    if (line.startsWith(key + "="))
      return line
        .slice(key.length + 1)
        .trim()
        .replace(/^"|"$/g, "");
  }
  throw new Error("missing " + key);
}

const URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SRK = env("SUPABASE_SERVICE_ROLE_KEY");
const H = {
  apikey: SRK,
  Authorization: "Bearer " + SRK,
  "Content-Type": "application/json",
};
const BUCKET = "media";

async function rest(path, init = {}) {
  const res = await fetch(`${URL}${path}`, {
    ...init,
    headers: { ...H, ...init.headers },
  });
  const text = await res.text();
  if (!res.ok)
    throw new Error(
      `${init.method ?? "GET"} ${path} → ${res.status} ${text.slice(0, 200)}`
    );
  return text ? JSON.parse(text) : null;
}

async function ensureBucket() {
  const res = await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!res.ok && res.status !== 409) {
    const t = await res.text();
    if (!t.includes("already exists"))
      throw new Error(`bucket: ${res.status} ${t}`);
  }
}

async function uploadImage(slug) {
  const file = join(root, "data/beauty-pipeline/images/out", `${slug}.webp`);
  if (!existsSync(file)) return null;
  const res = await fetch(
    `${URL}/storage/v1/object/${BUCKET}/products/${slug}.webp`,
    {
      method: "POST",
      headers: { ...H, "Content-Type": "image/webp", "x-upsert": "true" },
      body: readFileSync(file),
    }
  );
  if (!res.ok)
    throw new Error(`upload ${slug}: ${res.status} ${await res.text()}`);
  return `${URL}/storage/v1/object/public/${BUCKET}/products/${slug}.webp`;
}

const picks = JSON.parse(
  readFileSync(join(root, "data/beauty-pipeline/csv/picks_export.json"), "utf8")
);
await ensureBucket();

for (const p of picks) {
  const [existing] = await rest(
    `/rest/v1/products?slug=eq.${p.slug}&select=id`
  );
  let id;
  if (existing) {
    id = existing.id;
    await rest(`/rest/v1/products?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ tags: p.tags, award_badge: p.award_badge }),
      headers: { Prefer: "return=minimal" },
    });
  } else {
    const [row] = await rest(`/rest/v1/products`, {
      method: "POST",
      body: JSON.stringify({
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        tags: p.tags,
        award_badge: p.award_badge,
        disclosure_required: p.disclosure_required,
        is_published: true,
      }),
      headers: { Prefer: "return=representation" },
    });
    id = row.id;
  }

  const image = await uploadImage(p.slug);
  if (image) {
    await rest(`/rest/v1/products?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ image }),
      headers: { Prefer: "return=minimal" },
    });
  }

  for (const [i, o] of p.offers.entries()) {
    await rest(`/rest/v1/product_offers?on_conflict=product_id,retailer`, {
      method: "POST",
      body: JSON.stringify({
        product_id: id,
        retailer: o.retailer,
        url: o.url,
        is_active: true,
        sort: i,
      }),
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    });
  }
  console.log(
    `${p.slug}${existing ? " (updated)" : " (created)"}${image ? " +image" : ""}`
  );
}
console.log(`done: ${picks.length} picks`);
```

- [ ] **Step 2: 라이브 마이그레이션 적용 (체크포인트)**

```bash
cd /Users/jj_whatap/up/adropofseoul
npx supabase db push 2>&1 | tail -5
```

프로젝트가 링크 안 돼 있거나 실패하면 STOP — Task 1의 SQL 파일 경로를 사용자에게 보고하고 대시보드 SQL 에디터 적용을 요청. (무료 티어 일시정지 상태면 먼저 깨워야 함.)

- [ ] **Step 3: 시드 실행**

```bash
node scripts/seed-picks.mjs
```

Expected: 8줄 `<slug> (created)` + `done: 8 picks`. 실패 시 에러 그대로 보고 (RLS 이슈면 service key 사용 여부 확인).

- [ ] **Step 4: 확인**

```bash
npx next build 2>&1 | tail -5   # 빌드 게이트
```

로컬 `npm run dev` 또는 프리뷰에서 `/beauty/picks` 눈확인: 카드 8개, 각각 "Olive Young →" 링크·태그·배지(해당 제품만)·disclosure 문구, 평점 없음. 이미지는 placeholder(원본 수급 전이므로 정상).

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-picks.mjs
git commit -m "feat(scripts): seed-picks.mjs — promote pipeline picks to live products/offers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 남는 사람 몫 (플랜 밖, 사용자에게 보고)

1. 토리든 원본 이미지 확보(프레스킷/직접 촬영) → `data/beauty-pipeline/images/raw/P00249.png` → `process_image.py` → `seed-picks.mjs` 재실행 (수직 슬라이스 완성).
2. OY 어필리에이트 대시보드에서 리워드코드 확인 → `OY_REWARD_CODE=<code> .venv/bin/python export_picks.py` 재실행 → 시드 재실행 (딥링크 전환).
3. admin 폼에서 각 제품 `description`(편집 한 줄) 작성.
