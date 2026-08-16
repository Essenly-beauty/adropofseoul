import type { Metadata } from "next";
import { HairQuizClient } from "@/components/editorial/HairQuizClient";

// The public Hair Profile quiz (WS-06). Client-only: answers are scored in the
// browser and nothing is stored, so there is no flag to gate and no personal
// data in the URL. noindex — the quiz itself is not a landing page; the six
// profile guides under /haircare/profiles are.
//
// The server-backed, anonymously-persisted variant lives at ./start and
// ./[attempt] and stays behind the hair_profile flag until its v1 seed lands.
export const metadata: Metadata = {
  title: "Hair Profile quiz",
  robots: { index: false, follow: false },
};

export default function HairQuizPage() {
  return (
    <main>
      <HairQuizClient />
    </main>
  );
}
