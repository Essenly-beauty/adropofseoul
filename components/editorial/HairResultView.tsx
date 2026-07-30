"use client";

import { useRouter } from "next/navigation";
import { HairProfileResult } from "./HairProfileResult";
import type { HairProfile } from "@/lib/haircare/profiles";
import type { HairResultExplanation } from "@/lib/haircare/explain";

// Server components can't hand a function to a client component, so the durable
// result route wraps the presentational screen and turns Retake into navigation.

export function HairResultView({
  profile,
  explanation,
  retakeHref,
}: {
  profile: HairProfile | null;
  explanation: HairResultExplanation;
  retakeHref: string;
}) {
  const router = useRouter();
  return (
    <HairProfileResult
      profile={profile}
      explanation={explanation}
      onRetake={() => router.push(retakeHref)}
    />
  );
}
