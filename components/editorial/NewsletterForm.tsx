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
      className="text-[12px] uppercase tracking-label text-text transition-colors duration-medium ease-editorial hover:text-accent disabled:opacity-60"
    >
      {pending ? "Subscribing…" : "Subscribe"}
    </button>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useFormState(subscribeToNewsletter, initial);
  return (
    <form action={formAction} className="mx-auto mt-9 max-w-[460px]">
      <div className="flex items-center gap-3 border-b border-text pb-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full bg-transparent px-0.5 py-1.5 text-[15px] outline-none placeholder:text-text-muted/60"
        />
        <SubmitButton />
      </div>
      {state.message && (
        <p
          role="status"
          className={`mt-3 text-sm ${state.ok ? "text-accent" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
