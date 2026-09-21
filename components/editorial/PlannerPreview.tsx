"use client";

import { useEffect, useRef, useState } from "react";
import { NAV_CTA } from "@/lib/nav";
import { MySeoulDropLink } from "./MySeoulDropLink";
import styles from "./PlannerPreview.module.css";

export function PlannerPreview({
  mobile = false,
  onNavigate,
  onOpen,
}: {
  mobile?: boolean;
  onNavigate: () => void;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = `planner-preview-${mobile ? "mobile" : "desktop"}`;
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div
      ref={wrapper}
      className={`${styles.wrapper} ${mobile ? styles.mobile : styles.desktop}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (!open) onOpen();
          setOpen(!open);
        }}
      >
        <span className={styles.eyebrow}>{NAV_CTA.eyebrow}</span>
        <span>
          {NAV_CTA.label} <span aria-hidden="true">{open ? "−" : "+"}</span>
        </span>
      </button>
      {open && (
        <div id={id} className={styles.panel}>
          <p>Find Seoul places and beauty experiences to suit your interests</p>
          <MySeoulDropLink
            source={mobile ? "site_header_mobile" : "site_header"}
            onClick={onNavigate}
            ariaLabel="Explore My Seoul Drop (opens in a new tab)"
          >
            Explore My Seoul Drop <span aria-hidden="true">↗</span>
          </MySeoulDropLink>
        </div>
      )}
    </div>
  );
}
