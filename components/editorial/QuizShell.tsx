"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { QuestionRenderer, type QuizResponseValue } from "./QuestionRenderer";
import {
  optionKeys,
  type QuizDefinition,
  type QuizQuestionDef,
} from "@/lib/profile/quiz-definition";
import { validateResponse } from "@/lib/profile/validation";

// The quiz runner shell (docs/05 §2): title/context, progress, one question at a
// time, back/next, validation, and an exit. M2b-1 keeps responses in local
// state; M2b-2 backs the same interface with server autosave/resume + result.

type Responses = Record<string, QuizResponseValue>;

function isAnswered(q: QuizQuestionDef, v: QuizResponseValue): boolean {
  switch (q.type) {
    case "info":
      return true;
    case "single_select":
      return typeof v === "string" && v.length > 0;
    case "multi_select":
      return Array.isArray(v) && v.length > 0;
    case "scale":
      return typeof v === "number";
    case "text":
      return typeof v === "string" && v.trim().length > 0;
    default:
      return false;
  }
}

export function QuizShell({
  definition,
  exitHref = "/beauty-profile",
}: {
  definition: QuizDefinition;
  exitHref?: string;
}) {
  const total = definition.questions.length;
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Responses>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);

  const question = definition.questions[index];
  const isLast = index === total - 1;

  function setValue(v: QuizResponseValue) {
    setResponses((r) => ({ ...r, [question.key]: v }));
    if (error) setError(null);
  }

  function focusStep() {
    // Move focus to the step region so screen readers land on the new question.
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function validateCurrent(): boolean {
    const v = responses[question.key];
    if (question.isRequired && !isAnswered(question, v)) {
      setError(
        question.type === "multi_select"
          ? "Please choose at least one option."
          : "Please answer to continue."
      );
      return false;
    }
    if (isAnswered(question, v) && question.type !== "info") {
      const res = validateResponse(question.type, v, optionKeys(question));
      if (!res.ok) {
        setError("That answer doesn't look valid — please try again.");
        return false;
      }
    }
    return true;
  }

  function next() {
    if (!validateCurrent()) return;
    if (isLast) {
      setDone(true);
      return;
    }
    setIndex((i) => Math.min(i + 1, total - 1));
    setError(null);
    focusStep();
  }

  function back() {
    if (index === 0) return;
    setIndex((i) => i - 1);
    setError(null);
    focusStep();
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24" aria-live="polite">
        <p className="text-xs uppercase tracking-widest text-accent">
          {definition.title}
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
          That&apos;s the preview.
        </h1>
        <p className="mt-4 text-text-muted">
          In the full Hair Profile, your answers build a private, personalized
          result — with the reasoning shown — before any signup. That part is
          coming next.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setIndex(0);
              setResponses({});
            }}
            className="rounded-full border border-text px-4 py-1.5 text-xs font-medium uppercase tracking-label transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
          >
            Start over
          </button>
          <Link
            href={exitHref}
            className="rounded-full border border-soft-gray px-4 py-1.5 text-xs font-medium uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
          >
            Back to Beauty Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <div className="flex items-center justify-between">
        <p
          className="text-[11px] uppercase tracking-label text-text-muted"
          aria-live="polite"
        >
          Step {index + 1} of {total}
        </p>
        <Link
          href={exitHref}
          className="text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
        >
          Exit
        </Link>
      </div>
      <div
        className="mt-2 h-1 w-full overflow-hidden rounded-full bg-soft-gray"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Quiz progress"
      >
        <div
          className="h-full bg-accent transition-[width] duration-medium ease-editorial"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div ref={headingRef} tabIndex={-1} className="mt-10 outline-none">
        <QuestionRenderer
          question={question}
          value={responses[question.key] ?? null}
          onChange={setValue}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={index === 0}
          className="rounded-full border border-soft-gray px-5 py-2 text-xs font-medium uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-full border border-text bg-text px-6 py-2 text-xs font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent"
        >
          {isLast ? "See preview" : "Next"}
        </button>
      </div>
    </div>
  );
}
