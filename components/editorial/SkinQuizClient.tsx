"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QuizShell } from "./QuizShell";
import type { QuizResponseValue } from "./QuestionRenderer";
import type { Product } from "@/services/types";
import { SKIN_PROFILE_V1, scoreSkinProfileV1 } from "@/lib/skincare/profile-v1";
import {
  recommendSkinProductsV1,
  SKIN_PREVIEW_PRODUCTS_V1,
} from "@/lib/skincare/recommendation-v1";
import {
  profileQuizCompleted,
  profileQuizStarted,
  profileQuizStepCompleted,
  profileQuizStepViewed,
  productPreviewClicked,
  passportHandoffClicked,
} from "@/lib/analytics/events";
import { durationBucketFromMs } from "@/lib/analytics/duration";
import { makeNonce } from "@/lib/profile/nonce";
import {
  completeQuizAttempt,
  saveQuizResponse,
  startQuizAttempt,
} from "@/app/actions/profile";
import type { SkinProfileV1Result } from "@/lib/skincare/profile-v1";

const PROFILE_NAMES: Record<string, string> = {
  "hydration-seeker": "The Hydration Seeker",
  "sensitive-comfort": "The Sensitive Comfort Seeker",
  "oil-water-balancer": "The Oil–Water Balancer",
  "texture-reset": "The Texture Reset",
  "steady-radiance": "The Steady Radiance",
  "balanced-basics": "The Balanced Basics",
};

const REASON_COPY: Record<string, string> = {
  PRIMARY_CONCERN_MATCH: "Matches the main goal you chose.",
  SECONDARY_CONCERN_MATCH: "Also supports one of your secondary goals.",
  SKIN_TENDENCY_MATCH: "Fits the way you described your skin's balance.",
  TEXTURE_PREFERENCE_MATCH: "Matches your preferred finish.",
  SENSITIVE_CONSIDERATION: "Selected with your reactivity answer in mind.",
  ROUTINE_STEP_MATCH: "Fits the routine step you want help choosing.",
};

