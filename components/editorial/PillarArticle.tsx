import Link from "next/link";
import { Prose } from "@/components/editorial/Prose";
import { TonalFrame } from "@/components/editorial/TonalFrame";
import { JsonLd } from "@/components/editorial/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, canonical } from "@/lib/seo";
import { pillarToPost, resolvePillarHero } from "@/lib/articles/assets";
import type { Pillar } from "@/lib/articles/pillars";
import { ShareButtons } from "@/components/editorial/ShareButtons";
import { WaitlistForm } from "@/components/seongsu/WaitlistForm";

export function PillarArticle({ pillar }: { pillar: Pillar }) {
  const post = pillarToPost(pillar);
  const hero = resolvePillarHero(pillar);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Around Seoul", path: "/around-seoul" },
          { name: pillar.title, path: `/articles/${pillar.slug}` },
        ])}
      />

      <article>
        <p className="text-xs uppercase tracking-widest text-accent">
          {pillar.seriesLabel}
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">{pillar.title}</h1>
        <p className="mt-3 text-xl text-text-muted">{pillar.dek}</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-text-muted">By {pillar.author}</p>
          <ShareButtons
            path={`/articles/${pillar.slug}`}
            title={`${pillar.title} — A Drop of Seoul`}
            imageUrl={hero ? canonical(hero) : undefined}
            align="right"
          />
        </div>

        <figure className="mt-8">
          <TonalFrame
            src={hero}
            alt={pillar.heroAlt}
            label={pillar.areaTag}
            ratio="aspect-[16/9]"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            branded
          />
          <figcaption className="mt-2 text-center text-xs text-text-muted">
            {pillar.heroCaption}
          </figcaption>
        </figure>

        <Prose markdown={pillar.body} anchors />

        <WaitlistForm
          source={pillar.slug}
          heading={pillar.cta.heading}
          body={pillar.cta.body}
          button={pillar.cta.button}
        />

        {pillar.seriesLinks.length > 0 && (
          <nav
            aria-label="Related guides"
            className="mt-8 border-t border-soft-gray pt-5"
          >
            <ul className="space-y-2">
              {pillar.seriesLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-accent hover:text-accent-hover"
                  >
                    {link.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </article>
    </main>
  );
}
