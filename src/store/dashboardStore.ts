// src/store/dashboardStore.ts
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import {
  getDashboardBalance,
  getDashboardActivity,
  getTopCategories,
  getDashboardSummary,
  getRecentGroups,
  getTopPartners,
  getDashboardEvents,
  getLastCurrencies,
} from "../api/dashboardApi"
import type {
  DashboardBalance,
  DashboardActivity,
  TopCategories,
  DashboardSummary,
  RecentGroupCard,
  TopPartner,
  DashboardEventFeed,
} from "../types/dashboard"

type Period = "week" | "month" | "year"
type SummaryPeriod = "day" | "week" | "month" | "year"

interface UIState {
  balanceCurrencies: string[]
  categoriesPeriod: Period
  partnersPeriod: Period
  activityPeriod: Period
  summaryPeriod: SummaryPeriod
  summaryCurrency: string
  balanceChipsTouched?: boolean
}

interface LoadingState {
  global: boolean
  balance: boolean
  activity: boolean
  categories: boolean
  summary: boolean
  recentGroups: boolean
  partners: boolean
  events: boolean
}

interface DashboardState {
  balance?: DashboardBalance
  activity?: DashboardActivity
  topCategories?: TopCategories
  summary?: DashboardSummary
  recentGroups?: RecentGroupCard[]
  topPartners?: TopPartner[]
  events?: DashboardEventFeed
  lastCurrenciesOrdered?: string[]
  loading: LoadingState
  error?: string | null
  ui: UIState
  _isRefreshingBalance?: boolean

  hydrateIfNeeded: (currencyFallback?: string) => Promise<void>
  fetchAll: (currency: string, period?: Period) => Promise<void>
  refreshBalance: () => Promise<void>

  setBalanceCurrencies: (codes: string[]) => void
  setCategoriesPeriod: (p: Period) => void
  setPartnersPeriod: (p: Period) => void
  setActivityPeriod: (p: Period) => void
  setSummaryPeriod: (p: SummaryPeriod) => void
  setSummaryCurrency: (ccy: string) => void
}

const defaultLoading: LoadingState = {
  global: false, balance: false, activity: false, categories: false, summary: false, recentGroups: false, partners: false, events: false,
}
const defaultUI: UIState = {
  balanceCurrencies: [], categoriesPeriod: "month", partnersPeriod: "month", activityPeriod: "month", summaryPeriod: "month", summaryCurrency: "USD", balanceChipsTouched: false,
}

