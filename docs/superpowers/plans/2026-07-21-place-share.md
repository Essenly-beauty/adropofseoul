# Place Share Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add share buttons (native share, copy link, WhatsApp, Pinterest, X, Threads, Facebook, Reddit, LINE, Telegram, Email) with UTM tagging to place detail pages.

**Architecture:** Pure URL-building logic lives in `lib/share.ts` (unit-tested, no DOM). A single client component `components/editorial/ShareButtons.tsx` renders the pills: native share + copy + 3 primary channels visible, the rest behind a "More +" toggle. The server component `app/places/[slug]/page.tsx` passes `path`/`title`/`imageUrl` down. No SDKs — every channel is a plain URL scheme, so there are **no new dependencies**.

**Tech Stack:** Next.js 14 App Router, React 18 client component, Tailwind (existing editorial tokens), Vitest + Testing Library (jsdom).

## Global Constraints

- No new npm dependencies.
- UI copy in English (site is English-facing).
- Styling must reuse existing tokens/idioms: pill = `rounded-full border ... text-[11px] uppercase tracking-label`, transitions `duration-medium ease-editorial`, colors `soft-gray`/`accent`/`text-muted` (see `app/places/[slug]/page.tsx:182` and `components/editorial/TagChips.tsx`).
- Shared URLs carry `utm_source=share&utm_medium=<channel>`; the page's canonical tag already exists, so UTM params don't affect SEO.
- Absolute URLs built from `SITE_URL` in `lib/site.ts` (uses `NEXT_PUBLIC_SITE_URL`, safe in client components).
- Test commands: `npx vitest run <file>` (config: `vitest.config.ts`, jsdom, globals on, `@/` alias = repo root).
- Scope note: share UI goes on the **detail page only**. List cards are whole-card `<Link>`s (`PlaceCard.tsx`); nesting interactive share buttons inside them is deferred deliberately.

---

### Task 1: Share URL library (`lib/share.ts`)

**Files:**

- Create: `lib/share.ts`
- Test: `lib/share.test.ts`

**Interfaces:**

- Produces: `withUtm(url: string, medium: string): string` — returns `url` with `utm_source=share` and `utm_medium=<medium>` query params set.
- Produces: `SHARE_CHANNELS: ShareChannel[]` where `ShareChannel = { key: string; label: string; href: (url: string, title: string, imageUrl?: string) => string }`, ordered by priority: whatsapp, pinterest, x, threads, facebook, reddit, line, telegram, email.
- Produces: `PRIMARY_CHANNEL_KEYS: string[]` = `["whatsapp", "pinterest", "x"]`.

- [ ] **Step 1: Write the failing test**

Create `lib/share.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { withUtm, SHARE_CHANNELS, PRIMARY_CHANNEL_KEYS } from "./share";

describe("withUtm", () => {
  it("appends utm params to a bare url", () => {
    expect(withUtm("https://adropofseoul.com/places/soo", "copy")).toBe(
      "https://adropofseoul.com/places/soo?utm_source=share&utm_medium=copy"
    );
  });

  it("preserves existing query params", () => {
    const out = withUtm("https://adropofseoul.com/places?area=seongsu", "x");
    expect(out).toContain("area=seongsu");
    expect(out).toContain("utm_source=share");
    expect(out).toContain("utm_medium=x");
  });
});

describe("SHARE_CHANNELS", () => {
  const url = "https://adropofseoul.com/places/soo";
  const title = "Soo Head Spa — A Drop of Seoul";

  it("lists all 9 channels in priority order", () => {
    expect(SHARE_CHANNELS.map((c) => c.key)).toEqual([
      "whatsapp",
      "pinterest",
      "x",
      "threads",
      "facebook",
      "reddit",
      "line",
      "telegram",
      "email",
    ]);
  });

  it("every channel href carries its own utm_medium", () => {
    for (const c of SHARE_CHANNELS) {
      const href = c.href(url, title);
      expect(decodeURIComponent(href)).toContain(`utm_medium=${c.key}`);
    }
  });

  it("points each channel at the right endpoint", () => {
    const hrefs = Object.fromEntries(
      SHARE_CHANNELS.map((c) => [c.key, c.href(url, title)])
    );
    expect(hrefs.whatsapp).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(hrefs.pinterest).toMatch(
      /^https:\/\/www\.pinterest\.com\/pin\/create\/button\/\?url=/
    );
    expect(hrefs.x).toMatch(/^https:\/\/twitter\.com\/intent\/tweet\?/);
    expect(hrefs.threads).toMatch(
      /^https:\/\/www\.threads\.net\/intent\/post\?text=/
    );
    expect(hrefs.facebook).toMatch(
      /^https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?u=/
    );
    expect(hrefs.reddit).toMatch(/^https:\/\/www\.reddit\.com\/submit\?url=/);
    expect(hrefs.line).toMatch(
      /^https:\/\/social-plugins\.line\.me\/lineit\/share\?url=/
    );
    expect(hrefs.telegram).toMatch(/^https:\/\/t\.me\/share\/url\?url=/);
    expect(hrefs.email).toMatch(/^mailto:\?subject=/);
  });

  it("encodes the title into text-bearing channels", () => {
    const x = SHARE_CHANNELS.find((c) => c.key === "x")!;
    expect(x.href(url, title)).toContain(encodeURIComponent(title));
  });

  it("pinterest includes media only when imageUrl is given", () => {
    const pin = SHARE_CHANNELS.find((c) => c.key === "pinterest")!;
    expect(pin.href(url, title)).not.toContain("media=");
    expect(pin.href(url, title, "https://img.example/a.jpg")).toContain(
      `media=${encodeURIComponent("https://img.example/a.jpg")}`
    );
  });

  it("primary keys are a subset of channel keys", () => {
    const keys = SHARE_CHANNELS.map((c) => c.key);
    expect(PRIMARY_CHANNEL_KEYS).toEqual(["whatsapp", "pinterest", "x"]);
    for (const k of PRIMARY_CHANNEL_KEYS) expect(keys).toContain(k);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/share.test.ts`
