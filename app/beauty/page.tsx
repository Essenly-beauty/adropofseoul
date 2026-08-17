import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { BeautyProfileEntryCard } from "@/components/editorial/BeautyProfileEntryCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { BEAUTY_PROFILE_DOMAINS } from "@/lib/beauty-profile/domains";
import { buildPageMetadata } from "@/lib/seo";
import { HAIRCARE_CATEGORIES, SKINCARE_CATEGORIES } from "@/lib/taxonomy";
import { listPublishedPosts } from "@/services/posts";
import type { Post } from "@/services/types";

export const metadata: Metadata = buildPageMetadata({
  title: "Beauty",
  description:
    "Explore Korean skincare, hair and scalp care, ingredients, and a private Beauty Profile that helps you know where to begin.",
  path: "/beauty",
});

export const dynamic = "force-dynamic";

const PATHS = [
  {
    eyebrow: "Skin",
    title: "Skincare",
    description:
      "Routines, ingredients, treatments, and aftercare — with skincare picks kept in their proper context.",
    href: "/skincare",
    links: [
      { label: "Ingredients", href: "/ingredients" },
      { label: "Skincare Picks", href: "/skincare/picks" },
    ],
  },
  {
    eyebrow: "Hair",
    title: "Hair & Scalp",
    description:
      "Scalp care, damage, head spas, treatments, and styling — guidance first, without a premature product shelf.",
    href: "/haircare",
    links: [],
  },
] as const;

export default async function BeautyPage() {
  let posts: Post[] = [];
  try {
    posts = await listPublishedPosts({
      limit: 6,
      categories: [...SKINCARE_CATEGORIES, ...HAIRCARE_CATEGORIES],
    });
  } catch (err) {
    console.error("beauty: posts fetch failed", err);
  }

  return (
    <main>
      <section className="mx-auto max-w-content px-6 py-16 md:py-24">
        <SectionHeading title="Beauty" eyebrow="Where to begin" />
        <p className="-mt-2 max-w-2xl text-lg text-text-muted">
          Skin, hair, and scalp belong to one conversation. Choose what you want
          to understand, or start with a profile if you are not sure yet.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {PATHS.map((path) => (
            <article
              key={path.href}
              className="rounded-lg border border-soft-gray p-6 md:p-8"
            >
              <p className="text-[11px] uppercase tracking-label text-accent">
                {path.eyebrow}
              </p>
              <h2 className="mt-2 font-serif text-3xl">{path.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                {path.description}
              </p>
              <Link
                href={path.href}
                className="mt-6 inline-block text-[11px] uppercase tracking-label text-accent hover:text-accent-hover"
              >
                Explore {path.title} →
              </Link>
              {path.links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-soft-gray pt-4">
                  {path.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xs text-text-muted underline decoration-soft-gray underline-offset-4 hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="bg-porcelain/60">
        <div className="mx-auto max-w-content px-6 py-14 md:py-20">
          <SectionHeading title="Beauty Profile" eyebrow="Personalize" />
          <p className="-mt-2 mb-8 max-w-2xl text-text-muted">
            Not sure which advice applies to you? Choose skin or hair for a
            short, private profile. No signup is required to see your result.
          </p>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            {BEAUTY_PROFILE_DOMAINS.map((domain) => (
              <BeautyProfileEntryCard key={domain.slug} domain={domain} />
            ))}
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="mx-auto max-w-content px-6 py-14 md:py-20">
          <SectionHeading
            title="Latest in Beauty"
            eyebrow="From the journal"
            href="/stories?filter=beauty"
          />
          <div className="grid gap-8 md:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
