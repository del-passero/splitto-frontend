// src/store/dashboardStore.ts
import { create } from "zustand"

// --------- Типы (сжато под UI) ---------
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

// --------- Стор типы ---------
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
  loading: LoadingState
  error: ErrorState

  balance: DashboardBalance | null
  lastCurrenciesOrdered: string[]
  ui: { balanceCurrencies: string[] }

  activityPeriod: "week" | "month" | "year"
  activity: DashboardActivity | null

  eventsFilter: string
  events: EventFeedItem[] | null

  summaryPeriod: "day" | "week" | "month" | "year"
  summaryCurrency: string
  currenciesRecent: string[]
  summary: DashboardSummary | null

  groups: RecentGroupCard[] | null

  topCategoriesPeriod: "week" | "month" | "year"
  topCategories: TopCategoryItem[] | null

  frequentPeriod: "week" | "month" | "year"
  frequentUsers: TopPartnerItem[] | null

  init: () => Promise<void>
  reloadBalance: () => Promise<void>
  setBalanceCurrencies: (codes: string[]) => void
  startLive: () => () => void

  setActivityPeriod: (p: "week" | "month" | "year") => void
  loadActivity: (p?: "week" | "month" | "year") => Promise<void>

  setEventsFilter: (f: string) => void
  loadEvents: () => Promise<void>

  setSummaryPeriod: (p: "day" | "week" | "month" | "year") => void
  setSummaryCurrency: (c: string) => void
  loadSummary: (p?: "day" | "week" | "month" | "year", c?: string) => Promise<void>

  loadRecentGroups: () => Promise<void>

  setTopPeriod: (p: "week" | "month" | "year") => void
  loadTopCategories: (p?: "week" | "month" | "year") => Promise<void>

  setFrequentPeriod: (p: "week" | "month" | "year") => void
  loadTopPartners: (p?: "week" | "month" | "year") => Promise<void>

  refreshAll: () => Promise<void>
}

// --------- Хелперы запроса (как в других разделах) ---------
const BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "")

const tgInitData = (): string => {
  try {
    // @ts-ignore
    return window?.Telegram?.WebApp?.initData || ""
  } catch {
    return ""
  }
}

