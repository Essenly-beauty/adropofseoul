"use client";

import { useFormState } from "react-dom";
import { runResearchAction } from "@/app/admin/actions/candidates";
import { INITIAL_STATE } from "@/app/admin/actions/state";
import { TextField } from "@/components/admin/TextField";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormError } from "@/components/admin/FormError";

export function RunResearchForm() {
  const [state, action] = useFormState(runResearchAction, INITIAL_STATE);
  return (
    <form
      action={action}
      className="max-w-md rounded-lg border border-soft-gray bg-white p-4"
    >
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <TextField
            name="area"
            label="Run research for area"
            error={state.errors.area}
            required
          />
        </div>
        <div className="mb-4">
          <SubmitButton>Run</SubmitButton>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="images" defaultChecked />
        Also collect image candidates (thumbnails + reality shots, with sources)
      </label>
      {state.formError && <FormError message={state.formError} />}
    </form>
  );
}
