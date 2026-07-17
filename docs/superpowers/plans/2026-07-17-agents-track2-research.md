# Editorial Agents — Track 2: Research Agent + Human Gate 1

> **For agentic workers:** Implement task-by-task with checkbox (`- [ ]`) tracking.
> TDD with injected fakes — no live LLM/Reddit/Supabase calls in tests.

**Goal:** The editor can press "Run research" for a Seoul area (or let a weekly
cron do it), and sourced, deduped place candidates appear in a new admin
review surface where they are approved (→ promoted to a `places` draft) or
rejected. Spec §5.2, §5.3, §5.6.

**Spec:** `docs/superpowers/specs/2026-07-17-editorial-research-agents-design.md`
**Prerequisite:** Track 1 (`feat/agents-track1-foundations`) merged/stacked.

## Design decisions (resolving spec §5.2 "Reddit + web")

- **Reddit:** public JSON search API (`reddit.com/search.json`) with a
  descriptive User-Agent, read-only, no OAuth app needed for MVP volume
  (one manual run + one weekly cron). Fetcher is injectable; if rate limits
  bite, swap to OAuth creds behind the same interface without touching the
  pipeline.
- **Web research:** the model's **server-side web-search tool** through the
  AI Gateway (Anthropic web_search) — cited results, no extra search-API key.
  Wrapped in the same injectable fetcher interface.
- **Trigger latency:** the manual trigger is a Server Action that runs the
  pipeline inline (~30–60s, well under the 300s function ceiling) and
  redirects back to the candidates list.
- **Cron:** ONE weekly Vercel Cron hitting `app/api/agents/research/route.ts`,
  gated by `CRON_SECRET` (Authorization: Bearer). This is the repo's first API
  route — justified: cron cannot invoke Server Actions. The route only rotates
  through `RESEARCH_AREAS` and calls the same `runResearch`.
- **Caps (spec §7):** `limit` candidates per run (RunConfig, ≤25, default 10);
  gather keeps top ~20 Reddit posts; drops are recorded in `counts` on the run
  row — no silent truncation.

## File Structure

```
lib/agents/sources.ts  sources.test.ts     # NEW: SourceDoc type, reddit fetch parse, gather merge
services/agents/research.ts  research.test.ts  # NEW: runResearch pipeline (injectable deps)
app/admin/candidates/
  page.tsx                                 # NEW: list (grouped by status) + run-research form
  [id]/page.tsx                            # NEW: detail — sources, evidence, actions
app/admin/actions/candidates.ts            # NEW: runResearchAction, approveCandidate, rejectCandidate
app/admin/layout.tsx                       # MODIFY: add Candidates nav link
app/api/agents/research/route.ts           # NEW: cron entry (CRON_SECRET gate)
vercel.json                                # NEW: weekly cron schedule
docs/PROVISIONING.md                       # MODIFY: CRON_SECRET
```

## Tasks

### Task 1: Source layer (TDD)

- [ ] `lib/agents/sources.ts`: `SourceDoc {url, title, text}`;
      `parseRedditSearch(json): SourceDoc[]` (pure — permalink→URL, title+selftext
      →text, skip empty/removed); `formatGathered(docs): string` (numbered,
      URL-labeled blocks for the extract prompt); `redditQueryFor(area)` (area +
      beauty/spa/salon/cafe terms).
- [ ] Tests with a fixture JSON: parse shape, removed-post skip, formatting
      contains URLs (extractor must be able to cite them).
- [ ] `fetchRedditDocs(area, fetchImpl = fetch)` — thin I/O wrapper, UA header,
      not unit-tested beyond wiring.

### Task 2: Research pipeline (TDD)

- [ ] `services/agents/research.ts` — `runResearch(config, deps)` where `deps`
      `{ gather, extract }` are injectable (prod defaults: reddit fetch + model
      web-search gather; generateObject extract with CandidateListSchema): 1. `createRun` (research, prompt_version) → 2. gather → 3. extract → 4. schema-parse → `combinedConfidence` per candidate → 5. `filterNewCandidates` vs existing keys (fetch existing candidate +
      place keys for the area) → 6. `insertCandidates` → 7. `finishRun` with counts {gathered, extracted, kept, dropped} — and
      `finishRun(status:'error')` on any throw.
