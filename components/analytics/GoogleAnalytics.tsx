"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const isValidMeasurementId = /^G-[A-Z0-9]+$/.test(measurementId ?? "");
const isProductionDeployment =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

export function isProductionAnalyticsHost(hostname: string) {
  return hostname === "adropofseoul.com";
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const initialized = useRef(false);
  const lastTrackedLocation = useRef<string>();

  const initializeAndTrackPageView = useCallback(() => {
    if (
      !isValidMeasurementId ||
      !isProductionDeployment ||
      !isProductionAnalyticsHost(window.location.hostname)
    ) {
      return;
    }

    window.dataLayer ||= [];
    window.gtag ||= function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };

    if (!initialized.current) {
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { send_page_view: false });
      initialized.current = true;
    }

    const location = `${window.location.pathname}${window.location.search}`;
    if (lastTrackedLocation.current === location) return;

    window.gtag("event", "page_view", {
      page_path: location,
      page_location: window.location.href,
      page_title: document.title,
    });
    lastTrackedLocation.current = location;
  }, []);

  useEffect(() => {
    initializeAndTrackPageView();
  }, [pathname, initializeAndTrackPageView]);

  if (!isValidMeasurementId || !measurementId || !isProductionDeployment) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onReady={initializeAndTrackPageView}
      />
    </>
  );
}
