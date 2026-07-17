import { FormError } from "./FormError";

export function TextField({
  name,
  label,
  defaultValue,
  error,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className="mt-1 w-full rounded-md border border-soft-gray bg-white px-3 py-2"
      />
      <FormError message={error} />
    </div>
  );
}
