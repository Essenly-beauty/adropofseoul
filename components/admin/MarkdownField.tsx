"use client";

import { useState } from "react";
import { Prose } from "@/components/editorial/Prose";

export function MarkdownField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1 grid gap-4 md:grid-cols-2">
        <textarea
          id={name}
          name={name}
          rows={16}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-md border border-soft-gray bg-white px-3 py-2 font-mono text-sm"
        />
        <div className="rounded-md border border-soft-gray bg-white px-4 py-2">
          <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">
            Preview
          </p>
          <Prose markdown={value} />
        </div>
      </div>
    </div>
  );
}
