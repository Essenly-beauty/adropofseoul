// Upserts HAIR_QUIZ into quiz_definitions/questions/options as the active
// version 1, and retires any other active hair version.
//
// Usage: node scripts/seed-hair-quiz.ts        (reads .env.local)
//        node scripts/seed-hair-quiz.ts --dry  (print what would be written)
//
// This is DATA, not schema — it deliberately does not go through a migration.
// supabase/migrations/README.md forbids a blind `db push` against the live
// drift, and the quiz definition needs no DDL.
//
// The definition is imported, not restated: the v0 SQL seed transcribed every
// question by hand, which is exactly how a definition and its seed drift apart.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { HAIR_QUIZ } from "../lib/haircare/quiz.ts";

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
const DRY = process.argv.includes("--dry");

async function rest(
  path: string,
  init: { method: string; body?: unknown; prefer?: string }
) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: init.method,
    headers: {
      apikey: SRK,
      Authorization: `Bearer ${SRK}`,
      "Content-Type": "application/json",
      Prefer: init.prefer ?? "return=representation",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  if (!res.ok)
    throw new Error(`${init.method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const questions = HAIR_QUIZ.questions;
console.log(
  `hair quiz v${HAIR_QUIZ.version}: ${questions.length} questions, ` +
    `${questions.reduce((n, q) => n + q.options.length, 0)} options`
);
if (DRY) {
  for (const q of questions)
    console.log(`  ${q.key} (${q.type}) — ${q.options.length} options`);
  process.exit(0);
}

// 1. Retire any other active hair version first: the schema uniques
// (quiz_key, version), not "one active per domain", so this is enforced here.
await rest(
  `quiz_definitions?quiz_key=eq.hair&status=eq.active&version=neq.${HAIR_QUIZ.version}`,
  {
    method: "PATCH",
    body: { status: "retired", retired_at: new Date().toISOString() },
    prefer: "return=minimal",
  }
);

// 2. Upsert the definition on (quiz_key, version).
const [def] = await rest("quiz_definitions?on_conflict=quiz_key,version", {
  method: "POST",
  body: [
    {
      quiz_key: HAIR_QUIZ.quizKey,
      version: HAIR_QUIZ.version,
      status: "active",
      locale_strategy: "single",
      title_key: HAIR_QUIZ.title,
      description_key: HAIR_QUIZ.description ?? null,
      published_at: new Date().toISOString(),
      retired_at: null,
    },
  ],
  prefer: "resolution=merge-duplicates,return=representation",
});
console.log("definition:", def.id);

// 3. Upsert questions on (quiz_definition_id, question_key), then their options
// on (question_id, option_key). Position comes from array order, so reordering
// the definition reorders the quiz without touching any key.
for (let i = 0; i < questions.length; i++) {
  const q = questions[i];
  const [row] = await rest(
    "quiz_questions?on_conflict=quiz_definition_id,question_key",
    {
      method: "POST",
      body: [
        {
          quiz_definition_id: def.id,
          question_key: q.key,
          question_type: q.type,
          section_key: q.sectionKey ?? null,
          position: i,
          is_required: q.isRequired,
          allows_multiple: q.allowsMultiple,
          content_key: q.content,
          help_text_key: q.helpText ?? null,
          validation_json: q.validation ?? null,
        },
      ],
      prefer: "resolution=merge-duplicates,return=representation",
    }
  );
  if (q.options.length > 0) {
    await rest("quiz_options?on_conflict=question_id,option_key", {
      method: "POST",
      body: q.options.map((o, j) => ({
        question_id: row.id,
        option_key: o.key,
        position: j,
        content_key: o.label,
        value_code: o.value,
      })),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  }
  console.log(`  ${q.key}: ${q.options.length} options`);
}

console.log("seeded hair quiz v" + HAIR_QUIZ.version);
