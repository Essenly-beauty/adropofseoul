"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  subscribeToNewsletter,
  type NewsletterState,
} from "@/app/actions/newsletter";

const initial: NewsletterState = { ok: false, message: "" };

// The form ships on the cream editorial pages and on the dark photo band that
// closes the home page, so every ink color is picked per surface rather than
// inherited. `accent` clears AA on both (#B78B62 reads ~5.7:1 on brand ink).
const SURFACE = {
  light: {
    rule: "border-text",
    field: "placeholder:text-text-muted/60",
    button: "text-text hover:text-accent",
    error: "text-red-600",
  },
  dark: {
    rule: "border-white/40",
    field: "text-white placeholder:text-white/45",
    button: "text-white hover:text-accent",
    error: "text-red-300",
  },
} as const;

function SubmitButton({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`text-[12px] uppercase tracking-label transition-colors duration-medium ease-editorial disabled:opacity-60 ${className}`}
    >
      {pending ? "Subscribing…" : "Subscribe"}
    </button>
  );
}

export function NewsletterForm({
  surface = "light",
}: {
  surface?: keyof typeof SURFACE;
}) {
  const [state, formAction] = useFormState(subscribeToNewsletter, initial);
  const ink = SURFACE[surface];
  return (
    <form action={formAction} className="mx-auto mt-9 max-w-[460px]">
      <div className={`flex items-center gap-3 border-b pb-2 ${ink.rule}`}>
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className={`w-full bg-transparent px-0.5 py-1.5 text-[15px] outline-none ${ink.field}`}
        />
        <SubmitButton className={ink.button} />
      </div>
      {state.message && (
        <p
          role="status"
          className={`mt-3 text-sm ${state.ok ? "text-accent" : ink.error}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
