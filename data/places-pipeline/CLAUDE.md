# 장소 후보 파이프라인 (행안부 인허가 공공데이터 → 후보 CSV)

이 폴더는 행안부 생활_미용업 인허가 공공데이터로 구별 뷰티 업소 후보 테이블을 생성하는
독립 파이프라인이다. 앱(Next.js/Supabase)과 무관하며 DB에 절대 쓰지 않는다.
세부 설계: `docs/superpowers/specs/2026-07-22-places-pipeline-design.md`.

## 데이터 출처

- URL: `https://file.localdata.go.kr/file/download/beauty_salons/info?orgCode=<코드>`
- **Referer 헤더 필수** — `https://www.data.go.kr/` (없으면 302 → `/error.html`)
- 응답 헤더는 `Content-Type: text/csv;charset=UTF-8`이라고 주장하지만 실제 payload는
  **CP949**. `iconv -f cp949` 또는 `bytes.decode("cp949")`로 디코딩해야 함.
- 모든 필드에 트레일링 공백이 붙어있다 (`.strip()` 필수 — 키/값 전부).
- `orgCode` 파라미터가 실제로 해당 자치구만 필터링해 반환함을 실증 확인
  (2026-07-23, `?orgCode=3130000` → 마포구 1,661,449 bytes, 전 행 개방자치단체코드=3130000).
  전국 스트리밍 폴백은 불필요 — 구현하지 않음.
- 자치구 코드: 강남구 3220000, 마포구 3130000, 중구 3010000.

## 폴더 구성

- `candidates.py` — `DISTRICTS`, `download_district()`, `parse_rows()` (Task 1 범위).
  이후 태스크에서 상태 필터링/카테고리 매핑/동네 필터/중복 힌트/CSV 출력을 추가한다.
- `raw/` — 다운로드한 원본 CSV (git-ignored, 재현 가능하니 커밋하지 않음).
- `csv/` — (이후 태스크) 커밋되는 후보 산출물 `candidates_<district>.csv`.
- `tests/` — pytest, 네트워크 없이 fixture(`tests/fixtures/localdata_sample.csv`, CP949)로 검증.

## 실행

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest tests/ -q
.venv/bin/python candidates.py mapo --dest raw/
```

## 절대 규칙

1. Referer 헤더 없이 요청 금지 (즉시 차단됨).
2. User-Agent는 항상 `adropofseoul-research-bot/0.1 (contact: jj@whatap.io)`.
3. 타임아웃 30초, 재시도 최대 2회.
4. `raw/`의 원본 CSV는 커밋하지 않는다 — `data/places-pipeline/**`의 코드/테스트/산출 CSV만 커밋.
5. 테스트는 네트워크에 절대 나가지 않는다 (fixture + `download_district`는 stub된 `requests.get`으로만 검증).
