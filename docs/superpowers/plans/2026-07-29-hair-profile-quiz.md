# Hair Profile Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "coming soon" chooser on `/beauty-profile/hair` with the real
14-question Hair Profile quiz that scores into one of the six existing hair
archetypes and shows an in-page result.

**Architecture:** Three pure modules in `lib/haircare/` own the content and the
logic — `quiz.ts` (the versioned definition), `scoring.ts` (weights → archetype),
`explain.ts` (tags + why-lines). The existing M2b `QuizShell` renders them in its
no-server mode; a new client wrapper binds them together and fires the analytics
funnel. Nothing touches the database: the server-backed attempt routes stay as
they are, dark behind their flag.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, Vitest + jsdom +
@testing-library/react.

**Spec:** `docs/superpowers/specs/2026-07-28-hair-profile-quiz-design.md` — read §3
and §4 before Task 3. Section references below (§4.1, §4.6 …) point at that spec.

## Global Constraints

- Repo: `/Users/jj_whatap/up/adropofseoul-seongsu`. Branch: `feat/hair-quiz-content`.
- Option `key` and `value` are **identical** for every option, and both are the
  canonical code from spec §3. Labels are display-only and are never stored,
  scored, or sent to analytics.
- Scoring tables are keyed by **question key**, never by question index.
- No diagnostic language anywhere in copy. No condition described as a disease
  (WS-06). The standing medical disclaimer stays on every hair surface.
- Analytics may carry the domain, quiz version, question **key**, integer
  indices/counts and bucket strings only — never an answer, label, or free text.
- `npm run typecheck && npm test && npm run lint` must pass before each commit.
  Husky + lint-staged run prettier on commit; let it reformat rather than
  fighting it.
- Tests are colocated (`foo.ts` → `foo.test.ts`), Vitest globals are on, and `@`
  aliases the repo root.

## Prerequisites (do before Task 2)

Tasks 2–9 edit files that only exist on the unmerged M2b stack. Land it first:

```bash
gh pr merge 20 --merge && gh pr merge 21 --merge && gh pr merge 22 --merge
cd /Users/jj_whatap/up/adropofseoul-seongsu
git checkout main && git pull
git checkout feat/hair-quiz-content && git merge main
```

Merge order matters: #21's base is #20's branch and #22's base is #21's, so
merging bottom-up lets GitHub retarget each base to `main` in turn. Verify
`components/editorial/QuizShell.tsx` and `lib/profile/quiz-definition.ts` exist in
the working tree before starting Task 2. **Task 1 needs none of this** — start
there while the merge is pending.

## File Structure

| File                                         | Responsibility                                          |
| -------------------------------------------- | ------------------------------------------------------- |
| `lib/haircare/profiles.ts`                   | _(modify)_ six archetypes; gains `routine`              |
| `lib/haircare/quiz.ts`                       | _(create)_ `HAIR_QUIZ` definition + option-label lookup |
| `lib/haircare/scoring.ts`                    | _(create)_ weight tables, overrides, `scoreHairQuiz`    |
| `lib/haircare/explain.ts`                    | _(create)_ snapshot tags, why-lines, advisory flag      |
| `lib/profile/quiz-definition.ts`             | _(modify)_ `validation` field on `QuizQuestionDef`      |
| `lib/profile/quiz-mapper.ts`                 | _(modify)_ populate `validation` from `validation_json` |
| `lib/analytics/duration.ts`                  | _(create)_ shared duration bucket names                 |
| `components/editorial/QuestionRenderer.tsx`  | _(modify)_ exclusive multi-select options               |
| `components/editorial/QuizShell.tsx`         | _(modify)_ `renderResult` prop + final button label     |
| `components/editorial/HairProfileResult.tsx` | _(create)_ presentational result screen                 |
| `components/editorial/HairQuizClient.tsx`    | _(create)_ client boundary: analytics + wiring          |
| `app/beauty-profile/hair/quiz/page.tsx`      | _(rewrite)_ ungated noindex quiz route                  |
| `app/beauty-profile/hair/page.tsx`           | _(modify)_ quiz becomes the primary CTA                 |

---

### Task 1: `routine` on `HairProfile`

Four routine steps per archetype. Independent of the M2b merge — do this first.

**Files:**

- Modify: `lib/haircare/profiles.ts`
- Test: `lib/haircare/profiles.test.ts` (create)

**Interfaces:**

- Consumes: nothing.
- Produces: `type HairRoutineStep = { step: string; detail: string }` and a
  required `routine: HairRoutineStep[]` on `HairProfile`, four entries per profile.
  Task 7 renders it.

- [ ] **Step 1: Write the failing test**

Create `lib/haircare/profiles.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { HAIR_PROFILES, getHairProfile } from "./profiles";

describe("HAIR_PROFILES", () => {
  it("has six profiles with unique slugs", () => {
    expect(HAIR_PROFILES).toHaveLength(6);
    expect(new Set(HAIR_PROFILES.map((p) => p.slug)).size).toBe(6);
  });

  it("gives every profile exactly four routine steps with non-empty copy", () => {
    for (const p of HAIR_PROFILES) {
      expect(p.routine, p.slug).toHaveLength(4);
      for (const s of p.routine) {
        expect(s.step.length, `${p.slug} step`).toBeGreaterThan(0);
        expect(s.detail.length, `${p.slug} detail`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps routine step labels unique within a profile", () => {
    for (const p of HAIR_PROFILES) {
      expect(new Set(p.routine.map((s) => s.step)).size, p.slug).toBe(4);
    }
  });

  it("looks a profile up by slug and misses cleanly", () => {
    expect(getHairProfile("hidden-wave")?.name).toBe("The Hidden Wave");
    expect(getHairProfile("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/haircare/profiles.test.ts`
Expected: FAIL — `Property 'routine' does not exist` / `expected undefined to have length 4`.

- [ ] **Step 3: Add the type and the content**

In `lib/haircare/profiles.ts`, add above `HairProfile`:

```ts
/** One step of a profile's suggested routine (shown on the quiz result). */
export type HairRoutineStep = { step: string; detail: string };
```

Add to the `HairProfile` type, after `useCarefully`:

```ts
  /** The four-step routine for this profile, in order. */
  routine: HairRoutineStep[];
```

Then add a `routine` array to each of the six profile objects (place it after
`useCarefully`, before `pillarGuide`):

`lightweight-balancer`:

```ts
    routine: [
      { step: "Wash", detail: "Use a light shampoo focused on the scalp." },
      {
        step: "Condition",
        detail: "Apply a rinse-out conditioner from mid-lengths down.",
      },
      { step: "Style", detail: "Choose a mist or fluid leave-in." },
      { step: "Reset", detail: "Clarify occasionally when buildup appears." },
    ],
```

`dense-glass-seeker`:

```ts
    routine: [
      { step: "Wash", detail: "Cleanse without stripping the lengths." },
      { step: "Condition", detail: "Use a smoothing conditioner generously." },
      { step: "Treat", detail: "Add a richer mask weekly." },
      {
        step: "Finish",
        detail: "Use heat protection and a small amount of serum.",
      },
    ],
```

`oily-scalp-dry-ends`:

```ts
    routine: [
      { step: "Wash", detail: "Massage shampoo into the scalp only." },
      { step: "Condition", detail: "Apply conditioner below the ears." },
      { step: "Treat", detail: "Use a mask only on dry lengths." },
      {
        step: "Between washes",
        detail: "Protect ends with a light leave-in.",
      },
    ],
```

`hidden-wave`:

```ts
    routine: [
      {
        step: "Wash",
        detail: "Use a balanced cleanser and avoid rough handling.",
      },
      { step: "Condition", detail: "Keep conditioner light and rinse well." },
      { step: "Define", detail: "Apply mousse or flexible gel on wet hair." },
      { step: "Dry", detail: "Air-dry or diffuse on low heat." },
    ],
```

`moisture-seeking-curl`:

```ts
    routine: [
      {
        step: "Cleanse",
        detail: "Use a balanced shampoo or conditioning cleanser.",
      },
      { step: "Condition", detail: "Detangle with plenty of slip." },
      { step: "Layer", detail: "Apply leave-in and then hold." },
      { step: "Reset", detail: "Clarify periodically to manage buildup." },
    ],
```

`treated-fragile`:

```ts
    routine: [
      {
        step: "Wash",
        detail: "Use a gentle routine and avoid rough friction.",
      },
      { step: "Condition", detail: "Choose a damage-focused conditioner." },
      { step: "Treat", detail: "Use a weekly mask or bond-support step." },
      {
        step: "Protect",
        detail: "Apply leave-in and heat protection every time.",
      },
    ],
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/haircare/profiles.test.ts && npm run typecheck`
Expected: PASS, 4 tests. Typecheck clean — if it errors elsewhere, a consumer
builds a `HairProfile` literal and needs `routine` too.

- [ ] **Step 5: Commit**

```bash
git add lib/haircare/profiles.ts lib/haircare/profiles.test.ts
git commit -m "feat(haircare): four-step routine on each hair profile"
```

---

### Task 2: Framework support for exclusive multi-select options

`scalp_concerns` and `chemical_history` both offer `none`, which must clear the
other choices. The rule travels on the definition (mirroring the DB's
`validation_json`) so the future seed carries it too.

**Files:**

- Modify: `lib/profile/quiz-definition.ts`
- Modify: `lib/profile/quiz-mapper.ts` (in `mapQuizDefinition`, the `clientQuestions.push({…})` literal)
- Modify: `components/editorial/QuestionRenderer.tsx`
- Test: `components/editorial/QuestionRenderer.test.tsx` (append),
  `lib/profile/quiz-mapper.test.ts` (append)

**Interfaces:**

- Consumes: `QuizQuestionDef` from Task 0 state (existing).
- Produces: `QuizQuestionDef.validation?: { min?: number; max?: number; exclusiveOptionKeys?: string[] }`.
  Task 3 sets it on two questions; the renderer honors it.

- [ ] **Step 1: Write the failing test**

Append to `components/editorial/QuestionRenderer.test.tsx`:

