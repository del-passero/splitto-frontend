// src/api/dashboardApi.ts
// КЛИЕНТ ДАШБОРДА — URL/аутентификация как в groupsApi, роуты как в backend/dashboard.py

import type {
  DashboardBalance,
  DashboardActivity,
  TopCategoriesOut,
  DashboardSummaryOut,
  RecentGroupCard,
  TopPartnerItem,
  EventsFeedOut,
  PeriodAll,
  PeriodLTYear,
} from "../types/dashboard"

const API_URL: string =
  (import.meta.env.VITE_API_URL as string) || "https://splitto-backend-prod-ugraf.amvera.io/api"

function getTelegramInitData(): string {
  try {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp
    const raw = tg?.initData || tg?.initDataUnsafe
    return typeof raw === "string" ? raw : tg?.initData ?? ""
  } catch {
    return ""
  }
}

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return ""
  const qp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue
    qp.set(k, String(v))
  }
  const s = qp.toString()
  return s ? `?${s}` : ""
}

async function httpGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = `${API_URL.replace(/\/$/, "")}${path}${toQuery(params)}`
  const initData = getTelegramInitData()
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { ...(initData ? { "x-telegram-initdata": initData } : {}) },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`GET ${path} ${res.status} ${res.statusText}${txt ? ` — ${txt}` : ""}`)
  }
  return (await res.json()) as T
}

/* ===== helpers ===== */
function pickUiLocale(): string {
  try {
    const w: any = window
    // 1) язык i18next, если он доступен глобально
    const fromI18n =
      w?.i18next?.language ||
      w?.__I18N_LANG__ || // вдруг вы сами кладёте
      w?.__APP_LOCALE__
    // 2) lang на <html>
    const fromHtml =
      typeof document !== "undefined"
        ? document.documentElement.getAttribute("lang")
        : null
    // 3) браузер
    const fromNav = typeof navigator !== "undefined" ? navigator.language : null
    return (fromI18n || fromHtml || fromNav || "ru").split("-")[0].toLowerCase()
  } catch {
    return "ru"
  }
}

/* ===== API соответствуют src/routers/dashboard.py ===== */

export function getDashboardBalance(): Promise<DashboardBalance> {
  return httpGet("/dashboard/balance")
}

export function getDashboardActivity(params?: { period?: PeriodAll }): Promise<DashboardActivity> {
  return httpGet("/dashboard/activity", params)
}

export function getDashboardTopCategories(params?: {
  period?: PeriodLTYear
  currency?: string
  limit?: number
  offset?: number
  locale?: string
}): Promise<TopCategoriesOut> {
  // ВАЖНО: по умолчанию используем язык приложения, а не браузера
  const uiLocale = (params?.locale || pickUiLocale())
    .split("-")[0]
    .toLowerCase()

  return httpGet("/dashboard/top-categories", { ...params, locale: uiLocale })
}

export function getDashboardSummary(params: {
  period?: PeriodAll
  currency: string
}): Promise<DashboardSummaryOut> {
  return httpGet("/dashboard/summary", params)
}

export function getDashboardRecentGroups(limit = 10): Promise<RecentGroupCard[]> {
  return httpGet("/dashboard/recent-groups", { limit })
}

export function getDashboardTopPartners(params?: {
  period?: PeriodLTYear
  limit?: number
}): Promise<TopPartnerItem[]> {
  return httpGet("/dashboard/top-partners", params)
}

export function getDashboardLastCurrencies(limit = 2): Promise<string[]> {
  return httpGet("/dashboard/last-currencies", { limit })
}

export function getDashboardEvents(limit = 20): Promise<EventsFeedOut> {
  return httpGet("/dashboard/events", { limit })
}