Expected: FAIL — `Cannot find module './share'` (or equivalent resolution error).

- [ ] **Step 3: Write minimal implementation**

Create `lib/share.ts`:

```ts
// Share-channel URL builders. Every channel is a plain URL scheme — no SDKs.
// Each shared link carries utm_source=share&utm_medium=<channel> so GA can
// attribute inbound traffic per channel; the page's canonical tag keeps UTM
// params out of SEO.

export type ShareChannel = {
  key: string;
  label: string;
  href: (url: string, title: string, imageUrl?: string) => string;
};

export function withUtm(url: string, medium: string): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", "share");
  u.searchParams.set("utm_medium", medium);
  return u.toString();
}

const enc = encodeURIComponent;

export const SHARE_CHANNELS: ShareChannel[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    href: (url, title) =>
      `https://wa.me/?text=${enc(`${title} ${withUtm(url, "whatsapp")}`)}`,
  },
  {
    key: "pinterest",
    label: "Pinterest",
    href: (url, title, imageUrl) =>
      `https://www.pinterest.com/pin/create/button/?url=${enc(withUtm(url, "pinterest"))}&description=${enc(title)}${imageUrl ? `&media=${enc(imageUrl)}` : ""}`,
  },
  {
    key: "x",
    label: "X",
    href: (url, title) =>
      `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(withUtm(url, "x"))}`,
  },
  {
    key: "threads",
    label: "Threads",
    href: (url, title) =>
      `https://www.threads.net/intent/post?text=${enc(`${title} ${withUtm(url, "threads")}`)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    href: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${enc(withUtm(url, "facebook"))}`,
  },
  {
    key: "reddit",
    label: "Reddit",
    href: (url, title) =>
      `https://www.reddit.com/submit?url=${enc(withUtm(url, "reddit"))}&title=${enc(title)}`,
  },
  {
    key: "line",
    label: "LINE",
    href: (url) =>
      `https://social-plugins.line.me/lineit/share?url=${enc(withUtm(url, "line"))}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    href: (url, title) =>
      `https://t.me/share/url?url=${enc(withUtm(url, "telegram"))}&text=${enc(title)}`,
  },
  {
    key: "email",
    label: "Email",
    href: (url, title) =>
      `mailto:?subject=${enc(title)}&body=${enc(withUtm(url, "email"))}`,
  },
];

export const PRIMARY_CHANNEL_KEYS = ["whatsapp", "pinterest", "x"];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/share.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/share.ts lib/share.test.ts
git commit -m "feat(share): channel URL builders with UTM tagging"
```

---

### Task 2: ShareButtons client component

**Files:**

- Create: `components/editorial/ShareButtons.tsx`
- Test: `components/editorial/ShareButtons.test.tsx`

**Interfaces:**

- Consumes: `SHARE_CHANNELS`, `PRIMARY_CHANNEL_KEYS`, `withUtm` from `@/lib/share` (Task 1); `SITE_URL` from `@/lib/site`.
- Produces: `ShareButtons({ path, title, imageUrl }: { path: string; title: string; imageUrl?: string })` — client component; `path` is a site-relative path like `/places/soo`.

Behavior spec:

- Always visible: "Copy Link" button + primary channels (WhatsApp, Pinterest, X) + "More +" toggle.
- "More +" click reveals the remaining channels (Threads, Facebook, Reddit, LINE, Telegram, Email) and removes itself.
- "Copy Link" writes the UTM-tagged URL (`utm_medium=copy`) via `navigator.clipboard.writeText`, flips its label to "Copied ✓" for 2 seconds.
- A native "Share…" button appears only when `navigator.share` exists, detected in `useEffect` after mount (avoids SSR/hydration mismatch); it calls `navigator.share({ title, url })` with `utm_medium=native` and swallows user-cancel rejections.
- Channel links open in a new tab (`target="_blank" rel="noopener noreferrer"`).

- [ ] **Step 1: Write the failing test**

Create `components/editorial/ShareButtons.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShareButtons } from "./ShareButtons";

