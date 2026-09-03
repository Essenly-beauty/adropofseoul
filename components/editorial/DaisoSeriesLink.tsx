"use client";

import Link from "next/link";
import { daisoEditRelatedClicked } from "@/lib/analytics/events";

export function DaisoSeriesLink({
  articleNumber,
  articleSlug,
}: {
  articleNumber: string;
  articleSlug: string;
}) {
  const destination = "/articles/daiso-korea-guide";
  return (
    <Link
      href={destination}
      className="mt-3 inline-block font-serif text-xl text-accent underline decoration-soft-gray underline-offset-4 transition-colors hover:text-accent-hover"
      onClick={() =>
        daisoEditRelatedClicked({
          articleNumber,
          articleSlug,
          linkDestination: destination,
          placement: "series_footer",
          series: "The Daiso Edit",
          category: "Shopping",
        })
      }
    >
      Daiso Korea: A Local’s Guide to Shopping Like a Korean
    </Link>
  );
}
