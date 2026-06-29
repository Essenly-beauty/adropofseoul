"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  subscribeToNewsletter,
  type NewsletterState,
} from "@/app/actions/newsletter";

const initial: NewsletterState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-5 py-2.5 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Subscribing…" : "Subscribe"}
    </button>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useFormState(subscribeToNewsletter, initial);
  return (
    <form action={formAction} className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-md border border-soft-gray bg-white px-3 py-2.5 sm:max-w-xs"
        />
        <SubmitButton />
      </div>
      {state.message && (
        <p
          role="status"
          className={`mt-2 text-sm ${state.ok ? "text-accent" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
