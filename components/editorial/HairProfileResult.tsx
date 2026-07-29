import Link from "next/link";
import type { HairProfile } from "@/lib/haircare/profiles";
import type { HairResultExplanation } from "@/lib/haircare/explain";

// The Hair Profile result (WS-07 §1–§7, §9). Presentational: it receives a
// scored profile and its explanation and renders them. Scoring, analytics, and
// state live in HairQuizClient.
//
// `profile === null` means the scorer found no signal — we say so instead of
// asserting an archetype the answers don't support.

const LIMITATION =
  "This result is educational and is not a medical diagnosis. Persistent itching, redness, pain, severe flaking, scalp lesions, or sudden hair loss may need professional evaluation.";

const ADVISORY =
  "Some of your answers describe symptoms that a dermatologist or trichologist should look at. A routine can support your scalp, but it can't assess what's causing this — please consider a professional evaluation.";

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-soft-gray p-5">
      <h3 className="font-serif text-lg leading-snug">{title}</h3>
      <ul className="mt-3 space-y-1.5 text-sm text-text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function RetakeButton({ onRetake }: { onRetake: () => void }) {
  return (
    <button
      type="button"
      onClick={onRetake}
      className="rounded-full border border-soft-gray px-5 py-2 text-xs font-medium uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-text"
    >
      Retake the quiz
    </button>
  );
}

export function HairProfileResult({
  profile,
  explanation,
  onRetake,
}: {
  profile: HairProfile | null;
  explanation: HairResultExplanation;
  onRetake: () => void;
}) {
  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24" aria-live="polite">
        <p className="text-xs uppercase tracking-widest text-accent">
          Hair Profile
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
          That&apos;s not enough to place you yet.
        </h1>
        <p className="mt-4 text-text-muted">
          Your answers didn&apos;t point clearly to one profile. Retake the
          quiz, or read through the six profiles and see which one sounds like
          your hair.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <RetakeButton onRetake={onRetake} />
          <Link
            href="/beauty-profile/hair"
            className="rounded-full border border-text bg-text px-5 py-2 text-xs font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent"
          >
            Browse the profiles
          </Link>
        </div>
        <p className="mt-12 border-t border-soft-gray pt-6 text-xs text-text-muted/70">
          {LIMITATION}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24" aria-live="polite">
      <p className="text-xs uppercase tracking-widest text-accent">
        Your Hair Profile
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
        {profile.name}
      </h1>
      <p className="mt-4 text-lg text-text-muted">{profile.tagline}</p>

      {explanation.tags.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {explanation.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-soft-gray px-3 py-1 text-xs text-text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {explanation.reasons.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Why this result</h2>
          <p className="mt-2 text-sm text-text-muted">
            These answers weighed most heavily:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-text-muted">
            {explanation.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Panel title="Your priorities" items={profile.care} />
        <Panel title="Look for" items={profile.lookFor} />
        <Panel title="Use carefully" items={profile.useCarefully} />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Build your routine</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">
          {profile.routine.map((s) => (
            <li key={s.step} className="border-t border-soft-gray pt-3">
              <p className="text-[11px] uppercase tracking-label text-accent">
                {s.step}
              </p>
              <p className="mt-1 text-sm text-text-muted">{s.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {explanation.advisory && (
        <p
          role="note"
          className="mt-10 rounded-lg border border-accent/40 bg-porcelain/50 p-5 text-sm text-text"
        >
          {ADVISORY}
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/haircare/profiles/${profile.slug}`}
          className="rounded-full border border-text bg-text px-5 py-2 text-xs font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent"
        >
          Read the full guide
        </Link>
        <RetakeButton onRetake={onRetake} />
      </div>

      <p className="mt-12 border-t border-soft-gray pt-6 text-xs text-text-muted/70">
        {LIMITATION}
      </p>
    </div>
  );
}
