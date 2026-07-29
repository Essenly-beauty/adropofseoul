"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startQuizAttempt } from "@/app/actions/profile";
import {
  profileQuizStarted,
  profileQuizResumed,
  type ProfileDomain,
} from "@/lib/analytics/events";

// Entry point for the server-backed quiz (M2b-2b). Creates (or resumes) an owned
// attempt, emits started/resumed, then routes to the attempt runner. `started`
// and `resumed` are emitted HERE (at attempt creation), not in QuizRunner.

function startErrorText(code?: string): string {
  switch (code) {
    case "FEATURE_DISABLED":
      return "This quiz isn't available yet.";
    case "QUIZ_VERSION_RETIRED":
      return "This quiz is being updated — please check back soon.";
    default:
      return "Something went wrong starting the quiz. Please try again.";
  }
}

function makeNonce(): string {
  // Per-click idempotency key so a genuine double-click resolves to one attempt.
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function StartQuizButton({
  domain,
  sourceContext = "hair_landing",
  label = "Start the quiz",
  basePath = "/beauty-profile/hair/quiz",
}: {
  domain: ProfileDomain;
  sourceContext?: string;
  label?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await startQuizAttempt(domain, sourceContext, makeNonce());
    if (!res.ok) {
      setBusy(false);
      setError(startErrorText(res.error));
      return;
    }
    if (res.created) {
      profileQuizStarted({
        domain,
        quizVersion: res.quizVersion,
        entrySource: sourceContext,
      });
    } else {
      profileQuizResumed({
        domain,
        quizVersion: res.quizVersion,
        resumeAgeBucket: res.resumeAgeBucket ?? "unknown",
      });
    }
    router.push(`${basePath}/${res.attemptId}`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="rounded-full border border-text bg-text px-6 py-2.5 text-xs font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Starting…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
