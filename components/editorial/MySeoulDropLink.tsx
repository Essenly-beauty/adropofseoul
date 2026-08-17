"use client";

import type { ReactNode } from "react";
import { outboundLinkClicked } from "@/lib/analytics/events";
import { mySeoulDropUrl } from "@/lib/my-seoul-drop";

export function MySeoulDropLink({
  source,
  className,
  children,
  onClick,
  ariaLabel,
}: {
  source: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <a
      href={mySeoulDropUrl(source)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={() => {
        onClick?.();
        outboundLinkClicked({
          destinationHost: "myseouldrop.app",
          sourcePath: source,
        });
      }}
      className={className}
    >
      {children}
    </a>
  );
}