```ts
describe("QuestionRenderer exclusive multi-select options", () => {
  const concerns = q({
    key: "scalp_concerns",
    type: "multi_select",
    content: "Which scalp concerns do you experience regularly?",
    allowsMultiple: true,
    validation: { exclusiveOptionKeys: ["none"] },
    options: [
      { key: "none", value: "none", label: "None" },
      { key: "itching", value: "itching", label: "Itching" },
      { key: "oiliness", value: "oiliness", label: "Excess oiliness" },
    ],
  });

  it("clears the other options when an exclusive option is picked", () => {
    const onChange = vi.fn();
    render(
      <QuestionRenderer
        question={concerns}
        value={["itching", "oiliness"]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "None" }));
    expect(onChange).toHaveBeenCalledWith(["none"]);
  });

  it("drops the exclusive option when another option is picked", () => {
    const onChange = vi.fn();
    render(
      <QuestionRenderer
        question={concerns}
        value={["none"]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Itching" }));
    expect(onChange).toHaveBeenCalledWith(["itching"]);
  });

  it("deselects an exclusive option that is clicked again", () => {
    const onChange = vi.fn();
    render(
      <QuestionRenderer
        question={concerns}
        value={["none"]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "None" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
```

- [ ] **Step 2: Write the failing mapper test**

Append to `lib/profile/quiz-mapper.test.ts`, inside the existing
`describe("mapQuizDefinition")` block so it reuses the `loaded` fixture:

```ts
it("carries validation_json into the client question shape", () => {
  const heat = loaded.definition.questions.find((x) => x.key === "heat")!;
  expect(heat.validation).toEqual({ min: 0, max: 5 });
  const wash = loaded.definition.questions.find((x) => x.key === "wash")!;
  expect(wash.validation).toBeUndefined();
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
```

- [ ] **Step 3: Run both tests to verify they fail**

Run: `npx vitest run components/editorial/QuestionRenderer.test.tsx lib/profile/quiz-mapper.test.ts`
Expected: FAIL — `validation` is not a known property of `QuizQuestionDef`,
`onChange` receives `["itching","oiliness","none"]`, and `heat.validation` is
undefined.

- [ ] **Step 4: Add the field to the definition shape**

In `lib/profile/quiz-definition.ts`, add above `QuizQuestionDef`:

```ts
/**
 * Per-question validation, mirroring `quiz_questions.validation_json`.
 * `min`/`max` bound a `scale`; `exclusiveOptionKeys` marks multi-select options
 * that cannot be combined with any other (a "None of these" answer).
 */
export type QuizQuestionValidation = {
  min?: number;
  max?: number;
  exclusiveOptionKeys?: string[];
};
```

Add to `QuizQuestionDef`, after `sectionKey`:

```ts
  validation?: QuizQuestionValidation;
```

- [ ] **Step 5: Carry it through the DB mapper**

In `lib/profile/quiz-mapper.ts`, add above `mapQuizDefinition`:

```ts
function parseValidation(
  validationJson: unknown
): QuizQuestionValidation | undefined {
  if (!validationJson || typeof validationJson !== "object") return undefined;
  const v = validationJson as Record<string, unknown>;
  const out: QuizQuestionValidation = {};
  if (typeof v.min === "number") out.min = v.min;
  if (typeof v.max === "number") out.max = v.max;
  if (Array.isArray(v.exclusiveOptionKeys))
    out.exclusiveOptionKeys = v.exclusiveOptionKeys.filter(
      (k): k is string => typeof k === "string"
    );
  return Object.keys(out).length > 0 ? out : undefined;
}
```

Import the type alongside the existing definition imports:

```ts
import type {
  QuizDefinition,
  QuizOptionDef,
  QuizQuestionDef,
  QuizQuestionValidation,
} from "./quiz-definition";
```

(Match the existing import list in the file — add only the names that are missing.)

Then add one line to the `clientQuestions.push({…})` literal, after `sectionKey`:

```ts
      validation: parseValidation(q.validation_json),
```

`LoadedQuestion.scale` keeps using `parseScale` — leave it alone; the server index
and the client shape read the same column for their own purposes.

- [ ] **Step 6: Honor it in the renderer**

In `components/editorial/QuestionRenderer.tsx`, replace the `toggle` function in
the `single_select | multi_select` branch:

```ts
const exclusive = new Set(question.validation?.exclusiveOptionKeys ?? []);

function toggle(optionKey: string) {
  if (!multiple) {
    onChange(optionKey);
    return;
  }
  // An exclusive option ("None") can't coexist with any other answer.
  if (exclusive.has(optionKey)) {
    onChange(selected.has(optionKey) ? [] : [optionKey]);
    return;
  }
  const next = new Set(selected);
  if (next.has(optionKey)) next.delete(optionKey);
  else next.add(optionKey);
  for (const k of exclusive) next.delete(k);
  onChange(Array.from(next));
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run components/editorial lib/profile && npm run typecheck`
Expected: PASS — the five new cases plus every pre-existing
QuestionRenderer/quiz-mapper test. The existing mapper assertions use `toEqual`
on projected arrays, not `toStrictEqual` on whole question objects, so the added
`validation` key does not disturb them.

- [ ] **Step 8: Commit**

```bash
git add lib/profile/quiz-definition.ts lib/profile/quiz-mapper.ts lib/profile/quiz-mapper.test.ts components/editorial/QuestionRenderer.tsx components/editorial/QuestionRenderer.test.tsx
git commit -m "feat(profile): exclusive multi-select options on quiz questions"
```

---

### Task 3: The `HAIR_QUIZ` definition

14 questions, version 1. Copy comes from spec §3 (codes) and the labels below.

**Files:**

- Create: `lib/haircare/quiz.ts`
- Test: `lib/haircare/quiz.test.ts`

**Interfaces:**

- Consumes: `QuizDefinition`, `QuizQuestionDef`, `optionKeys` from
  `@/lib/profile/quiz-definition`; `validateResponse` from `@/lib/profile/validation`.
- Produces: `HAIR_QUIZ: QuizDefinition` (`quizKey: "hair"`, `version: 1`),
  `HAIR_QUIZ_SECTIONS: readonly string[]`, and
  `hairOptionLabel(questionKey: string, optionKey: string): string` — returns the
  option's label, or `optionKey` when unknown. Tasks 4, 5, 7, 8 consume these.

- [ ] **Step 1: Write the failing test**

Create `lib/haircare/quiz.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { HAIR_QUIZ, HAIR_QUIZ_SECTIONS, hairOptionLabel } from "./quiz";
import { optionKeys } from "@/lib/profile/quiz-definition";
import { validateResponse } from "@/lib/profile/validation";

describe("HAIR_QUIZ", () => {
  it("is version 1 of the hair domain with 14 questions", () => {
    expect(HAIR_QUIZ.quizKey).toBe("hair");
    expect(HAIR_QUIZ.version).toBe(1);
    expect(HAIR_QUIZ.questions).toHaveLength(14);
  });

  it("has unique question keys", () => {
    const keys = HAIR_QUIZ.questions.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is fully answerable: every question is required, closed, and non-info", () => {
    for (const q of HAIR_QUIZ.questions) {
      expect(q.type, q.key).toMatch(/^(single|multi)_select$/);
      expect(q.isRequired, q.key).toBe(true);
      expect(q.options.length, q.key).toBeGreaterThan(1);
    }
  });

  it("keeps option key and value identical, and keys unique per question", () => {
    for (const q of HAIR_QUIZ.questions) {
      for (const o of q.options)
        expect(o.value, `${q.key}.${o.key}`).toBe(o.key);
      expect(new Set(optionKeys(q)).size, q.key).toBe(q.options.length);
      for (const o of q.options)
        expect(o.label.length, `${q.key}.${o.key} label`).toBeGreaterThan(0);
    }
  });

  it("agrees between type and allowsMultiple", () => {
    for (const q of HAIR_QUIZ.questions)
      expect(q.allowsMultiple, q.key).toBe(q.type === "multi_select");
  });

  it("uses only known sections", () => {
    for (const q of HAIR_QUIZ.questions)
      expect(HAIR_QUIZ_SECTIONS, q.key).toContain(q.sectionKey);
  });

  it("marks exactly the two multi-selects, each with an exclusive None", () => {
    const multi = HAIR_QUIZ.questions.filter((q) => q.type === "multi_select");
    expect(multi.map((q) => q.key)).toEqual([
      "scalp_concerns",
      "chemical_history",
    ]);
    for (const q of multi) {
      expect(q.validation?.exclusiveOptionKeys, q.key).toEqual(["none"]);
      expect(optionKeys(q), q.key).toContain("none");
    }
  });

  it("accepts every declared option and rejects an unknown one", () => {
    for (const q of HAIR_QUIZ.questions) {
      const allowed = optionKeys(q);
      for (const o of q.options) {
        const response = q.type === "multi_select" ? [o.key] : o.key;
        expect(validateResponse(q.type, response, allowed).ok, o.key).toBe(
          true
        );
      }
      const bogus = q.type === "multi_select" ? ["nope"] : "nope";
      expect(validateResponse(q.type, bogus, allowed).ok, q.key).toBe(false);
    }
  });

  it("looks up option labels and falls back to the key", () => {
    expect(hairOptionLabel("natural_pattern", "loose_wave")).toBe(
      "Forms loose S-shaped bends"
    );
    expect(hairOptionLabel("natural_pattern", "nope")).toBe("nope");
    expect(hairOptionLabel("nope", "loose_wave")).toBe("loose_wave");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/haircare/quiz.test.ts`
Expected: FAIL — cannot resolve `./quiz`.

- [ ] **Step 3: Write the definition**

Create `lib/haircare/quiz.ts`:

