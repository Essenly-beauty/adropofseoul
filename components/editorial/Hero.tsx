import Link from "next/link";
import { SITE_NAME, TAGLINE } from "@/lib/site";

export function Hero() {
  return (
    <section className="mx-auto max-w-content px-6 py-20 text-center">
      <h1 className="font-serif text-5xl md:text-7xl">{SITE_NAME}</h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-text-muted">{TAGLINE}</p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/articles"
          className="rounded-md bg-accent px-5 py-2.5 text-sm text-white hover:bg-accent-hover"
        >
          Explore Guides
        </Link>
        <Link
          href="/places"
          className="rounded-md border border-soft-gray px-5 py-2.5 text-sm hover:border-accent"
        >
          Explore Seoul
        </Link>
      </div>
    </section>
  );
}
