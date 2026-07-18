import Link from "next/link";

export type TypeOption = { slug: string; label: string };

function Chip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-label transition-colors duration-medium ease-editorial ${
        active
          ? "border-text bg-text text-bg"
          : "border-soft-gray text-text-muted hover:border-accent hover:text-text"
      }`}
    >
      {label}
    </Link>
  );
}

function hrefWith(next: { area?: string; type?: string }): string {
  const sp = new URLSearchParams();
  if (next.area) sp.set("area", next.area);
  if (next.type) sp.set("type", next.type);
  const qs = sp.toString();
  return qs ? `/places?${qs}` : "/places";
}

// Area + type filter bar for the Places directory. Each chip preserves the
// other active dimension so filters combine.
export function PlaceFilters({
  areas,
  types,
  activeArea,
  activeType,
}: {
  areas: string[];
  types: TypeOption[];
  activeArea?: string;
  activeType?: string;
}) {
  return (
    <div className="mb-10 space-y-3">
      {types.length > 0 && (
        <nav aria-label="Filter by type" className="flex flex-wrap gap-2.5">
          <Chip
            label="All types"
            href={hrefWith({ area: activeArea })}
            active={!activeType}
          />
          {types.map((t) => (
            <Chip
              key={t.slug}
              label={t.label}
              href={hrefWith({ area: activeArea, type: t.slug })}
              active={activeType === t.slug}
            />
          ))}
        </nav>
      )}
      {areas.length > 0 && (
        <nav aria-label="Filter by area" className="flex flex-wrap gap-2.5">
          <Chip
            label="All areas"
            href={hrefWith({ type: activeType })}
            active={!activeArea}
          />
          {areas.map((area) => (
            <Chip
              key={area}
              label={area}
              href={hrefWith({ area, type: activeType })}
              active={activeArea === area}
            />
          ))}
        </nav>
      )}
    </div>
  );
}
