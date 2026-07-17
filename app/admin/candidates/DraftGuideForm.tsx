"use client";

import { useFormState } from "react-dom";
import { draftGuideAction } from "@/app/admin/actions/writer";
import { INITIAL_STATE } from "@/app/admin/actions/state";
import { TextField } from "@/components/admin/TextField";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormError } from "@/components/admin/FormError";

export function DraftGuideForm() {
  const [state, action] = useFormState(draftGuideAction, INITIAL_STATE);
  return (
    <form
      action={action}
      className="max-w-md rounded-lg border border-soft-gray bg-white p-4"
    >
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <TextField
            name="area"
            label="Draft a guide for area"
            error={state?.errors?.area}
            required
          />
        </div>
        <div className="mb-4">
          <SubmitButton>Draft</SubmitButton>
        </div>
      </div>
      <p className="text-xs text-text-muted">
        Writes a <em>draft</em> guide from this area&rsquo;s places, with [[
        NOTE ]] slots for first-hand detail. Nothing publishes until you finish
        it.
      </p>
      {state?.formError && <FormError message={state.formError} />}
    </form>
  );
}
