import type { Metadata } from "next";
import { SITE_NAME, TAGLINE } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE_NAME}.`,
  alternates: { canonical: canonical("/about") },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">About</h1>
      <p className="mt-4 text-lg text-text-muted">{TAGLINE}</p>
      <p className="mt-6">
        {SITE_NAME} is an English-language guide to Korean beauty, haircare,
        head spas, salons, and the Seoul places worth knowing — written for a
        global audience discovering Korean rituals and craft.
      </p>
    </main>
  );
}
