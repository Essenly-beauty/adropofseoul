type Base = { label: string; name: string; error?: string };

const labelCls = "block text-sm font-medium text-text";
const inputCls =
  "mt-1 block w-full rounded border border-soft-gray px-3 py-2 text-sm focus:border-accent focus:outline-none";
const errCls = "mt-1 text-xs text-red-600";

function FieldShell({
  label,
  name,
  error,
  children,
}: Base & { children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      {children}
      {error && <p className={errCls}>{error}</p>}
    </div>
  );
}

export function TextField({
  label,
  name,
  error,
  defaultValue,
  readOnly,
}: Base & { defaultValue?: string; readOnly?: boolean }) {
  return (
    <FieldShell label={label} name={name} error={error}>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        readOnly={readOnly}
        className={inputCls}
      />
    </FieldShell>
  );
}

export function UrlField(props: Base & { defaultValue?: string }) {
  return <TextField {...props} />;
}

export function NumberField({
  label,
  name,
  error,
  defaultValue,
  step,
}: Base & { defaultValue?: string; step?: string }) {
  return (
    <FieldShell label={label} name={name} error={error}>
      <input
        id={name}
        name={name}
        type="number"
        step={step}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  name,
  error,
  defaultValue,
  rows,
}: Base & { defaultValue?: string; rows?: number }) {
  return (
    <FieldShell label={label} name={name} error={error}>
      <textarea
        id={name}
        name={name}
        rows={rows ?? 3}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
      />
    </FieldShell>
  );
}

export function ListField({
  label,
  name,
  error,
  defaultValue,
}: Base & { defaultValue?: string[] }) {
  return (
    <FieldShell label={`${label} (one per line)`} name={name} error={error}>
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={(defaultValue ?? []).join("\n")}
        className={inputCls}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  error,
  defaultValue,
  options,
}: Base & {
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <FieldShell label={label} name={name} error={error}>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-text">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
