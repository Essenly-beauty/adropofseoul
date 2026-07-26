import Link from "next/link";

export type SectionTab = { key: string; label: string; href: string };

// Shared chip-style tab switcher used across section landings (Skincare tabs,
// neighborhood tabs, etc.).
export function SectionTabs({
  label,
  tabs,
  active,
}: {
  label: string;
  tabs: readonly SectionTab[];
  active: string;
}) {
  return (
    <nav aria-label={label} className="mb-10 flex flex-wrap gap-2.5">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-label transition-colors duration-medium ease-editorial ${
              isActive
                ? "border-text bg-text text-bg"
                : "border-soft-gray text-text-muted hover:border-accent hover:text-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
