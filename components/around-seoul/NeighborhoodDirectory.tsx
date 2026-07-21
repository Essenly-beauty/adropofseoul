import Link from "next/link";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import {
  groupPlacesBySection,
  placeTypeSlug,
  type Neighborhood,
} from "@/lib/taxonomy";
import type { Place } from "@/services/types";

// Purpose-first directory for a neighborhood hub: published places grouped
// into the neighborhood's configured sections, in editorial order. Renders
// nothing when the neighborhood has no section config or no places matched.
export function NeighborhoodDirectory({
  neighborhood,
  places,
}: {
  neighborhood: Neighborhood;
  places: Place[];
}) {
  const sections = neighborhood.sections ?? [];
  if (sections.length === 0 || places.length === 0) return null;
  const groups = groupPlacesBySection(places, sections);
  if (groups.length === 0) return null;
  return (
    <div className="mt-16 space-y-14">
      {groups.map(({ section, places: grouped }) => {
        const filter =
          section.categories.length === 1
            ? `/places?area=${encodeURIComponent(neighborhood.label)}&type=${placeTypeSlug(section.categories[0])}`
            : `/places?area=${encodeURIComponent(neighborhood.label)}`;
        return (
          <section key={section.title}>
            <h2 className="font-serif text-2xl md:text-3xl">{section.title}</h2>
            {section.blurb && (
              <p className="mt-1.5 max-w-2xl text-text-muted">
                {section.blurb}
              </p>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.map((pl) => (
                <PlaceCard key={pl.id} place={pl} />
              ))}
            </div>
            <p className="mt-4 text-sm">
              <Link
                href={filter}
                className="text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
              >
                Browse all in the directory →
              </Link>
            </p>
          </section>
        );
      })}
    </div>
  );
}
