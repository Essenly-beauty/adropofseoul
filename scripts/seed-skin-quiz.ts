// Upserts SKIN_PROFILE_V1 as the active skin definition. Data operation only;
// use --dry to inspect without writing.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SKIN_PROFILE_V1 } from "../lib/skincare/profile-v1.ts";

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
const VERIFY = process.argv.includes("--verify");

async function rest(
  path: string,
  init: { method: string; body?: unknown; prefer?: string }
) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: init.method,
    headers: {
      apikey: SRK,
      Authorization: `Bearer ${SRK}`,
      "Content-Type": "application/json",
      Prefer: init.prefer ?? "return=representation",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await response.text();
  if (!response.ok)
    throw new Error(`${init.method} ${path} → ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  const questions = SKIN_PROFILE_V1.questions;
  console.log(
    `skin quiz v${SKIN_PROFILE_V1.version}: ${questions.length} questions`
  );
  if (DRY) {
    for (const question of questions)
      console.log(
        `  ${question.key} (${question.type}) — ${question.options.length} options`
      );
    return;
  }
  if (VERIFY) {
    const definitions = await rest(
      `quiz_definitions?quiz_key=eq.skin&version=eq.${SKIN_PROFILE_V1.version}&status=eq.active&select=id,version,status`,
      { method: "GET" }
    );
    if (definitions.length !== 1)
      throw new Error(
        `expected 1 active definition, found ${definitions.length}`
      );
    const definitionId = definitions[0].id;
    const storedQuestions = await rest(
      `quiz_questions?quiz_definition_id=eq.${definitionId}&select=id,question_key`,
      { method: "GET" }
    );
    const expectedOptions = questions.reduce(
      (total, question) => total + question.options.length,
      0
    );
    const questionIds = storedQuestions.map((row: { id: string }) => row.id);
    const storedOptions = questionIds.length
      ? await rest(
          `quiz_options?question_id=in.(${questionIds.join(",")})&select=id`,
          { method: "GET" }
        )
      : [];
    if (storedQuestions.length !== questions.length)
      throw new Error(
        `expected ${questions.length} questions, found ${storedQuestions.length}`
      );
    if (storedOptions.length !== expectedOptions)
      throw new Error(
        `expected ${expectedOptions} options, found ${storedOptions.length}`
      );
    console.log(
      `verified active skin quiz v${SKIN_PROFILE_V1.version}: ${storedQuestions.length} questions, ${storedOptions.length} options`
    );
    return;
  }
  await rest(
    `quiz_definitions?quiz_key=eq.skin&status=eq.active&version=neq.${SKIN_PROFILE_V1.version}`,
    {
      method: "PATCH",
      body: { status: "retired", retired_at: new Date().toISOString() },
      prefer: "return=minimal",
    }
  );
  const [definition] = await rest(
    "quiz_definitions?on_conflict=quiz_key,version",
    {
      method: "POST",
      body: [
        {
          quiz_key: "skin",
          version: SKIN_PROFILE_V1.version,
          status: "active",
          locale_strategy: "single",
          title_key: SKIN_PROFILE_V1.title,
          description_key: SKIN_PROFILE_V1.description ?? null,
          published_at: new Date().toISOString(),
          retired_at: null,
        },
      ],
      prefer: "resolution=merge-duplicates,return=representation",
    }
  );
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const [row] = await rest(
      "quiz_questions?on_conflict=quiz_definition_id,question_key",
      {
        method: "POST",
        body: [
          {
            quiz_definition_id: definition.id,
            question_key: question.key,
            question_type: question.type,
            section_key: question.sectionKey ?? null,
            position: index,
            is_required: question.isRequired,
            allows_multiple: question.allowsMultiple,
            content_key: question.content,
            help_text_key: question.helpText ?? null,
            validation_json: question.validation ?? null,
          },
        ],
        prefer: "resolution=merge-duplicates,return=representation",
      }
    );
    if (question.options.length)
      await rest("quiz_options?on_conflict=question_id,option_key", {
        method: "POST",
        body: question.options.map((option, position) => ({
          question_id: row.id,
          option_key: option.key,
          position,
          content_key: option.label,
          value_code: option.value,
        })),
        prefer: "resolution=merge-duplicates,return=minimal",
      });
  }
  console.log(`seeded skin quiz v${SKIN_PROFILE_V1.version}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
