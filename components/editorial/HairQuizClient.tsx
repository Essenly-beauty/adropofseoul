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
