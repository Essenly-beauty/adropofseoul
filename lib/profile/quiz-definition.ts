// Client-usable shape of a versioned quiz definition (Essenly Phase 1, M2b).
//
// Mirrors the DB tables (quiz_definitions / quiz_questions / quiz_options) so the
// same structure serves a code-defined placeholder now and a DB-loaded
// definition later (getActiveQuizDefinition in M2b-2). The QuizShell /
// QuestionRenderer render off THIS shape and are agnostic to the source.
//
// `content` fields hold display text directly here for the placeholder; in the
// DB path they are resolved from *_key references. Option `value` is the
// canonical value_code, never a localized label.

import type { QuestionTypeValue } from "./validation";

export type QuizOptionDef = {
  key: string;
  /** Canonical stored value (quiz_options.value_code). */
  value: string;
  label: string;
};

export type QuizQuestionDef = {
  key: string;
  type: QuestionTypeValue;
  /** Question prompt (or informational body when type === "info"). */
  content: string;
  helpText?: string;
  sectionKey?: string;
  isRequired: boolean;
  allowsMultiple: boolean;
  options: QuizOptionDef[];
};

export type QuizDefinition = {
  quizKey: "skin" | "hair";
  version: number;
  title: string;
  description?: string;
  questions: QuizQuestionDef[];
};

/** Option keys a question allows — for server/client response validation. */
export function optionKeys(q: QuizQuestionDef): string[] {
  return q.options.map((o) => o.key);
}

/** Steps a user actually answers (informational steps are shown, not answered). */
export function answerableQuestions(def: QuizDefinition): QuizQuestionDef[] {
  return def.questions.filter((q) => q.type !== "info");
}

// --- Placeholder definition (M2b framework only) --------------------------
// NOT the final hair taxonomy — copy and clinical logic require product +
// medical review (M3). This exists so the quiz framework has something real to
// render and test. Clearly labeled; safe to delete when the approved definition
// lands. [PRODUCT/MEDICAL REVIEW REQUIRED for the real hair quiz]
export const PLACEHOLDER_HAIR_QUIZ: QuizDefinition = {
  quizKey: "hair",
  version: 0, // 0 = placeholder / not an approved published version
  title: "Hair Profile (preview)",
  description:
    "A short preview of how the Hair Profile works. This is a placeholder, not medical advice.",
  questions: [
    {
      key: "intro",
      type: "info",
      content:
        "This quick preview shows how the Hair Profile works. Your answers stay private, and you'll see a result before any signup.",
      isRequired: false,
      allowsMultiple: false,
      options: [],
    },
    {
      key: "wash_frequency",
      type: "single_select",
      content: "How often do you wash your hair?",
      sectionKey: "routine",
      isRequired: true,
      allowsMultiple: false,
      options: [
        { key: "daily", value: "daily", label: "Every day" },
        { key: "alt", value: "every_other_day", label: "Every other day" },
        { key: "few", value: "few_times_week", label: "A few times a week" },
        { key: "weekly", value: "weekly_or_less", label: "Weekly or less" },
      ],
    },
    {
      key: "concerns",
      type: "multi_select",
      content: "Which of these sound like your hair? (choose any)",
      sectionKey: "concerns",
      isRequired: true,
      allowsMultiple: true,
      options: [
        { key: "oily_scalp", value: "oily_scalp", label: "Oily scalp" },
        { key: "dry_ends", value: "dry_ends", label: "Dry ends" },
        { key: "frizz", value: "frizz", label: "Frizz" },
        {
          key: "flat",
          value: "lacks_volume",
          label: "Falls flat / lacks volume",
        },
        { key: "damage", value: "damage", label: "Breakage or damage" },
      ],
    },
    {
      key: "heat",
      type: "scale",
      content: "How often do you use heat tools? (0 = never, 5 = daily)",
      sectionKey: "styling",
      helpText: "A rough sense is fine.",
      isRequired: true,
      allowsMultiple: false,
      options: [],
    },
    {
      key: "goal",
      type: "single_select",
      content: "What would you most like to improve?",
      sectionKey: "goal",
      isRequired: true,
      allowsMultiple: false,
      options: [
        { key: "shine", value: "shine", label: "Shine / glass-hair finish" },
        { key: "volume", value: "volume", label: "More volume" },
        { key: "repair", value: "repair", label: "Repair damage" },
        { key: "scalp", value: "scalp", label: "A healthier scalp" },
      ],
    },
  ],
};
