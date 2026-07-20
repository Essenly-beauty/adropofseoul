"use client";

import { useMemo, useState } from "react";
import type { Place } from "@/lib/discovery";
import { DiscoveryPlaceCard } from "./DiscoveryCards";

const ALL = "All";

export function PlacesDirectory({ places }: { places: Place[] }) {
  const [selected, setSelected] = useState<string>(ALL);

  const neighborhoods = useMemo(() => {
    const seen: string[] = [];
    for (const place of places) {
      if (!seen.includes(place.neighborhood)) seen.push(place.neighborhood);
    }
    return seen;
  }, [places]);

  const visible =
    selected === ALL
      ? places
      : places.filter((place) => place.neighborhood === selected);

  const chips = [ALL, ...neighborhoods];

  return (
    <div>
      <nav aria-label="Neighborhood filters" className="flex flex-wrap gap-3">
        {chips.map((chip) => {
          const active = chip === selected;
          return (
            <button
              key={chip}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(chip)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-label transition-colors duration-medium ease-editorial ${
                active
                  ? "border-accent text-accent"
                  : "border-soft-gray text-text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {chip}
            </button>
          );
        })}
      </nav>

      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {visible.map((place) => (
          <DiscoveryPlaceCard key={place.slug} place={place} />
        ))}
      </div>
    </div>
  );
}
