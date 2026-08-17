import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/editorial/JsonLd";
import { breadcrumbJsonLd, canonical } from "@/lib/seo";
import {
  getSkinGuideProfile,
  SKIN_GUIDE_PROFILE_SLUGS,
} from "@/lib/skincare/profiles";

export function generateStaticParams() {
  return SKIN_GUIDE_PROFILE_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const profile = getSkinGuideProfile(params.slug);
  if (!profile) return { title: "Not found" };
  const title = `${profile.name} — Skin Profile`;
  const url = `/skincare/profiles/${profile.slug}`;
  return {
    title,
    description: profile.tagline,
    alternates: { canonical: canonical(url) },
    openGraph: {
      title,
      description: profile.tagline,
      type: "article",
      url: canonical(url),
    },
  };
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-[11px] uppercase tracking-label text-accent">
        {title}
      </h2>
      <ul className="mt-3 space-y-1.5 text-sm text-text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="text-accent">
              ·
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SkinGuideProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const profile = getSkinGuideProfile(params.slug);
  if (!profile) notFound();
  const path = `/skincare/profiles/${profile.slug}`;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Skincare", path: "/skincare" },
          { name: "Skin Profiles", path: "/beauty-profile/skin" },
          { name: profile.name, path },
        ])}
      />
      <Link
        href="/beauty-profile/skin"
        className="text-[11px] uppercase tracking-label text-text-muted hover:text-accent"
      >
        ← Skin Profile
      </Link>
      <p className="mt-4 text-xs uppercase tracking-widest text-accent">
        Skin Profile Guide
      </p>
      <h1 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">
        {profile.name}
      </h1>
      <p className="mt-3 text-lg text-text-muted">{profile.tagline}</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <List title="Starting points" items={profile.startingPoints} />
        <List title="What to look for" items={profile.lookFor} />
        <List title="What to use carefully" items={profile.useCarefully} />
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Build your routine</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">
          {profile.routine.map((step) => (
            <li key={step.step} className="border-t border-soft-gray pt-3">
              <p className="text-[11px] uppercase tracking-label text-accent">
                {step.step}
              </p>
              <p className="mt-1 text-sm text-text-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/beauty-profile/skin/quiz"
          className="rounded-full border border-text bg-text px-5 py-2 text-xs font-medium uppercase tracking-label text-bg hover:border-accent hover:bg-accent"
        >
          Find my Skin Profile →
        </Link>
        <Link
          href="/skincare"
          className="rounded-full border border-soft-gray px-5 py-2 text-xs font-medium uppercase tracking-label text-text-muted hover:border-accent hover:text-accent"
        >
          Explore skincare
        </Link>
      </div>
      <p className="mt-12 border-t border-soft-gray pt-6 text-xs text-text-muted/70">
        Educational guidance only. A profile describes self-observed tendencies
        and is not a medical diagnosis.
      </p>
    </main>
  );
}