- [ ] Tests (fakes): happy path persists kept candidates + done-run with
      counts; extract failure → run marked error, nothing inserted; all-dupes →
      run done with kept=0.

### Task 3: Candidate review UI (Human Gate 1)

- [ ] `app/admin/actions/candidates.ts` (`"use server"`, ALL behind
      `requireAdmin()`):
      `approveCandidate(id)` — createPlace draft (`is_published:false`, notes
      ← whyNotable + source URLs) then `setCandidateStatus(id,'promoted',placeId)`;
      `rejectCandidate(id)`; `runResearchAction(prev, formData)` (area from
      form → `runResearch` → redirect with result note).
- [ ] `app/admin/candidates/page.tsx` — new candidates grouped by area
      (name · category guess · confidence · source count), links to detail;
      sections for reviewing/approved; run-research form (area input +
      SubmitButton) at top.
- [ ] `[id]/page.tsx` — full detail: whyNotable, evidence quote, clickable
      source URLs, confidence; Approve/Reject buttons (approve disabled note
      when confidence < APPROVAL_THRESHOLD — editor may still approve).
- [ ] Nav link in `app/admin/layout.tsx`.

### Task 4: Cron entry

- [ ] `app/api/agents/research/route.ts` — GET; 401 unless
      `Authorization: Bearer ${CRON_SECRET}`; rotates area by ISO-week index
      over `RESEARCH_AREAS = [Seongsu, Hannam, Bukchon, Yeonnam, Apgujeong]`;
      calls `runResearch`; returns run summary JSON.
- [ ] `vercel.json`: `{"crons":[{"path":"/api/agents/research","schedule":"0 21 * * 1"}]}`
      (Mon 21:00 UTC = Tue 06:00 KST).
- [ ] PROVISIONING.md: `CRON_SECRET` setup.

### Task 5: Verify + ship

- [ ] `npm run test && npm run typecheck && npm run build` green.
- [ ] Live smoke (manual, post-provisioning): run research for Seongsu →
      candidates appear with real sources → approve one → confirm places draft
      in admin → reject one → re-run same area → no duplicates.

### Task 6 (amendment, 2026-07-17): image candidates

Editor request: also collect thumbnail-grade and in-article photos during
research, with sources recorded (credits will be shown) and brand tone
re-processing (2차 가공) applied later at render.

- [x] Migration `0004_image_candidates.sql` — url (unique), source_url,
      source_type (reddit/web/unsplash/pexels), suggested_use
      (thumbnail/inline), license (commercial-ok/attribution-required/
      **unverified**), attribution, status, optional place_candidate link.
- [x] Two channels: **reality shots** found in sources (reddit previews/
      direct links + extractor `imageUrls` echoing only URLs present in the
      material) stored as `unverified` — content-strategy licensing hygiene:
      attribution alone is not a license, the editor clears rights at the
      gate; **stock pool** via Unsplash/Pexels APIs (env-gated, both
      commercial-safe) for thumbnails.
- [x] `RunConfig.images` option (form checkbox, default on; cron default on).
- [x] `services/agents/images.ts` (idempotent inserts, list, approve/reject);
      pipeline persists linked + pool images and records `counts.images`.
- [x] UI: image grid with license badge / attribution / source link and
      approve/reject on the candidate detail page + an area image pool on the
      candidates list.
- Brand tone treatment itself stays the separate small frontend task from the
  content-strategy spec (tint applied in code to approved picks).

## Definition of Done

- Pipeline is idempotent per area (dedupe vs existing candidates AND places).
- No agent→published path: approval creates an UNPUBLISHED places draft only.
- Candidates invisible to public services (no public read path added).
- All new server actions call `requireAdmin()`; cron route requires the secret.
- Suite/typecheck/build green; no live-network tests.

**Next:** Track 3 — writing agent (`writer.ts`) + AI review panel.
