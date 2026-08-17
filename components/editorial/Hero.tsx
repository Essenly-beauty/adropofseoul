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
      <div className="mx-auto mt-9 grid max-w-2xl overflow-hidden rounded-lg border border-soft-gray text-left sm:grid-cols-2">
        <div className="p-5 sm:p-6">
          <p className="text-[9px] uppercase tracking-label text-accent">
            Discover
          </p>
          <h2 className="mt-2 font-serif text-xl">A Drop of Seoul</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Guides and practical information to help you decide what to try,
            buy, and experience.
          </p>
        </div>
        <div className="border-t border-soft-gray bg-porcelain/50 p-5 sm:border-l sm:border-t-0 sm:p-6">
          <p className="text-[9px] uppercase tracking-label text-accent">
            Plan &amp; save
          </p>
          <h2 className="mt-2 font-serif text-xl">My Seoul Drop</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Your personal space to save those finds and turn them into your own
            Seoul plan.
          </p>
        </div>
      </div>
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
