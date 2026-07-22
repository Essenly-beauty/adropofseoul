# Places Candidate Pipeline (Phase c) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run the 인허가 공공데이터 candidate generator, curate 5–8 verified venues per hub (Gangnam & Cheongdam hair / Hongdae nails / Myeongdong facials) through the publish gate, plus review-mandated hardening — per `docs/superpowers/specs/2026-07-22-places-pipeline-design.md` (the spec's §2–§4 verified facts — Referer gate, CP949, empirical 업태구분 tokens, district codes — are binding).

**Architecture:** New standalone `data/places-pipeline/` Python module (requests + pytest, no pandas needed); candidates flow as committed CSVs; curation reuses the established 2-JSON → seed-migration → user-gate path. Hardening touches `lib/taxonomy.ts` + hub page only.

**Tech Stack:** Python 3 (requests, pytest), existing Node seed tooling, Vitest.

## Global Constraints

- The generator NEVER writes to the DB and never touches `data/adropofseoul_places.json`/`places-curation.en.json` (it only READS the former for dedupe hints).
- Do NOT touch `data/beauty-pipeline/**`. Raw downloads go to `data/places-pipeline/raw/` (git-ignored); only candidate CSVs under `data/places-pipeline/csv/` are committed.
- HTTP: `Referer: https://www.data.go.kr/` header required; User-Agent `adropofseoul-research-bot/0.1 (contact: jj@whatap.io)` (same convention as beauty-pipeline); 30s timeout; no retries beyond 2.
- All curation entries follow the standing rules: first-party sources only, `"rating": null, "reviews": null, "verified": false, "googleMaps": null, "naverMap": null, "reviewSummary": null`, original editorial copy, publish only via the user gate.
- Verification commands: `python3 -m pytest data/places-pipeline/tests -q` (pipeline), `npm run typecheck && npm run test && npm run build` (app).
- Branch: `feat/places-pipeline` (stacked on `feat/neighborhood-hubs`).

---

### Task 1: Pipeline scaffold — download + parse

**Files:**

- Create: `data/places-pipeline/candidates.py` (download/decode/parse portion), `data/places-pipeline/requirements.txt` (`requests`, `pytest`), `data/places-pipeline/CLAUDE.md` (short: purpose, source URL + Referer gate, CP949 note, run commands), `data/places-pipeline/.gitignore` (`raw/`), `data/places-pipeline/tests/test_candidates.py`, `data/places-pipeline/tests/fixtures/localdata_sample.csv` (CP949-encoded)
- Test: `data/places-pipeline/tests/test_candidates.py`

**Interfaces (produced, used by Task 2):**

- `DISTRICTS: dict` — `{"gangnam": {"org": "3220000", "hub": "gangnam-cheongdam", "neighborhoods": ["청담동", "압구정", "신사동"]}, "mapo": {"org": "3130000", "hub": "hongdae", "neighborhoods": ["서교동", "동교동", "합정동", "연남동", "상수동"]}, "junggu": {"org": "3010000", "hub": "myeongdong", "neighborhoods": ["명동", "충무로", "을지로"]}}`
- `download_district(district_key: str, dest_dir: str) -> str` — fetches the bulk CSV (empirically confirm the per-district URL: try `https://file.localdata.go.kr/file/download/beauty_salons/info?orgCode=<org>` first; if the response is not CSV or contains other districts, fall back to the nationwide stream), writes raw bytes to `dest_dir`, returns path. MUST send the Referer header.
- `parse_rows(path: str) -> list[dict]` — CP949 decode, csv.DictReader, `.strip()` every key and value; returns row dicts.

