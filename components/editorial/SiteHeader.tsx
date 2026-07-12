"use client";

import { useState } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("Beauty");
  const items = NAV_ITEMS.filter((i) => i.label !== "Home");

  return (
    <header className="sticky top-0 z-40 border-b border-soft-gray bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="mx-auto flex h-[66px] max-w-content items-center justify-between px-6">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          {SITE_NAME}
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {items.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className="relative block py-6 text-xs uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial after:absolute after:bottom-4 after:left-0 after:right-0 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-medium after:ease-editorial hover:text-text hover:after:scale-x-100 focus:text-text focus:outline-none focus-visible:after:scale-x-100"
                aria-haspopup={item.items ? "true" : undefined}
              >
                {item.label}
              </Link>
              {item.items && (
                <div className="invisible absolute left-1/2 top-full min-w-56 -translate-x-1/2 border border-soft-gray bg-bg p-3 opacity-0 shadow-sm transition duration-medium ease-editorial group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="flex flex-col">
                    {item.items.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="px-3 py-2 text-sm text-text-muted transition-colors duration-medium ease-editorial hover:text-accent focus:text-accent focus:outline-none"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
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
          className="border-t border-soft-gray px-6 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.href}>
                {item.items ? (
                  <div>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between py-2 text-left font-serif text-xl transition-colors duration-medium ease-editorial hover:text-accent"
                      aria-expanded={expanded === item.label}
                      onClick={() =>
                        setExpanded((value) =>
                          value === item.label ? null : item.label
                        )
                      }
                    >
                      <span>{item.label}</span>
                      <span aria-hidden className="text-sm">
                        {expanded === item.label ? "-" : "+"}
                      </span>
                    </button>
                    {expanded === item.label && (
                      <div className="pb-2 pl-4">
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="block py-2 text-sm uppercase tracking-label text-accent"
                        >
                          All {item.label}
                        </Link>
                        {item.items.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="block py-2 text-sm text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 font-serif text-xl transition-colors duration-medium ease-editorial hover:text-accent"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
