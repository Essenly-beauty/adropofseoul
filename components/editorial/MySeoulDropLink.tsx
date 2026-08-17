"use client";

import type { ReactNode } from "react";
import { outboundLinkClicked } from "@/lib/analytics/events";
import { mySeoulDropUrl } from "@/lib/my-seoul-drop";

export function MySeoulDropLink({
  source,
  className,
  children,
}: {
  source: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={mySeoulDropUrl(source)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        outboundLinkClicked({
          destinationHost: "myseouldrop.app",
          sourcePath: source,
        })
      }
      className={className}
    >
      {children}
    </a>
  );
}
