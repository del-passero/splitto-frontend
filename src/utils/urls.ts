// src/utils/urls.ts
// База API (конечный /api обязателен)
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  "https://splitto-backend-prod-ugraf.amvera.io/api"

// База для статических файлов = API без "/api"
export const FILES_BASE_URL: string =
  (import.meta.env.VITE_FILES_BASE_URL as string) ||
  API_URL.replace(/\/api\/?$/i, "")

export function getTelegramInitData(): string {
  try {
    // @ts-ignore
    return window?.Telegram?.WebApp?.initData || ""
  } catch {
    return ""
  }
}

// Делает абсолютный URL из относительного пути
export function toAbsoluteUrl(input?: string | null): string {
  if (!input) return ""
  const url = String(input).trim()
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith("//")) return `https:${url}`
  const base = FILES_BASE_URL.replace(/\/$/, "")
  const path = url.startsWith("/") ? url : `/${url}`
  return `${base}${path}`
}
