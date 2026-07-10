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

export function AreaFilter({
  areas,
  active,
}: {
  areas: string[];
  active?: string;
}) {
  return (
    <nav aria-label="Filter by area" className="mb-10 flex flex-wrap gap-2.5">
      <Chip label="All" href="/places" active={!active} />
      {areas.map((area) => (
        <Chip
          key={area}
          label={area}
          href={`/places?area=${encodeURIComponent(area)}`}
          active={active === area}
        />
      ))}
    </nav>
  );
}
