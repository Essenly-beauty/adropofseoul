import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/editorial/JsonLd";
import { breadcrumbJsonLd, canonical } from "@/lib/seo";
import { getHairProfile, HAIR_PROFILE_SLUGS } from "@/lib/haircare/profiles";

export function generateStaticParams() {
  return HAIR_PROFILE_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const profile = getHairProfile(params.slug);
  if (!profile) return { title: "Not found" };
  const title = `${profile.name} — Hair Profile`;
  return {
    title,
    description: profile.tagline,
    alternates: { canonical: canonical(`/haircare/profiles/${profile.slug}`) },
    openGraph: {
      title,
      description: profile.tagline,
      type: "article",
      url: canonical(`/haircare/profiles/${profile.slug}`),
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
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="text-accent">
              ·
            </span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HairProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const profile = getHairProfile(params.slug);
  if (!profile) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Haircare", path: "/haircare" },
          { name: "Hair Profiles", path: "/haircare" },
          { name: profile.name, path: `/haircare/profiles/${profile.slug}` },
        ])}
      />

      <Link
        href="/haircare"
        className="text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
      >
        ← Haircare
      </Link>

      <p className="mt-4 text-xs uppercase tracking-widest text-accent">
        Your Hair Profile
      </p>
      <h1 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">
        {profile.name}
      </h1>
      <p className="mt-3 text-lg text-text-muted">{profile.tagline}</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <List title="You tend to have" items={profile.traits} />
        <List title="Your care priorities" items={profile.care} />
        <List title="What to look for" items={profile.lookFor} />
        <List title="What to use carefully" items={profile.useCarefully} />
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Build your routine</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">
          {profile.routine.map((s) => (
            <li key={s.step} className="border-t border-soft-gray pt-3">
              <p className="text-[11px] uppercase tracking-label text-accent">
                {s.step}
              </p>
              <p className="mt-1 text-sm text-text-muted">{s.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-lg border border-soft-gray bg-porcelain/40 p-6">
        <h2 className="text-[11px] uppercase tracking-label text-accent">
          Read your full guide
        </h2>
        <p className="mt-2 font-serif text-xl leading-snug">
          {profile.pillarGuide}
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-text-muted">
          {profile.guides.map((g) => (
            <li key={g} className="flex gap-2">
              <span aria-hidden className="text-accent">
                →
              </span>
              {g}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-text-muted/70">
          These guides are being written — the profile is live so you can start
          with the right approach today.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/beauty-profile/hair"
          className="rounded-full border border-text px-4 py-1.5 text-xs font-medium uppercase tracking-label transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
        >
          Take the Hair Profile test →
        </Link>
        <Link
          href="/haircare"
          className="rounded-full border border-soft-gray px-4 py-1.5 text-xs font-medium uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
        >
          All hair profiles
        </Link>
      </div>
    </main>
  );
}
