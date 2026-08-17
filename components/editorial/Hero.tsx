import Link from "next/link";
import { HERO_KICKER, HERO_LEDE } from "@/lib/site";
import { Eyebrow } from "./Eyebrow";

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
      <p className="mx-auto mt-7 max-w-[54ch] text-sm leading-relaxed text-text-muted">
        <span className="text-text">
          A Drop of Seoul is the editorial guide.
        </span>{" "}
        My Seoul Drop is the personal planner for saving what you find and
        building your trip.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#explore"
          className="rounded-full border border-text bg-text px-7 py-3.5 text-[12px] font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent"
        >
          Explore Seoul &amp; Beauty ↓
        </a>
        <Link
          href="/beauty-profile"
          className="rounded-full border border-text px-7 py-3.5 text-[12px] font-medium uppercase tracking-label text-text transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
        >
          Find My Beauty Profile →
        </Link>
      </div>
      <p className="mt-14 text-[11px] uppercase tracking-label text-text-muted/60">
        Scroll ↓
      </p>
    </section>
  );
}
