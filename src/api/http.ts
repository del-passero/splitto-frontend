// src/api/http.ts
// Общие утилиты для API-запросов:
//  • автоматом подставляем заголовок x-telegram-initdata во ВСЕ запросы,
//  • удобные врапперы tgFetch / tgFetchJson,
//  • helper readTotalFromHeaders для X-Total-Count.

export function getTelegramInitData(): string {
  // Telegram WebApp отдаёт строку initData в window.Telegram.WebApp.initData
  // @ts-ignore
  return (typeof window !== "undefined" && window?.Telegram?.WebApp?.initData) || ""
}

/** Сформировать заголовки с Telegram initData (+ принять любые свои) */
export function withTgHeaders(headers?: HeadersInit, locale?: string): HeadersInit {
  const base: HeadersInit = { "x-telegram-initdata": getTelegramInitData() }
  if (locale) base["Accept-Language"] = locale
  return { ...base, ...(headers || {}) }
}

/** Fetch, который всегда добавляет x-telegram-initdata */
export async function tgFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const headers = withTgHeaders(init?.headers)
  return fetch(input, { ...init, headers })
}

/** То же самое, но сразу парсит JSON и бросает Error с текстом ответа при не-200 */
export async function tgFetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await tgFetch(input, init)
  if (!res.ok) {
    let errText: string
    try { errText = await res.text() } catch { errText = res.statusText }
    throw new Error(errText || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

/** Прочитать X-Total-Count из заголовков (если нет — вернуть fallback или 0) */
export function readTotalFromHeaders(res: Response, fallback: number = 0): number {
  const h = res.headers.get("X-Total-Count") || res.headers.get("x-total-count")
  if (!h) return fallback
  const n = parseInt(h, 10)
  return Number.isFinite(n) ? n : fallback
}

/** Базовый URL API (как и раньше) */
export const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
