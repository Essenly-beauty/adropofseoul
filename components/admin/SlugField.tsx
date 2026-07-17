"use client";

import { useState } from "react";
import { slugify } from "@/lib/slug";
import { FormError } from "./FormError";

export function SlugField({
  sourceId,
  name = "slug",
  label = "Slug",
  defaultValue,
  error,
}: {
  sourceId: string;
  name?: string;
  label?: string;
  defaultValue?: string | null;
  error?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  function generate() {
    const el = document.getElementById(sourceId) as HTMLInputElement | null;
    if (el) setValue(slugify(el.value));
  }
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        <span className="text-red-600"> *</span>
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          className="w-full rounded-md border border-soft-gray bg-white px-3 py-2"
        />
        <button
          type="button"
          onClick={generate}
          className="shrink-0 rounded-md border border-soft-gray px-3 text-sm hover:border-accent"
        >
          Generate
        </button>
      </div>
      <FormError message={error} />
    </div>
  );
}
