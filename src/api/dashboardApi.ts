// src/api/dashboardApi.ts
// Подкрутил ожидание initData и ретраи на 401/403 (чтобы «заработало сразу»)

import type {
  DashboardBalance,
  DashboardActivity,
  TopCategories,
  DashboardSummary,
  RecentGroupCard,
  TopPartner,
  DashboardEventFeed,
} from "../types/dashboard"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

function tg() {
  // @ts-ignore
  return window?.Telegram?.WebApp
}

function getTelegramInitData(): string {
  try {
    return tg()?.initData || ""
  } catch {
    return ""
  }
}

async function waitForInitData(maxWaitMs = 6000, stepMs = 150): Promise<string> {
  const deadline = Date.now() + maxWaitMs
  let init = getTelegramInitData()
  while (!init && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, stepMs))
    init = getTelegramInitData()
  }
  return init
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  // 1) ждём initData
  const initData = await waitForInitData()
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    "x-telegram-initdata": initData,
  }

  // 2) до трёх попыток при 401/403 (иногда initData появляется с лагом)
  let last: Response | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { ...init, headers })
    last = res
    if (res.ok) {
      // @ts-ignore
      return res.status === 204 ? undefined : await res.json()
    }
    if (res.status === 401 || res.status === 403) {
      await new Promise((r) => setTimeout(r, 250 + attempt * 250))
      continue
    }
    let msg = ""
    try {
      msg = await res.text()
    } catch {}
    throw new Error(msg || `HTTP ${res.status}`)
  }
  let msg = ""
  try {
    msg = await last!.text()
  } catch {}
  throw new Error(msg || `HTTP ${last?.status}`)
}

// endpoints
export async function getDashboardBalance(): Promise<DashboardBalance> {
  return await fetchJson<DashboardBalance>(`${API_URL}/dashboard/balance`)
}
export async function getLastCurrencies(limit = 10): Promise<string[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 10)
  return await fetchJson<string[]>(`${API_URL}/dashboard/last-currencies?limit=${safeLimit}`)
}
export async function getDashboardActivity(period: "week" | "month" | "year" = "month"): Promise<DashboardActivity> {
  return await fetchJson<DashboardActivity>(`${API_URL}/dashboard/activity?period=${period}`)
}
export async function getTopCategories(
  period: "week" | "month" | "year" = "month",
  currency?: string,
  limit = 50,
  offset = 0
): Promise<TopCategories> {
  const sp = new URLSearchParams({ period, limit: String(limit), offset: String(offset) })
  if (currency) sp.set("currency", currency)
  return await fetchJson<TopCategories>(`${API_URL}/dashboard/top-categories?${sp.toString()}`)
}
export async function getDashboardSummary(
  period: "day" | "week" | "month" | "year" = "month",
  currency: string
): Promise<DashboardSummary> {
  const sp = new URLSearchParams({ period, currency })
  return await fetchJson<DashboardSummary>(`${API_URL}/dashboard/summary?${sp.toString()}`)
}
export async function getRecentGroups(limit = 10): Promise<RecentGroupCard[]> {
  return await fetchJson<RecentGroupCard[]>(`${API_URL}/dashboard/recent-groups?limit=${limit}`)
}
export async function getTopPartners(period: "week" | "month" | "year" = "month", limit = 20): Promise<TopPartner[]> {
  const sp = new URLSearchParams({ period, limit: String(limit) })
  return await fetchJson<TopPartner[]>(`${API_URL}/dashboard/top-partners?${sp.toString()}`)
}
export async function getDashboardEvents(limit = 20): Promise<DashboardEventFeed> {
  return await fetchJson<DashboardEventFeed>(`${API_URL}/dashboard/events?limit=${limit}`)
}
