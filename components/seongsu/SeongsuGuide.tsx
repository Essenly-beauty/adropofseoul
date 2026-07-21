import Link from "next/link";
import { Prose } from "@/components/editorial/Prose";
import { TonalFrame } from "@/components/editorial/TonalFrame";
import { JsonLd } from "@/components/editorial/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, canonical } from "@/lib/seo";
import { ShareButtons } from "@/components/editorial/ShareButtons";
import {
  getCourse,
  COURSE_1_ALTERNATES,
  DEEP_LOCAL_DETOURS,
} from "@/lib/seongsu/courses";
import { guideToPost, resolveHeroImage } from "@/lib/seongsu/assets";
import type { Guide } from "@/lib/seongsu/guides";
import { SeongsuMap } from "./SeongsuMap";
import { StopSection } from "./StopSection";
import { WaitlistForm } from "./WaitlistForm";

export function SeongsuGuide({ guide }: { guide: Guide }) {
  const course = getCourse(guide.courseId);
  const post = guideToPost(guide);
  const hero = resolveHeroImage(guide);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Stories", path: "/articles" },
          { name: guide.title, path: `/articles/${guide.slug}` },
        ])}
      />

      <article>
        <p className="text-xs uppercase tracking-widest text-accent">
          Seongsu series · Ep. {guide.episode}
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">{guide.title}</h1>
        <p className="mt-3 text-xl text-text-muted">{guide.subtitle}</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-text-muted">By {guide.author}</p>
          <ShareButtons
            path={`/articles/${guide.slug}`}
            title={`${guide.title} — A Drop of Seoul`}
            imageUrl={hero ? canonical(hero) : undefined}
            align="right"
          />
        </div>

        <figure className="mt-8">
          <TonalFrame
            src={hero}
            alt={guide.heroAlt}
            label="Seongsu · Seoul"
            ratio="aspect-[16/9]"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            branded
          />
          <figcaption className="mt-2 text-center text-xs text-text-muted">
            {guide.heroCaption}
          </figcaption>
        </figure>

        <Prose markdown={guide.intro} />

        <SeongsuMap course={guide.courseId} />

        <Prose markdown={guide.walk} />

        <StopSection
          eyebrow={`Course ${guide.courseId} · ${course.walk}`}
          title="The stops"
          stops={course.stops}
        />

        {guide.linkUp && <Prose markdown={guide.linkUp} />}

        {guide.showAlternates && (
          <StopSection
            title="More eats in the core"
            intro="Swap these into the walk when a line is too long or a craving strikes — all in the same Yeonmujang-gil cluster."
            stops={COURSE_1_ALTERNATES}
          />
        )}

        {guide.showDetours && (
          <StopSection
            title="Deep-local detours"
            intro="These don't sit in the walkable cluster — worth it if you're already near Ttukdo Market or Seoul Forest."
            stops={DEEP_LOCAL_DETOURS}
          />
        )}

        <Prose markdown={guide.knowBeforeYouGo} />

        <WaitlistForm
          source={guide.slug}
          heading={guide.cta.heading}
          body={guide.cta.body}
          button={guide.cta.button}
        />

        <p className="mt-8">
          <Link
            href={guide.seriesNav.href}
            className="text-accent hover:text-accent-hover"
          >
            {guide.seriesNav.label} →
          </Link>
        </p>

        <p className="mt-10 border-t border-soft-gray pt-4 text-xs text-text-muted">
          {guide.footnote}
        </p>
      </article>
    </main>
  );
}
