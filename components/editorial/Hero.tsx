import Link from "next/link";
import { HERO_KICKER, HERO_LEDE } from "@/lib/site";
import { Eyebrow } from "./Eyebrow";
import { MySeoulDropLink } from "./MySeoulDropLink";

export function Hero() {
  return (
    <section className="mx-auto max-w-content px-6 py-24 text-center md:py-36">
      <Eyebrow className="mb-7">{HERO_KICKER}</Eyebrow>
      <h1 className="mx-auto max-w-[15ch] text-balance font-serif text-5xl leading-[1.02] tracking-tight md:text-7xl">
        The city, distilled — <em className="italic text-accent">a drop</em> of
        Seoul at a time.
      </h1>
      <p className="mx-auto mt-8 max-w-[46ch] text-lg leading-relaxed text-text-muted">
        {HERO_LEDE}
      </p>
      <p className="mx-auto mt-10 max-w-[46ch] text-sm leading-relaxed text-text-muted">
        Save the places, products, and ideas you want to remember in one
        personal Seoul list.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <MySeoulDropLink
          source="home_hero"
          className="rounded-full border border-text bg-text px-7 py-3.5 text-[12px] font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent"
        >
          Start My Seoul Drop ↗
        </MySeoulDropLink>
        <Link
          href="/beauty-profile"
          className="rounded-full border border-text px-7 py-3.5 text-[12px] font-medium uppercase tracking-label text-text transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
        >
          Find My Beauty Profile →
        </Link>
      </div>
      <nav
        aria-label="Explore A Drop of Seoul"
        className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-label text-text-muted"
      >
        <Link
          href="/stories"
          className="border-b border-transparent pb-1 transition-colors duration-medium ease-editorial hover:border-accent hover:text-text"
        >
          Read Korean beauty guides →
        </Link>
        <Link
          href="/seoul/places"
          className="border-b border-transparent pb-1 transition-colors duration-medium ease-editorial hover:border-accent hover:text-text"
        >
          Browse vetted Seoul places →
        </Link>
      </nav>
      <p className="mt-14 text-[11px] uppercase tracking-label text-text-muted/60">
        Scroll ↓
      </p>
    </section>
  );
}
