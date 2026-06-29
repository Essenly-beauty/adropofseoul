import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-soft-gray bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60 sticky top-0 z-40">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          {SITE_NAME}
        </Link>
        <nav aria-label="Primary" className="hidden gap-6 md:flex">
          {NAV_ITEMS.filter((i) => i.label !== "Home").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
