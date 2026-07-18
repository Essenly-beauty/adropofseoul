import Link from "next/link";
import { BEAUTY_TABS, type BeautyTabKey } from "@/lib/taxonomy";

// Beauty section tab switcher (All / Skincare / Hair / Ingredients / Picks),
// shared chip style.
export function BeautyTabs({ active }: { active: BeautyTabKey }) {
  return (
    <nav aria-label="Beauty sections" className="mb-10 flex flex-wrap gap-2.5">
      {BEAUTY_TABS.map((tab) => {
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
