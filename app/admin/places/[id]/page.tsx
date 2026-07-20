import { notFound } from "next/navigation";
import { getAdminPlaceById } from "@/services/admin/places";
import { PlaceForm } from "@/components/admin/PlaceForm";

export const dynamic = "force-dynamic";

export default async function EditPlacePage({
  params,
}: {
  params: { id: string };
}) {
  const place = await getAdminPlaceById(params.id);
  if (!place) notFound();
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit place</h1>
      <p className="mt-1 text-text-muted">{place.name}</p>
      <div className="mt-6">
        <PlaceForm mode="edit" place={place} />
      </div>
    </div>
  );
}
