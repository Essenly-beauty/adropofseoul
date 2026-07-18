import Link from "next/link";

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

// Generic single-dimension query-param chip filter (e.g. /ingredients?skin=oily).
// For the Places directory's combined area+type bar, see PlaceFilters.
export function TermFilter({
  basePath,
  param,
  options,
  active,
  allLabel = "All",
}: {
  basePath: string;
  param: string;
  options: { value: string; label: string }[];
  active?: string;
  allLabel?: string;
}) {
  return (
    <nav aria-label="Filter" className="mb-10 flex flex-wrap gap-2.5">
      <Chip label={allLabel} href={basePath} active={!active} />
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          href={`${basePath}?${param}=${encodeURIComponent(o.value)}`}
          active={active === o.value}
        />
      ))}
    </nav>
  );
}
