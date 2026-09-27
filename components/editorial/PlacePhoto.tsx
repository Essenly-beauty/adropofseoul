"use client";

import { useState } from "react";
import Image from "next/image";

/** The parent supplies an aspect ratio; a failed image keeps that layout. */
export function PlacePhoto({
  src,
  alt,
  sizes,
  priority = false,
  contain = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  contain?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-porcelain p-4 text-center text-sm text-text-muted">
        Photo unavailable
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={contain ? "object-contain" : "object-cover"}
      onError={() => setFailed(true)}
    />
  );
}
