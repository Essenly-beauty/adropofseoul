import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/editorial/QuizRunner";
import { getQuizAttempt } from "@/app/actions/profile";
import { isFlagEnabled } from "@/lib/profile/flags";

// The server-backed Hair Profile quiz runner (M2b-2b). Resolves the owned attempt
// server-side (ownership proven from the cookie, not the URL) and hydrates the
// runner with the persisted answers so a refresh resumes without loss. Gated
// behind the default-OFF hair_profile flag; noindex (attempt URLs must not be
// crawled or indexed).
export const metadata: Metadata = {
  title: "Hair Profile quiz",
  robots: { index: false, follow: false },
};

export default async function HairQuizAttemptPage({
  params,
}: {
  params: { attempt: string };
}) {
  if (!isFlagEnabled("hair_profile")) notFound();

  const res = await getQuizAttempt(params.attempt);
  // Not owned / expired / unavailable / no service key → don't disclose; 404.
  if (!res.ok) notFound();

  return (
    <main>
      <QuizRunner
        definition={res.definition}
        attemptId={res.attemptId}
        domain="hair"
        initialResponses={res.initialResponses}
        initialStep={res.currentStep ?? 0}
        exitHref="/beauty-profile/hair"
      />
    </main>
  );
}
