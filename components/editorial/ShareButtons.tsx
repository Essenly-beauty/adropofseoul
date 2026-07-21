"use client";

import { useEffect, useRef, useState } from "react";
import { SITE_URL } from "@/lib/site";
import { SHARE_CHANNELS, withUtm } from "@/lib/share";
import { ChannelIcon, CopyLinkIcon, NativeShareIcon } from "./ShareIcons";

const PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-soft-gray px-3 py-1.5 text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent";

const ITEM =
  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:bg-porcelain hover:text-text";

// Single Share trigger that opens a channel menu. Native share is detected
// after mount so the server render (no navigator) matches the first client
// render.
export function ShareButtons({
  path,
  title,
  imageUrl,
}: {
  path: string;
  title: string;
  imageUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const url = `${SITE_URL}${path}`;

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(withUtm(url, "copy"));
    } catch {
      // clipboard denied or unavailable (non-secure context) — no-op
      return;
    }
    setCopied(true);
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  function nativeShare() {
    setOpen(false);
    navigator.share({ title, url: withUtm(url, "native") }).catch(() => {
      // user dismissed the share sheet — not an error
    });
  }

  return (
    <div ref={rootRef} className="relative mt-5 inline-block">
      <button
        type="button"
        className={PILL}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <NativeShareIcon />
        Share
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-10 mt-2 w-44 rounded-lg border border-soft-gray bg-bg p-1.5 shadow-sm"
        >
          {canNativeShare && (
            <button
              type="button"
              role="menuitem"
              className={ITEM}
              onClick={nativeShare}
            >
              <NativeShareIcon />
              Share via…
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className={ITEM}
            aria-live="polite"
            onClick={copy}
          >
            <CopyLinkIcon />
            {copied ? "Copied ✓" : "Copy Link"}
          </button>
          {SHARE_CHANNELS.map((c) => (
            <a
              key={c.key}
              role="menuitem"
              href={c.href(url, title, imageUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className={ITEM}
              onClick={() => setOpen(false)}
            >
              <ChannelIcon channel={c.key} />
              {c.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