describe("ShareButtons", () => {
  it("renders copy + primary channels, hides secondary behind More", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    expect(screen.getByText("Copy Link")).toBeTruthy();
    expect(screen.getByText("WhatsApp")).toBeTruthy();
    expect(screen.getByText("Pinterest")).toBeTruthy();
    expect(screen.getByText("X")).toBeTruthy();
    expect(screen.getByText("More +")).toBeTruthy();
    expect(screen.queryByText("Reddit")).toBe(null);
    expect(screen.queryByText("LINE")).toBe(null);
  });

  it("expands More to reveal all secondary channels", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    fireEvent.click(screen.getByText("More +"));
    for (const label of [
      "Threads",
      "Facebook",
      "Reddit",
      "LINE",
      "Telegram",
      "Email",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("More +")).toBe(null);
  });

  it("channel links are absolute, UTM-tagged, and open in a new tab", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    const wa = screen.getByText("WhatsApp").closest("a")!;
    expect(wa.getAttribute("target")).toBe("_blank");
    expect(wa.getAttribute("rel")).toContain("noopener");
    const decoded = decodeURIComponent(wa.getAttribute("href")!);
    expect(decoded).toContain("/places/soo");
    expect(decoded).toContain("utm_medium=whatsapp");
  });

  it("copies a UTM-tagged link and shows Copied state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    fireEvent.click(screen.getByText("Copy Link"));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("utm_medium=copy");
    expect(await screen.findByText("Copied ✓")).toBeTruthy();
  });

  it("shows native Share button only when navigator.share exists", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    const btn = await screen.findByText("Share…");
    fireEvent.click(btn);
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Soo Head Spa",
        url: expect.stringContaining("utm_medium=native"),
      })
    );
    // @ts-expect-error cleanup test-injected global
    delete navigator.share;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/ShareButtons.test.tsx`
Expected: FAIL — `Cannot find module './ShareButtons'`.

- [ ] **Step 3: Write minimal implementation**

Create `components/editorial/ShareButtons.tsx`:

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/ShareButtons.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/ShareButtons.tsx components/editorial/ShareButtons.test.tsx
git commit -m "feat(share): ShareButtons pills with native share, copy, More toggle"
```

---

### Task 3: Wire into place detail page

**Files:**

- Modify: `app/places/[slug]/page.tsx` (import block at top; JSX after the links `<div>` that closes at line 187)

**Interfaces:**

- Consumes: `ShareButtons` from Task 2.

- [ ] **Step 1: Add the import**

In `app/places/[slug]/page.tsx`, after the existing imports (line 8):

```tsx
import { ShareButtons } from "@/components/editorial/ShareButtons";
```

- [ ] **Step 2: Render inside the article**

Immediately after the closing `</div>` of the external-links block (the `mt-5 flex flex-wrap gap-3` div, currently line 187), still inside `<article>`:

```tsx
<ShareButtons
  path={`/places/${place.slug}`}
  title={`${place.name} — A Drop of Seoul`}
  imageUrl={place.images[0]}
/>
```

- [ ] **Step 3: Run the full test suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests PASS, tsc clean.

- [ ] **Step 4: Visual check in dev server**

Run: `npm run dev` and open `http://localhost:3000/places/<any-seeded-slug>` (pick one from `/places`).
Expected: "Share" row under the link pills — Copy Link / WhatsApp / Pinterest / X / More +. Clicking "More +" reveals Threads, Facebook, Reddit, LINE, Telegram, Email. Copy Link shows "Copied ✓". (Native "Share…" appears only on browsers exposing `navigator.share` — Safari, or Chrome on a phone.)
Note: if the Supabase free-tier DB is paused, data pages 500 — resume the project in the Supabase dashboard first.

- [ ] **Step 5: Commit**

```bash
git add app/places/[slug]/page.tsx
git commit -m "feat(share): share row on place detail pages"
```
