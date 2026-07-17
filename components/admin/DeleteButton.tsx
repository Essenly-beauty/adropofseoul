"use client";

import { useState } from "react";

export function DeleteButton({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:underline"
      >
        Delete
      </button>
    );
  }

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <span className="text-sm text-text-muted">Sure?</span>
      <button
        type="submit"
        className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
      >
        Confirm delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-text-muted hover:underline"
      >
        Cancel
      </button>
    </form>
  );
}
