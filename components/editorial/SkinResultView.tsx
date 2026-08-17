"use client";

import { useRouter } from "next/navigation";
import type { Product } from "@/services/types";
import type { SkinProfileV1Result } from "@/lib/skincare/profile-v1";
import { SkinProfileResult } from "./SkinQuizClient";

export function SkinResultView({
  profile,
  products,
}: {
  profile: SkinProfileV1Result;
  products: Product[];
}) {
  const router = useRouter();
  return (
    <SkinProfileResult
      result={profile}
      products={products}
      onRetake={() => router.push("/beauty-profile/skin/quiz")}
    />
  );
}
