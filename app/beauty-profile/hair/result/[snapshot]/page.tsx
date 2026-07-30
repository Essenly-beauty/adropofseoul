import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileSnapshot } from "@/app/actions/profile";
import { getHairProfile } from "@/lib/haircare/profiles";
import { HairResultView } from "@/components/editorial/HairResultView";

// The durable Hair Profile result. Ownership is proven from the anon cookie, so
// the id in the URL is not a capability — a snapshot someone else owns 404s and
// does not reveal that it exists. noindex: results are personal, not landings.
export const metadata: Metadata = {
  title: "Your Hair Profile",
  robots: { index: false, follow: false },
};

export default async function HairResultPage({
  params,
}: {
  params: { snapshot: string };
}) {
  const res = await getProfileSnapshot(params.snapshot);
  if (!res.ok) notFound();

  return (
    <main>
      <HairResultView
        profile={
          res.profileSlug ? (getHairProfile(res.profileSlug) ?? null) : null
        }
        explanation={res.explanation}
        retakeHref="/beauty-profile/hair/quiz"
      />
    </main>
  );
}