```ts
// Version 1 of the Hair Profile quiz (WS-06). 14 closed questions, no info step
// and no free text, scoring into the six archetypes in ./profiles via ./scoring.
//
// Option `key` and `value` are identical and are the canonical codes; labels are
// display-only and never stored or scored. Copy is observational and educational
// on purpose — nothing here names or implies a diagnosed condition (WS-06).
// [PRODUCT/MEDICAL REVIEW REQUIRED before this ships]
//
// The shape mirrors the DB tables, so the same definition can later be seeded as
// quiz_definitions version 1. See the design spec §3 for the question inventory.

import type {
  QuizDefinition,
  QuizQuestionDef,
} from "@/lib/profile/quiz-definition";

export const HAIR_QUIZ_SECTIONS = [
  "natural_hair",
  "scalp",
  "hair_behavior",
  "damage_styling",
  "concern_goal",
] as const;

export type HairQuizSection = (typeof HAIR_QUIZ_SECTIONS)[number];

/** Option key and value_code are the same string for every hair option. */
function opts(pairs: [string, string][]) {
  return pairs.map(([key, label]) => ({ key, value: key, label }));
}

function single(
  key: string,
  sectionKey: HairQuizSection,
  content: string,
  pairs: [string, string][],
  helpText?: string
): QuizQuestionDef {
  return {
    key,
    type: "single_select",
    content,
    helpText,
    sectionKey,
    isRequired: true,
    allowsMultiple: false,
    options: opts(pairs),
  };
}

function multi(
  key: string,
  sectionKey: HairQuizSection,
  content: string,
  pairs: [string, string][]
): QuizQuestionDef {
  return {
    key,
    type: "multi_select",
    content,
    helpText: "Select all that apply.",
    sectionKey,
    isRequired: true,
    allowsMultiple: true,
    // "None" cannot be combined with a concern or a service.
    validation: { exclusiveOptionKeys: ["none"] },
    options: opts(pairs),
  };
}

export const HAIR_QUIZ: QuizDefinition = {
  quizKey: "hair",
  version: 1,
  title: "Hair Profile",
  description:
    "Fourteen short questions about your hair, scalp, and routine. Educational, not a medical diagnosis.",
  questions: [
    single(
      "natural_pattern",
      "natural_hair",
      "When your hair air-dries without styling products, what does it naturally do?",
      [
        ["straight", "Falls almost completely straight"],
        ["loose_wave", "Forms loose S-shaped bends"],
        ["defined_wave_curl", "Forms defined waves or ringlets"],
        ["tight_curl_coil", "Forms tight curls or coils"],
        ["unknown_treated", "I am not sure because of chemical treatments"],
      ],
      "Choose the closest overall pattern. Different parts of your hair may behave differently."
    ),
    single(
      "strand_thickness",
      "natural_hair",
      "How does a single strand of your hair feel between your fingers?",
      [
        ["fine", "I can barely feel it"],
        [
          "medium",
          "I can feel it, but it does not seem especially fine or coarse",
        ],
        ["coarse", "It feels substantial, firm, or wiry"],
        ["unknown", "I am not sure"],
      ]
    ),
    single(
      "density",
      "natural_hair",
      "How would you describe the overall amount of hair on your scalp?",
      [
        ["low", "My scalp is easily visible or my ponytail feels small"],
        ["medium", "Somewhere in the middle"],
        ["high", "My hair feels dense, heavy, or forms a thick ponytail"],
        ["unknown", "I am not sure"],
      ]
    ),
    single(
      "scalp_oiliness_onset",
      "scalp",
      "How soon does your scalp begin to look or feel oily after washing?",
      [
        ["hours", "Within several hours"],
        ["next_day", "By the next day"],
        ["two_plus_days", "After two or more days"],
        ["rarely_oily", "It rarely feels oily and may feel dry"],
      ]
    ),
    multi(
      "scalp_concerns",
      "scalp",
      "Which scalp concerns do you experience regularly?",
      [
        ["none", "None"],
        ["itching", "Itching"],
        ["flaking", "Flaking or visible dandruff"],
        ["redness_stinging", "Redness, stinging, or burning"],
        ["odor", "Odor soon after washing"],
        ["bumps", "Bumps or tender spots"],
        ["oiliness", "Excess oiliness"],
        ["tightness_dryness", "Tightness or dryness"],
        ["hair_loss_concern", "Hair loss concern"],
      ]
    ),
    single(
      "wash_frequency",
      "scalp",
      "How often do you usually wash your hair?",
      [
        ["multiple_daily", "More than once a day"],
        ["daily", "Daily"],
        ["every_other_day", "Every other day"],
        ["three_plus_days", "Every three days or less often"],
      ]
    ),
    single(
      "product_response",
      "hair_behavior",
      "What usually happens when you apply conditioner, masks, or hair oil?",
      [
        ["weighed_down", "My hair gets weighed down or oily easily"],
        ["balanced", "It feels soft and balanced"],
        ["still_dry", "It still feels dry or frizzy"],
        ["sits_on_surface", "Products seem to sit on the surface"],
        ["varies", "It depends on the product"],
      ]
    ),
    single(
      "dry_time",
      "hair_behavior",
      "How long does your hair usually take to air-dry?",
      [
        ["very_fast", "It dries very quickly"],
        ["average", "An average amount of time"],
        ["slow", "It takes a long time"],
        ["mixed", "My roots dry quickly, but my ends stay wet"],
        ["unknown", "I am not sure"],
      ]
    ),
    single(
      "humidity_response",
      "hair_behavior",
      "What happens to your hair in humid weather?",
      [
        ["little_change", "Very little changes"],
        ["falls_flat", "It falls flat or loses volume"],
        ["frizzes", "It becomes frizzy or develops flyaways"],
        ["waves_appear", "Waves or curls become more visible"],
        [
          "expands_tangles",
          "It expands, tangles, or becomes difficult to control",
        ],
      ]
    ),
    multi(
      "chemical_history",
      "damage_styling",
      "Which chemical services have you had in the past 12 months?",
      [
        ["color", "Hair color"],
        ["bleach", "Bleach or highlights"],
        ["perm", "Perm"],
        ["straightening", "Chemical straightening or magic straight perm"],
        ["keratin_smoothing", "Keratin or smoothing treatment"],
        ["none", "None"],
      ]
    ),
    single(
      "heat_frequency",
      "damage_styling",
      "How often do you use heat tools?",
      [
        ["rarely", "Rarely"],
        ["one_two_week", "1–2 times a week"],
        ["three_five_week", "3–5 times a week"],
        ["almost_daily", "Almost daily"],
        ["dryer_only", "I mostly use a blow-dryer"],
      ]
    ),
    single(
      "ends_condition",
      "damage_styling",
      "How do your mid-lengths and ends currently feel?",
      [
        ["smooth", "Smooth and manageable"],
        ["slightly_dry", "Slightly dry"],
        ["split_breaking", "Split, snapping, or breaking"],
        ["tangled", "Frequently tangled"],
        ["rough_dull", "Rough, dull, or noticeably different from my roots"],
      ]
    ),
    single(
      "primary_concern",
      "concern_goal",
      "What would you most like to improve first?",
      [
        ["oily_scalp", "Oily scalp"],
        ["flatness", "Flatness or lack of volume"],
        ["dryness", "Dryness"],
        ["frizz", "Frizz"],
        ["breakage", "Breakage or split ends"],
        ["tangling", "Tangling"],
        ["lack_shine", "Lack of shine"],
        ["curl_definition", "Wave or curl definition"],
        ["sensitive_scalp", "Sensitive or uncomfortable scalp"],
        ["hair_loss", "Hair loss concern"],
      ]
    ),
    single(
      "desired_result",
      "concern_goal",
      "What result are you hoping for most?",
      [
        ["light_fresh", "Light, fresh hair"],
        ["volume", "More volume"],
        ["glass_hair", "Smooth, reflective glass hair"],
        ["soft_controlled", "Soft, controlled hair"],
        ["defined_texture", "Defined waves or curls"],
        ["stronger_look", "Stronger, healthier-looking hair"],
      ]
    ),
  ],
};

const LABELS: Record<string, Record<string, string>> = Object.fromEntries(
  HAIR_QUIZ.questions.map((q) => [
    q.key,
    Object.fromEntries(q.options.map((o) => [o.key, o.label])),
  ])
);

/** Display label for an answered option; falls back to the raw key. */
export function hairOptionLabel(
  questionKey: string,
  optionKey: string
): string {
  return LABELS[questionKey]?.[optionKey] ?? optionKey;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/haircare/quiz.test.ts && npm run typecheck`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/haircare/quiz.ts lib/haircare/quiz.test.ts
git commit -m "feat(haircare): version 1 hair quiz definition (14 questions)"
```

---

### Task 4: Scoring

Transcribe spec §4 exactly. The tables are the reviewable artifact — keep them
flat and readable rather than clever.

**Files:**

- Create: `lib/haircare/scoring.ts`
- Test: `lib/haircare/scoring.test.ts`

**Interfaces:**

- Consumes: nothing from other tasks (deliberately independent of `quiz.ts` so a
  question-copy change can't alter a score).
- Produces:
  - `type HairQuizResponses = Record<string, string | string[] | number | null | undefined>`
  - `type HairArchetypeCode = "LB" | "DG" | "OD" | "HW" | "MC" | "TF"`
  - `type HairScoreSignal = { questionKey: string; optionKey: string; code: HairArchetypeCode; weight: number }`
  - `type HairQuizScore = { profileSlug: string | null; scores: Record<HairArchetypeCode, number>; signals: HairScoreSignal[]; lowSignal: boolean }`
  - `scoreHairQuiz(responses: HairQuizResponses): HairQuizScore`
  - `ARCHETYPE_SLUG: Record<HairArchetypeCode, string>`

  Tasks 5, 7, 8 consume these.

- [ ] **Step 1: Write the failing test**

Create `lib/haircare/scoring.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { scoreHairQuiz, type HairQuizResponses } from "./scoring";
import { HAIR_PROFILE_SLUGS } from "./profiles";

// A neutral sheet: every answer present, none of them decisive. Individual tests
// override only the answers they care about.
function sheet(over: HairQuizResponses = {}): HairQuizResponses {
  return {
    natural_pattern: "straight",
    strand_thickness: "unknown",
    density: "unknown",
    scalp_oiliness_onset: "two_plus_days",
    scalp_concerns: ["none"],
    wash_frequency: "every_other_day",
    product_response: "varies",
    dry_time: "average",
    humidity_response: "little_change",
    chemical_history: ["none"],
    heat_frequency: "rarely",
    ends_condition: "smooth",
    primary_concern: "lack_shine",
    desired_result: "glass_hair",
    ...over,
  };
}

