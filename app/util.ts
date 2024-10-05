export const param = "q";

export function extract(value: FormDataEntryValue | null): string {
  return value && typeof value === "string" ? value : "";
}

export function getQuery(formData: FormData) {
  return extract(formData.get(param));
}
