"use client";

import { useState } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => i.label !== "Home");

  return (
    <header className="sticky top-0 z-40 border-b border-soft-gray bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="mx-auto flex h-[66px] max-w-content items-center justify-between px-6">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          {SITE_NAME}
        </Link>
        <nav aria-label="Primary" className="hidden gap-7 md:flex">
          {items.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className="relative flex items-center gap-1 text-xs uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-medium after:ease-editorial hover:text-text hover:after:scale-x-100"
              >
                {item.label}
                {item.children && (
                  <span
                    aria-hidden
                    className="text-[8px] text-text-muted/60 transition-transform duration-medium ease-editorial group-hover:rotate-180"
                  >
                    ▾
                  </span>
                )}
              </Link>
              {item.children && (
                // Preview of sub-categories: opens on hover or keyboard focus.
                <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-4 opacity-0 transition-all duration-fast ease-editorial group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul className="min-w-[160px] rounded-md border border-soft-gray bg-bg px-1.5 py-2 shadow-sm">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-sm px-3 py-2 text-xs uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:bg-porcelain hover:text-text"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </nav>
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="text-xs uppercase tracking-label text-text-muted md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav
          aria-label="Mobile"
          className="max-h-[calc(100vh-66px)] overflow-y-auto border-t border-soft-gray px-6 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-2 font-serif text-xl transition-colors duration-medium ease-editorial hover:text-accent"
                >
                  {item.label}
                </Link>
                {item.children && (
                  // Sub-categories visible up front — no extra tap needed.
                  <ul className="mb-2 flex flex-col border-l border-soft-gray pl-4">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className="block py-1.5 text-[12px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
