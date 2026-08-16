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

export type KindOption = { value: string; label: string };

// One filter axis: a label column naming the axis, then its chips. The label
// doubles as the nav's accessible name, and `divide-y` on the parent draws the
// hairline that separates one axis from the next.
function FilterRow({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[5.5rem_1fr] sm:gap-x-5">
      <span
        id={id}
        className="text-[11px] font-medium uppercase tracking-label text-text-muted sm:pt-2.5"
      >
        {label}
      </span>
      <nav aria-labelledby={id} className="flex flex-wrap gap-2.5">
        {children}
      </nav>
    </div>
  );
}

function hrefWith(next: {
  area?: string;
  type?: string;
  kind?: string;
}): string {
  const sp = new URLSearchParams();
  if (next.kind) sp.set("kind", next.kind);
  if (next.area) sp.set("area", next.area);
  if (next.type) sp.set("type", next.type);
  const qs = sp.toString();
  return qs ? `/seoul/places?${qs}` : "/seoul/places";
}

// Kind + type + area filter bar for the Places directory. One labelled row per
// axis, hairline-separated, so the three dimensions read as distinct rather
// than as one long run of chips. Each chip preserves the other active
// dimensions so filters combine.
export function PlaceFilters({
  kinds = [],
  areas,
  types,
  activeKind,
  activeArea,
  activeType,
}: {
  kinds?: KindOption[];
  areas: string[];
  types: TypeOption[];
  activeKind?: string;
  activeArea?: string;
  activeType?: string;
}) {
  return (
    <div className="mb-10 divide-y divide-soft-gray">
      {kinds.length > 0 && (
        <FilterRow id="place-filter-show" label="Show">
          <Chip
            label="All"
            href={hrefWith({ area: activeArea, type: activeType })}
            active={!activeKind}
          />
          {kinds.map((k) => (
            <Chip
              key={k.value}
              label={k.label}
              href={hrefWith({
                kind: k.value,
                area: activeArea,
                type: activeType,
              })}
              active={activeKind === k.value}
            />
          ))}
        </FilterRow>
      )}
      {types.length > 0 && (
        <FilterRow id="place-filter-type" label="Type">
          <Chip
            label="All"
            href={hrefWith({ kind: activeKind, area: activeArea })}
            active={!activeType}
          />
          {types.map((t) => (
            <Chip
              key={t.slug}
              label={t.label}
              href={hrefWith({
                kind: activeKind,
                area: activeArea,
                type: t.slug,
              })}
              active={activeType === t.slug}
            />
          ))}
        </FilterRow>
      )}
      {areas.length > 0 && (
        <FilterRow id="place-filter-area" label="Area">
          <Chip
            label="All"
            href={hrefWith({ kind: activeKind, type: activeType })}
            active={!activeArea}
          />
          {areas.map((area) => (
            <Chip
              key={area}
              label={area}
              href={hrefWith({ kind: activeKind, area, type: activeType })}
              active={activeArea === area}
            />
          ))}
        </FilterRow>
      )}
    </div>
  );
}
