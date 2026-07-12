import Link from "next/link";
import { Eyebrow } from "./Eyebrow";

export function Hero() {
  return (
    <section className="mx-auto max-w-content px-6 py-24 text-center md:py-36">
      <Eyebrow className="mb-7">The Korean Beauty Edit</Eyebrow>
      <h1 className="mx-auto max-w-[15ch] text-balance font-serif text-5xl leading-[1.02] tracking-tight md:text-7xl">
        Discover the beauty of Seoul.
      </h1>
      <p className="mx-auto mt-8 max-w-[46ch] text-lg leading-relaxed text-text-muted">
        A curated guide to Korean beauty, hair rituals, head spas, and places
        actually worth your time.
      </p>
      <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/places"
          className="rounded-full border border-text px-7 py-3.5 text-[12.5px] uppercase tracking-label transition-colors duration-medium ease-editorial hover:bg-text hover:text-bg"
        >
          Find Beauty Spots
        </Link>
        <Link
          href="/beauty"
          className="border-b border-transparent pb-1 text-[12.5px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-text"
        >
          Explore Korean Beauty →
        </Link>
      </div>
      <p className="mt-16 text-[11px] uppercase tracking-label text-text-muted/60">
        Scroll ↓
      </p>
    </section>
  );
}
