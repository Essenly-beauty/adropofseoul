"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NAV_ITEMS, NAV_SECONDARY } from "@/lib/nav";
import { SITE_NAME } from "@/lib/site";
import { PlannerPreview } from "./PlannerPreview";
import { BeautyNavContent } from "./BeautyNavContent";
import styles from "./SiteHeader.module.css";

const DESCRIPTIONS: Record<string, string> = {
  "/seoul-explained/everyday-life": "The small habits that shape Korean life",
  "/seoul-explained/food-drink": "The food and rituals around the Korean table",
  "/seoul-explained/shopping": "Local finds and a little shopping know-how",
  "/seoul/places": "Cafés, shops, parks, and places to pause",
  "/seoul/neighborhoods": "Get to know the city, one neighborhood at a time",
  "/beauty/the-edit": "Stories and perspectives on Korean beauty",
  "/skincare": "Skin, routines, and everyday care",
  "/haircare": "Healthy hair starts at the scalp",
  "/ingredients": "Know what goes into your routine",
  "/skincare/picks": "Considered products and honest comparisons",
  "/beauty-profile": "Find your Skin Profile or Hair Profile",
};

const PREVIEWS: Record<string, { description: string; action: string }> = {
  "/stories": {
    description: "Every story, all in one place",
    action: "Browse all stories",
  },
  "/about": {
    description: "Meet the person behind A Drop of Seoul",
    action: "Read our story",
  },
};