describe("scoreHairQuiz", () => {
  it("always returns a slug that exists in HAIR_PROFILES", () => {
    const res = scoreHairQuiz(sheet());
    expect(HAIR_PROFILE_SLUGS).toContain(res.profileSlug);
  });

  it("reaches the Lightweight Balancer on fine, easily-weighed-down hair", () => {
    const res = scoreHairQuiz(
      sheet({
        strand_thickness: "fine",
        density: "low",
        product_response: "weighed_down",
        humidity_response: "falls_flat",
        primary_concern: "flatness",
        desired_result: "volume",
      })
    );
    expect(res.profileSlug).toBe("lightweight-balancer");
  });

  it("reaches the Dense Glass Seeker on coarse, dense, dull hair", () => {
    const res = scoreHairQuiz(
      sheet({
        strand_thickness: "coarse",
        density: "high",
        dry_time: "slow",
        primary_concern: "lack_shine",
        desired_result: "glass_hair",
      })
    );
    expect(res.profileSlug).toBe("dense-glass-seeker");
  });

  it("reaches Oily Scalp, Dry Ends when the scalp oils fast and the ends are dry", () => {
    const res = scoreHairQuiz(
      sheet({
        scalp_oiliness_onset: "hours",
        scalp_concerns: ["oiliness"],
        wash_frequency: "daily",
        dry_time: "mixed",
        ends_condition: "slightly_dry",
        primary_concern: "oily_scalp",
      })
    );
    expect(res.profileSlug).toBe("oily-scalp-dry-ends");
  });

  it("reaches the Hidden Wave when a loose wave surfaces in humidity", () => {
    const res = scoreHairQuiz(
      sheet({
        natural_pattern: "loose_wave",
        humidity_response: "waves_appear",
      })
    );
    expect(res.profileSlug).toBe("hidden-wave");
  });

  it("reaches the Moisture-Seeking Curl on defined curls chasing definition", () => {
    const res = scoreHairQuiz(
      sheet({
        natural_pattern: "defined_wave_curl",
        humidity_response: "expands_tangles",
        primary_concern: "curl_definition",
        desired_result: "defined_texture",
      })
    );
    expect(res.profileSlug).toBe("moisture-seeking-curl");
  });

  it("reaches Treated & Fragile on breakage after bleach", () => {
    const res = scoreHairQuiz(
      sheet({
        chemical_history: ["bleach"],
        ends_condition: "split_breaking",
        primary_concern: "breakage",
      })
    );
    expect(res.profileSlug).toBe("treated-fragile");
  });

  it("overrides to Treated & Fragile when bleach meets splitting ends", () => {
    // Answers that otherwise shout Lightweight Balancer.
    const res = scoreHairQuiz(
      sheet({
        strand_thickness: "fine",
        density: "low",
        product_response: "weighed_down",
        primary_concern: "flatness",
        desired_result: "volume",
        chemical_history: ["bleach"],
        ends_condition: "split_breaking",
      })
    );
    expect(res.profileSlug).toBe("treated-fragile");
  });

  it("overrides to Treated & Fragile on services plus near-daily heat", () => {
    const res = scoreHairQuiz(
      sheet({
        chemical_history: ["color"],
        heat_frequency: "almost_daily",
        ends_condition: "slightly_dry",
      })
    );
    expect(res.profileSlug).toBe("treated-fragile");
  });

  it("does not trigger the heat override when the ends are smooth", () => {
    const res = scoreHairQuiz(
      sheet({
        chemical_history: ["color"],
        heat_frequency: "almost_daily",
        ends_condition: "smooth",
        strand_thickness: "fine",
        density: "low",
        product_response: "weighed_down",
        primary_concern: "flatness",
      })
    );
    expect(res.profileSlug).toBe("lightweight-balancer");
  });

  it("keeps coily hair on the curl profile under moderate damage", () => {
    const res = scoreHairQuiz(
      sheet({
        natural_pattern: "tight_curl_coil",
        chemical_history: ["color"],
        heat_frequency: "almost_daily",
        ends_condition: "slightly_dry",
      })
    );
    expect(res.profileSlug).toBe("moisture-seeking-curl");
  });

  it("moves coily hair to Treated & Fragile once damage clearly dominates", () => {
    const res = scoreHairQuiz(
      sheet({
        natural_pattern: "tight_curl_coil",
        chemical_history: ["bleach", "perm", "straightening"],
        heat_frequency: "almost_daily",
        ends_condition: "split_breaking",
        primary_concern: "breakage",
      })
    );
    expect(res.profileSlug).toBe("treated-fragile");
  });

  it("caps chemical damage at 10 however many services are selected", () => {
    const four = scoreHairQuiz(
      sheet({
        chemical_history: [
          "color",
          "bleach",
          "perm",
          "straightening",
          "keratin_smoothing",
        ],
      })
    );
    const bleachPlusStraightening = scoreHairQuiz(
      sheet({ chemical_history: ["bleach", "straightening"] })
    );
    expect(four.scores.TF).toBe(10);
    expect(bleachPlusStraightening.scores.TF).toBe(10);
  });

  it("adds the wave combination bonus", () => {
    const withBonus = scoreHairQuiz(
      sheet({
        natural_pattern: "defined_wave_curl",
        humidity_response: "frizzes",
      })
    );
    const withoutBonus = scoreHairQuiz(
      sheet({
        natural_pattern: "defined_wave_curl",
        humidity_response: "little_change",
      })
    );
    // frizzes contributes HW 3 on its own; the combination rule adds 3 more.
    expect(withBonus.scores.HW - withoutBonus.scores.HW).toBe(6);
  });

  it("adds the oily-scalp/dry-ends combination bonus", () => {
    const withBonus = scoreHairQuiz(
      sheet({ scalp_oiliness_onset: "next_day", ends_condition: "tangled" })
    );
    const withoutBonus = scoreHairQuiz(
      sheet({ scalp_oiliness_onset: "next_day", ends_condition: "smooth" })
    );
    // tangled contributes OD 1; the combination rule adds 4.
    expect(withBonus.scores.OD - withoutBonus.scores.OD).toBe(5);
  });

  it("scores nothing for advisory-only scalp concerns", () => {
    const advisory = scoreHairQuiz(
      sheet({ scalp_concerns: ["itching", "bumps"] })
    );
    const none = scoreHairQuiz(sheet({ scalp_concerns: ["none"] }));
    expect(advisory.scores).toEqual(none.scores);
  });

  it("reports low signal instead of guessing when nothing was answered", () => {
    const res = scoreHairQuiz({});
    expect(res.lowSignal).toBe(true);
    expect(res.profileSlug).toBe(null);
  });

  it("never reports low signal for a complete sheet, whatever the pattern", () => {
    for (const pattern of [
      "straight",
      "loose_wave",
      "defined_wave_curl",
      "tight_curl_coil",
      "unknown_treated",
    ]) {
      const res = scoreHairQuiz(sheet({ natural_pattern: pattern }));
      expect(res.lowSignal, pattern).toBe(false);
    }
  });

  it("is deterministic and records a signal for every applied weight", () => {
    const input = sheet({ natural_pattern: "loose_wave" });
    expect(scoreHairQuiz(input)).toEqual(scoreHairQuiz(input));
    const res = scoreHairQuiz(input);
    expect(
      res.signals.some(
        (s) =>
          s.questionKey === "natural_pattern" &&
          s.optionKey === "loose_wave" &&
          s.code === "HW" &&
          s.weight === 4
      )
    ).toBe(true);
  });

  it("ignores malformed answers instead of throwing", () => {
    expect(() =>
      scoreHairQuiz({
        natural_pattern: 42,
        scalp_concerns: "oiliness",
        chemical_history: null,
      })
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/haircare/scoring.test.ts`
Expected: FAIL — cannot resolve `./scoring`.

- [ ] **Step 3: Write the scoring module**

Create `lib/haircare/scoring.ts`:

```ts
// Hair Profile quiz scoring (design spec §4). Pure and synchronous: answers in,
// archetype out, plus the signals that got it there.
//
// The two-letter codes are the review shorthand from the spec; ARCHETYPE_SLUG
// maps them to the profile slugs in ./profiles. Tables are keyed by question KEY
// (never by position) so reordering a question cannot silently change a result.
//
// These weights are editorial judgment, not clinical evidence.
// [PRODUCT/MEDICAL REVIEW REQUIRED before this ships]

export type HairArchetypeCode = "LB" | "DG" | "OD" | "HW" | "MC" | "TF";

/** Tie-break priority: the first code with the highest score wins (§4.5). */
const CODE_ORDER: HairArchetypeCode[] = ["LB", "DG", "OD", "HW", "MC", "TF"];

export const ARCHETYPE_SLUG: Record<HairArchetypeCode, string> = {
  LB: "lightweight-balancer",
  DG: "dense-glass-seeker",
  OD: "oily-scalp-dry-ends",
  HW: "hidden-wave",
  MC: "moisture-seeking-curl",
  TF: "treated-fragile",
};

export type HairQuizResponses = Record<
  string,
  string | string[] | number | null | undefined
>;

export type HairScoreSignal = {
  questionKey: string;
  optionKey: string;
  code: HairArchetypeCode;
  weight: number;
};

export type HairQuizScore = {
  /** Winning profile slug, or null when there is not enough signal. */
  profileSlug: string | null;
  scores: Record<HairArchetypeCode, number>;
  signals: HairScoreSignal[];
  lowSignal: boolean;
};

type Weights = Partial<Record<HairArchetypeCode, number>>;

// --- §4.1 single-select weights -------------------------------------------
// Options omitted here contribute nothing (unknown / average / varies /
// every_other_day / rarely, and the two advisory concerns handled in §4.6).
const SINGLE_WEIGHTS: Record<string, Record<string, Weights>> = {
  natural_pattern: {
    straight: { LB: 1, DG: 2 },
    loose_wave: { DG: 1, HW: 4, MC: 1 },
    defined_wave_curl: { HW: 2, MC: 4 },
    tight_curl_coil: { MC: 6 },
    unknown_treated: { TF: 3 },
  },
  strand_thickness: {
    fine: { LB: 5, OD: 1, HW: 1, TF: 1 },
    medium: { LB: 1, DG: 1, MC: 1 },
    coarse: { DG: 5, MC: 2 },
  },
  density: {
    low: { LB: 2 },
    medium: { DG: 1 },
    high: { DG: 4, OD: 1, HW: 1, MC: 1 },
  },
  scalp_oiliness_onset: {
    hours: { LB: 2, OD: 5 },
    next_day: { LB: 1, OD: 3 },
    two_plus_days: { MC: 1 },
    rarely_oily: { DG: 1, MC: 2, TF: 1 },
  },
  wash_frequency: {
    multiple_daily: { LB: 1, OD: 2, TF: 1 },
    daily: { LB: 1, OD: 1 },
    three_plus_days: { MC: 1 },
  },
  product_response: {
    weighed_down: { LB: 6, OD: 2, HW: 1 },
    balanced: { DG: 1 },
    still_dry: { DG: 3, OD: 1, HW: 1, MC: 3, TF: 2 },
    sits_on_surface: { LB: 2, DG: 1 },
  },
  dry_time: {
    very_fast: { LB: 1, TF: 1 },
    slow: { DG: 2, HW: 1, MC: 1 },
    mixed: { OD: 2, TF: 1 },
  },
  humidity_response: {
    little_change: { DG: 1 },
    falls_flat: { LB: 3, HW: 1 },
    frizzes: { DG: 3, HW: 3, MC: 1, TF: 1 },
    waves_appear: { HW: 6, MC: 2 },
    expands_tangles: { DG: 1, HW: 1, MC: 4, TF: 2 },
  },
  heat_frequency: {
    one_two_week: { TF: 1 },
    three_five_week: { TF: 3 },
    almost_daily: { TF: 5 },
    dryer_only: { DG: 1, TF: 1 },
  },
  ends_condition: {
    smooth: { DG: 1 },
    slightly_dry: { DG: 2, OD: 2, MC: 1, TF: 2 },
    split_breaking: { OD: 2, MC: 1, TF: 7 },
    tangled: { DG: 1, OD: 1, HW: 1, MC: 3, TF: 4 },
    rough_dull: { DG: 3, OD: 2, MC: 2, TF: 5 },
  },
  primary_concern: {
    oily_scalp: { OD: 5 },
    flatness: { LB: 5 },
    dryness: { DG: 2, MC: 3, TF: 2 },
    frizz: { DG: 3, HW: 3, MC: 2 },
    breakage: { TF: 6 },
    tangling: { MC: 3, TF: 3 },
    lack_shine: { DG: 4 },
    curl_definition: { HW: 2, MC: 5 },
    // sensitive_scalp and hair_loss carry no weight on purpose — §4.6.
  },
  desired_result: {
    light_fresh: { LB: 2, OD: 1 },
    volume: { LB: 3 },
    glass_hair: { LB: 1, DG: 2 },
    soft_controlled: { DG: 2, TF: 1 },
    defined_texture: { HW: 2, MC: 3 },
    stronger_look: { TF: 2 },
  },
};

// --- §4.2 scalp_concerns (multi) ------------------------------------------
const SCALP_CONCERN_WEIGHTS: Record<string, Weights> = {
  oiliness: { OD: 3, LB: 1 },
  tightness_dryness: { MC: 2, DG: 1, TF: 1 },
  odor: { OD: 1 },
  // itching / flaking / redness_stinging / bumps / hair_loss_concern: advisory
  // only (§4.6) — see explain.ts.
};

// --- §4.3 chemical_history (multi) ----------------------------------------
const CHEMICAL_DAMAGE: Record<string, number> = {
  color: 2,
  bleach: 6,
  perm: 3,
  straightening: 4,
  keratin_smoothing: 2,
};
const CHEMICAL_DAMAGE_CAP = 10;

const DRY_OR_DAMAGED_ENDS = [
  "slightly_dry",
  "split_breaking",
  "tangled",
  "rough_dull",
];

function asSingle(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function asMulti(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

export function scoreHairQuiz(responses: HairQuizResponses): HairQuizScore {
  const scores: Record<HairArchetypeCode, number> = {
    LB: 0,
    DG: 0,
    OD: 0,
    HW: 0,
    MC: 0,
    TF: 0,
  };
  const signals: HairScoreSignal[] = [];

  function apply(questionKey: string, optionKey: string, weights: Weights) {
    for (const code of CODE_ORDER) {
      const weight = weights[code];
      if (!weight) continue;
      scores[code] += weight;
      signals.push({ questionKey, optionKey, code, weight });
    }
  }

  for (const [questionKey, table] of Object.entries(SINGLE_WEIGHTS)) {
    const answer = asSingle(responses[questionKey]);
    if (!answer) continue;
    const weights = table[answer];
    if (weights) apply(questionKey, answer, weights);
  }

  for (const concern of asMulti(responses.scalp_concerns)) {
    const weights = SCALP_CONCERN_WEIGHTS[concern];
    if (weights) apply("scalp_concerns", concern, weights);
  }

  // Damage sums across services, then caps — so four services can't blow past
  // every override threshold. Signals stay per-service (pre-cap) so the
  // explanation can name what the user actually selected.
  const services = asMulti(responses.chemical_history);
  let rawDamage = 0;
  for (const service of services) {
    const weight = CHEMICAL_DAMAGE[service];
    if (!weight) continue;
    rawDamage += weight;
    signals.push({
      questionKey: "chemical_history",
      optionKey: service,
      code: "TF",
      weight,
    });
  }
  scores.TF += Math.min(rawDamage, CHEMICAL_DAMAGE_CAP);

  // --- §4.4 combination rules ---
  const pattern = asSingle(responses.natural_pattern);
  const humidity = asSingle(responses.humidity_response);
  const onset = asSingle(responses.scalp_oiliness_onset);
  const ends = asSingle(responses.ends_condition);
  const heat = asSingle(responses.heat_frequency);

  if (
    (pattern === "loose_wave" || pattern === "defined_wave_curl") &&
    (humidity === "waves_appear" || humidity === "frizzes")
  ) {
    apply("humidity_response", humidity, { HW: 3 });
  }
  if (
    (onset === "hours" || onset === "next_day") &&
    ends !== null &&
    DRY_OR_DAMAGED_ENDS.includes(ends)
  ) {
    apply("ends_condition", ends, { OD: 4 });
  }

  // --- §4.5 winner selection ---
  const best = CODE_ORDER.reduce((a, b) => (scores[b] > scores[a] ? b : a));
  if (scores[best] === 0)
    return { profileSlug: null, scores, signals, lowSignal: true };

  const severe =
    scores.TF >= 13 ||
    (services.includes("bleach") && ends === "split_breaking") ||
    (services.some((s) => s !== "none") &&
      heat === "almost_daily" &&
      ends !== "smooth");

  let winner = best;
  if (pattern === "tight_curl_coil") {
    // Coily hair keeps its pattern routine unless damage clearly dominates.
    winner = severe && scores.TF >= scores.MC + 4 ? "TF" : "MC";
  } else if (severe) {
    winner = "TF";
  } else if (pattern === "loose_wave" && humidity === "waves_appear") {
    winner = "HW";
  }

  return {
    profileSlug: ARCHETYPE_SLUG[winner],
    scores,
    signals,
    lowSignal: false,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/haircare/scoring.test.ts && npm run typecheck`
Expected: PASS, 20 tests. If an archetype test fails, re-check that row against
spec §4.1 rather than nudging the fixture until it goes green — the fixtures are
the requirement.

- [ ] **Step 5: Commit**

```bash
git add lib/haircare/scoring.ts lib/haircare/scoring.test.ts
git commit -m "feat(haircare): hair quiz scoring into the six archetypes"
```

---

### Task 5: Snapshot tags, why-lines, advisory

**Files:**

- Create: `lib/haircare/explain.ts`
- Test: `lib/haircare/explain.test.ts`

**Interfaces:**

- Consumes: `hairOptionLabel` (Task 3); `HairQuizResponses`, `HairQuizScore`,
  `HairArchetypeCode` (Task 4).
- Produces:
  - `type HairResultExplanation = { tags: string[]; reasons: string[]; advisory: boolean }`
  - `explainHairResult(responses: HairQuizResponses, score: HairQuizScore): HairResultExplanation`

  Task 7 renders it; Task 8 calls it.

- [ ] **Step 1: Write the failing test**

Create `lib/haircare/explain.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { explainHairResult } from "./explain";
import { scoreHairQuiz, type HairQuizResponses } from "./scoring";

function sheet(over: HairQuizResponses = {}): HairQuizResponses {
  return {
    natural_pattern: "loose_wave",
    strand_thickness: "fine",
    density: "low",
    scalp_oiliness_onset: "two_plus_days",
    scalp_concerns: ["none"],
    wash_frequency: "every_other_day",
    product_response: "varies",
    dry_time: "average",
    humidity_response: "waves_appear",
    chemical_history: ["none"],
    heat_frequency: "rarely",
    ends_condition: "smooth",
    primary_concern: "curl_definition",
    desired_result: "defined_texture",
    ...over,
  };
}

function explain(over: HairQuizResponses = {}) {
  const responses = sheet(over);
  return explainHairResult(responses, scoreHairQuiz(responses));
}

describe("explainHairResult", () => {
  it("tags the pattern, strand, density, and goal in that order", () => {
    expect(explain().tags).toEqual([
      "Loose wave",
      "Fine strands",
      "Low density",
      "Goal: Defined texture",
    ]);
  });

  it("distinguishes medium strands from medium density", () => {
    const tags = explain({
      strand_thickness: "medium",
      density: "medium",
    }).tags;
    expect(tags).toContain("Medium strands");
    expect(tags).toContain("Medium density");
  });

  it("omits a tag the user could not answer", () => {
    const tags = explain({
      strand_thickness: "unknown",
      density: "unknown",
    }).tags;
    expect(tags).toEqual(["Loose wave", "Goal: Defined texture"]);
  });

  it("adds a sensitive-scalp tag and raises the advisory for scalp symptoms", () => {
    const res = explain({ scalp_concerns: ["itching", "flaking"] });
    expect(res.tags).toContain("Sensitive scalp consideration");
    expect(res.advisory).toBe(true);
  });

  it("raises the advisory when the main concern needs a professional", () => {
    expect(explain({ primary_concern: "sensitive_scalp" }).advisory).toBe(true);
    expect(explain({ primary_concern: "hair_loss" }).advisory).toBe(true);
  });

  it("leaves the advisory down for a clean scalp sheet", () => {
    const res = explain();
    expect(res.advisory).toBe(false);
    expect(res.tags).not.toContain("Sensitive scalp consideration");
  });

  it("explains with the winning archetype's heaviest answers, most first", () => {
    const res = explain();
    // The winner is Hidden Wave; waves_appear (6) outweighs loose_wave (4).
    expect(res.reasons[0]).toBe("Waves or curls become more visible");
    expect(res.reasons).toContain("Forms loose S-shaped bends");
    expect(res.reasons.length).toBeLessThanOrEqual(4);
    expect(new Set(res.reasons).size).toBe(res.reasons.length);
  });

  it("returns no tags or reasons when there is no signal", () => {
    const res = explainHairResult({}, scoreHairQuiz({}));
    expect(res.tags).toEqual([]);
    expect(res.reasons).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/haircare/explain.test.ts`
Expected: FAIL — cannot resolve `./explain`.

- [ ] **Step 3: Write the module**

Create `lib/haircare/explain.ts`:

```ts
// Turns a scored hair quiz into the two things the result screen shows besides
// the profile itself: the snapshot tags, and why this result (spec §4.6–§4.7).
//
// Both are derived from the answers and the scoring signals — nothing is
// hardcoded per archetype, so an explanation cannot contradict the score.

import { hairOptionLabel } from "./quiz";
import {
  ARCHETYPE_SLUG,
  type HairArchetypeCode,
  type HairQuizResponses,
  type HairQuizScore,
} from "./scoring";

export type HairResultExplanation = {
  /** Short chips describing what the user told us. */
  tags: string[];
  /** Option labels that contributed most to the winning archetype. */
  reasons: string[];
  /** True when an answer warrants pointing at professional evaluation. */
  advisory: boolean;
};

/** Questions that become snapshot tags, in display order. */
const TAG_QUESTIONS = [
  "natural_pattern",
  "strand_thickness",
  "density",
  "desired_result",
] as const;

// Short tag copy, keyed by question and option. Deliberately keyed by BOTH:
// `medium` means "Medium strands" for one question and "Medium density" for
// another. An option with no entry here produces no tag.
const TAG_LABELS: Record<string, Record<string, string>> = {
  natural_pattern: {
    straight: "Straight",
    loose_wave: "Loose wave",
    defined_wave_curl: "Defined wave / curl",
    tight_curl_coil: "Tight curl / coil",
    unknown_treated: "Pattern obscured by treatment",
  },
  strand_thickness: {
    fine: "Fine strands",
    medium: "Medium strands",
    coarse: "Coarse strands",
  },
  density: {
    low: "Low density",
    medium: "Medium density",
    high: "High density",
  },
  desired_result: {
    light_fresh: "Goal: Light & fresh",
    volume: "Goal: Volume",
    glass_hair: "Goal: Glass hair",
    soft_controlled: "Goal: Soft & controlled",
    defined_texture: "Goal: Defined texture",
    stronger_look: "Goal: Stronger-looking hair",
  },
};

/** Scalp answers that raise the professional-evaluation advisory (§4.6). */
const ADVISORY_CONCERNS = [
  "itching",
  "flaking",
  "redness_stinging",
  "bumps",
  "hair_loss_concern",
];
const ADVISORY_PRIMARY = ["sensitive_scalp", "hair_loss"];

const SENSITIVE_TAG = "Sensitive scalp consideration";
const MAX_REASONS = 4;

function codeFor(profileSlug: string | null): HairArchetypeCode | null {
  const found = (Object.keys(ARCHETYPE_SLUG) as HairArchetypeCode[]).find(
    (code) => ARCHETYPE_SLUG[code] === profileSlug
  );
  return found ?? null;
}

export function explainHairResult(
  responses: HairQuizResponses,
  score: HairQuizScore
): HairResultExplanation {
  const concerns = Array.isArray(responses.scalp_concerns)
    ? responses.scalp_concerns.filter((c): c is string => typeof c === "string")
    : [];
  const primary =
    typeof responses.primary_concern === "string"
      ? responses.primary_concern
      : null;

  const advisory =
    concerns.some((c) => ADVISORY_CONCERNS.includes(c)) ||
    (primary !== null && ADVISORY_PRIMARY.includes(primary));

  const code = codeFor(score.profileSlug);
  if (code === null) return { tags: [], reasons: [], advisory };

  const tags: string[] = [];
  for (const questionKey of TAG_QUESTIONS) {
    const answer = responses[questionKey];
    if (typeof answer !== "string") continue;
    const tag = TAG_LABELS[questionKey]?.[answer];
    if (tag) tags.push(tag);
  }
  if (concerns.some((c) => ADVISORY_CONCERNS.includes(c)))
    tags.push(SENSITIVE_TAG);

  // Heaviest contributions to the winner first; one reason per answer.
  const reasons: string[] = [];
  const seen = new Set<string>();
  const contributing = score.signals
    .filter((s) => s.code === code)
    .sort((a, b) => b.weight - a.weight);
  for (const signal of contributing) {
    const label = hairOptionLabel(signal.questionKey, signal.optionKey);
    if (seen.has(label)) continue;
    seen.add(label);
    reasons.push(label);
    if (reasons.length === MAX_REASONS) break;
  }

  return { tags, reasons, advisory };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/haircare/explain.test.ts && npm run typecheck`
Expected: PASS, 8 tests.

Note: `Array.prototype.sort` is stable in Node 18+, so equal-weight reasons keep
signal order and the output stays deterministic.

- [ ] **Step 5: Commit**

```bash
git add lib/haircare/explain.ts lib/haircare/explain.test.ts
git commit -m "feat(haircare): snapshot tags, why-this-result, scalp advisory"
```

---

### Task 6: `renderResult` on `QuizShell`

**Files:**

- Modify: `components/editorial/QuizShell.tsx`
- Test: `components/editorial/QuizShell.test.tsx` (append)

**Interfaces:**

- Produces: `renderResult?: (args: { responses: Record<string, QuizResponseValue>; restart: () => void }) => ReactNode`
  on `QuizShell`. When present, it replaces the completion interstitial and the
  final button reads "See my result". Task 8 passes it.

- [ ] **Step 1: Write the failing test**

Append to `components/editorial/QuizShell.test.tsx`:

```ts
describe("QuizShell with a custom result", () => {
  function renderWithResult() {
    return render(
      <QuizShell
        definition={PLACEHOLDER_HAIR_QUIZ}
        renderResult={({ responses, restart }) => (
          <div>
            <p>Result for {String(responses.wash_frequency)}</p>
            <button type="button" onClick={restart}>
              Retake
            </button>
          </div>
        )}
      />
    );
  }

  function finish() {
    fireEvent.click(screen.getByRole("button", { name: "Next" })); // intro
    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Frizz" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("radio", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("radio", { name: "More volume" }));
    fireEvent.click(screen.getByRole("button", { name: "See my result" }));
  }

  it("labels the final action for a result, not a preview", () => {
    renderWithResult();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Frizz" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("radio", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "See my result" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "See preview" })).toBe(null);
  });

  it("renders the custom result with the collected answers", () => {
    renderWithResult();
    finish();
    expect(screen.getByText("Result for alt")).toBeTruthy();
    expect(screen.queryByText("That's the preview.")).toBe(null);
  });

  it("restarts the quiz from the custom result", () => {
    renderWithResult();
    finish();
    fireEvent.click(screen.getByRole("button", { name: "Retake" }));
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
  });

  it("keeps the built-in interstitial when no result is provided", () => {
    render(<QuizShell definition={PLACEHOLDER_HAIR_QUIZ} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Frizz" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("radio", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("radio", { name: "More volume" }));
    fireEvent.click(screen.getByRole("button", { name: "See preview" }));
    expect(screen.getByText("That's the preview.")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/QuizShell.test.tsx`
Expected: FAIL — `renderResult` is not a known prop; the final button still reads
"See preview".

- [ ] **Step 3: Add the prop**

In `components/editorial/QuizShell.tsx`, add the `ReactNode` type import:

```ts
import { useEffect, useRef, useState, type ReactNode } from "react";
```

Add to the props destructuring (after `onComplete`):

```ts
  renderResult,
```

Add to the props type (after the `onComplete` entry):

```ts
  /**
   * Render the completed state yourself — receives the collected answers and a
   * reset. When omitted, the built-in interstitial is shown.
   */
  renderResult?: (args: {
    responses: Responses;
    restart: () => void;
  }) => ReactNode;
```

Extract the reset so both the interstitial and a custom result can use it — add
just below the `back` function:

```ts
function restart() {
  setDone(false);
  setIndex(0);
  setResponses({});
  setError(null);
  stepErrors.current = {};
}
```

Replace the `if (done)` block's opening so a custom result short-circuits it:

```ts
  if (done) {
    if (renderResult) return <>{renderResult({ responses, restart })}</>;
```

…and in the interstitial's "Start over" button, replace the inline handler with
`onClick={restart}`.

Finally update the last-step label:

```ts
{
  isLast
    ? serverBacked || renderResult
      ? "See my result"
      : "See preview"
    : "Next";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/editorial/QuizShell.test.tsx && npm run typecheck`
Expected: PASS — the four new cases and every existing QuizShell case, including
the server-backed suite.

- [ ] **Step 5: Commit**

```bash
git add components/editorial/QuizShell.tsx components/editorial/QuizShell.test.tsx
git commit -m "feat(profile): let QuizShell render a caller-supplied result"
```

---

### Task 7: The result screen

**Files:**

- Create: `components/editorial/HairProfileResult.tsx`
- Test: `components/editorial/HairProfileResult.test.tsx`

**Interfaces:**

- Consumes: `HairProfile` (Task 1), `HairResultExplanation` (Task 5).
- Produces: `HairProfileResult({ profile, explanation, onRetake })` where
  `profile: HairProfile | null` (null renders the low-signal fallback). Task 8
  renders it.

- [ ] **Step 1: Write the failing test**

Create `components/editorial/HairProfileResult.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HairProfileResult } from "./HairProfileResult";
import { getHairProfile } from "@/lib/haircare/profiles";
import type { HairResultExplanation } from "@/lib/haircare/explain";

const profile = getHairProfile("hidden-wave")!;

const explanation: HairResultExplanation = {
  tags: ["Loose wave", "Fine strands"],
  reasons: ["Waves or curls become more visible", "Forms loose S-shaped bends"],
  advisory: false,
};

describe("HairProfileResult", () => {
  it("leads with the profile identity and summary", () => {
    render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={vi.fn()}
      />
    );
    expect(
      screen.getByRole("heading", { level: 1, name: profile.name })
    ).toBeTruthy();
    expect(screen.getByText(profile.tagline)).toBeTruthy();
  });

  it("shows the snapshot tags and the why-this-result reasons", () => {
    render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={vi.fn()}
      />
    );
    for (const tag of explanation.tags)
      expect(screen.getByText(tag)).toBeTruthy();
    for (const reason of explanation.reasons)
      expect(screen.getByText(reason)).toBeTruthy();
  });

  it("renders the guidance panels and all four routine steps", () => {
    render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={vi.fn()}
      />
    );
    expect(screen.getByText(profile.care[0])).toBeTruthy();
    expect(screen.getByText(profile.lookFor[0])).toBeTruthy();
    expect(screen.getByText(profile.useCarefully[0])).toBeTruthy();
    for (const s of profile.routine) {
      expect(screen.getByText(s.step)).toBeTruthy();
      expect(screen.getByText(s.detail)).toBeTruthy();
    }
  });

  it("links to the profile's full guide and offers a retake", () => {
    const onRetake = vi.fn();
    render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={onRetake}
      />
    );
    const link = screen.getByRole("link", { name: /read the full guide/i });
    expect(link.getAttribute("href")).toBe("/haircare/profiles/hidden-wave");
    fireEvent.click(screen.getByRole("button", { name: /retake/i }));
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("always carries the educational limitation note", () => {
    render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={vi.fn()}
      />
    );
    expect(screen.getByText(/not a medical diagnosis/i)).toBeTruthy();
  });

  it("shows the professional-evaluation advisory only when raised", () => {
    const { unmount } = render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={vi.fn()}
      />
    );
    expect(screen.queryByRole("note")).toBe(null);
    unmount();

    render(
      <HairProfileResult
        profile={profile}
        explanation={{ ...explanation, advisory: true }}
        onRetake={vi.fn()}
      />
    );
    expect(screen.getByRole("note")).toBeTruthy();
    expect(screen.getByText(/professional evaluation/i)).toBeTruthy();
  });

  it("falls back to the chooser when there is not enough signal", () => {
    render(
      <HairProfileResult
        profile={null}
        explanation={{ tags: [], reasons: [], advisory: false }}
        onRetake={vi.fn()}
      />
    );
    expect(screen.getByText(/not enough to place you/i)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /browse the profiles/i })
        .getAttribute("href")
    ).toBe("/beauty-profile/hair");
    expect(screen.getByRole("button", { name: /retake/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/HairProfileResult.test.tsx`
Expected: FAIL — cannot resolve `./HairProfileResult`.

- [ ] **Step 3: Write the component**

Create `components/editorial/HairProfileResult.tsx`:

```tsx
import Link from "next/link";
import type { HairProfile } from "@/lib/haircare/profiles";
import type { HairResultExplanation } from "@/lib/haircare/explain";

// The Hair Profile result (WS-07 §1–§7, §9). Presentational: it receives a
// scored profile and its explanation and renders them. Scoring, analytics, and
// state live in HairQuizClient.
//
// `profile === null` means the scorer found no signal — we say so instead of
// asserting an archetype the answers don't support.

const LIMITATION =
  "This result is educational and is not a medical diagnosis. Persistent itching, redness, pain, severe flaking, scalp lesions, or sudden hair loss may need professional evaluation.";

const ADVISORY =
  "Some of your answers describe symptoms that a dermatologist or trichologist should look at. A routine can support your scalp, but it can't assess what's causing this — please consider a professional evaluation.";

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-soft-gray p-5">
      <h3 className="font-serif text-lg leading-snug">{title}</h3>
      <ul className="mt-3 space-y-1.5 text-sm text-text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function RetakeButton({ onRetake }: { onRetake: () => void }) {
  return (
    <button
      type="button"
      onClick={onRetake}
      className="rounded-full border border-soft-gray px-5 py-2 text-xs font-medium uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-text"
    >
      Retake the quiz
    </button>
  );
}

export function HairProfileResult({
  profile,
  explanation,
  onRetake,
}: {
  profile: HairProfile | null;
  explanation: HairResultExplanation;
  onRetake: () => void;
}) {
  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24" aria-live="polite">
        <p className="text-xs uppercase tracking-widest text-accent">
          Hair Profile
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
          That&apos;s not enough to place you yet.
        </h1>
        <p className="mt-4 text-text-muted">
          Your answers didn&apos;t point clearly to one profile. Retake the
          quiz, or read through the six profiles and see which one sounds like
          your hair.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <RetakeButton onRetake={onRetake} />
          <Link
            href="/beauty-profile/hair"
            className="rounded-full border border-text bg-text px-5 py-2 text-xs font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent"
          >
            Browse the profiles
          </Link>
        </div>
        <p className="mt-12 border-t border-soft-gray pt-6 text-xs text-text-muted/70">
          {LIMITATION}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24" aria-live="polite">
      <p className="text-xs uppercase tracking-widest text-accent">
        Your Hair Profile
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
        {profile.name}
      </h1>
      <p className="mt-4 text-lg text-text-muted">{profile.tagline}</p>

      {explanation.tags.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {explanation.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-soft-gray px-3 py-1 text-xs text-text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {explanation.reasons.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Why this result</h2>
          <p className="mt-2 text-sm text-text-muted">
            These answers weighed most heavily:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-text-muted">
            {explanation.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Panel title="Your priorities" items={profile.care} />
        <Panel title="Look for" items={profile.lookFor} />
        <Panel title="Use carefully" items={profile.useCarefully} />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Build your routine</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">
          {profile.routine.map((s) => (
            <li key={s.step} className="border-t border-soft-gray pt-3">
              <p className="text-[11px] uppercase tracking-label text-accent">
                {s.step}
              </p>
              <p className="mt-1 text-sm text-text-muted">{s.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {explanation.advisory && (
        <p
          role="note"
          className="mt-10 rounded-lg border border-accent/40 bg-porcelain/50 p-5 text-sm text-text"
        >
          {ADVISORY}
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/haircare/profiles/${profile.slug}`}
          className="rounded-full border border-text bg-text px-5 py-2 text-xs font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent"
        >
          Read the full guide
        </Link>
        <RetakeButton onRetake={onRetake} />
      </div>

      <p className="mt-12 border-t border-soft-gray pt-6 text-xs text-text-muted/70">
        {LIMITATION}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/editorial/HairProfileResult.test.tsx && npm run typecheck`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add components/editorial/HairProfileResult.tsx components/editorial/HairProfileResult.test.tsx
git commit -m "feat(profile): Hair Profile result screen"
```

---

### Task 8: Client wiring, analytics, and the quiz route

**Files:**

- Create: `lib/analytics/duration.ts`
- Create: `lib/analytics/duration.test.ts`
- Create: `components/editorial/HairQuizClient.tsx`
- Create: `components/editorial/HairQuizClient.test.tsx`
- Rewrite: `app/beauty-profile/hair/quiz/page.tsx`

**Interfaces:**

- Consumes: `HAIR_QUIZ` (Task 3), `scoreHairQuiz` (Task 4), `explainHairResult`
  (Task 5), `renderResult` (Task 6), `HairProfileResult` (Task 7),
  `getHairProfile` (Task 1), the funnel helpers in `@/lib/analytics/events`.
- Produces: `durationBucketFromMs(ms: number): string` and `HairQuizClient()`
  (no props). Task 9 links to the route that renders it.

`renderResult` is a function prop, so it cannot cross the server→client boundary:
the route stays a server component (for `metadata`) and `HairQuizClient` owns the
client side. That is why this task exists.

- [ ] **Step 1: Write the failing duration test**

Create `lib/analytics/duration.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { durationBucketFromMs } from "./duration";

describe("durationBucketFromMs", () => {
  it("buckets elapsed time into the profile funnel's buckets", () => {
    expect(durationBucketFromMs(0)).toBe("under_1m");
    expect(durationBucketFromMs(59_000)).toBe("under_1m");
    expect(durationBucketFromMs(60_000)).toBe("1_3m");
    expect(durationBucketFromMs(179_000)).toBe("1_3m");
    expect(durationBucketFromMs(180_000)).toBe("3_10m");
    expect(durationBucketFromMs(599_000)).toBe("3_10m");
    expect(durationBucketFromMs(600_000)).toBe("over_10m");
  });

  it("treats nonsense as the smallest bucket rather than throwing", () => {
    expect(durationBucketFromMs(-1)).toBe("under_1m");
    expect(durationBucketFromMs(Number.NaN)).toBe("under_1m");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/analytics/duration.test.ts`
Expected: FAIL — cannot resolve `./duration`.

- [ ] **Step 3: Write the helper**

Create `lib/analytics/duration.ts`:

```ts
// Duration buckets for the profile funnel (docs/06). Buckets, never timestamps —
// a bucket can't re-identify anyone.
//
// `durationBucket()` in app/actions/profile.ts computes the same buckets from an
// ISO start time on the server; keep the two lists in step.

export function durationBucketFromMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "under_1m";
  const minutes = ms / 60_000;
  if (minutes < 1) return "under_1m";
  if (minutes < 3) return "1_3m";
  if (minutes < 10) return "3_10m";
  return "over_10m";
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run lib/analytics/duration.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write the failing client test**

Create `components/editorial/HairQuizClient.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HairQuizClient } from "./HairQuizClient";
import { HAIR_QUIZ } from "@/lib/haircare/quiz";

vi.mock("@/lib/analytics/events", () => ({
  profileQuizStarted: vi.fn(),
  profileQuizStepViewed: vi.fn(),
  profileQuizStepCompleted: vi.fn(),
  profileQuizCompleted: vi.fn(),
}));

import {
  profileQuizStarted,
  profileQuizStepViewed,
  profileQuizCompleted,
} from "@/lib/analytics/events";

/** Answer every question with the option key given, then submit. */
function completeQuiz(answers: Record<string, string>) {
  for (const question of HAIR_QUIZ.questions) {
    const key = answers[question.key];
    const option = question.options.find((o) => o.key === key)!;
    const role = question.type === "multi_select" ? "checkbox" : "radio";
    fireEvent.click(screen.getByRole(role, { name: option.label }));
    const last =
      question.key === HAIR_QUIZ.questions[HAIR_QUIZ.questions.length - 1].key;
    fireEvent.click(
      screen.getByRole("button", { name: last ? "See my result" : "Next" })
    );
  }
}

const HIDDEN_WAVE: Record<string, string> = {
  natural_pattern: "loose_wave",
  strand_thickness: "fine",
  density: "low",
  scalp_oiliness_onset: "two_plus_days",
  scalp_concerns: "none",
  wash_frequency: "every_other_day",
  product_response: "varies",
  dry_time: "average",
  humidity_response: "waves_appear",
  chemical_history: "none",
  heat_frequency: "rarely",
  ends_condition: "smooth",
  primary_concern: "curl_definition",
  desired_result: "defined_texture",
};

describe("HairQuizClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens on step 1 of 14 and reports the quiz start once", () => {
    render(<HairQuizClient />);
    expect(screen.getByText("Step 1 of 14")).toBeTruthy();
    expect(profileQuizStarted).toHaveBeenCalledTimes(1);
    expect(profileQuizStarted).toHaveBeenCalledWith({
      domain: "hair",
      quizVersion: 1,
      entrySource: "hair_quiz_page",
    });
  });

  it("reports steps by key, never by answer", () => {
    render(<HairQuizClient />);
    expect(profileQuizStepViewed).toHaveBeenCalledWith({
      domain: "hair",
      quizVersion: 1,
      stepKey: "natural_pattern",
      stepIndex: 0,
    });
  });

  it("scores a completed quiz into a profile result", () => {
    render(<HairQuizClient />);
    completeQuiz(HIDDEN_WAVE);
    expect(
      screen.getByRole("heading", { level: 1, name: "The Hidden Wave" })
    ).toBeTruthy();
    expect(screen.getByText("Loose wave")).toBeTruthy();
    expect(profileQuizCompleted).toHaveBeenCalledTimes(1);
    expect(profileQuizCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "hair", quizVersion: 1 })
    );
  });

  it("returns to step 1 on retake", () => {
    render(<HairQuizClient />);
    completeQuiz(HIDDEN_WAVE);
    fireEvent.click(screen.getByRole("button", { name: /retake/i }));
    expect(screen.getByText("Step 1 of 14")).toBeTruthy();
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run components/editorial/HairQuizClient.test.tsx`
Expected: FAIL — cannot resolve `./HairQuizClient`.

- [ ] **Step 7: Write the client wrapper**

Create `components/editorial/HairQuizClient.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { QuizShell } from "./QuizShell";
import { HairProfileResult } from "./HairProfileResult";
import type { QuizResponseValue } from "./QuestionRenderer";
import { HAIR_QUIZ } from "@/lib/haircare/quiz";
import { scoreHairQuiz, type HairQuizResponses } from "@/lib/haircare/scoring";
import { explainHairResult } from "@/lib/haircare/explain";
import { getHairProfile } from "@/lib/haircare/profiles";
import { durationBucketFromMs } from "@/lib/analytics/duration";
import {
  profileQuizStarted,
  profileQuizStepViewed,
  profileQuizStepCompleted,
  profileQuizCompleted,
} from "@/lib/analytics/events";

// Client boundary for the public Hair Profile quiz. Answers live in QuizShell's
// state and are scored here on completion — nothing is persisted, so there is no
// attempt, no cookie, and no resume (that is the server-backed path under
// /quiz/start). Analytics carry question keys and buckets only, never answers.

const DOMAIN = "hair" as const;
const VERSION = HAIR_QUIZ.version;

/** Result view: scores once, reports the completion once, renders the result. */
function HairQuizResult({
  responses,
  startedAt,
  onRetake,
}: {
  responses: Record<string, QuizResponseValue>;
  startedAt: number;
  onRetake: () => void;
}) {
  const { profile, explanation } = useMemo(() => {
    const score = scoreHairQuiz(responses as HairQuizResponses);
    return {
      profile: score.profileSlug
        ? (getHairProfile(score.profileSlug) ?? null)
        : null,
      explanation: explainHairResult(responses as HairQuizResponses, score),
    };
  }, [responses]);

  useEffect(() => {
    profileQuizCompleted({
      domain: DOMAIN,
      quizVersion: VERSION,
      durationBucket: durationBucketFromMs(Date.now() - startedAt),
    });
    // Once per completed run; a retake mounts a new result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HairProfileResult
      profile={profile}
      explanation={explanation}
      onRetake={onRetake}
    />
  );
}

export function HairQuizClient() {
  const startedAt = useRef(Date.now());
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    profileQuizStarted({
      domain: DOMAIN,
      quizVersion: VERSION,
      entrySource: "hair_quiz_page",
    });
  }, []);

  return (
    <QuizShell
      definition={HAIR_QUIZ}
      exitHref="/beauty-profile/hair"
      onStepView={(stepKey, stepIndex) =>
        profileQuizStepViewed({
          domain: DOMAIN,
          quizVersion: VERSION,
          stepKey,
          stepIndex,
        })
      }
      onStepCompleted={(stepKey, stepIndex, validationErrorCount) =>
        profileQuizStepCompleted({
          domain: DOMAIN,
          quizVersion: VERSION,
          stepKey,
          stepIndex,
          validationErrorCount,
        })
      }
      renderResult={({ responses, restart }) => (
        <HairQuizResult
          responses={responses}
          startedAt={startedAt.current}
          onRetake={restart}
        />
      )}
    />
  );
}
```

- [ ] **Step 8: Rewrite the route**

Replace `app/beauty-profile/hair/quiz/page.tsx` entirely:

```tsx
import type { Metadata } from "next";
import { HairQuizClient } from "@/components/editorial/HairQuizClient";

// The public Hair Profile quiz (WS-06). Client-only: answers are scored in the
// browser and nothing is stored, so there is no flag to gate and no personal
// data in the URL. noindex — the quiz itself is not a landing page; the six
// profile guides under /haircare/profiles are.
//
// The server-backed, anonymously-persisted variant lives at ./start and
// ./[attempt] and stays behind the hair_profile flag until its v1 seed lands.
export const metadata: Metadata = {
  title: "Hair Profile quiz",
  robots: { index: false, follow: false },
};

export default function HairQuizPage() {
  return (
    <main>
      <HairQuizClient />
    </main>
  );
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run components/editorial lib && npm run typecheck && npm run lint`
Expected: PASS — the four HairQuizClient cases plus every prior suite. The
`PLACEHOLDER_HAIR_QUIZ` import is gone from the route; lint must not report it as
unused anywhere (it is still imported by `QuizShell.test.tsx` and the server path).

- [ ] **Step 10: Commit**

```bash
git add lib/analytics/duration.ts lib/analytics/duration.test.ts components/editorial/HairQuizClient.tsx components/editorial/HairQuizClient.test.tsx app/beauty-profile/hair/quiz/page.tsx
git commit -m "feat(profile): public client-scored Hair Profile quiz route"
```

---

### Task 9: Make the quiz the entry point

**Files:**

- Modify: `app/beauty-profile/hair/page.tsx`
- Test: manual (this page is a static server component with no branching logic;
  the suites above cover the behavior it links to)

**Interfaces:**

- Consumes: the route from Task 8.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Promote the quiz, demote the chooser**

In `app/beauty-profile/hair/page.tsx`, replace the comment and `<section>` that
currently start at "The guided 12–14 question quiz is in build" with:

```tsx
<div className="mt-10">
  <Link
    href="/beauty-profile/hair/quiz"
    className="inline-block rounded-full border border-text bg-text px-6 py-2.5 text-xs font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent"
  >
    Start the quiz
  </Link>
</div>;

{
  /* Secondary path: the six profiles double as the quiz's result
          archetypes, so anyone who already knows theirs can skip straight to
          the care guide. */
}
<section className="mt-16 border-t border-soft-gray pt-10">
  <h2 className="font-serif text-2xl">Already know your profile?</h2>
  <p className="mt-2 text-text-muted">Go straight to its care guide.</p>
  <div className="mt-6 grid gap-4 sm:grid-cols-2">
    {HAIR_PROFILES.map((p) => (
      <Link
        key={p.slug}
        href={`/haircare/profiles/${p.slug}`}
        className="group block rounded-lg border border-soft-gray p-5 transition-colors duration-medium ease-editorial hover:border-accent"
      >
        <h3 className="font-serif text-lg leading-snug transition-colors duration-medium ease-editorial group-hover:text-accent">
          {p.name}
        </h3>
        <p className="mt-2 text-sm text-text-muted">{p.tagline}</p>
      </Link>
    ))}
  </div>
</section>;
```

Leave the header, the `REASSURANCE` list, and the closing limitation note as they
are. `REASSURANCE` already reads "About two minutes / No purchase required /
Personalized care guidance / Educational, not a medical diagnosis" — all still true.

- [ ] **Step 2: Verify the whole suite and the build**

Run: `npm run typecheck && npm test && npm run lint && npm run build`
Expected: all pass. `npm run build` catches a server/client boundary mistake that
Vitest cannot (for example a function prop leaking into a server component).

- [ ] **Step 3: Walk it manually, keyboard only**

Run: `npm run dev`, then with the keyboard alone:

1. `/beauty-profile/hair` → "Start the quiz" is reachable by Tab and Enter.
2. All 14 steps: options selectable with arrows/space, Next with Enter.
3. On step 5 pick two concerns, then "None" — the other two clear. Pick a concern
   again — "None" clears.
4. Try Next with nothing selected — an error is announced and the step holds.
5. Back preserves the previous answer.
6. Finish → the result shows a profile name, tags, why-this-result, three panels,
   four routine steps, the guide link, and the limitation note.
7. On step 13 choose "Sensitive or uncomfortable scalp" in a second run — the
   advisory block appears on the result.
8. "Retake the quiz" returns to step 1 of 14 with the answers cleared.

- [ ] **Step 4: Commit**

```bash
git add app/beauty-profile/hair/page.tsx
git commit -m "feat(profile): make the Hair Profile quiz the primary entry"
```

- [ ] **Step 5: Review and open the PR**

Run `/code-review`, then `/security-review` (focus: nothing personal in URLs or
analytics, noindex on the quiz route, the server-backed path still gated). Then:

```bash
git push -u origin feat/hair-quiz-content
gh pr create --title "feat(profile): Hair Profile quiz — 14 questions, six archetypes, in-page result" --body "$(cat <<'BODY'
Implements docs/superpowers/specs/2026-07-28-hair-profile-quiz-design.md — the
hair half of M3, on top of the M2b framework.

- 14-question `HAIR_QUIZ` (version 1), scored in the browser into the six
  existing hair archetypes; in-page result with why-this-result, guidance
  panels, and a four-step routine.
- `/beauty-profile/hair` now leads with the quiz; the profile chooser stays as a
  secondary path.
- Framework: `QuizShell` can render a caller-supplied result;
  multi-select questions support an exclusive "None".
- No database work: the server-backed attempt path is untouched and still
  flag-gated. DB seed of version 1 + durable results are the follow-up.

**Requires product/medical review before enabling in production** — the weight
tables in spec §4 are the artifact to review (WS-06).
BODY
)"
```

---

## Follow-up (not this plan)

Seed `quiz_definitions` version 1 from `HAIR_QUIZ` and retire version 0; write the
real archetype into `profile_snapshots`; add a durable
`/beauty-profile/hair/result/[snapshot]`; render `routine` on the profile
landings; the signup/save prompt (M5).
