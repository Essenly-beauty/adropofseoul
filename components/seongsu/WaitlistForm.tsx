"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { joinWaitlist, type WaitlistState } from "@/app/actions/waitlist";

const initial: WaitlistState = { ok: false, message: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="whitespace-nowrap text-[12px] uppercase tracking-label text-text transition-colors duration-medium ease-editorial hover:text-accent disabled:opacity-60"
    >
      {pending ? "Joining…" : label}
    </button>
  );
}

// Email-capture CTA for the Aesenly Seongsu guide waitlist. A working form
// (server action) — the demand-validation signal for the guide service.
// `source` tags the signup with the post it came from.
export function WaitlistForm({
  source,
  heading,
  body,
  button = "Join the waitlist",
}: {
  source: string;
  heading: string;
  body: string;
  button?: string;
}) {
  const [state, formAction] = useFormState(joinWaitlist, initial);
  const tracked = useRef(false);

  // Basic analytics event on successful signup (no-ops if no analytics present).
  useEffect(() => {
    if (state.ok && !tracked.current) {
      tracked.current = true;
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ads:waitlist_signup", { detail: { source } })
        );
        const w = window as unknown as { dataLayer?: unknown[] };
        w.dataLayer?.push({ event: "waitlist_signup", source });
      }
    }
  }, [state.ok, source]);

  return (
    <section className="not-prose my-14 rounded-lg border border-soft-gray bg-porcelain/50 px-6 py-10 text-center md:px-10">
      <h2 className="font-serif text-3xl">{heading}</h2>
      <p className="mx-auto mt-3 max-w-xl text-text-muted">{body}</p>
      <form action={formAction} className="mx-auto mt-7 max-w-[460px]">
        <input type="hidden" name="source" value={source} />
        <div className="flex items-center gap-3 border-b border-text pb-2">
          <label htmlFor={`waitlist-email-${source}`} className="sr-only">
            Email address
          </label>
          <input
            id={`waitlist-email-${source}`}
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full bg-transparent px-0.5 py-1.5 text-[15px] outline-none placeholder:text-text-muted/60"
          />
          <SubmitButton label={button} />
        </div>
        {state.message && (
          <p
            role="status"
            className={`mt-3 text-sm ${
              state.ok ? "text-accent" : "text-red-600"
            }`}
          >
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
