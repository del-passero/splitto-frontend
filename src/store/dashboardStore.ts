// src/store/dashboardStore.ts
import { create } from "zustand"

// ---------------- Types from backend (сжато под нужды UI) ----------------
type BalanceMap = Record<string, string>

export type DashboardBalance = {
  i_owe: BalanceMap
  they_owe_me: BalanceMap
  last_currencies?: string[]
}

type ActivityBucket = { date: string; count: number }
type DashboardActivity = { period: "week" | "month" | "year"; buckets: ActivityBucket[] }

type DashboardSummary = {
  period: "day" | "week" | "month" | "year"
  currency: string
  spent: string
  avg_check: string
  my_share: string
}

type RecentGroupCard = {
  id: number
  name: string
  avatar_url?: string | null
  my_balance_by_currency: Record<string, string>
  last_event_at?: string | null
}

type TopCategoryItem = {
  category_id: number
  name?: string | null
  sum: string
  currency: string
}

type TopCategories = {
  period: "week" | "month" | "year"
  items: TopCategoryItem[]
  total: number
}

type TopPartnerItem = {
  user: {
    id: number
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    photo_url?: string | null
  }
  joint_expense_count: number
  period: "week" | "month" | "year"
}

type EventFeedItem = {
  id: number
  type: string
  created_at: string
  title: string
  subtitle?: string | null
  icon: string
  entity: Record<string, unknown>
}

// ---------------- Store types ----------------
type LoadingState = {
  global: boolean
  balance: boolean
  activity: boolean
  events: boolean
  summary: boolean
  groups: boolean
  top: boolean
  frequent: boolean
}

type ErrorState = Partial<{
  global: string | null
  balance: string | null
  activity: string | null
  events: string | null
  summary: string | null
  groups: string | null
  top: string | null
  frequent: string | null
}>

export type DashboardState = {
  // Loading / Errors
  loading: LoadingState
  error: ErrorState

  // BALANCE
  balance: DashboardBalance | null
  lastCurrenciesOrdered: string[]
  ui: {
    balanceCurrencies: string[]
  }

  // ACTIVITY
  activityPeriod: "week" | "month" | "year"
  activity: DashboardActivity | null

  // EVENTS
  eventsFilter: string
  events: EventFeedItem[] | null

  // SUMMARY
  summaryPeriod: "day" | "week" | "month" | "year"
  summaryCurrency: string
  currenciesRecent: string[]
  summary: DashboardSummary | null

  // GROUPS
  groups: RecentGroupCard[] | null

  // TOP CATEGORIES
  topCategoriesPeriod: "week" | "month" | "year"
  topCategories: TopCategoryItem[] | null

  // TOP PARTNERS
  frequentPeriod: "week" | "month" | "year"
  frequentUsers: TopPartnerItem[] | null

  // Actions (balance)
  init: () => Promise<void>
  reloadBalance: () => Promise<void>
  setBalanceCurrencies: (codes: string[]) => void
  startLive: () => () => void

  // Actions (activity)
  setActivityPeriod: (p: "week" | "month" | "year") => void
  loadActivity: (p?: "week" | "month" | "year") => Promise<void>

  // Actions (events)
  setEventsFilter: (f: string) => void
  loadEvents: () => Promise<void>

  // Actions (summary)
  setSummaryPeriod: (p: "day" | "week" | "month" | "year") => void
  setSummaryCurrency: (c: string) => void
  loadSummary: (p?: "day" | "week" | "month" | "year", c?: string) => Promise<void>

  // Actions (groups)
  loadRecentGroups: () => Promise<void>

  // Actions (top categories)
  setTopPeriod: (p: "week" | "month" | "year") => void
  loadTopCategories: (p?: "week" | "month" | "year") => Promise<void>

  // Actions (top partners)
  setFrequentPeriod: (p: "week" | "month" | "year") => void
  loadTopPartners: (p?: "week" | "month" | "year") => Promise<void>

  // Helpers
  refreshAll: () => Promise<void>
}

// ---------------- Helpers ----------------
const API_PREFIX = "/api"

