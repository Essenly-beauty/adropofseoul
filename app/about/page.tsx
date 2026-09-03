import type { Metadata } from "next";
import Image from "next/image";
import { Eyebrow } from "@/components/editorial/Eyebrow";
import { SITE_NAME } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_NAME} is a Seoul-based editorial and discovery platform exploring Korean beauty, wellness, and everyday life in Seoul.`,
  alternates: { canonical: canonical("/about") },
  openGraph: {
    title: "About A Drop of Seoul | Beauty, Care & Life in Seoul",
    description:
      "Discover the products we use, the ways we care, and the places we love—shared from Seoul with a personal point of view.",
    url: canonical("/about"),
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About A Drop of Seoul | Beauty, Care & Life in Seoul",
    description:
      "Discover the products we use, the ways we care, and the places we love—shared from Seoul with a personal point of view.",
  },
};

const bodyCopy = "text-[15px] leading-[1.9] text-text-muted md:text-base";

const memories = [
  {
    src: "/images/articles/korean-skincare-brands-on-our-radar.png",
    alt: "Two women looking at skincare products in a small Seoul studio",
    className: "-rotate-[3deg] md:translate-y-5",
    imageClassName: "object-cover object-center",
  },
  {
    src: "/images/about/seoul-sunset-original.jpeg",
    alt: "Seoul buildings beneath a pink evening sky",
    className: "rotate-[2deg]",
    imageClassName: "object-cover object-[center_56%]",
  },
  {
    src: "/images/articles/korean-head-spa-first-timer-guide.png",
    alt: "A head spa practitioner massaging a client's scalp",
    className: "-rotate-[2deg] md:translate-y-4",
    imageClassName: "object-cover object-center",
  },
  {
    src: "/images/articles/seoul-holistic-beauty-shift.png",
    alt: "A woman stretching beside her bed during a quiet evening in Seoul",
    className: "-rotate-1 md:translate-y-4",
    imageClassName: "object-cover object-center",
  },
  {
    src: "/images/about/hanok-winter-original.jpeg",
    alt: "A quiet hanok courtyard in Seoul after snowfall",
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
        Little moments from the Seoul I know.
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
            <em className="font-normal text-accent">to Seoul</em>
          </h1>
          <p className="mt-8 max-w-[34ch] text-lg leading-[1.75] text-text-muted md:mt-10 md:text-xl">
            It started with questions from friends abroad—what I use, how we
            care for ourselves, and where we actually go.
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
            Their questions were rarely only about what to see. They wanted to
            know which Korean beauty products were genuinely worth trying, how
            people in Seoul cared for their skin and hair, where we went to
            recharge, and which corners of the city we returned to again and
            again.
          </p>
          <p className={bodyCopy}>
            I found myself sharing the everyday Seoul I knew: the products we
            trust, the rituals that help us feel like ourselves, and the places
            that make the city feel like home.
          </p>
          <p className={bodyCopy}>
            A Drop of Seoul grew from a desire to bring those recommendations
            together—not as a list of everything trending, but as a personal and
            considered view of beauty, care, and life in Seoul.
          </p>
        </div>
        <MemoryCollage />
      </section>

      <section className="border-y border-soft-gray px-6 py-24 text-center md:py-36">
        <p className="mx-auto max-w-[27ch] font-serif text-3xl leading-[1.25] tracking-[-0.02em] sm:text-4xl md:text-5xl">
          A Drop of Seoul began with a simple desire:
          <br />
          <em className="font-normal text-accent">
            to share what we use,
            <br />
            how we care,
            <br />
            and where we go
          </em>
        </p>
      </section>

      <section className="mx-auto grid max-w-content gap-12 px-6 py-20 md:grid-cols-2 md:gap-20 md:py-32 lg:gap-32">
        <div>
          <Eyebrow className="mb-4">Our point of view</Eyebrow>
          <h2 className="font-serif text-3xl md:text-4xl">What we share</h2>
          <div className={`mt-6 space-y-5 ${bodyCopy}`}>
            <p>
              A Drop of Seoul is a Seoul-based editorial and discovery platform
              exploring the beauty, wellness, and everyday culture that shape
              life in the city.
            </p>
            <p>
              From skincare ingredients and hair rituals to head spas,
              neighborhood finds, food, and experiences, we look beyond what is
              simply trending to share what feels genuinely worth knowing.
            </p>
          </div>
        </div>

        <div className="md:border-l md:border-soft-gray md:pl-20 lg:pl-32">
          <Eyebrow className="mb-4">Our approach</Eyebrow>
          <h2 className="font-serif text-3xl md:text-4xl">How we choose</h2>
          <div className={`mt-6 space-y-5 ${bodyCopy}`}>
            <p>We believe the best recommendations feel personal.</p>
            <p>
              Rather than following every trend, we look for products, rituals,
              and places with a distinct point of view—things we have genuinely
              tried, considered, and would want to share with a friend.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-porcelain/80">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
          <Eyebrow className="mb-5">A note from the founder</Eyebrow>
          <h2 className="font-serif text-3xl leading-tight md:text-4xl">
            Seoul is best shared personally
          </h2>
          <div className={`mx-auto mt-7 max-w-2xl space-y-5 ${bodyCopy}`}>
            <p>
              I&apos;m the person behind A Drop of Seoul—a curious local
              exploring the products we use, the ways we care for ourselves, and
              the places that make everyday life in Seoul feel special.
            </p>
            <p>
              Think of A Drop of Seoul as a note from a friend: personal,
              considered, and always shared with genuine affection for the city.
            </p>
          </div>
          <p className="mt-9 font-serif text-xl italic text-accent">
            Seoul, with love.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-14 text-center md:py-20">
        <p className="text-xs leading-6 text-text-muted/75">
          A Drop of Seoul is published by Essenly Co., Ltd., a Seoul-based
          beauty and lifestyle company guided by a simple idea: Essentials Only.
          <br />
          <br /> Our stories and recommendations are shaped by thoughtful
          research, personal experience, and genuine curiosity.
        </p>
      </section>
    </main>
  );
}
