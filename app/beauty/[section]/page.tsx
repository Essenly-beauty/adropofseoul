import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import {
  DiscoveryPlaceCard,
  GuideCard,
} from "@/components/editorial/DiscoveryCards";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import {
  BEAUTY_SECTION_REDIRECTS,
  BEAUTY_SECTION_SLUGS,
  BEAUTY_SECTIONS,
  getBeautySectionBySlug,
  postMatchesBeautySection,
} from "@/lib/beauty";
import {
  getCategoryLandingBySlug,
  getGuideBySlug,
  getRelatedPlaces,
} from "@/lib/discovery";
import { canonical } from "@/lib/seo";
import { listPublishedPosts } from "@/services/posts";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return BEAUTY_SECTION_SLUGS.map((section) => ({ section }));
}

export function generateMetadata({
  params,
}: {
  params: { section: string };
}): Metadata {
  const section = getBeautySectionBySlug(params.section);
  if (!section) return { title: "Not found" };
  return {
    title: `${section.label} | Beauty`,
    description: section.description,
    alternates: { canonical: canonical(`/beauty/${section.slug}`) },
  };
}

export default async function BeautySectionPage({
  params,
}: {
  params: { section: string };
}) {
  const legacy = BEAUTY_SECTION_REDIRECTS[params.section];
  if (legacy) redirect(legacy);

  const section = getBeautySectionBySlug(params.section);
  if (!section) notFound();
  const landing = getCategoryLandingBySlug(section.slug);
  const featuredGuide = landing?.featuredGuideSlug
    ? getGuideBySlug(landing.featuredGuideSlug)
    : undefined;
  const featuredPlaces = landing
    ? getRelatedPlaces(landing.featuredPlaceSlugs)
    : [];

  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    const beautyPosts = await listPublishedPosts({
      limit: 48,
      category: "beauty",
    });
    posts = beautyPosts.filter((post) =>
      postMatchesBeautySection(post.tags, section)
    );
  } catch (err) {
    console.error(`beauty ${section.slug}: posts fetch failed`, err);
  }

  const featuredStory =
    landing?.featuredStorySlug &&
    posts.find((post) => post.slug === landing.featuredStorySlug);
  const latest = featuredStory
    ? posts.filter((post) => post.slug !== featuredStory.slug)
    : posts;

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">Beauty</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
          {section.label}
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-muted">
          {landing?.intro ?? section.description}
        </p>
      </header>

      {featuredStory && (
        <section className="mt-12">
          <SectionHeading title="Featured story" eyebrow={section.eyebrow} />
          <div className="max-w-xl">
            <ArticleCard post={featuredStory} />
          </div>
        </section>
      )}

      {featuredGuide && (
        <section className="mt-14">
          <SectionHeading title="Featured guide" eyebrow="Plan" />
          <div className="max-w-xl">
            <GuideCard guide={featuredGuide} />
          </div>
        </section>
      )}

      {featuredPlaces.length > 0 && (
        <section className="mt-14">
          <SectionHeading title="Featured places" eyebrow="Directory" />
          <div className="grid gap-8 md:grid-cols-3">
            {featuredPlaces.map((place) => (
              <DiscoveryPlaceCard key={place.slug} place={place} />
            ))}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section className="mt-14">
          <SectionHeading title="Latest articles" eyebrow="Stories" />
          <div className="grid gap-8 md:grid-cols-3">
            {latest.slice(0, 9).map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 border-t border-soft-gray pt-8">
        <SectionHeading title="Related categories" eyebrow="Keep exploring" />
        <div className="flex flex-wrap gap-3">
          {(
            landing?.related ??
            BEAUTY_SECTIONS.filter((item) => item.slug !== section.slug)
          ).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-soft-gray px-4 py-2 text-xs uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
