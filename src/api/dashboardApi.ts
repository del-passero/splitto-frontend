// src/api/dashboardApi.ts
// API для главного дашборда (Главная страница)

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

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    "x-telegram-initdata": getTelegramInitData(),
  }
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    let msg = ""
    try {
      msg = await res.text()
    } catch {}
    throw new Error(msg || `HTTP ${res.status}`)
  }
  // @ts-ignore
  return res.status === 204 ? undefined : await res.json()
}

// ---------------- BALANCE ----------------
export async function getDashboardBalance(): Promise<DashboardBalance> {
  const url = `${API_URL}/dashboard/balance`
  return await fetchJson<DashboardBalance>(url)
}

// ---------------- LAST CURRENCIES (ordered by recency) ----------------
export async function getLastCurrencies(limit = 10): Promise<string[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 10) // <= 10 — соответствует бэку
  const url = `${API_URL}/dashboard/last-currencies?limit=${safeLimit}`
  return await fetchJson<string[]>(url)
}

// ---------------- ACTIVITY ----------------
export async function getDashboardActivity(period: "week" | "month" | "year" = "month"): Promise<DashboardActivity> {
  const url = `${API_URL}/dashboard/activity?period=${period}`
  return await fetchJson<DashboardActivity>(url)
}

// ---------------- TOP CATEGORIES ----------------
export async function getTopCategories(
  period: "week" | "month" | "year" = "month",
  currency?: string,
  limit = 50,
  offset = 0
): Promise<TopCategories> {
  const sp = new URLSearchParams({ period, limit: String(limit), offset: String(offset) })
  if (currency) sp.set("currency", currency)
  const url = `${API_URL}/dashboard/top-categories?${sp.toString()}`
  return await fetchJson<TopCategories>(url)
}

// ---------------- SUMMARY ----------------
export async function getDashboardSummary(
  period: "day" | "week" | "month" | "year" = "month",
  currency: string
): Promise<DashboardSummary> {
  const sp = new URLSearchParams({ period, currency })
  const url = `${API_URL}/dashboard/summary?${sp.toString()}`
  return await fetchJson<DashboardSummary>(url)
}

// ---------------- RECENT GROUPS ----------------
export async function getRecentGroups(limit = 10): Promise<RecentGroupCard[]> {
  const url = `${API_URL}/dashboard/recent-groups?limit=${limit}`
  return await fetchJson<RecentGroupCard[]>(url)
}

// ---------------- TOP PARTNERS ----------------
export async function getTopPartners(
  period: "week" | "month" | "year" = "month",
  limit = 20
): Promise<TopPartner[]> {
  const sp = new URLSearchParams({ period, limit: String(limit) })
  const url = `${API_URL}/dashboard/top-partners?${sp.toString()}`
  return await fetchJson<TopPartner[]>(url)
}

// ---------------- EVENTS FEED ----------------
export async function getDashboardEvents(limit = 20): Promise<DashboardEventFeed> {
  const url = `${API_URL}/dashboard/events?limit=${limit}`
  return await fetchJson<DashboardEventFeed>(url)
}
