import { PlaceForm } from "@/components/admin/PlaceForm";

export default function NewPlacePage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">New place</h1>
      <div className="mt-6">
        <PlaceForm mode="create" />
      </div>
    </div>
  );
}
