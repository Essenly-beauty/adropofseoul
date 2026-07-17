import { FormError } from "./FormError";

export function TextAreaField({
  name,
  label,
  defaultValue,
  error,
  rows = 3,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  error?: string;
  rows?: number;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className="mt-1 w-full rounded-md border border-soft-gray bg-white px-3 py-2"
      />
      <FormError message={error} />
    </div>
  );
}
