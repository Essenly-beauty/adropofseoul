import { listCandidatesByStatus } from "@/services/agents/candidates";
import type { PlaceCandidate } from "@/services/agents/types";
import { RunResearchForm } from "./RunResearchForm";

export const dynamic = "force-dynamic";

function CandidateTable({ candidates }: { candidates: PlaceCandidate[] }) {
  return (
    <table className="mt-3 w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-soft-gray text-left text-text-muted">
          <th className="py-2">Name</th>
          <th className="py-2">Area</th>
          <th className="py-2">Category</th>
          <th className="py-2">Confidence</th>
          <th className="py-2">Sources</th>
        </tr>
      </thead>
      <tbody>
        {candidates.map((c) => (
          <tr key={c.id} className="border-b border-soft-gray">
            <td className="py-2">
              <a
                href={`/admin/candidates/${c.id}`}
                className="hover:text-accent"
              >
                {c.name}
              </a>
            </td>
            <td className="py-2">{c.area}</td>
            <td className="py-2">{c.categoryGuess ?? "—"}</td>
            <td className="py-2">{Math.round(c.confidence * 100)}%</td>
            <td className="py-2">{c.sourceUrls.length}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: { ran?: string; kept?: string; dropped?: string };
}) {
  const [fresh, approved] = await Promise.all([
    listCandidatesByStatus("new"),
    listCandidatesByStatus("approved"),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Place candidates</h1>
      <p className="mt-2 text-sm text-text-muted">
        Research output awaiting review. Approving a candidate creates an{" "}
        <em>unpublished</em> place draft — nothing goes live from here.
      </p>

      <div className="mt-6">
        <RunResearchForm />
        {searchParams.ran && (
          <p className="mt-2 text-sm text-text-muted">
            Research for “{searchParams.ran}” finished: {searchParams.kept} new
            candidate(s), {searchParams.dropped} already known.
          </p>
        )}
      </div>

      <h2 className="mt-10 font-serif text-2xl">New ({fresh.length})</h2>
      {fresh.length === 0 ? (
        <p className="mt-2 text-text-muted">
          No candidates waiting — run research for an area above.
        </p>
      ) : (
        <CandidateTable candidates={fresh} />
      )}

      {approved.length > 0 && (
        <>
          <h2 className="mt-10 font-serif text-2xl">
            Approved, not yet promoted ({approved.length})
          </h2>
          <CandidateTable candidates={approved} />
        </>
      )}
    </div>
  );
}
