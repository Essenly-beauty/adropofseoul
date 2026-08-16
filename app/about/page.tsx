import type { Metadata } from "next";
import Image from "next/image";
import { Eyebrow } from "@/components/editorial/Eyebrow";
import { SITE_NAME } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_NAME} is an independent guide to the beauty, places, and everyday rituals that shape life in Seoul.`,
  alternates: { canonical: canonical("/about") },
};

const bodyCopy = "text-[15px] leading-[1.9] text-text-muted md:text-base";

export default function AboutPage() {
  return (
    <main>
      <section className="mx-auto grid max-w-content items-center gap-10 px-6 pb-20 pt-14 md:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)] md:gap-16 md:pb-32 md:pt-24 lg:gap-24">
        <div className="md:pb-10">
          <Eyebrow className="mb-5">About</Eyebrow>
          <h1 className="max-w-[9ch] font-serif text-5xl leading-[0.95] tracking-[-0.035em] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            A love letter
            <br />
            <em className="font-normal text-accent">to Seoul.</em>
          </h1>
          <p className="mt-8 max-w-[34ch] text-lg leading-[1.75] text-text-muted md:mt-10 md:text-xl">
            Whenever friends from abroad came to visit, I found myself gathering
            the places I wanted to share with them.
          </p>
        </div>

        <div className="relative aspect-[3/4] overflow-hidden bg-porcelain">
          <Image
            src="/images/about/seoul-courtyard.jpeg"
            alt="People gathering beneath a large tree outside a brick building in Seoul"
            fill
            priority
            sizes="(min-width: 768px) 42vw, calc(100vw - 3rem)"
            className="object-cover object-center"
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20 md:pb-32">
        <div className="mx-auto max-w-2xl space-y-6">
          <p className={bodyCopy}>
            Not only the well-known sights, but quiet neighborhoods made for
            wandering, small spaces that invite you to stay a little longer, and
            places where you can feel the seasons and spirit of Seoul.
          </p>
          <p className={bodyCopy}>
            Watching my friends experience the city I love—and discover moments
            of their own within it—made me wish that more people could
            experience Seoul, and Korea, not simply as a list of
            recommendations, but as something they could feel, enjoy, and
            remember in their own way.
          </p>
        </div>

        <figure className="mx-auto mt-14 w-full max-w-[34rem] md:mt-20">
          <div className="relative aspect-[3/4] overflow-hidden bg-porcelain">
            <Image
              src="/images/about/shared-table.jpeg"
              alt="Two friends sharing makgeolli over a Korean pancake"
              fill
              sizes="(min-width: 768px) 34rem, calc(100vw - 3rem)"
              className="object-cover object-center"
            />
          </div>
          <figcaption className="mt-3 text-center font-serif text-sm italic text-text-muted/80">
            A little taste of Seoul, shared with a friend.
          </figcaption>
        </figure>
      </section>

      <section className="border-y border-soft-gray px-6 py-24 text-center md:py-36">
        <p className="mx-auto max-w-[27ch] font-serif text-3xl leading-[1.25] tracking-[-0.02em] sm:text-4xl md:text-5xl">
          a drop of seoul began with a simple desire:
          <br />
          <em className="font-normal text-accent">
            to share a small piece of the Seoul I love.
          </em>
        </p>
      </section>

      <section className="mx-auto grid max-w-content gap-12 px-6 py-20 md:grid-cols-2 md:gap-20 md:py-32 lg:gap-32">
        <div>
          <Eyebrow className="mb-4">Our point of view</Eyebrow>
          <h2 className="font-serif text-3xl md:text-4xl">What we share</h2>
          <div className={`mt-6 space-y-5 ${bodyCopy}`}>
            <p>
              A Drop of Seoul is an independent guide to the beauty, places, and
              everyday rituals that shape life in Seoul.
            </p>
            <p>
              From skincare and hair rituals to head spas, wellness, food, and
              neighborhoods worth exploring, everything begins with a genuine
              sense of curiosity.
            </p>
          </div>
        </div>

        <div className="md:border-l md:border-soft-gray md:pl-20 lg:pl-32">
          <Eyebrow className="mb-4">Our approach</Eyebrow>
          <h2 className="font-serif text-3xl md:text-4xl">How we choose</h2>
          <div className={`mt-6 space-y-5 ${bodyCopy}`}>
            <p>We believe the best recommendations feel personal.</p>
            <p>
              Rather than following every trend, we look for experiences with a
              distinct point of view—places and rituals we have genuinely tried,
              enjoyed, and would want to share with a friend.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-porcelain/80">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
          <Eyebrow className="mb-5">A note from the founder</Eyebrow>
          <h2 className="font-serif text-3xl leading-tight md:text-4xl">
            Seoul is best shared personally.
          </h2>
          <div className={`mx-auto mt-7 max-w-2xl space-y-5 ${bodyCopy}`}>
            <p>
              I&apos;m the person behind a drop of seoul—a curious local who
              loves discovering places worth sharing and experiencing Seoul
              through beauty, wellness, food, and everyday rituals.
            </p>
            <p>
              Think of a drop of seoul as a recommendation from a friend who
              wants you to see a little more of the city they love.
            </p>
          </div>
          <p className="mt-9 font-serif text-xl italic text-accent">
            Seoul, with love.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-14 text-center md:py-20">
        <p className="text-xs leading-6 text-text-muted/75">
          A Drop of Seoul is created by Essenly,
          <br /> a Seoul-based hair care brand guided by the philosophy of
          “Essentials Only.”
          <br /> While this is a brand-owned publication, its recommendations
          and editorial point of view remain independently considered.
        </p>
      </section>
    </main>
  );
}
