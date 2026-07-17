export type FormState = { errors: Record<string, string>; formError?: string };

export const INITIAL_STATE: FormState = { errors: {} };

/** Empty string → null (ENG-R5); trims first. */
export function orNull(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}
