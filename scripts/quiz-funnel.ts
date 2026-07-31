// Per-question drop-off for a quiz, computed from our own tables.
//
// The v0.1 data-schema draft asked for `last_question_key` so the first four
// weeks of drop-off could be monitored per question. We don't need that column,
// and we don't need a third-party analytics provider either: an abandoned
// attempt's furthest question is just how many responses it has, and the
// definition tells us which question sits at that position.
//
// So this reports ground truth. When an analytics provider is eventually wired
// up, this stays the thing to reconcile it against.
//
// Usage: node scripts/quiz-funnel.ts            (hair, all time)
//        node scripts/quiz-funnel.ts --days 7   (last 7 days)
//        node scripts/quiz-funnel.ts --domain skin
//
// Reads only. Answers are counted, never printed — no answer text or option code
// leaves the database here.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function env(key: string): string {
  if (process.env[key]) return process.env[key] as string;
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

const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SRK = env("SUPABASE_SERVICE_ROLE_KEY");

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf("--" + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const DOMAIN = arg("domain", "hair");
const DAYS = Number(arg("days", "0"));

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SRK, Authorization: `Bearer ${SRK}` },
  });
  if (!res.ok)
    throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

function pct(n: number, of: number): string {
  return of === 0 ? "  — " : `${((n / of) * 100).toFixed(0).padStart(3)}%`;
}

function bar(n: number, of: number, width = 24): string {
  const filled = of === 0 ? 0 : Math.round((n / of) * width);
  return "█".repeat(filled) + "·".repeat(width - filled);
}

async function main() {
  const since =
    DAYS > 0
      ? new Date(Date.now() - DAYS * 86_400_000).toISOString()
      : undefined;
  const window = since ? `last ${DAYS} day(s)` : "all time";

  // The active definition and its question order.
  const defs = await get<{ id: string; version: number }[]>(
    `quiz_definitions?quiz_key=eq.${DOMAIN}&status=eq.active&select=id,version`
  );
  if (defs.length === 0) {
    console.log(`no active ${DOMAIN} definition`);
    return;
  }
  const def = defs[0];
  const questions = await get<{ id: string; question_key: string }[]>(
    `quiz_questions?quiz_definition_id=eq.${def.id}&select=id,question_key&order=position`
  );

  const attemptFilter =
    `quiz_attempts?quiz_definition_id=eq.${def.id}` +
    `&select=id,status,source_context,started_at` +
    (since ? `&started_at=gte.${since}` : "");
  const attempts =
    await get<{ id: string; status: string; source_context: string | null }[]>(
      attemptFilter
    );

  if (attempts.length === 0) {
    console.log(`${DOMAIN} v${def.version} — no attempts in ${window}`);
    return;
  }

  // Response counts per attempt = how far each one got.
  const responses = await get<{ quiz_attempt_id: string }[]>(
    `quiz_responses?select=quiz_attempt_id`
  );
  const answered = new Map<string, number>();
  for (const r of responses)
    answered.set(r.quiz_attempt_id, (answered.get(r.quiz_attempt_id) ?? 0) + 1);

  const completed = attempts.filter((a) => a.status === "completed");
  const abandoned = attempts.filter((a) => a.status !== "completed");

  console.log(
    `\n${DOMAIN} quiz v${def.version} — ${window}, ${questions.length} questions\n`
  );
  console.log(`  started    ${String(attempts.length).padStart(4)}`);
  console.log(
    `  completed  ${String(completed.length).padStart(4)}   ${pct(completed.length, attempts.length)}`
  );
  console.log(
    `  abandoned  ${String(abandoned.length).padStart(4)}   ${pct(abandoned.length, attempts.length)}\n`
  );

  // Reach: how many attempts answered at least this question. A completion
  // reached every question; an abandon reached as many as it has responses.
  console.log("  reach by question (× = where abandons stopped)\n");
  let previous = attempts.length;
  for (let i = 0; i < questions.length; i++) {
    const reached = attempts.filter(
      (a) => a.status === "completed" || (answered.get(a.id) ?? 0) >= i + 1
    ).length;
    const droppedHere = previous - reached;
    const marker = droppedHere > 0 ? ` × ${droppedHere}` : "";
    console.log(
      `  ${String(i + 1).padStart(2)}. ${questions[i].question_key.padEnd(22)}` +
        ` ${bar(reached, attempts.length)} ${String(reached).padStart(4)} ${pct(reached, attempts.length)}${marker}`
    );
    previous = reached;
  }

  // Entry attribution — "direct" dominating usually means a caller is sending a
  // source that isn't on the allowlist (that bug happened once already).
  const bySource = new Map<string, number>();
  for (const a of attempts) {
    const k = a.source_context ?? "(null)";
    bySource.set(k, (bySource.get(k) ?? 0) + 1);
  }
  console.log("\n  entry source\n");
  for (const [k, v] of [...bySource].sort((x, y) => y[1] - x[1]))
    console.log(
      `    ${k.padEnd(18)} ${String(v).padStart(4)} ${pct(v, attempts.length)}`
    );

  // Result mix, grouped by scoring version. Grouping matters: pre-M3 rows carry
  // rule_set_version "placeholder-0" and profile_code "placeholder", and mixing
  // those into the distribution would quietly understate every real archetype.
  const snaps = await get<
    {
      profile_code: string;
      rule_set_version: string;
      confidence_json: unknown;
    }[]
  >(
    `profile_snapshots?profile_domain=eq.${DOMAIN}&select=profile_code,rule_set_version,confidence_json`
  );
  const byVersion = new Map<string, typeof snaps>();
  for (const s of snaps) {
    const list = byVersion.get(s.rule_set_version) ?? [];
    list.push(s);
    byVersion.set(s.rule_set_version, list);
  }
  for (const [version, rows] of [...byVersion].sort()) {
    console.log(`\n  result mix — ${version} (${rows.length} snapshots)\n`);
    const byCode = new Map<string, number>();
    for (const s of rows)
      byCode.set(s.profile_code, (byCode.get(s.profile_code) ?? 0) + 1);
    for (const [k, v] of [...byCode].sort((x, y) => y[1] - x[1]))
      console.log(
        `    ${k.padEnd(22)} ${String(v).padStart(4)} ${pct(v, rows.length)}`
      );

    // A small margin means the runner-up was nearly as strong — the hybrid
    // segment the schema draft cared about. A pile-up here says the weights
    // aren't separating people, and the tie-break is doing too much work.
    const margins = rows
      .map((s) => (s.confidence_json as { margin?: number } | null)?.margin)
      .filter((m): m is number => typeof m === "number");
    if (margins.length > 0) {
      const close = margins.filter((m) => m <= 2).length;
      console.log(
        `    ${"margin ≤ 2 (hybrid)".padEnd(22)} ${String(close).padStart(4)} ${pct(close, margins.length)}`
      );
    }
  }
  console.log("");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
