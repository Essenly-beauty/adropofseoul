import { describe, it, expect } from "vitest";
import { mapQuizDefinition, hydrateResponses } from "./quiz-mapper";
import type { Database } from "@/types/database.types";

type DefRow = Database["public"]["Tables"]["quiz_definitions"]["Row"];
type QuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type OptionRow = Database["public"]["Tables"]["quiz_options"]["Row"];

const def: DefRow = {
  id: "def-1",
  quiz_key: "hair",
  version: 0,
  status: "active",
  locale_strategy: "single",
  title_key: "Hair Profile",
  description_key: "A short preview.",
  published_at: null,
  retired_at: null,
  created_at: "2026-07-27T00:00:00Z",
  updated_at: "2026-07-27T00:00:00Z",
};

function q(over: Partial<QuestionRow>): QuestionRow {
  return {
    id: "q",
    quiz_definition_id: "def-1",
    question_key: "k",
    question_type: "single_select",
    section_key: null,
    position: 0,
    is_required: true,
    allows_multiple: false,
    validation_json: null,
    display_logic_json: null,
    content_key: null,
    help_text_key: null,
    created_at: "2026-07-27T00:00:00Z",
    updated_at: "2026-07-27T00:00:00Z",
    ...over,
  };
}

function o(over: Partial<OptionRow>): OptionRow {
  return {
    id: "o",
    question_id: "q",
    option_key: "k",
    position: 0,
    content_key: null,
    value_code: "v",
    metadata_json: null,
    created_at: "2026-07-27T00:00:00Z",
    updated_at: "2026-07-27T00:00:00Z",
    ...over,
  };
}

describe("mapQuizDefinition", () => {
  const questions = [
    q({ id: "q-goal", question_key: "goal", position: 4 }),
    q({
      id: "q-intro",
      question_key: "intro",
      question_type: "info",
      position: 0,
      is_required: false,
    }),
    q({ id: "q-wash", question_key: "wash", position: 1 }),
    q({
      id: "q-concerns",
      question_key: "concerns",
      question_type: "multi_select",
      allows_multiple: true,
      position: 2,
    }),
    q({
      id: "q-heat",
      question_key: "heat",
      question_type: "scale",
      position: 3,
      validation_json: { min: 0, max: 5 },
    }),
  ];
  const options = [
    o({
      id: "o-alt",
      question_id: "q-wash",
      option_key: "alt",
      value_code: "every_other_day",
      content_key: "Every other day",
      position: 1,
    }),
    o({
      id: "o-daily",
      question_id: "q-wash",
      option_key: "daily",
      value_code: "daily",
      content_key: "Every day",
      position: 0,
    }),
    o({
      id: "o-flat",
      question_id: "q-concerns",
      option_key: "flat",
      value_code: "lacks_volume",
      content_key: "Falls flat",
      position: 0,
    }),
  ];

  const loaded = mapQuizDefinition(def, questions, options);

  it("sorts questions by position in the client definition", () => {
    expect(loaded.definition.questions.map((x) => x.key)).toEqual([
      "intro",
      "wash",
      "concerns",
      "heat",
      "goal",
    ]);
  });

  it("sorts options by position and uses value_code as the canonical value", () => {
    const wash = loaded.definition.questions.find((x) => x.key === "wash")!;
    expect(wash.options.map((op) => op.key)).toEqual(["daily", "alt"]);
    expect(wash.options.map((op) => op.value)).toEqual([
      "daily",
      "every_other_day",
    ]);
    expect(wash.options.map((op) => op.label)).toEqual([
      "Every day",
      "Every other day",
    ]);
  });

  it("builds option_key ↔ value_code maps in the index", () => {
    expect(loaded.questionByKey.wash.optionKeyToValue).toEqual({
      daily: "daily",
      alt: "every_other_day",
    });
    expect(loaded.questionByKey.wash.valueToOptionKey).toEqual({
      daily: "daily",
      every_other_day: "alt",
    });
  });

  it("exposes question UUIDs in the index but never in the client definition", () => {
    expect(loaded.questionByKey.wash.id).toBe("q-wash");
    expect(JSON.stringify(loaded.definition)).not.toContain("q-wash");
  });

  it("lists only required, answerable (non-info) questions", () => {
    expect(loaded.requiredAnswerableKeys.sort()).toEqual(
      ["concerns", "goal", "heat", "wash"].sort()
    );
  });

  it("parses scale bounds from validation_json", () => {
    expect(loaded.questionByKey.heat.scale).toEqual({ min: 0, max: 5 });
    expect(loaded.questionByKey.wash.scale).toBeNull();
  });

  it("falls back to keys when content columns are null", () => {
    const concerns = loaded.definition.questions.find(
      (x) => x.key === "concerns"
    )!;
    expect(concerns.content).toBe("concerns"); // content_key was null
  });

  it("carries validation_json into the client question shape", () => {
    const heat = loaded.definition.questions.find((x) => x.key === "heat")!;
    expect(heat.validation).toEqual({ min: 0, max: 5 });
    const wash = loaded.definition.questions.find((x) => x.key === "wash")!;
    expect(wash.validation).toBeUndefined();
  });

  it("hydrates stored value codes back into option keys", () => {
    const byKey = loaded.questionByKey;
    const hydrated = hydrateResponses(loaded, [
      { questionId: byKey.wash.id, responseJson: "every_other_day" },
      { questionId: byKey.concerns.id, responseJson: ["lacks_volume"] },
      { questionId: byKey.heat.id, responseJson: 3 },
    ]);
    // wash's option_key is "alt" while its value_code is "every_other_day".
    expect(hydrated).toEqual({ wash: "alt", concerns: ["flat"], heat: 3 });
  });

  it("skips rows it cannot place or whose shape is wrong for the type", () => {
    const byKey = loaded.questionByKey;
    const hydrated = hydrateResponses(loaded, [
      { questionId: "no-such-question", responseJson: "x" },
      { questionId: byKey.wash.id, responseJson: 42 }, // single_select wants a string
      { questionId: byKey.concerns.id, responseJson: "flat" }, // multi wants an array
      { questionId: byKey.heat.id, responseJson: "3" }, // scale wants a number
    ]);
    expect(hydrated).toEqual({});
  });

  it("passes through a value code with no matching option key", () => {
    const hydrated = hydrateResponses(loaded, [
      { questionId: loaded.questionByKey.wash.id, responseJson: "gone" },
    ]);
    expect(hydrated).toEqual({ wash: "gone" });
  });

  it("carries exclusive option keys through", () => {
    const withExclusive = mapQuizDefinition(
      def,
      [
        q({
          id: "q-concerns",
          question_key: "concerns",
          question_type: "multi_select",
          allows_multiple: true,
          validation_json: { exclusiveOptionKeys: ["none"] },
        }),
      ],
      []
    );
    expect(withExclusive.definition.questions[0].validation).toEqual({
      exclusiveOptionKeys: ["none"],
    });
  });
});