- [ ] **Step 1: Empirical URL check (no code yet).** From the worktree root run a curl with the Referer header against the `?orgCode=3130000` variant; inspect the first 3 lines (header + rows) — confirm CSV shape, whether rows are 마포-only (`개방자치단체코드` column), and capture the EXACT header line for the fixture. If the per-district param doesn't filter, note it and design `download_district` to stream the nationwide file. Record findings in your report.
- [ ] **Step 2: Write failing tests** — using a fixture you build from the REAL captured header plus 4 synthetic rows (one open 일반미용업 in 청담동, one 폐업 row, one 네일아트업, one row with trailing spaces in fields), CP949-encoded. Tests: `parse_rows` decodes CP949 and strips whitespace (assert a value that had trailing spaces); DictReader keys match the real header; `DISTRICTS` has the three entries with correct org codes.
- [ ] **Step 3: Run tests, verify failure.** `python3 -m pytest data/places-pipeline/tests -q` → import/function errors.
- [ ] **Step 4: Implement** `DISTRICTS`, `download_district`, `parse_rows` in `candidates.py` (download is NOT exercised by tests — network-free tests; guard it behind CLI usage).
- [ ] **Step 5: Tests green.** Same command; all pass.
- [ ] **Step 6: Commit** — `git add data/places-pipeline && git commit -m "feat(pipeline): places candidate scaffold — LOCALDATA download + CP949 parse"`

---

### Task 2: Filter, category mapping, candidate CSV emitter

**Files:**

- Modify: `data/places-pipeline/candidates.py`
- Test: `data/places-pipeline/tests/test_candidates.py` (extend)

**Interfaces:**

