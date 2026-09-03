"use client";

import { MySeoulDropLink } from "@/components/editorial/MySeoulDropLink";
import { mySeoulDropCtaClicked } from "@/lib/analytics/events";

export function ShoppingCta({
  articleNumber,
  articleSlug,
  series,
  category,
}: {
  articleNumber: string;
  articleSlug: string;
  series: string;
  category: string;
}) {
  return (
    <section className="not-prose mt-14 rounded-lg border border-soft-gray bg-porcelain/60 px-6 py-9 md:px-10">
      <p className="text-[11px] uppercase tracking-label text-accent">
        My Seoul Drop
      </p>
      <h2 className="mt-2 font-serif text-3xl">Going to Daiso?</h2>
      <p className="mt-3 max-w-xl text-text-muted">
        Before crossing Seoul for a famous flagship, see what’s already around
        you.
      </p>
      <MySeoulDropLink
        source="daiso_korea_guide_location_cta"
        className="mt-6 inline-flex rounded-full bg-text px-5 py-3 text-sm text-bg transition-colors hover:bg-accent"
        onClick={() =>
          mySeoulDropCtaClicked({
            articleNumber,
            articleSlug,
            linkDestination: "https://myseouldrop.app",
            placement: "article_cta",
            series,
            category,
          })
        }
      >
        Find Daiso near you → My Seoul Drop
      </MySeoulDropLink>
    </section>
  );
}
