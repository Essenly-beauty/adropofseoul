"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { PLACE_TYPE_LABELS, PLACE_ENTRY_KINDS } from "@/lib/taxonomy";
import type { AdminPlace } from "@/services/admin/places";
import {
  createPlaceAction,
  updatePlaceAction,
  deletePlaceAction,
  type FormState,
} from "@/app/admin/places/actions";
import {
  TextField,
  UrlField,
  NumberField,
  TextArea,
  ListField,
  SelectField,
  CheckboxField,
} from "./fields";

const CATEGORY_OPTIONS = Object.entries(PLACE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);
const KIND_OPTIONS = PLACE_ENTRY_KINDS.map((k) => ({
  value: k.value,
  label: k.label,
}));

export function PlaceForm({
  mode,
  place,
}: {
  mode: "create" | "edit";
  place?: AdminPlace;
}) {
  const action =
    mode === "edit" && place
      ? updatePlaceAction.bind(null, place.id)
      : createPlaceAction;
  const [state, formAction] = useFormState(action, { ok: true } as FormState);
  const e = state.errors ?? {};

  return (
    <div className="max-w-2xl">
      {state.formError && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.formError}
        </p>
      )}
      <form action={formAction} className="grid gap-5">
        <TextField
          label="Name (English)"
          name="name"
          defaultValue={place?.name}
          error={e.name}
        />
        <TextField
          label="Name (Korean)"
          name="nameKr"
          defaultValue={place?.nameKr ?? ""}
          error={e.nameKr}
        />
        <TextField
          label="Slug"
          name="slug"
          defaultValue={place?.slug}
          readOnly={mode === "edit"}
          error={e.slug}
        />
        <SelectField
          label="Category"
          name="category"
          defaultValue={place?.category ?? "salon"}
          options={CATEGORY_OPTIONS}
          error={e.category}
        />
        <SelectField
          label="Entry type"
          name="entryType"
          defaultValue={place?.entryType ?? "place"}
          options={KIND_OPTIONS}
          error={e.entryType}
        />
        <TextField label="Area" name="area" defaultValue={place?.area ?? ""} />
        <TextField
          label="Address"
          name="address"
          defaultValue={place?.address ?? ""}
        />
        <TextField
          label="Service detail"
          name="serviceDetail"
          defaultValue={place?.serviceDetail ?? ""}
        />
        <TextArea
          label="Short description"
          name="shortDescription"
          defaultValue={place?.shortDescription ?? ""}
        />
        <TextArea
          label="Long description"
          name="longDescription"
          rows={6}
          defaultValue={place?.longDescription ?? ""}
        />
        <TextArea
          label="Why we like it"
          name="whyWeLikeIt"
          defaultValue={place?.whyWeLikeIt ?? ""}
        />
        <TextField
          label="Best for"
          name="bestFor"
          defaultValue={place?.bestFor ?? ""}
        />
        <TextField
          label="Price range"
          name="priceRange"
          defaultValue={place?.priceRange ?? ""}
        />
        <NumberField
          label="Rating (0–5)"
          name="rating"
          step="0.1"
          defaultValue={place?.rating != null ? String(place.rating) : ""}
          error={e.rating}
        />
        <NumberField
          label="Review count"
          name="reviewCount"
          defaultValue={
            place?.reviewCount != null ? String(place.reviewCount) : ""
          }
          error={e.reviewCount}
        />
        <UrlField
          label="Website URL"
          name="websiteUrl"
          defaultValue={place?.websiteUrl ?? ""}
          error={e.websiteUrl}
        />
        <UrlField
          label="Instagram URL"
          name="instagramUrl"
          defaultValue={place?.instagramUrl ?? ""}
          error={e.instagramUrl}
        />
        <UrlField
          label="Naver Map URL"
          name="naverMapUrl"
          defaultValue={place?.naverMapUrl ?? ""}
          error={e.naverMapUrl}
        />
        <UrlField
          label="Google Map URL"
          name="googleMapUrl"
          defaultValue={place?.googleMapUrl ?? ""}
          error={e.googleMapUrl}
        />
        <UrlField
          label="Booking URL"
          name="bookingUrl"
          defaultValue={place?.bookingUrl ?? ""}
          error={e.bookingUrl}
        />
        <ListField
          label="Languages"
          name="languages"
          defaultValue={place?.languages}
        />
        <ListField label="Images" name="images" defaultValue={place?.images} />
        <CheckboxField
          label="Published"
          name="isPublished"
          defaultChecked={place?.isPublished ?? false}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded bg-text px-4 py-2 text-sm text-bg hover:opacity-90"
          >
            {mode === "create" ? "Create place" : "Save changes"}
          </button>
          <Link
            href="/admin/places"
            className="text-sm text-text-muted hover:text-text"
          >
            Cancel
          </Link>
        </div>
      </form>

      {mode === "edit" && place && (
        <form
          action={deletePlaceAction.bind(null, place.id)}
          className="mt-8 border-t border-soft-gray pt-6"
          onSubmit={(ev) => {
            if (!confirm("Delete this place? This cannot be undone.")) {
              ev.preventDefault();
            }
          }}
        >
          <button
            type="submit"
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete place
          </button>
        </form>
      )}
    </div>
  );
}
