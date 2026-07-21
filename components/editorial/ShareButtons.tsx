"use client";

import { useEffect, useState } from "react";
import { SITE_URL } from "@/lib/site";
import { PRIMARY_CHANNEL_KEYS, SHARE_CHANNELS, withUtm } from "@/lib/share";

const PILL =
  "rounded-full border border-soft-gray px-3 py-1.5 text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent";

// Share pills for a detail page. Native share is detected after mount so the
// server render (no navigator) matches the first client render.
export function ShareButtons({
  path,
  title,
  imageUrl,
}: {
  path: string;
  title: string;
  imageUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const url = `${SITE_URL}${path}`;

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  const primary = SHARE_CHANNELS.filter((c) =>
    PRIMARY_CHANNEL_KEYS.includes(c.key)
  );
  const secondary = SHARE_CHANNELS.filter(
    (c) => !PRIMARY_CHANNEL_KEYS.includes(c.key)
  );

  async function copy() {
    await navigator.clipboard.writeText(withUtm(url, "copy"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function nativeShare() {
    navigator.share({ title, url: withUtm(url, "native") }).catch(() => {
      // user dismissed the share sheet — not an error
    });
  }

  const channelPill = (c: (typeof SHARE_CHANNELS)[number]) => (
    <a
      key={c.key}
      href={c.href(url, title, imageUrl)}
      target="_blank"
      rel="noopener noreferrer"
      className={PILL}
    >
      {c.label}
    </a>
  );

  return (
    <div className="mt-5">
      <p className="text-[11px] uppercase tracking-label text-text-muted">
        Share
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {canNativeShare && (
          <button type="button" className={PILL} onClick={nativeShare}>
            Share…
          </button>
        )}
        <button type="button" className={PILL} onClick={copy}>
          {copied ? "Copied ✓" : "Copy Link"}
        </button>
        {primary.map(channelPill)}
        {expanded ? (
          secondary.map(channelPill)
        ) : (
          <button
            type="button"
            className={PILL}
            onClick={() => setExpanded(true)}
          >
            More +
          </button>
        )}
      </div>
    </div>
  );
}
