import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { SITE_NAME, TAGLINE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-soft-gray">
      <div className="mx-auto max-w-content px-6 py-12">
        <p className="font-serif text-xl">{SITE_NAME}</p>
        <p className="mt-2 max-w-md text-sm text-text-muted">{TAGLINE}</p>
        <nav
          aria-label="Footer"
          className="mt-6 flex flex-wrap gap-x-6 gap-y-2"
        >
          {NAV_ITEMS.filter((i) => i.label !== "Home").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-text-muted hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 text-xs text-text-muted">
          © {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
