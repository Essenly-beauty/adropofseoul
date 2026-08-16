"use client";

import Link from "next/link";
import { categoryClicked } from "@/lib/analytics/events";

export function Breadcrumbs({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-xs text-text-muted">
      <ol className="flex min-w-0 items-center gap-2">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={item.path} className="flex min-w-0 items-center gap-2">
              {index > 0 && <span aria-hidden>/</span>}
              {current ? (
                <span aria-current="page" className="truncate">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="whitespace-nowrap hover:text-accent"
                  onClick={() =>
                    index > 0 &&
                    categoryClicked({ category: item.name, path: item.path })
                  }
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
