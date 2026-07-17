"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-5 py-2.5 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
