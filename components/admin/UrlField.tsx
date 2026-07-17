import { FormError } from "./FormError";

export function UrlField({
  name,
  label,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="url"
        inputMode="url"
        placeholder="https://…"
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className="mt-1 w-full rounded-md border border-soft-gray bg-white px-3 py-2"
      />
      <FormError message={error} />
    </div>
  );
}
