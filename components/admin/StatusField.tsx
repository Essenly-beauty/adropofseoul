import { SelectField } from "./SelectField";
import { POST_STATUSES } from "@/lib/admin/workflow";

export function StatusField({
  name = "status",
  defaultValue,
  error,
}: {
  name?: string;
  defaultValue?: string | null;
  error?: string;
}) {
  return (
    <SelectField
      name={name}
      label="Status"
      options={POST_STATUSES}
      defaultValue={defaultValue ?? "draft"}
      error={error}
    />
  );
}
