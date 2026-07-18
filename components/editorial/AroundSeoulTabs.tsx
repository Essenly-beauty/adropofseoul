import Link from "next/link";

const TABS = [
  { key: "neighborhoods", label: "By neighborhood", href: "/around-seoul" },
  { key: "common", label: "Common", href: "/around-seoul/common" },
] as const;

// 지역별 / Common switcher for the Around Seoul section (shared chip style).
export function AroundSeoulTabs({
  active,
}: {
  active: "neighborhoods" | "common";
}) {
  return (
    <nav
      aria-label="Around Seoul sections"
      className="mb-10 flex flex-wrap gap-2.5"
    >
      {TABS.map((tab) => {
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
