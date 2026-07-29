"use client";

import { QuizShell } from "./QuizShell";
import type { QuizResponseValue } from "./QuestionRenderer";
import type { QuizDefinition } from "@/lib/profile/quiz-definition";
import {
  saveQuizResponse,
  completeQuizAttempt,
  updateQuizProgress,
} from "@/app/actions/profile";
import {
  profileQuizStepViewed,
  profileQuizStepCompleted,
  profileQuizCompleted,
  type ProfileDomain,
} from "@/lib/analytics/events";

// Client wrapper that binds an owned, server-persisted attempt to the presentational
// QuizShell (M2b-2b). It calls the server actions for autosave + completion and
// emits the funnel events with the domain/version context QuizShell doesn't carry.
// `started` / `resumed` are emitted by the start entry (attempt creation), not here.

export function QuizRunner({
  definition,
  attemptId,
  domain,
  initialResponses,
  initialStep,
  exitHref,
}: {
  definition: QuizDefinition;
  attemptId: string;
  domain: ProfileDomain;
  initialResponses?: Record<string, QuizResponseValue>;
  initialStep?: number;
  exitHref?: string;
}) {
  const quizVersion = definition.version;

  async function onSaveResponse(questionKey: string, value: QuizResponseValue) {
    const res = await saveQuizResponse(attemptId, questionKey, value);
    return { ok: res.ok, error: res.ok ? undefined : res.error };
  }

  async function onComplete() {
    const res = await completeQuizAttempt(attemptId);
    if (res.ok && res.firstCompletion) {
      profileQuizCompleted({
        domain,
        quizVersion,
        durationBucket: res.durationBucket ?? "unknown",
      });
    }
    return { ok: res.ok, error: res.ok ? undefined : res.error };
  }

  return (
    <QuizShell
      definition={definition}
      exitHref={exitHref}
      initialResponses={initialResponses}
      initialStep={initialStep}
      onSaveResponse={onSaveResponse}
      onComplete={onComplete}
      onStepView={(stepKey, stepIndex) => {
        profileQuizStepViewed({ domain, quizVersion, stepKey, stepIndex });
        // Persist position so a refresh resumes on the current step, not step 0
        // (answers already persist via saveQuizResponse). Fire-and-forget; a
        // late call on a completed attempt is rejected server-side and ignored.
        void updateQuizProgress(attemptId, stepIndex).catch(() => {});
      }}
      onStepCompleted={(stepKey, stepIndex, validationErrorCount) =>
        profileQuizStepCompleted({
          domain,
          quizVersion,
          stepKey,
          stepIndex,
          validationErrorCount,
        })
      }
    />
  );
}