const toApiUrl = (url: string) => {
  if (url.startsWith("/api/")) return url
  if (/^https?:\/\//i.test(url)) return url
  return `${API_PREFIX}${url.startsWith("/") ? "" : "/"}${url}`
}

const tgInitData = (): string => {
  try {
    // @ts-ignore
    return window?.Telegram?.WebApp?.initData || ""
  } catch {
    return ""
  }
}

const GET = async <T,>(url: string): Promise<T> => {
  const base = toApiUrl(url)
  // жёстко убиваем кэш: no-store + бастер
  const full = `${base}${base.includes("?") ? "&" : "?"}_ts=${Date.now()}`
  const headers: HeadersInit = {
    Accept: "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  }
  const init = tgInitData()
  if (init) (headers as any)["x-telegram-initdata"] = init

  const res = await fetch(full, {
    credentials: "include",
    cache: "no-store",
    headers,
  })

  // На всякий случай обработаем 304 (быть не должно из-за no-store, но пусть будет)
  if (res.status === 304) {
    const bust = `${base}${base.includes("?") ? "&" : "?"}_b=${Date.now()}_${Math.random()}`
    const res2 = await fetch(bust, {
      credentials: "include",
      cache: "no-store",
      headers,
    })
    if (!res2.ok) {
      const txt = await res2.text().catch(() => "")
      throw new Error(`GET ${bust} -> ${res2.status} ${res2.statusText}${txt ? `: ${txt}` : ""}`)
    }
    return res2.json()
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`GET ${full} -> ${res.status} ${res.statusText}${txt ? `: ${txt}` : ""}`)
  }
  return res.json()
}

// ---------------- Store ----------------
export const useDashboardStore = create<DashboardState>((set, get) => ({
  // base
  loading: {
    global: false,
    balance: false,
    activity: false,
    events: false,
    summary: false,
    groups: false,
    top: false,
    frequent: false,
  },
  error: {},

  // BALANCE
  balance: null,
  lastCurrenciesOrdered: [],
  ui: { balanceCurrencies: [] },

  // ACTIVITY
  activityPeriod: "month",
  activity: null,

  // EVENTS
  eventsFilter: "all",
  events: null,

  // SUMMARY
  summaryPeriod: "month",
  summaryCurrency: "USD",
  currenciesRecent: [],
  summary: null,

  // GROUPS
  groups: null,

  // TOP CATEGORIES
  topCategoriesPeriod: "month",
  topCategories: null,

  // TOP PARTNERS
  frequentPeriod: "month",
  frequentUsers: null,

  // ---------- BALANCE ----------
  setBalanceCurrencies: (codes) => {
    set((s) => ({ ui: { ...s.ui, balanceCurrencies: codes.map((c) => (c || "").toUpperCase()) } }))
  },

  reloadBalance: async () => {
    set((s) => ({ loading: { ...s.loading, balance: true }, error: { ...s.error, balance: null } }))
    try {
      const data = await GET<DashboardBalance>("/dashboard/balance")
      set((s) => ({
        balance: data,
        lastCurrenciesOrdered: s.lastCurrenciesOrdered.length ? s.lastCurrenciesOrdered : (data.last_currencies ?? []),
        loading: { ...s.loading, balance: false },
        error: { ...s.error, balance: null },
      }))
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, balance: false },
        error: { ...s.error, balance: e?.message || "Error" },
      }))
    }
  },

  init: async () => {
    set((s) => ({ loading: { ...s.loading, global: true } }))
    try {
      const last = await GET<string[]>("/dashboard/last-currencies?limit=2").catch(() => [])
      await get().reloadBalance()

      const defCurrency = (last?.[0] || get().summaryCurrency || "RUB").toUpperCase()

      set((s) => ({
        lastCurrenciesOrdered: last ?? [],
        currenciesRecent: last ?? [],
        summaryCurrency: defCurrency,
        ui: {
          ...s.ui,
          balanceCurrencies: s.ui.balanceCurrencies.length
            ? s.ui.balanceCurrencies
            : (last ?? []).map((c) => (c || "").toUpperCase()),
        },
      }))

      void get().loadActivity(get().activityPeriod)
      void get().loadEvents()
      void get().loadSummary(get().summaryPeriod, defCurrency)
      void get().loadRecentGroups()
      void get().loadTopCategories(get().topCategoriesPeriod)
      void get().loadTopPartners(get().frequentPeriod)

      set((s) => ({ loading: { ...s.loading, global: false } }))
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, global: false },
        error: { ...s.error, global: e?.message || "Error" },
      }))
    }
  },

  startLive: () => {
    const tick = () => { void get().reloadBalance() }
    const onFocus = () => {
      void get().reloadBalance()
      void get().loadEvents()
      void get().loadRecentGroups()
    }
    const onOnline = onFocus

    window.addEventListener("focus", onFocus)
    window.addEventListener("online", onOnline)
    const timer = window.setInterval(tick, 15000)

    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("online", onOnline)
      window.clearInterval(timer)
    }
  },

  // ---------- ACTIVITY ----------
  setActivityPeriod: (p) => set({ activityPeriod: p }),
  loadActivity: async (p) => {
    const period = p ?? get().activityPeriod
    set((s) => ({ loading: { ...s.loading, activity: true }, error: { ...s.error, activity: null } }))
    try {
      const data = await GET<DashboardActivity>(`/dashboard/activity?period=${period}`)
      set((s) => ({
        activity: data,
        activityPeriod: period,
        loading: { ...s.loading, activity: false },
      }))
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, activity: false },
        error: { ...s.error, activity: e?.message || "Error" },
      }))
    }
  },

  // ---------- EVENTS ----------
  setEventsFilter: (f) => set({ eventsFilter: f }),
  loadEvents: async () => {
    set((s) => ({ loading: { ...s.loading, events: true }, error: { ...s.error, events: null } }))
    try {
      const data = await GET<{ items: EventFeedItem[] }>("/dashboard/events")
      set((s) => ({
        events: data.items ?? [],
        loading: { ...s.loading, events: false },
      }))
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, events: false },
        error: { ...s.error, events: e?.message || "Error" },
      }))
    }
  },

  // ---------- SUMMARY ----------
  setSummaryPeriod: (p) => set({ summaryPeriod: p }),
  setSummaryCurrency: (c) => set({ summaryCurrency: (c || "RUB").toUpperCase() }),
  loadSummary: async (p, c) => {
    const period = p ?? get().summaryPeriod
    const currency = (c ?? get().summaryCurrency ?? "RUB").toUpperCase()
    set((s) => ({ loading: { ...s.loading, summary: true }, error: { ...s.error, summary: null } }))
    try {
      const data = await GET<DashboardSummary>(`/dashboard/summary?period=${period}&currency=${currency}`)
      set((s) => ({
        summary: data,
        summaryPeriod: period,
        summaryCurrency: currency,
        loading: { ...s.loading, summary: false },
      }))
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, summary: false },
        error: { ...s.error, summary: e?.message || "Error" },
      }))
    }
  },

  // ---------- GROUPS ----------
  loadRecentGroups: async () => {
    set((s) => ({ loading: { ...s.loading, groups: true }, error: { ...s.error, groups: null } }))
    try {
      const data = await GET<RecentGroupCard[]>("/dashboard/recent-groups?limit=10")
      set((s) => ({
        groups: data ?? [],
        loading: { ...s.loading, groups: false },
      }))
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, groups: false },
        error: { ...s.error, groups: e?.message || "Error" },
      }))
    }
  },

  // ---------- TOP CATEGORIES ----------
  setTopPeriod: (p) => set({ topCategoriesPeriod: p }),
  loadTopCategories: async (p) => {
    const period = p ?? get().topCategoriesPeriod
    set((s) => ({ loading: { ...s.loading, top: true }, error: { ...s.error, top: null } }))
    try {
      const data = await GET<TopCategories>(`/dashboard/top-categories?period=${period}`)
      set((s) => ({
        topCategories: data?.items ?? [],
        topCategoriesPeriod: period,
        loading: { ...s.loading, top: false },
      }))
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, top: false },
        error: { ...s.error, top: e?.message || "Error" },
      }))
    }
  },

  // ---------- TOP PARTNERS ----------
  setFrequentPeriod: (p) => set({ frequentPeriod: p }),
  loadTopPartners: async (p) => {
    const period = p ?? get().frequentPeriod
    set((s) => ({ loading: { ...s.loading, frequent: true }, error: { ...s.error, frequent: null } }))
    try {
      const data = await GET<TopPartnerItem[]>(`/dashboard/top-partners?period=${period}`)
      set((s) => ({
        frequentUsers: data ?? [],
        frequentPeriod: period,
        loading: { ...s.loading, frequent: false },
      }))
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, frequent: false },
        error: { ...s.error, frequent: e?.message || "Error" },
      }))
    }
  },

  // ---------- Helpers ----------
  refreshAll: async () => {
    await Promise.allSettled([
      get().reloadBalance(),
      get().loadActivity(),
      get().loadEvents(),
      get().loadSummary(),
      get().loadRecentGroups(),
      get().loadTopCategories(),
      get().loadTopPartners(),
    ])
  },
}))