- `CATEGORY_RULES: list[tuple[str, list[str]]]` — exactly the spec §3 table, in order: `[("salon", ["일반미용업", "종합미용업", "미용업"]), ("nail_lash", ["네일아트업", "네일미용업"]), ("facial", ["피부미용업", "두피관리업"]), ("makeup", ["메이크업업", "화장ㆍ분장", "화장·분장"])]`
- `map_category(row) -> str | None` — substring match over 업태구분명 then 위생업태명; first rule wins; bare-"미용업" token must match the exact value or a comma-separated part (NOT substring inside e.g. "네일미용업" — implement token-aware matching: split 위생업태명 on commas, compare stripped parts; 업태구분명 compared as whole value); returns None when unmapped.
- `is_open(row) -> bool` — determine from the real header which column carries open/closed (영업상태구분코드 == "01" or 상세영업상태명/영업상태명 == "영업/정상" 계열 — decide from Task 1's captured header and record the choice).
- `match_neighborhood(row, neighborhoods) -> bool` — substring over 도로명전체주소, fallback 소재지전체주소/지번주소.
- `existing_slug_hint(row, places_json) -> str | None` — normalized (whitespace/괄호 stripped) containment match of 사업장명 against nameKr/nameEn, or road-address containment, against `data/adropofseoul_places.json`.
- `emit_candidates(rows, district_key, out_path) -> dict` — writes UTF-8 CSV with columns exactly: `관리번호,사업장명,category,업태구분명,위생업태명,도로명주소,지번주소,전화,인허가일자,영업상태,hub,existing_slug,status`; `status=PENDING_REVIEW`; returns per-category counts. Also `value_counts` of 업태구분명 across the district's OPEN rows printed to stdout (spec §3 first-ingest requirement).
- CLI: `python3 candidates.py <district_key> [--raw PATH] [--out PATH]` — download (or reuse `--raw`), parse, filter open → category → neighborhood, dedupe hint, emit.

- [ ] **Step 1: Write failing tests** for: token-aware bare-미용업 matching (positive: 위생업태명 "미용업"; negative: "네일미용업" must NOT map to salon), comma-combined 위생업태명 ("피부미용업, 네일미용업" → facial via first rule order), 업태구분명 direct hit (네일아트업 → nail_lash), unmapped row → None, closed row filtered, neighborhood match on 도로명 and 지번 fallback, existing-slug hint (fixture JSON with one known nameKr), emit column order + counts.
- [ ] **Step 2: Verify failure.** `python3 -m pytest data/places-pipeline/tests -q`
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Tests green.**
- [ ] **Step 5: Commit** — `feat(pipeline): candidate filtering, category mapping, CSV emitter`

---

### Task 3: Live run — three districts

**Files:**

- Create: `data/places-pipeline/csv/candidates_gangnam.csv`, `candidates_mapo.csv`, `candidates_junggu.csv` (committed)

- [ ] **Step 1:** Run the CLI for each district. Record per-district: open-row count, 업태구분명 value_counts (flag values not covered by CATEGORY_RULES), per-category candidate counts after neighborhood filter, count with existing_slug hints.
- [ ] **Step 2: Sanity checks** — expected magnitudes from research: 마포 open ≈ 2,100 total 미용업; 중구 피부미용업 open ≈ 168. If a district×target category yields 0 or >1,000 candidates, STOP and report (filter bug).
- [ ] **Step 3:** Spot-check 5 random candidate rows per district against the raw CSV (fields intact, addresses in target neighborhoods).
- [ ] **Step 4: Commit** — `feat(data): first candidate tables — gangnam/mapo/junggu from 인허가 data`

---

### Task 4: Curation sprint (controller-orchestrated, not an SDD implementer task)

The controller runs a multi-agent workflow over the candidate CSVs: for each hub, sample candidates (prioritize target category; prefer recent 인허가일자 and non-franchise-looking names), fan out verification agents (official site/Instagram discovery; confirmed-operating + live channel + foreign-visitor suitability), loop until **5–8 CONFIRMED per hub**; then implementer agents write the 2-JSON entries (unpublished, standing data rules), validate with `node scripts/seed-places.mjs --dry-run`, commit.

- [ ] Fan-out verification per hub (loop-until-count)
- [ ] 2-JSON entries for confirmed venues, dry-run clean, commit `feat(data): curated candidates from 인허가 pipeline (unpublished)`

---

### Task 5: Publish gate + migration

- [ ] Present per-venue verdict list to the user; **STOP for explicit approval** (publish set may be a subset)
- [ ] Flip approved `verified: true`, regenerate `supabase/migrations/<ts>_publish_pipeline_places.sql` via `node scripts/seed-places.mjs --sql`, spot-check, `npm run db:push`, REST-verify
- [ ] Commit `feat(data): publish pipeline-sourced places (post user gate)`

---

### Task 6: Hardening (app code)

**Files:**

- Modify: `lib/taxonomy.ts`, `lib/taxonomy.test.ts`, `components/around-seoul/NeighborhoodDirectory.tsx`, `services/places.ts`, `app/around-seoul/[neighborhood]/page.tsx`

- [ ] **Step 1: Failing tests** for a new pure helper in `lib/taxonomy.ts`:

```ts
/** Directory URL for a hub section: area only for single-area hubs;
 *  type for single-category sections, else kind when restricted. */
export function sectionDirectoryHref(
  neighborhood: Neighborhood,
  section: NeighborhoodSection
): string {
  const params = new URLSearchParams();
  if (!neighborhood.areas) params.set("area", neighborhood.label);
  if (section.categories.length === 1)
    params.set("type", placeTypeSlug(section.categories[0]));
  else if (section.entryType) params.set("kind", section.entryType);
  const query = params.toString();
  return query ? `/places?${query}` : "/places";
}
```

Tests (4-case matrix): single-area+single-category → `?area=X&type=y`; single-area+multi-category+entryType → `?area=X&kind=experience`; multi-area+single-category → `?type=y`; multi-area+multi-category+no-entryType → `/places`.

- [ ] **Step 2:** Verify failure, implement, replace the inline builder in `NeighborhoodDirectory.tsx` with `sectionDirectoryHref(neighborhood, section)` (delete the inline `URLSearchParams` block), tests green.
- [ ] **Step 3:** `services/places.ts` — doc comment above `listPlaces`: `/** List published places. Pass \`area\` OR \`areas\` (they AND together if both given — callers should pass one). */`
- [ ] **Step 4:** `app/around-seoul/[neighborhood]/page.tsx` `generateMetadata` — truncate description at a word boundary ≤155 chars:

```ts
const rawDescription = n.lede ?? n.blurb;
const description =
  rawDescription.length > 155
    ? rawDescription.slice(0, 152).replace(/\s+\S*$/, "") + "…"
    : rawDescription;
```

Use `description` in both `description` and `openGraph.description`.

- [ ] **Step 5:** `npm run typecheck && npm run test && npm run build` — green. Commit `refactor(around-seoul): extract section href builder; trim hub meta descriptions`
