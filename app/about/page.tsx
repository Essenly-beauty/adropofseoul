import type { Metadata } from "next";
import Image from "next/image";
import { Eyebrow } from "@/components/editorial/Eyebrow";
import { SITE_NAME } from "@/lib/site";
import { canonical } from "@/lib/seo";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_NAME} is an independent guide to the beauty, places, and everyday rituals that shape life in Seoul.`,
  alternates: { canonical: canonical("/about") },
};

const bodyCopy = "text-[15px] leading-[1.9] text-text-muted md:text-base";

const memories = [
  {
    src: "/images/about/seoul-balloon-clear.png",
    alt: "A Seoul hot-air balloon glowing in the night sky",
    className: "-rotate-[3deg] md:translate-y-5",
    imageClassName: "scale-[1.24] object-cover object-[68%_36%]",
  },
  {
    src: "/images/about/hanok-winter-original.jpeg",
    alt: "A quiet hanok courtyard in winter",
    className: "rotate-[2deg]",
    imageClassName: "object-cover object-center",
  },
  {
    src: "/images/about/korean-desserts-web.png",
    alt: "Colorful Korean rice cakes and traditional desserts on a wooden table",
    className: "-rotate-[2deg] md:translate-y-4",
    imageClassName: "object-cover object-[center_62%]",
  },
  {
    src: "/images/about/seoul-sunset-original.jpeg",
    alt: "Seoul skyline beneath a pink evening sky",
    className: "-rotate-1 md:translate-y-4",
    imageClassName: "object-cover object-[center_56%]",
  },
  {
    src: "/images/about/coffee-and-cake-web.png",
    alt: "Coffee and cakes shared at a Seoul cafe",
    className: "rotate-[2deg]",
    imageClassName: "object-cover object-center",
  },
  {
    src: "/images/about/eomuk-skewers.jpeg",
    alt: "Assorted eomuk skewers lined up at a Seoul street-food shop",
    className: "-rotate-[2deg] md:translate-y-4",
    imageClassName: "object-cover object-[center_58%]",
  },
  {
    src: "/images/about/shared-table.jpeg",
    alt: "Friends sharing makgeolli and pajeon at a wooden table",
    className: "rotate-[3deg]",
    imageClassName: "object-cover object-center",
  },
];

const tapeAngles = [
  "-rotate-[4deg]",
  "rotate-[2deg]",
  "-rotate-1",
  "rotate-[4deg]",
  "-rotate-[3deg]",
  "rotate-1",
  "-rotate-[2deg]",
];

function MemoryCollage() {
  return (
    <figure className="mx-auto mt-14 w-full max-w-[80rem] md:mt-20">
      <div className="relative pt-5 md:pt-7">
        <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-4 md:gap-6 lg:grid-cols-7 lg:gap-6">
          {memories.map((memory, index) => (
            <div
              key={memory.src}
              className={`relative aspect-[4/5] bg-[#fffdfa] p-1.5 pb-6 shadow-[0_10px_26px_rgba(49,39,30,0.14)] sm:p-2 sm:pb-8 ${memory.className}`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-[-0.55rem] z-10 h-5 w-[42%] -translate-x-1/2 bg-[#d8c19a]/65 shadow-[0_2px_5px_rgba(92,70,45,0.08)] [clip-path:polygon(3%_7%,97%_0,100%_88%,5%_100%,0_18%)] sm:h-6 ${tapeAngles[index]}`}
              />
              <div className="relative h-full w-full overflow-hidden bg-porcelain">
                <Image
                  src={memory.src}
                  alt={memory.alt}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 14vw, (min-width: 768px) 24vw, 48vw"
                  className={`${memory.imageClassName} saturate-[0.92] contrast-[0.97]`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-10 text-center font-serif text-base italic leading-relaxed text-text-muted/80 md:mt-12 md:text-lg">
        Little moments from the Seoul I love.
      </figcaption>
    </figure>
  );
}

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

      <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-32">
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
        <MemoryCollage />
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
              Rather than following every trend, we distinguish firsthand
              recommendations from researched guides and explain the basis for
              each recommendation.
            </p>
            <p>
              Articles carrying the “A Drop of Seoul Editorial” byline are
              produced under the publication&apos;s responsibility. Read our{" "}
              <Link
                href="/editorial-standards"
                className="text-accent hover:text-accent-hover"
              >
                editorial standards
              </Link>
              .
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
