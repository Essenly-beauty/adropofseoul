import { notFound } from "next/navigation";
import { listCandidateById } from "@/services/agents/candidates";
import { APPROVAL_THRESHOLD } from "@/lib/agents/score";
import {
  approveCandidate,
  rejectCandidate,
} from "@/app/admin/actions/candidates";
import { SubmitButton } from "@/components/admin/SubmitButton";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const candidate = await listCandidateById(params.id);
  if (!candidate) notFound();

  const lowConfidence = candidate.confidence < APPROVAL_THRESHOLD;
  const actionable =
    candidate.status === "new" || candidate.status === "reviewing";

  return (
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-wide text-text-muted">
        Candidate · {candidate.status}
      </p>
      <h1 className="mt-1 font-serif text-3xl">{candidate.name}</h1>
      <p className="mt-1 text-sm text-text-muted">
        {candidate.area} · {candidate.categoryGuess ?? "uncategorized"} ·{" "}
        {Math.round(candidate.confidence * 100)}% confidence
      </p>

      <h2 className="mt-8 font-serif text-xl">Why notable</h2>
      <p className="mt-2">{candidate.whyNotable}</p>

      <h2 className="mt-6 font-serif text-xl">Evidence</h2>
      <blockquote className="mt-2 border-l-2 border-soft-gray pl-4 italic">
        “{candidate.evidenceQuote}”
      </blockquote>

      <h2 className="mt-6 font-serif text-xl">
        Sources ({candidate.sourceUrls.length}) — verify before approving
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {candidate.sourceUrls.map((url) => (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {url}
            </a>
          </li>
        ))}
      </ul>

      {lowConfidence && (
        <p className="mt-6 rounded-md border border-soft-gray bg-white p-3 text-sm text-text-muted">
          Confidence is below the {Math.round(APPROVAL_THRESHOLD * 100)}% review
          threshold — check the sources extra carefully. You can still approve.
        </p>
      )}

      {actionable && (
        <div className="mt-8 flex items-center gap-4">
          <form action={approveCandidate.bind(null, candidate.id)}>
            <SubmitButton>Approve → create place draft</SubmitButton>
          </form>
          <form action={rejectCandidate.bind(null, candidate.id)}>
            <button
              type="submit"
              className="text-sm text-red-600 hover:underline"
            >
              Reject
            </button>
          </form>
        </div>
      )}

      {candidate.status === "promoted" && candidate.promotedPlaceId && (
        <p className="mt-8 text-sm">
          Promoted →{" "}
          <a
            href={`/admin/places/${candidate.promotedPlaceId}`}
            className="text-accent hover:underline"
          >
            edit the place draft
          </a>
        </p>
      )}
    </div>
  );
}
