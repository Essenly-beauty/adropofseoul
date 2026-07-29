import type { QuizQuestionDef } from "@/lib/profile/quiz-definition";

// One quiz question, rendered by its versioned type — never hardcoded per
// route (docs/05 §2). Controlled: the parent (QuizShell) owns the value.
// Accessible: grouped inputs use fieldset/legend; every control has a label.

export type QuizResponseValue = string | string[] | number | null;

const SCALE = [0, 1, 2, 3, 4, 5] as const;

export function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: QuizQuestionDef;
  value: QuizResponseValue;
  onChange: (value: QuizResponseValue) => void;
}) {
  const help = question.helpText ? (
    <p className="mt-1 text-sm text-text-muted">{question.helpText}</p>
  ) : null;

  if (question.type === "info") {
    return (
      <p className="text-lg leading-relaxed text-text">{question.content}</p>
    );
  }

  if (question.type === "text") {
    return (
      <div>
        <label
          htmlFor={`q-${question.key}`}
          className="block font-serif text-2xl leading-snug"
        >
          {question.content}
        </label>
        {help}
        <textarea
          id={`q-${question.key}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={500}
          rows={4}
          className="mt-4 w-full rounded-md border border-soft-gray bg-bg p-3 text-sm focus:border-accent focus:outline-none"
        />
      </div>
    );
  }

  if (question.type === "scale") {
    const current = typeof value === "number" ? value : null;
    return (
      <fieldset>
        <legend className="font-serif text-2xl leading-snug">
          {question.content}
        </legend>
        {help}
        <div className="mt-4 flex flex-wrap gap-2.5" role="radiogroup">
          {SCALE.map((n) => {
            const active = current === n;
            return (
              <label
                key={n}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors duration-medium ease-editorial ${
                  active
                    ? "border-text bg-text text-bg"
                    : "border-soft-gray text-text-muted hover:border-accent hover:text-text"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question.key}`}
                  value={n}
                  checked={active}
                  onChange={() => onChange(n)}
                  className="sr-only"
                />
                {n}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  // single_select | multi_select
  const multiple = question.type === "multi_select";
  const selected = new Set<string>(
    multiple
      ? Array.isArray(value)
        ? value
        : []
      : typeof value === "string"
        ? [value]
        : []
  );

  function toggle(optionKey: string) {
    if (!multiple) {
      onChange(optionKey);
      return;
    }
    const next = new Set(selected);
    if (next.has(optionKey)) next.delete(optionKey);
    else next.add(optionKey);
    onChange(Array.from(next));
  }

  return (
    <fieldset>
      <legend className="font-serif text-2xl leading-snug">
        {question.content}
      </legend>
      {help}
      <div className="mt-4 space-y-2.5">
        {question.options.map((opt) => {
          const active = selected.has(opt.key);
          return (
            <label
              key={opt.key}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm transition-colors duration-medium ease-editorial ${
                active
                  ? "border-accent bg-porcelain/50"
                  : "border-soft-gray hover:border-accent"
              }`}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={`q-${question.key}`}
                value={opt.key}
                checked={active}
                onChange={() => toggle(opt.key)}
                className="h-4 w-4 accent-accent"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
