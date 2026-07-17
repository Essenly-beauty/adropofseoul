"use client";

import { useFormState } from "react-dom";
import { savePlace } from "@/app/admin/actions/places";
import { INITIAL_STATE } from "@/app/admin/actions/state";
import type { AdminPlace } from "@/services/admin/types";
import { PLACE_CATEGORIES } from "@/lib/admin/enums";
import { TextField } from "@/components/admin/TextField";
import { TextAreaField } from "@/components/admin/TextAreaField";
import { SelectField } from "@/components/admin/SelectField";
import { UrlField } from "@/components/admin/UrlField";
import { SlugField } from "@/components/admin/SlugField";
import { TagsField } from "@/components/admin/TagsField";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormError } from "@/components/admin/FormError";

export function PlaceForm({ place }: { place?: AdminPlace }) {
  const [state, action] = useFormState(savePlace, INITIAL_STATE);
  const e = state.errors;
  return (
    <form action={action} className="max-w-3xl">
      {place && <input type="hidden" name="id" value={place.id} />}
      <TextField
        name="name"
        label="Name"
        defaultValue={place?.name}
        error={e.name}
        required
      />
      <SlugField sourceId="name" defaultValue={place?.slug} error={e.slug} />
      <SelectField
        name="category"
        label="Category"
        options={PLACE_CATEGORIES}
        defaultValue={place?.category}
        error={e.category}
      />
      <TextField name="area" label="Area" defaultValue={place?.area} />
      <TextField name="address" label="Address" defaultValue={place?.address} />
      <TextAreaField
        name="shortDescription"
        label="Short description"
        defaultValue={place?.shortDescription}
      />
      <MarkdownField
        name="longDescription"
        label="Long description (Markdown)"
        defaultValue={place?.longDescription}
      />
      <TextAreaField
        name="whyWeLikeIt"
        label="Why we like it"
        defaultValue={place?.whyWeLikeIt}
      />
      <TextField
        name="bestFor"
        label="Best for"
        defaultValue={place?.bestFor}
      />
      <TextField
        name="priceRange"
        label="Price range"
        defaultValue={place?.priceRange}
      />
      <UrlField
        name="instagramUrl"
        label="Instagram URL"
        defaultValue={place?.instagramUrl}
        error={e.instagramUrl}
      />
      <UrlField
        name="naverMapUrl"
        label="Naver Map URL"
        defaultValue={place?.naverMapUrl}
        error={e.naverMapUrl}
      />
      <UrlField
        name="googleMapUrl"
        label="Google Map URL"
        defaultValue={place?.googleMapUrl}
        error={e.googleMapUrl}
      />
      <UrlField
        name="bookingUrl"
        label="Booking URL"
        defaultValue={place?.bookingUrl}
        error={e.bookingUrl}
      />
      <TextField
        name="contactEmail"
        label="Contact email"
        defaultValue={place?.contactEmail}
        error={e.contactEmail}
      />
      <TextField
        name="contactPhone"
        label="Contact phone"
        defaultValue={place?.contactPhone}
      />
      <TagsField
        name="languages"
        label="Languages"
        defaultValue={place?.languages}
      />
      <TextAreaField
        name="notes"
        label="Internal notes"
        defaultValue={place?.notes}
      />
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={place?.isPublished}
        />
        Published
      </label>

      {state.formError && <FormError message={state.formError} />}
      <div className="mt-4">
        <SubmitButton>{place ? "Save changes" : "Create place"}</SubmitButton>
      </div>
    </form>
  );
}
