# Beauty Data Pipeline Scaffold — Design

**Date:** 2026-07-20
**Status:** Approved (verbal)
**Scope:** Build the missing pieces of the Hwahae↔Oliveyoung product-data merge pipeline. No live crawling. No changes to the app's Supabase `products` table.

## Background

We maintain a CSV master set of K-beauty products (내부 ID `P#####`, 화해 데이터 기반) plus merge tooling for adding Oliveyoung (올리브영) as a second source. The source files currently live at `/Users/jj_whatap/Downloads/files (2)/`:

- 12 CSVs in `화해_제품_분류_csv/` (UTF-8 BOM, Korean intact)
- `merge_oliveyoung.py` — 국내(한글) merge; `load_crawled()` is `NotImplementedError`
- `apply_global.py` — global(영문) 2단계 apply; expects `reconcile_global.csv` + `oliveyoung_global_crawl.json`
- `inventory_raw_values.py` — raw-value inventory for the map CSVs
- `oliveyoung_claude_code_brief.md` — the merge rules (절대 규칙 포함)

Missing pieces: `reconcile_global.py` (referenced by the brief but never written), a working `load_crawled()`, a crawler scaffold, and a standalone validator.

## Deliverables

### 1. Workspace: `data/beauty-pipeline/`

```
data/beauty-pipeline/
  CLAUDE.md                  # the brief's content (merge rules travel with the folder)
  requirements.txt           # pandas, requests, beautifulsoup4
  csv/                       # the 12 master CSVs, copied as-is
  merge_oliveyoung.py        # existing, load_crawled() wired to JSON input
  apply_global.py            # existing, copied as-is (path adjusted to csv/)
  inventory_raw_values.py    # existing, copied as-is (path adjusted to csv/)
  reconcile_global.py        # NEW
  crawler.py                 # NEW — scaffold only, no live requests by default
  validate.py                # NEW
```

Scripts read/write CSVs in `csv/` (a `DIR` constant at the top of each script; existing scripts get only that one-line change plus nothing else — their logic is untouched).

### 2. `reconcile_global.py` (new)

Input: `oliveyoung_global_crawl.json` — list of records with `oy_id`, `brand_en`, `product_name_en`, `url`, optional `category`, `skin_types[]`, `concerns[]`.

Logic:

1. Load `brands.csv`; build `brand_en (lowercased, trimmed)` → `brand(한글)` bridge.
2. For each crawl record, find the Korean brand. If found, list that brand's master products (`P#####` + 한글 제품명) as candidates.
3. Emit `reconcile_global.csv` with columns:
   `oy_global_id, brand_en, product_name_en, url, matched_product_id, candidate_pids, candidate_names`
   - `matched_product_id` is **always blank** — a human/LLM fills in `P#####` or `NEW`. The script never guesses.
   - `candidate_pids`/`candidate_names` are `|`-joined helper columns; `apply_global.py` ignores them.
4. Print a summary: total records, records with ≥1 candidate, brand-miss count (brands not in `brands.csv` → will become NEW).

### 3. `merge_oliveyoung.py` — `load_crawled()`

Reads `oliveyoung_crawl.json` (same folder) and returns the dict list. Validates each record has the required fields (`brand`, `product_name`, `oy_id`, `url`); raises with a clear message listing offending records otherwise. No other changes to the file's merge logic.

### 4. `crawler.py` (new, scaffold)

Python + `requests` + `BeautifulSoup`. Structure:

- `check_robots(base_url)` — fetches and prints robots.txt guidance; the module docstring reminds to check ToS/공식 API first (brief step 1).
- `fetch(url)` — rate-limited (configurable delay, default 3s), explicit User-Agent.
- `parse_product(html) -> dict` — **TODO stub** with the exact output schema documented:
  required `brand, product_name, oy_id, url`; optional `brand_en, category, subcategory, skin_types[], concerns[]`.
- `main()` — takes a list of product URLs (file arg), crawls max N (default 10, the brief's 시딩 상한), writes `oliveyoung_crawl.json`.
- Running the module without arguments prints usage and exits — nothing hits the network unless explicitly invoked with URLs.

### 5. `validate.py` (new)

Standalone run of the brief's verification report against `csv/`:

- `product_id` unique
- matching-key (`keyf`) duplicates = 0 — imports `keyf` from `merge_oliveyoung.py` (single source of truth)
- orphan `product_sources` rows = 0
- referential check: `skin_types`, `concerns`, `age_groups`, `awards`, `rankings`, `textures` product_ids all exist in `products.csv`
- map coverage: raw values in `skin_types`/`concerns` present in their `*_map.csv`

Exit code 0/1 + printed report.

## Non-goals

- Live crawling (crawler is inert by default; parse logic is a stub)
- Supabase / Next.js app integration (separate future project)
- Filling `std_value` in the map CSVs, or reconciling actual global data

## Verification

- `python3 validate.py` passes on the copied master CSVs.
- `reconcile_global.py` + `apply_global.py` round-trip tested with a tiny fixture `oliveyoung_global_crawl.json` (2–3 fake records: one matching an existing brand, one NEW brand), on a throwaway copy of the CSVs — asserting: matched product gets `product_name_en` filled + source row added; NEW gets `P00360`+; reruns are idempotent for sources.
- `merge_oliveyoung.py` round-trip tested the same way with a fixture `oliveyoung_crawl.json`.
- Fixtures and CSV copies live in a temp dir during tests; the committed `csv/` masters are never mutated by tests.

## Decisions

- Crawler stack: Python/requests/BeautifulSoup (matches existing pandas tooling).
- `matched_product_id` left blank by `reconcile_global.py` (never pre-filled, not even "NEW").
- Workspace lives in-repo at `data/beauty-pipeline/` so it's versioned alongside the app.
