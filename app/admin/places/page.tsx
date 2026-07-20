import Link from "next/link";
import { listAllPlaces } from "@/services/admin/places";
import { PLACE_TYPE_LABELS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

const FLASH: Record<string, string> = {
  created: "Place created.",
  updated: "Place updated.",
  deleted: "Place deleted.",
};

export default async function AdminPlacesPage({
  searchParams,
}: {
  searchParams: { created?: string; updated?: string; deleted?: string };
}) {
  const places = await listAllPlaces();
  const flashKey = Object.keys(FLASH).find(
    (k) => (searchParams as Record<string, string>)[k]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Places</h1>
        <Link
          href="/admin/places/new"
          className="rounded bg-text px-4 py-2 text-sm text-bg hover:opacity-90"
        >
          New place
        </Link>
      </div>
      {flashKey && (
        <p className="mt-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {FLASH[flashKey]}
        </p>
      )}
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-soft-gray text-left text-text-muted">
            <th className="py-2">Name</th>
            <th className="py-2">Category</th>
            <th className="py-2">Area</th>
            <th className="py-2">Status</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {places.map((p) => (
            <tr key={p.id} className="border-b border-soft-gray/60">
              <td className="py-2">
                {p.name}
                {p.nameKr && (
                  <span className="ml-2 text-text-muted">{p.nameKr}</span>
                )}
              </td>
              <td className="py-2">
                {PLACE_TYPE_LABELS[p.category] ?? p.category}
              </td>
              <td className="py-2">{p.area ?? "—"}</td>
              <td className="py-2">
                {p.isPublished ? (
                  <span className="text-green-700">Published</span>
                ) : (
                  <span className="text-text-muted">Draft</span>
                )}
              </td>
              <td className="py-2 text-right">
                <Link
                  href={`/admin/places/${p.id}`}
                  className="text-accent hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {places.length === 0 && (
        <p className="mt-6 text-text-muted">No places yet.</p>
      )}
    </div>
  );
}
