"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { QuestionRenderer, type QuizResponseValue } from "./QuestionRenderer";
import {
  optionKeys,
  type QuizDefinition,
  type QuizQuestionDef,
} from "@/lib/profile/quiz-definition";
import { validateResponse } from "@/lib/profile/validation";

// The quiz runner shell (docs/05 §2): title/context, progress, one question at a
// time, back/next, validation, and an exit.
//
// Two modes, same component:
//  * Preview (M2b-1): pass only `definition` — responses live in local state and
//    completion shows a preview interstitial. No server, no persistence.
//  * Server-backed (M2b-2b): pass `onSaveResponse` / `onComplete` (+ resume data
//    and analytics callbacks) — answers autosave on advance, progress resumes
//    from the server, and completion is server-authoritative. The extra props
//    are all optional, so the preview path is unchanged.

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

function saveErrorText(code?: string): string {
  switch (code) {
    case "ATTEMPT_EXPIRED":
      return "This session has expired — please start the quiz again.";
    case "ATTEMPT_ALREADY_COMPLETED":
      return "This quiz was already completed.";
    case "FEATURE_DISABLED":
      return "This quiz isn't available right now.";
    default:
      return "Something went wrong saving your answer. Please try again.";
  }
}

export function QuizShell({
  definition,
  exitHref = "/beauty-profile",
  initialResponses,
  initialStep,
  onSaveResponse,
  onComplete,
  onStepView,
  onStepCompleted,
  onResumed,
  renderResult,
}: {
  definition: QuizDefinition;
  exitHref?: string;
  /** Server-persisted answers to resume from (server-backed mode). */
  initialResponses?: Responses;
  /** Step to resume on (server-backed mode). */
  initialStep?: number;
  /** Persist one answer; resolves ok=false to block advancing. */
  onSaveResponse?: (
    questionKey: string,
    value: QuizResponseValue
  ) => Promise<{ ok: boolean; error?: string }>;
  /** Finalize the attempt; resolves ok=false to block completion. */
  onComplete?: () => Promise<{ ok: boolean; error?: string }>;
  onStepView?: (stepKey: string, stepIndex: number) => void;
  onStepCompleted?: (
    stepKey: string,
    stepIndex: number,
    validationErrorCount: number
  ) => void;
  /** Called once on mount when resuming a pre-existing attempt. */
  onResumed?: () => void;
  /**
   * Render the completed state yourself — receives the collected answers and a
   * reset. When omitted, the built-in interstitial is shown.
   */
  renderResult?: (args: {
    responses: Responses;
    restart: () => void;
  }) => ReactNode;
}) {
  const total = definition.questions.length;
  const serverBacked = Boolean(onComplete);
  const clampStep = (n: number) => Math.min(Math.max(n, 0), total - 1);
  const [index, setIndex] = useState(() => clampStep(initialStep ?? 0));
  const [responses, setResponses] = useState<Responses>(initialResponses ?? {});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const stepErrors = useRef<Record<string, number>>({});

  const question = definition.questions[index];
  const isLast = index === total - 1;

  // Announce resume once, before the first step view.
  useEffect(() => {
    if (initialResponses && Object.keys(initialResponses).length > 0)
      onResumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step view fires on mount (initial/resumed step) and every transition.
  useEffect(() => {
    if (!done && question) onStepView?.(question.key, index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, done]);

  function setValue(v: QuizResponseValue) {
    setResponses((r) => ({ ...r, [question.key]: v }));
    if (error) setError(null);
  }

  function focusStep() {
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

  async function next() {
    if (saving) return;
    if (!validateCurrent()) {
      stepErrors.current[question.key] =
        (stepErrors.current[question.key] ?? 0) + 1;
      return;
    }
    // Autosave the current answer before advancing (server-backed mode only).
    if (onSaveResponse && question.type !== "info") {
      const v = responses[question.key];
      if (isAnswered(question, v)) {
        setSaving(true);
        const r = await onSaveResponse(question.key, v);
        setSaving(false);
        if (!r.ok) {
          setError(saveErrorText(r.error));
          return;
        }
      }
    }
    onStepCompleted?.(
      question.key,
      index,
      stepErrors.current[question.key] ?? 0
    );

    if (isLast) {
      if (onComplete) {
        setSaving(true);
        const r = await onComplete();
        setSaving(false);
        if (!r.ok) {
          setError(saveErrorText(r.error));
          return;
        }
      }
      setDone(true);
      return;
    }
    setIndex((i) => clampStep(i + 1));
    setError(null);
    focusStep();
  }

  function back() {
    if (index === 0 || saving) return;
    setIndex((i) => clampStep(i - 1));
    setError(null);
    focusStep();
  }

  function restart() {
    setDone(false);
    setIndex(0);
    setResponses({});
    setError(null);
    stepErrors.current = {};
  }

  if (done) {
    if (renderResult) return <>{renderResult({ responses, restart })}</>;
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24" aria-live="polite">
        <p className="text-xs uppercase tracking-widest text-accent">
          {definition.title}
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
          {serverBacked ? "Your answers are saved." : "That's the preview."}
        </h1>
        <p className="mt-4 text-text-muted">
          {serverBacked
            ? "Your Hair Profile is being prepared. Your personalized result — with the reasoning shown — is coming next, before any signup."
            : "In the full Hair Profile, your answers build a private, personalized result — with the reasoning shown — before any signup. That part is coming next."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {!serverBacked && (
            <button
              type="button"
              onClick={restart}
              className="rounded-full border border-text px-4 py-1.5 text-xs font-medium uppercase tracking-label transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
            >
              Start over
            </button>
          )}
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
          disabled={index === 0 || saving}
          className="rounded-full border border-soft-gray px-5 py-2 text-xs font-medium uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          {saving && (
            <span
              className="text-[11px] uppercase tracking-label text-text-muted"
              aria-live="polite"
            >
              Saving…
            </span>
          )}
          <button
            type="button"
            onClick={next}
            disabled={saving}
            className="rounded-full border border-text bg-text px-6 py-2 text-xs font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLast
              ? serverBacked || renderResult
                ? "See my result"
                : "See preview"
              : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
