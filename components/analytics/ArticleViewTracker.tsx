"use client";

import { useEffect, useRef } from "react";
import { articleViewed } from "@/lib/analytics/events";

export function ArticleViewTracker({
  slug,
  category,
}: {
  slug: string;
  category: string;
}) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    articleViewed({ articleSlug: slug, articleCategory: category });
  }, [slug, category]);
  return null;
}
