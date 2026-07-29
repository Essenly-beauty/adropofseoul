import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizShell } from "@/components/editorial/QuizShell";
import { PLACEHOLDER_HAIR_QUIZ } from "@/lib/profile/quiz-definition";
import { isFlagEnabled } from "@/lib/profile/flags";

// Preview of the quiz framework (M2b-1). Gated behind the default-OFF
// `hair_profile` flag, so it's invisible in production until the engine is
// ready. This renders the reusable QuizShell against a PLACEHOLDER definition
// with responses held client-side — server-authoritative persistence
// (start/save/resume, a real attempt route) is M2b-2. Quiz/result routes are
// noindex (acceptance criteria).
export const metadata: Metadata = {
  title: "Hair Profile quiz (preview)",
  robots: { index: false, follow: false },
};

export default function HairQuizPreviewPage() {
  if (!isFlagEnabled("hair_profile")) notFound();
  return (
    <main>
      <QuizShell
        definition={PLACEHOLDER_HAIR_QUIZ}
        exitHref="/beauty-profile/hair"
      />
    </main>
  );
}
