import Link from "next/link";
import type { BeautyProfileDomain } from "@/lib/beauty-profile/domains";

// Entry card for a Beauty Profile domain (Skin / Hair) on the hub (docs/05 §2).
// An "available" domain is a link; a "coming soon" domain is a non-interactive
// card so navigation is never broken.
export function BeautyProfileEntryCard({
  domain,
}: {
  domain: BeautyProfileDomain;
}) {
  const comingSoon = domain.status === "coming_soon";

  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl leading-snug transition-colors duration-medium ease-editorial group-hover:text-accent">
          {domain.label}
        </h3>
        {comingSoon && (
          <span className="shrink-0 rounded-full border border-soft-gray px-2.5 py-0.5 text-[10px] uppercase tracking-label text-text-muted">
            Coming soon
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-text-muted">{domain.blurb}</p>
      <p className="mt-4 text-[11px] uppercase tracking-label text-text-muted">
        {comingSoon ? "In build" : `${domain.estimatedTime} · no signup`}
      </p>
    </>
  );

  const base = "block rounded-lg border p-6 md:p-7";
  if (comingSoon) {
    return (
      <div
        aria-disabled="true"
        className={`${base} border-soft-gray bg-porcelain/30 opacity-80`}
      >
        {body}
      </div>
    );
  }
  return (
    <Link
      href={domain.href}
      className={`group ${base} border-soft-gray transition-colors duration-medium ease-editorial hover:border-accent`}
    >
      {body}
      <span className="mt-4 inline-block text-[11px] uppercase tracking-label text-accent">
        Start →
      </span>
    </Link>
  );
}
