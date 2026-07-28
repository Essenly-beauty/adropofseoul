// Pure mapping from DB rows (quiz_definitions / quiz_questions / quiz_options)
// to the client-facing QuizDefinition shape PLUS a server-side index the
// persistence layer needs (question UUIDs, option_key ↔ value_code maps, scale
// bounds, required-answerable keys). No DB client here, so it unit-tests
// directly.
//
// Content resolution (M2b-2, locale_strategy = 'single'): the *_key columns are
// treated as literal display text — no i18n resolver exists yet. Falls back to
// the machine key when a content column is null so nothing renders blank.
// Option `value` is always the canonical value_code, never the label (docs/03).

import type { Database } from "@/types/database.types";
import type {
  QuizDefinition,
  QuizQuestionDef,
  QuizOptionDef,
} from "./quiz-definition";
import type { QuestionTypeValue } from "./validation";

type DefRow = Database["public"]["Tables"]["quiz_definitions"]["Row"];
type QuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type OptionRow = Database["public"]["Tables"]["quiz_options"]["Row"];

/** Per-question server-side index used to validate + persist responses. */
export type LoadedQuestion = {
  /** quiz_questions.id (UUID) — never leaked to the client. */
  id: string;
  key: string;
  type: QuestionTypeValue;
  isRequired: boolean;
  allowsMultiple: boolean;
  /** Option keys this question allows (the only keys a response may reference). */
  optionKeys: string[];
  /** option_key → canonical value_code (what we store in response_json). */
  optionKeyToValue: Record<string, string>;
  /** value_code → option_key (to rehydrate a saved answer for the renderer). */
  valueToOptionKey: Record<string, string>;
  /** Parsed { min, max } for a scale question, else null. */
  scale: { min: number; max: number } | null;
};

export type LoadedQuizDefinition = {
  definitionId: string;
  quizKey: "skin" | "hair";
  version: number;
  status: Database["public"]["Enums"]["quiz_status"];
  /** Client-facing shape (no internal UUIDs). */
  definition: QuizDefinition;
  questionByKey: Record<string, LoadedQuestion>;
  /** Keys of required, answerable (non-info) questions — for completion checks. */
  requiredAnswerableKeys: string[];
};

function parseScale(
  validationJson: unknown
): { min: number; max: number } | null {
  if (!validationJson || typeof validationJson !== "object") return null;
  const v = validationJson as Record<string, unknown>;
  const min = typeof v.min === "number" ? v.min : 0;
  const max = typeof v.max === "number" ? v.max : null;
  if (max === null) return null;
  return { min, max };
}

/**
 * Map the raw rows of one quiz definition into the client shape + server index.
 * `questions` and `options` may be in any order; they are sorted by `position`.
 */
export function mapQuizDefinition(
  def: DefRow,
  questions: QuestionRow[],
  options: OptionRow[]
): LoadedQuizDefinition {
  const optionsByQuestion = new Map<string, OptionRow[]>();
  for (const opt of options) {
    const list = optionsByQuestion.get(opt.question_id) ?? [];
    list.push(opt);
    optionsByQuestion.set(opt.question_id, list);
  }

  const sortedQuestions = [...questions].sort(
    (a, b) => a.position - b.position
  );

  const questionByKey: Record<string, LoadedQuestion> = {};
  const requiredAnswerableKeys: string[] = [];
  const clientQuestions: QuizQuestionDef[] = [];

  for (const q of sortedQuestions) {
    const type = q.question_type as QuestionTypeValue;
    const opts = (optionsByQuestion.get(q.id) ?? []).sort(
      (a, b) => a.position - b.position
    );

    const optionKeyToValue: Record<string, string> = {};
    const valueToOptionKey: Record<string, string> = {};
    const clientOptions: QuizOptionDef[] = [];
    for (const o of opts) {
      optionKeyToValue[o.option_key] = o.value_code;
      valueToOptionKey[o.value_code] = o.option_key;
      clientOptions.push({
        key: o.option_key,
        value: o.value_code,
        label: o.content_key ?? o.option_key,
      });
    }

    questionByKey[q.question_key] = {
      id: q.id,
      key: q.question_key,
      type,
      isRequired: q.is_required,
      allowsMultiple: q.allows_multiple,
      optionKeys: opts.map((o) => o.option_key),
      optionKeyToValue,
      valueToOptionKey,
      scale: type === "scale" ? parseScale(q.validation_json) : null,
    };

    if (q.is_required && type !== "info") {
      requiredAnswerableKeys.push(q.question_key);
    }

    clientQuestions.push({
      key: q.question_key,
      type,
      content: q.content_key ?? q.question_key,
      helpText: q.help_text_key ?? undefined,
      sectionKey: q.section_key ?? undefined,
      isRequired: q.is_required,
      allowsMultiple: q.allows_multiple,
      options: clientOptions,
    });
  }

  return {
    definitionId: def.id,
    quizKey: def.quiz_key,
    version: def.version,
    status: def.status,
    definition: {
      quizKey: def.quiz_key,
      version: def.version,
      title: def.title_key ?? `${def.quiz_key} quiz`,
      description: def.description_key ?? undefined,
      questions: clientQuestions,
    },
    questionByKey,
    requiredAnswerableKeys,
  };
}