export function SkinProfileResult({
  result,
  products,
  onRetake,
}: {
  result: SkinProfileV1Result;
  products: Product[];
  onRetake: () => void;
}) {
  const recommendations = useMemo(
    () => recommendSkinProductsV1(result),
    [result]
  );
  const productBySlug = useMemo(
    () => new Map(products.map((product) => [product.slug, product])),
    [products]
  );

  const gateway =
    process.env.NEXT_PUBLIC_MY_SEOUL_DROP_URL?.trim() ||
    "https://myseouldrop.app";
  const destination = `${gateway.replace(/\/$/, "")}?utm_source=adropofseoul&utm_medium=beauty_profile&utm_campaign=skin_profile_v1`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24" aria-live="polite">
      <p className="text-xs uppercase tracking-widest text-accent">
        Your Skin Profile
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
        {PROFILE_NAMES[result.profileSlug]}
      </h1>
      <p className="mt-4 text-lg text-text-muted">
        Your result reflects the balance, goals, and finish preferences you
        described today—not a diagnosis or a permanent skin type.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Your starting points</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {result.traits.map((trait) => (
            <li
              key={trait}
              className="rounded-full border border-soft-gray px-3 py-1 text-xs text-text-muted"
            >
              {trait.replace(/_/g, " ")}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <p className="text-[11px] uppercase tracking-label text-accent">
          Korean product preview
        </p>
        <h2 className="mt-2 font-serif text-2xl">A few places to start</h2>
        <p className="mt-2 text-sm text-text-muted">
          Reviewed starting points from our current catalog. Patch test new
          products and introduce them one at a time.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {recommendations.map((recommendation) => {
            const overlay = SKIN_PREVIEW_PRODUCTS_V1.find(
              (candidate) => candidate.productId === recommendation.productId
            );
            const product = overlay
              ? productBySlug.get(overlay.slug)
              : undefined;
            if (!product) return null;
            return (
              <article
                key={product.id}
                className="rounded-lg border border-soft-gray p-5"
              >
                <p className="text-[10px] uppercase tracking-label text-accent">
                  {recommendation.matchLevel} match
                </p>
                {product.brand && (
                  <p className="mt-3 text-[10px] uppercase tracking-label text-text-muted">
                    {product.brand}
                  </p>
                )}
                <h3 className="mt-1 font-serif text-lg leading-tight">
                  {product.name}
                </h3>
                <ul className="mt-4 space-y-1.5 text-sm text-text-muted">
                  {recommendation.reasonCodes.slice(0, 3).map((code) => (
                    <li key={code}>{REASON_COPY[code]}</li>
                  ))}
                </ul>
                {product.offers[0] && (
                  <a
                    href={product.offers[0].url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    onClick={() =>
                      productPreviewClicked({
                        productId: recommendation.productId,
                        matchLevel: recommendation.matchLevel,
                        destination: "oliveyoung_global",
                      })
                    }
                    className="mt-5 inline-block text-[11px] uppercase tracking-label text-accent hover:text-accent-hover"
                  >
                    View at Olive Young →
                  </a>
                )}
                {product.disclosureRequired && (
                  <p className="mt-2 text-[10px] text-text-muted">
                    Affiliate link; we may earn a commission.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-accent/30 bg-porcelain/60 p-6 text-center md:p-8">
        <p className="text-[11px] uppercase tracking-label text-accent">
          My Beauty Passport
        </p>
        <h2 className="mt-2 font-serif text-3xl">
          Take your profile with you.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">
          Continue to My Seoul Drop to keep your profile and build toward more
          product and Seoul beauty recommendations.
        </p>
        <a
          href={destination}
          onClick={() =>
            passportHandoffClicked({
              profileDomain: "skin",
              profileVersion: SKIN_PROFILE_V1.version,
              source: "skin_profile_result",
            })
          }
          className="mt-6 inline-block rounded-full border border-text bg-text px-6 py-2.5 text-xs font-medium uppercase tracking-label text-bg hover:border-accent hover:bg-accent"
        >
          Continue in My Seoul Drop ↗
        </a>
        <p className="mt-3 text-[11px] text-text-muted">
          Your result is already yours. Continuing opens the separate My Seoul
          Drop service.
        </p>
      </section>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onRetake}
          className="text-xs uppercase tracking-label text-text-muted hover:text-accent"
        >
          Retake the quiz
        </button>
      </div>
      <p className="mt-12 border-t border-soft-gray pt-6 text-xs text-text-muted/70">
        Educational guidance only. Persistent irritation, pain, or sudden
        changes may need evaluation by a qualified professional.
      </p>
    </div>
  );
}

function SkinQuizResult({
  responses,
  products,
  startedAt,
  onRetake,
}: {
  responses: Record<string, QuizResponseValue>;
  products: Product[];
  startedAt: number;
  onRetake: () => void;
}) {
  const result = useMemo(() => scoreSkinProfileV1(responses), [responses]);
  useEffect(() => {
    profileQuizCompleted({
      domain: "skin",
      quizVersion: SKIN_PROFILE_V1.version,
      durationBucket: durationBucketFromMs(Date.now() - startedAt),
    });
  }, [startedAt]);
  return result ? (
    <SkinProfileResult
      result={result}
      products={products}
      onRetake={onRetake}
    />
  ) : null;
}

function SkinQuizFinish({
  responses,
  products,
  startedAt,
  attemptId,
  savedKeys,
  onRetake,
}: {
  responses: Record<string, QuizResponseValue>;
  products: Product[];
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
    if (!attemptId) return;
    void (async () => {
      try {
        for (const [key, value] of Object.entries(responses)) {
          if (savedKeys.has(key)) continue;
          const saved = await saveQuizResponse(attemptId, key, value);
          if (!saved.ok) throw new Error(saved.error);
        }
        const completed = await completeQuizAttempt(attemptId);
        if (!completed.ok) throw new Error(completed.error);
        if (completed.firstCompletion)
          profileQuizCompleted({
            domain: "skin",
            quizVersion: SKIN_PROFILE_V1.version,
            durationBucket: completed.durationBucket ?? "unknown",
          });
        router.push(`/beauty-profile/skin/result/${completed.resultId}`);
      } catch {
        setFellBack(true);
      }
    })();
  }, [attemptId, responses, router, savedKeys]);
  if (!fellBack)
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-accent">
          Skin Profile
        </p>
        <h1 className="mt-3 font-serif text-3xl">Building your profile…</h1>
      </div>
    );
  return (
    <SkinQuizResult
      responses={responses}
      products={products}
      startedAt={startedAt}
      onRetake={onRetake}
    />
  );
}

export function SkinQuizClient({ products }: { products: Product[] }) {
  const startedAt = useRef(Date.now());
  const reported = useRef(false);
  const attemptId = useRef<string | null>(null);
  const saved = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    profileQuizStarted({
      domain: "skin",
      quizVersion: SKIN_PROFILE_V1.version,
      entrySource: "skin_quiz_page",
    });
    void startQuizAttempt("skin", "skin_quiz_page", makeNonce()).then((res) => {
      if (res.ok) attemptId.current = res.attemptId;
    });
  }, []);

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
      definition={SKIN_PROFILE_V1}
      exitHref="/beauty-profile/skin"
      onSaveResponse={onSaveResponse}
      onStepView={(stepKey, stepIndex) =>
        profileQuizStepViewed({
          domain: "skin",
          quizVersion: SKIN_PROFILE_V1.version,
          stepKey,
          stepIndex,
        })
      }
      onStepCompleted={(stepKey, stepIndex, validationErrorCount) =>
        profileQuizStepCompleted({
          domain: "skin",
          quizVersion: SKIN_PROFILE_V1.version,
          stepKey,
          stepIndex,
          validationErrorCount,
        })
      }
      renderResult={({ responses, restart }) => (
        <SkinQuizFinish
          responses={responses}
          products={products}
          startedAt={startedAt.current}
          attemptId={attemptId.current}
          savedKeys={saved.current}
          onRetake={restart}
        />
      )}
    />
  );
}
