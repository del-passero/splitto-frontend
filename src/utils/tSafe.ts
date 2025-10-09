// src/utils/tSafe.ts
export function tSafe(
  t: (k: string, opts?: any) => any,
  key: string,
  def?: string
): string {
  const v = t(key, def ? { defaultValue: def } : undefined)
  if (v == null) return def ?? ""
  if (typeof v === "string" || typeof v === "number") return String(v)
  if (Array.isArray(v)) return v.join(" ")
  // если внезапно объект — не уроняем React
  return def ?? ""
}
