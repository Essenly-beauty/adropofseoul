"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QuizShell } from "./QuizShell";
import { HairProfileResult } from "./HairProfileResult";
import type { QuizResponseValue } from "./QuestionRenderer";
import { HAIR_QUIZ } from "@/lib/haircare/quiz";
import { scoreHairQuiz, type HairQuizResponses } from "@/lib/haircare/scoring";
import { explainHairResult } from "@/lib/haircare/explain";
import { getHairProfile } from "@/lib/haircare/profiles";
import { durationBucketFromMs } from "@/lib/analytics/duration";
import { makeNonce } from "@/lib/profile/nonce";
import {
  startQuizAttempt,
  saveQuizResponse,
  completeQuizAttempt,
} from "@/app/actions/profile";
import {
  profileQuizStarted,
  profileQuizStepViewed,
  profileQuizStepCompleted,
  profileQuizResumed,
  profileQuizCompleted,
} from "@/lib/analytics/events";

// Client boundary for the public Hair Profile quiz, in two modes that the user
// never has to choose between.
//
// The questions always render client-side and immediately. An anonymous attempt
// is bootstrapped in parallel: if it lands, answers persist as the user advances
// and completion hands off to the durable result URL. If it doesn't — no service
// key, flag off, a failed round-trip — the quiz scores in the browser and shows
// the in-page result, exactly as it did before it could persist anything.
//
// So the hair_profile flag is a *persistence* switch, not a visibility one:
// turning it off degrades this page, it doesn't break it.
//
// Analytics carry question keys and buckets only, never answers.

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
    const answers: HairQuizResponses = responses;
    const score = scoreHairQuiz(answers);
    return {
      profile: score.profileSlug
        ? (getHairProfile(score.profileSlug) ?? null)
        : null,
      explanation: explainHairResult(answers, score),
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

/** The one-round-trip state between the last answer and the durable result. */
function HairQuizPending() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:py-24" aria-live="polite">
      <p className="text-xs uppercase tracking-widest text-accent">
        Hair Profile
      </p>
      <h1 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
        Building your profile…
      </h1>
    </div>
  );
}

/**
 * Completion. With an attempt: flush any answer whose autosave didn't land (the
 * attempt can arrive after the first steps), complete server-side, and hand off
 * to the durable result. Without one — or if any of that fails — render the
 * in-page result. The user always gets their profile.
 */
function HairQuizFinish({
  responses,
  startedAt,
  attemptId,
  savedKeys,
  onRetake,
}: {
  responses: Record<string, QuizResponseValue>;
  startedAt: number;
  attemptId: string | null;
  savedKeys: Set<string>;
  onRetake: () => void;
}) {
  const router = useRouter();
  const ran = useRef(false);
  const [fellBack, setFellBack] = useState(attemptId === null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (attemptId === null) return; // client-only: the result renders below

    void (async () => {
      try {
        // upsertResponse is idempotent, so re-saving a landed answer is free.
        for (const [key, value] of Object.entries(responses)) {
          if (savedKeys.has(key)) continue;
          const r = await saveQuizResponse(attemptId, key, value);
          if (!r.ok) throw new Error(r.error);
        }
        const done = await completeQuizAttempt(attemptId);
        if (!done.ok) throw new Error(done.error);
        if (done.firstCompletion)
          profileQuizCompleted({
            domain: DOMAIN,
            quizVersion: VERSION,
            durationBucket: done.durationBucket ?? "unknown",
          });
        router.push(`/beauty-profile/hair/result/${done.resultId}`);
      } catch {
        setFellBack(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!fellBack) return <HairQuizPending />;
  return (
    <HairQuizResult
      responses={responses}
      startedAt={startedAt}
      onRetake={onRetake}
    />
  );
}

export function HairQuizClient() {
  const startedAt = useRef(Date.now());
  const reported = useRef(false);
  // Refs, not state: nothing renders off the attempt, and the quiz must not
  // re-render when it lands mid-question. null = client-only for this run.
  const attemptId = useRef<string | null>(null);
  const saved = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    profileQuizStarted({
      domain: DOMAIN,
      quizVersion: VERSION,
      entrySource: "hair_quiz_page",
    });
    // Bootstrapped in parallel with the user reading question 1. A failure is
    // not an error state — it means this run scores client-side and stays there.
    void startQuizAttempt(DOMAIN, "hair_quiz_page", makeNonce()).then((res) => {
      if (!res.ok) return;
      attemptId.current = res.attemptId;
      if (!res.created)
        profileQuizResumed({
          domain: DOMAIN,
          quizVersion: VERSION,
          resumeAgeBucket: res.resumeAgeBucket ?? "unknown",
        });
    });
  }, []);

  // Fire-and-forget, and always ok. Advancing must not wait on a round-trip or
  // be blocked by a failed one: this quiz works client-side, and HairQuizFinish
  // flushes anything that didn't land before completing. Autosave here is what
  // makes a mid-quiz refresh resumable, not what makes the result correct.
  function onSaveResponse(questionKey: string, value: QuizResponseValue) {
    const id = attemptId.current;
    if (id)
      void saveQuizResponse(id, questionKey, value).then((res) => {
        if (res.ok) saved.current.add(questionKey);
      });
    return Promise.resolve({ ok: true as const });
  }

  return (
    <QuizShell
      definition={HAIR_QUIZ}
      exitHref="/beauty-profile/hair"
      onSaveResponse={onSaveResponse}
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
        <HairQuizFinish
          responses={responses}
          startedAt={startedAt.current}
          attemptId={attemptId.current}
          savedKeys={saved.current}
          onRetake={restart}
        />
      )}
    />
  );
}