const GET = async <T,>(path: string): Promise<T> => {
  const url = path.startsWith("http")
    ? path
    : `${BASE}${path.startsWith("/") ? "" : "/"}${path}`

  // Антикашь + no-store
  const withBust = `${url}${url.includes("?") ? "&" : "?"}_ts=${Date.now()}`
  const headers: HeadersInit = {
    Accept: "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  }
  const init = tgInitData()
  if (init) (headers as any)["x-telegram-initdata"] = init

  const res = await fetch(withBust, {
    credentials: "include",
    cache: "no-store",
    headers,
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`GET ${withBust} -> ${res.status} ${res.statusText}${txt ? `: ${txt}` : ""}`)
  }
  if (res.status === 204) return undefined as any
  return res.json()
}

// --------- Стор ---------
export const useDashboardStore = create<DashboardState>((set, get) => ({
  loading: { global: false, balance: false, activity: false, events: false, summary: false, groups: false, top: false, frequent: false },
  error: {},

  balance: null,
  lastCurrenciesOrdered: [],
  ui: { balanceCurrencies: [] },

  activityPeriod: "month",
  activity: null,

  eventsFilter: "all",
  events: null,

  summaryPeriod: "month",
  summaryCurrency: "USD",
  currenciesRecent: [],
  summary: null,

  groups: null,

  topCategoriesPeriod: "month",
  topCategories: null,

  frequentPeriod: "month",
  frequentUsers: null,

  // BALANCE
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
    const refetch = () => { void get().reloadBalance() }

    const onFocus = () => {
      refetch()
      void get().loadEvents()
      void get().loadRecentGroups()
    }
    const onOnline = onFocus
    const onVisibility = () => { if (!document.hidden) refetch() }

    window.addEventListener("focus", onFocus)
    window.addEventListener("online", onOnline)
    document.addEventListener("visibilitychange", onVisibility)

    const timer = window.setInterval(refetch, 15000)

    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("online", onOnline)
      document.removeEventListener("visibilitychange", onVisibility)
      window.clearInterval(timer)
    }
  },

  // ACTIVITY
  setActivityPeriod: (p) => set({ activityPeriod: p }),
  loadActivity: async (p) => {
    const period = p ?? get().activityPeriod
    set((s) => ({ loading: { ...s.loading, activity: true }, error: { ...s.error, activity: null } }))
    try {
      const data = await GET<DashboardActivity>(`/dashboard/activity?period=${period}`)
      set((s) => ({ activity: data, activityPeriod: period, loading: { ...s.loading, activity: false } }))
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, activity: false }, error: { ...s.error, activity: e?.message || "Error" } }))
    }
  },

  // EVENTS
  setEventsFilter: (f) => set({ eventsFilter: f }),
  loadEvents: async () => {
    set((s) => ({ loading: { ...s.loading, events: true }, error: { ...s.error, events: null } }))
    try {
      const data = await GET<{ items: EventFeedItem[] }>("/dashboard/events")
      set((s) => ({ events: data.items ?? [], loading: { ...s.loading, events: false } }))
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, events: false }, error: { ...s.error, events: e?.message || "Error" } }))
    }
  },

  // SUMMARY
  setSummaryPeriod: (p) => set({ summaryPeriod: p }),
  setSummaryCurrency: (c) => set({ summaryCurrency: (c || "RUB").toUpperCase() }),
  loadSummary: async (p, c) => {
    const period = p ?? get().summaryPeriod
    const currency = (c ?? get().summaryCurrency ?? "RUB").toUpperCase()
    set((s) => ({ loading: { ...s.loading, summary: true }, error: { ...s.error, summary: null } }))
    try {
      const data = await GET<DashboardSummary>(`/dashboard/summary?period=${period}&currency=${currency}`)
      set((s) => ({ summary: data, summaryPeriod: period, summaryCurrency: currency, loading: { ...s.loading, summary: false } }))
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, summary: false }, error: { ...s.error, summary: e?.message || "Error" } }))
    }
  },

  // GROUPS
  loadRecentGroups: async () => {
    set((s) => ({ loading: { ...s.loading, groups: true }, error: { ...s.error, groups: null } }))
    try {
      const data = await GET<RecentGroupCard[]>("/dashboard/recent-groups?limit=10")
      set((s) => ({ groups: data ?? [], loading: { ...s.loading, groups: false } }))
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, groups: false }, error: { ...s.error, groups: e?.message || "Error" } }))
    }
  },

  // TOP CATEGORIES
  setTopPeriod: (p) => set({ topCategoriesPeriod: p }),
  loadTopCategories: async (p) => {
    const period = p ?? get().topCategoriesPeriod
    set((s) => ({ loading: { ...s.loading, top: true }, error: { ...s.error, top: null } }))
    try {
      const data = await GET<TopCategories>(`/dashboard/top-categories?period=${period}`)
      set((s) => ({ topCategories: data?.items ?? [], topCategoriesPeriod: period, loading: { ...s.loading, top: false } }))
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, top: false }, error: { ...s.error, top: e?.message || "Error" } }))
    }
  },

  // TOP PARTNERS
  setFrequentPeriod: (p) => set({ frequentPeriod: p }),
  loadTopPartners: async (p) => {
    const period = p ?? get().frequentPeriod
    set((s) => ({ loading: { ...s.loading, frequent: true }, error: { ...s.error, frequent: null } }))
    try {
      const data = await GET<TopPartnerItem[]>(`/dashboard/top-partners?period=${period}`)
      set((s) => ({ frequentUsers: data ?? [], frequentPeriod: period, loading: { ...s.loading, frequent: false } }))
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, frequent: false }, error: { ...s.error, frequent: e?.message || "Error" } }))
    }
  },

  // Helpers
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
