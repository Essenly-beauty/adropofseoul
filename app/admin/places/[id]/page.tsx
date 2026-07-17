import { notFound } from "next/navigation";
import { getPlaceById } from "@/services/admin/places";
import { PlaceForm } from "../PlaceForm";

export const dynamic = "force-dynamic";

export default async function EditPlacePage({
  params,
}: {
  params: { id: string };
}) {
  const place = await getPlaceById(params.id);
  if (!place) notFound();
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit place</h1>
      <div className="mt-6">
        <PlaceForm place={place} />
      </div>
    </div>
  );
}
