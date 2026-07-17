import { listAllPlaces } from "@/services/admin/places";
import { liveLabel } from "@/lib/admin/workflow";
import { deletePlace } from "@/app/admin/actions/places";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function PlacesListPage() {
  const places = await listAllPlaces();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Places</h1>
        <a
          href="/admin/places/new"
          className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          New place
        </a>
      </div>
      {places.length === 0 ? (
        <p className="mt-6 text-text-muted">No places yet.</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-soft-gray text-left text-text-muted">
              <th className="py-2">Name</th>
              <th className="py-2">Status</th>
              <th className="py-2">Updated</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {places.map((p) => (
              <tr key={p.id} className="border-b border-soft-gray">
                <td className="py-2">
                  <a
                    href={`/admin/places/${p.id}`}
                    className="hover:text-accent"
                  >
                    {p.name}
                  </a>
                </td>
                <td className="py-2">{liveLabel(p.isPublished)}</td>
                <td className="py-2 text-text-muted">
                  {p.updatedAt.slice(0, 10)}
                </td>
                <td className="py-2 text-right">
                  <DeleteButton action={deletePlace.bind(null, p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