function Chevron() {
  return (
    <svg
      width="11"
      height="7"
      viewBox="0 0 11 7"
      fill="none"
      aria-hidden="true"
    >
      <path d="m1 1 4.5 4.5L10 1" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10.5"
        cy="10.5"
        r="6.75"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function SiteHeader() {
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pinnedMenu = useRef<string | null>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const desktopTriggers = useRef<Record<string, HTMLButtonElement | null>>({});

  function closeAll() {
    pinnedMenu.current = null;
    setDesktopOpen(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) closeAll();
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (searchOpen) searchTrigger.current?.focus();
      else if (mobileOpen) mobileTrigger.current?.focus();
      else if (desktopOpen) desktopTriggers.current[desktopOpen]?.focus();
      closeAll();
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [desktopOpen, mobileOpen, searchOpen]);
  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const desktop = window.matchMedia("(min-width: 1200px)");
    const resized = () => {
      setMobileOpen(false);
      setDesktopOpen(null);
    };
    desktop.addEventListener("change", resized);
    return () => desktop.removeEventListener("change", resized);
  }, []);

  return (
    <header
      ref={headerRef}
      className={styles.header}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          closeAll();
      }}
    >
      <div className={styles.bar}>
        <Link
          href="/"
          aria-label={SITE_NAME}
          onClick={closeAll}
          className={styles.wordmark}
        >
          <span>A Drop of Seoul</span>
          <span className={styles.wordmarkCaption}>The city, distilled</span>
        </Link>
        <nav aria-label="Primary" className={styles.primary}>
          {NAV_ITEMS.map((item, i) => {
            const active = desktopOpen === item.href;
            return (
              <div
                className={styles.navItem}
                key={item.href}
                onMouseEnter={() => {
                  if (pinnedMenu.current !== item.href)
                    pinnedMenu.current = null;
                  setDesktopOpen(item.href);
                  setSearchOpen(false);
                }}
                onMouseLeave={(event) => {
                  if (
                    pinnedMenu.current !== item.href &&
                    !event.currentTarget.contains(document.activeElement)
                  )
                    setDesktopOpen(null);
                }}
              >
                <div className={styles.navLabel}>
                  <Link href={item.href} onClick={closeAll}>
                    {item.label}
                  </Link>
                  <button
                    ref={(el) => {
                      desktopTriggers.current[item.href] = el;
                    }}
                    type="button"
                    aria-label={`${item.label} submenu`}
                    aria-expanded={active}
                    aria-controls={`desktop-submenu-${i}`}
                    onClick={() => {
                      const close = pinnedMenu.current === item.href;
                      pinnedMenu.current = close ? null : item.href;
                      setDesktopOpen(close ? null : item.href);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setDesktopOpen(item.href);
                        requestAnimationFrame(() =>
                          document
                            .getElementById(`desktop-submenu-${i}`)
                            ?.querySelector("a")
                            ?.focus()
                        );
                      }
                    }}
                  >
                    <Chevron />
                  </button>
                </div>
                <div
                  id={`desktop-submenu-${i}`}
                  className={`${styles.dropdown} ${item.href === "/beauty" ? styles.beautyDropdown : ""}`}
                  hidden={!active}
                >
                  {item.href === "/beauty" ? (
                    <BeautyNavContent onNavigate={closeAll} />
                  ) : (
                    <ul>
                      {item.children?.map((child) => (
                        <li
                          key={child.href}
                          className={child.divider ? styles.divided : undefined}
                        >
                          <Link href={child.href} onClick={closeAll}>
                            <span className={styles.childTitle}>
                              {child.label}
                            </span>
                            <span className={styles.childDescription}>
                              {DESCRIPTIONS[child.href]}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </nav>
        <div className={styles.utilities}>
          {NAV_SECONDARY.map((item, i) => (
            <div
              key={item.href}
              className={`${styles.navItem} ${styles.secondaryItem}`}
              onMouseEnter={() => {
                if (pinnedMenu.current !== item.href) pinnedMenu.current = null;
                setDesktopOpen(item.href);
                setSearchOpen(false);
              }}
              onMouseLeave={(event) => {
                if (
                  pinnedMenu.current !== item.href &&
                  !event.currentTarget.contains(document.activeElement)
                )
                  setDesktopOpen(null);
              }}
            >
              <div className={`${styles.navLabel} ${styles.secondaryLabel}`}>
                <Link href={item.href} onClick={closeAll}>
                  {item.label}
                </Link>
                <button
                  ref={(el) => {
                    desktopTriggers.current[item.href] = el;
                  }}
                  type="button"
                  aria-label={`${item.label} preview`}
                  aria-expanded={desktopOpen === item.href}
                  aria-controls={`desktop-preview-${i}`}
                  onClick={() => {
                    const close = pinnedMenu.current === item.href;
                    pinnedMenu.current = close ? null : item.href;
                    setDesktopOpen(close ? null : item.href);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setDesktopOpen(item.href);
                      requestAnimationFrame(() =>
                        document
                          .getElementById(`desktop-preview-${i}`)
                          ?.querySelector("a")
                          ?.focus()
                      );
                    }
                  }}
                >
                  <Chevron />
                </button>
              </div>
              <div
                id={`desktop-preview-${i}`}
                hidden={desktopOpen !== item.href}
                className={`${styles.dropdown} ${styles.preview}`}
              >
                <p>{PREVIEWS[item.href].description}</p>
                <Link href={item.href} onClick={closeAll}>
                  {PREVIEWS[item.href].action} <span aria-hidden="true">⟶</span>
                </Link>
              </div>
            </div>
          ))}
          <button
            ref={searchTrigger}
            type="button"
            className={styles.iconButton}
            aria-label="Search stories"
            aria-expanded={searchOpen}
            aria-controls="site-search"
            onClick={() => {
              setSearchOpen(!searchOpen);
              setDesktopOpen(null);
              setMobileOpen(false);
            }}
          >
            <SearchIcon />
          </button>
          <span className={styles.language} aria-label="Language: English">
            EN
          </span>
          <PlannerPreview
            onNavigate={closeAll}
            onOpen={() => {
              pinnedMenu.current = null;
              setDesktopOpen(null);
              setSearchOpen(false);
            }}
          />
          <button
            ref={mobileTrigger}
            type="button"
            className={styles.menuButton}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => {
              setMobileOpen(!mobileOpen);
              setSearchOpen(false);
            }}
          >
            <span>{mobileOpen ? "Close" : "Menu"}</span>
            <span
              aria-hidden="true"
              className={mobileOpen ? styles.menuCross : styles.menuLines}
            >
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>
      {searchOpen && (
        <div id="site-search" className={styles.searchPanel}>
          <form role="search" action="/stories" className={styles.searchForm}>
            <label htmlFor="header-story-search" className="sr-only">
              Search all stories
            </label>
            <input
              ref={searchInput}
              id="header-story-search"
              name="q"
              type="search"
              placeholder="What are you curious about?"
              required
            />
            <button type="submit">
              Search <span aria-hidden="true">⟶</span>
            </button>
          </form>
          <Link href="/stories" className={styles.browseAll} onClick={closeAll}>
            Or browse all stories ⟶
          </Link>
        </div>
      )}
      {mobileOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile"
          className={styles.mobile}
        >
          <ul>
            {NAV_ITEMS.map((item, i) => (
              <li key={item.href} className={styles.mobileItem}>
                <div className={styles.mobileLabel}>
                  <Link href={item.href} onClick={closeAll}>
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    aria-label={`${item.label} topics`}
                    aria-expanded={mobileSection === item.href}
                    aria-controls={`mobile-submenu-${i}`}
                    onClick={() =>
                      setMobileSection(
                        mobileSection === item.href ? null : item.href
                      )
                    }
                  >
                    <Chevron />
                  </button>
                </div>
                {item.href === "/beauty" ? (
                  <div
                    id={`mobile-submenu-${i}`}
                    hidden={mobileSection !== item.href}
                  >
                    <BeautyNavContent onNavigate={closeAll} />
                  </div>
                ) : (
                  <ul
                    id={`mobile-submenu-${i}`}
                    hidden={mobileSection !== item.href}
                    className={styles.mobileChildren}
                  >
                    {item.children?.map((child) => (
                      <li key={child.href}>
                        <Link href={child.href} onClick={closeAll}>
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className={styles.mobileSecondary}>
            {NAV_SECONDARY.map((item, i) => (
              <div key={item.href} className={styles.mobilePreviewItem}>
                <div
                  className={`${styles.mobileLabel} ${styles.mobilePreviewLabel}`}
                >
                  <Link href={item.href} onClick={closeAll}>
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    aria-label={`${item.label} preview`}
                    aria-expanded={mobileSection === item.href}
                    aria-controls={`mobile-preview-${i}`}
                    onClick={() =>
                      setMobileSection(
                        mobileSection === item.href ? null : item.href
                      )
                    }
                  >
                    <Chevron />
                  </button>
                </div>
                <div
                  id={`mobile-preview-${i}`}
                  hidden={mobileSection !== item.href}
                  className={styles.mobilePreview}
                >
                  <p>{PREVIEWS[item.href].description}</p>
                  <Link href={item.href} onClick={closeAll}>
                    {PREVIEWS[item.href].action} →
                  </Link>
                </div>
              </div>
            ))}
            <span lang="en">English · EN</span>
          </div>
          <PlannerPreview
            mobile
            onNavigate={closeAll}
            onOpen={() => setMobileSection(null)}
          />
        </nav>
      )}
    </header>
  );
}