const parseAbs = (x?: string | null) => { if (!x) return 0; const n = Number(String(x).replace(",", ".")); return Number.isFinite(n) ? Math.abs(n) : 0 }
const nonZeroCurrencies = (b?: DashboardBalance) => {
  const set = new Set<string>()
  if (!b) return []
  Object.entries(b.i_owe || {}).forEach(([c, v]) => { if (parseAbs(v) > 0) set.add(c.toUpperCase()) })
  Object.entries(b.they_owe_me || {}).forEach(([c, v]) => { if (parseAbs(v) > 0) set.add(c.toUpperCase()) })
  return Array.from(set)
}
const sortByLastOrdered = (codes: string[], last?: string[]) => {
  const order = new Map<string, number>(); (last || []).forEach((c, i) => order.set((c || "").toUpperCase(), i))
  const inLast = codes.filter((c) => order.has(c.toUpperCase())).sort((a, b) => (order.get(a.toUpperCase())! - order.get(b.toUpperCase())!))
  const others = codes.filter((c) => !order.has(c.toUpperCase())).sort()
  return [...inLast, ...others]
}
const pickDefault = (nonZeroSorted: string[], last?: string[]) => {
  if (nonZeroSorted.length === 0) return []
  const inOrder = (last || []).map((c) => (c || "").toUpperCase()).filter((c) => nonZeroSorted.includes(c))
  const primary = inOrder.slice(0, 2)
  for (const c of nonZeroSorted) if (!primary.includes(c) && primary.length < 2) primary.push(c)
  return primary
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      loading: { ...defaultLoading },
      error: null,
      ui: { ...defaultUI },

      async hydrateIfNeeded(currencyFallback?: string) {
        const st = get()
        if (st.loading.global) return
        if (st.balance && st.activity && st.topCategories && st.summary && st.recentGroups && st.topPartners && st.events && st.lastCurrenciesOrdered) return

        const ccy = st.ui.summaryCurrency || currencyFallback || "USD"
        const period = st.ui.activityPeriod || "month"
        await get().fetchAll(ccy, period)
      },

      async fetchAll(currency: string, period: Period = "month") {
        if (get().loading.global) return
        set((s) => ({
          loading: { ...s.loading, global: true, balance: true, activity: true, categories: true, summary: true, recentGroups: true, partners: true, events: true },
          error: null,
          ui: { ...s.ui, summaryCurrency: currency, activityPeriod: period, categoriesPeriod: period, partnersPeriod: period },
        }))
        try {
          const [balance, activity, topCategories, summary, recentGroups, topPartners, events, last] = await Promise.all([
            getDashboardBalance(),
            getDashboardActivity(period).catch(() => undefined),
            getTopCategories(period, currency).catch(() => undefined),
            getDashboardSummary("month", currency).catch(() => undefined),
            getRecentGroups(10).catch(() => undefined),
            getTopPartners(period, 20).catch(() => undefined),
            getDashboardEvents(20).catch(() => undefined),
            getLastCurrencies(10).catch(() => [] as string[]),
          ])
          const lastUp = (last || []).map((c) => (c || "").toUpperCase())
          const nonZero = nonZeroCurrencies(balance)
          const sorted = sortByLastOrdered(nonZero, lastUp)
          let selected = get().ui.balanceCurrencies
          if (!get().ui.balanceChipsTouched || selected.length === 0) selected = pickDefault(sorted, lastUp)
          else {
            selected = selected.filter((c) => sorted.includes(c.toUpperCase()))
            if (selected.length === 0) selected = pickDefault(sorted, lastUp)
          }
          set((s) => ({
            balance, activity, topCategories, summary, recentGroups, topPartners, events,
            lastCurrenciesOrdered: lastUp,
            ui: { ...s.ui, balanceCurrencies: selected },
            loading: { ...s.loading, global: false, balance: false, activity: false, categories: false, summary: false, recentGroups: false, partners: false, events: false },
            error: null,
          }))
        } catch (e: any) {
          set((s) => ({
            loading: { ...s.loading, global: false, balance: false, activity: false, categories: false, summary: false, recentGroups: false, partners: false, events: false },
            error: e?.message || "Failed to load dashboard",
          }))
        }
      },

      async refreshBalance() {
        if (get()._isRefreshingBalance) return
        set({ _isRefreshingBalance: true, loading: { ...get().loading, balance: true } })
        try {
          const [balance, last] = await Promise.all([getDashboardBalance(), getLastCurrencies(10).catch(() => [] as string[])])
          const lastUp = (last || []).map((c) => (c || "").toUpperCase())
          const nonZero = nonZeroCurrencies(balance)
          const sorted = sortByLastOrdered(nonZero, lastUp)
          let selected = get().ui.balanceCurrencies
          if (!get().ui.balanceChipsTouched || selected.length === 0) selected = pickDefault(sorted, lastUp)
          else {
            selected = selected.filter((c) => sorted.includes(c.toUpperCase()))
            if (selected.length === 0) selected = pickDefault(sorted, lastUp)
          }
          set((s) => ({
            balance,
            lastCurrenciesOrdered: lastUp,
            ui: { ...s.ui, balanceCurrencies: selected },
            loading: { ...s.loading, balance: false },
          }))
        } finally {
          set({ _isRefreshingBalance: false })
        }
      },

      setBalanceCurrencies(codes: string[]) {
        const unique = Array.from(new Set(codes.map((c) => c.toUpperCase())))
        set((s) => ({ ui: { ...s.ui, balanceCurrencies: unique, balanceChipsTouched: true } }))
      },
      setCategoriesPeriod(p: Period) { set((s) => ({ ui: { ...s.ui, categoriesPeriod: p } })) },
      setPartnersPeriod(p: Period) { set((s) => ({ ui: { ...s.ui, partnersPeriod: p } })) },
      setActivityPeriod(p: Period) { set((s) => ({ ui: { ...s.ui, activityPeriod: p } })) },
      setSummaryPeriod(p: SummaryPeriod) { set((s) => ({ ui: { ...s.ui, summaryPeriod: p } })) },
      setSummaryCurrency(ccy: string) { set((s) => ({ ui: { ...s.ui, summaryCurrency: ccy.toUpperCase() } })) },
    }),
    {
      name: "dashboard-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ ui: s.ui }),
      version: 7,
    }
  )
)
