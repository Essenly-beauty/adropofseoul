"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { registerAnalyticsProvider } from "@/lib/analytics";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const isValidMeasurementId = /^G-[A-Z0-9]+$/.test(measurementId ?? "");

// next/script executes this in the page's main world. Keeping the queue
// bootstrap independent from React and the external gtag download prevents
// ad blockers, slow networks, or hydration timing from leaving `gtag` absent.
const GTAG_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
`;

export function isProductionAnalyticsHost(hostname: string) {
  return hostname === "adropofseoul.com";
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function ensureGtag(target: Window): NonNullable<Window["gtag"]> {
  target.dataLayer ||= [];
  target.gtag ||= function gtag(...args: unknown[]) {
    target.dataLayer.push(args);
  };
  return target.gtag;
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const initialized = useRef(false);
  const lastTrackedLocation = useRef<string>();

  const initializeAndTrackPageView = useCallback(() => {
    if (
      !isValidMeasurementId ||
      !isProductionAnalyticsHost(window.location.hostname)
    ) {
      return;
    }

    const gtag = ensureGtag(window);
    setEnabled(true);

    if (!initialized.current) {
      gtag("js", new Date());
      gtag("config", measurementId, { send_page_view: false });
      registerAnalyticsProvider({
        track(event, props) {
          gtag("event", event, props);
        },
        identify() {},
      });
      initialized.current = true;
    }

    const location = `${window.location.pathname}${window.location.search}`;
    if (lastTrackedLocation.current === location) return;

    gtag("event", "page_view", {
      page_path: location,
      page_location: window.location.href,
      page_title: document.title,
    });
    lastTrackedLocation.current = location;
  }, []);

  useEffect(() => {
    initializeAndTrackPageView();
  }, [pathname, initializeAndTrackPageView]);

  if (!isValidMeasurementId || !measurementId || !enabled) {
    return null;
  }

  return (
    <>
      <Script id="ga4-bootstrap" strategy="afterInteractive">
        {GTAG_BOOTSTRAP}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
    </>
  );
}
