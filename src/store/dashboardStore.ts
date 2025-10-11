// src/store/dashboardStore.ts
// Авто-обновление подключаем сразу; рефетч баланса по фокусу/интервалу всегда активен.

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

  _autoRefreshAttached?: boolean
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
  balanceCurrencies: [],
  categoriesPeriod: "month",
  partnersPeriod: "month",
  activityPeriod: "month",
  summaryPeriod: "month",
  summaryCurrency: "USD",
  balanceChipsTouched: false,
}

function parseAbs(x?: string | null): number {
  if (!x) return 0
  const n = Number(String(x).replace(",", "."))
  return Number.isFinite(n) ? Math.abs(n) : 0
}
function nonZeroCurrencies(b?: DashboardBalance): string[] {
  const set = new Set<string>()
  if (!b) return []
  for (const [ccy, v] of Object.entries(b.i_owe || {})) if (parseAbs(v) > 0) set.add(ccy.toUpperCase())
  for (const [ccy, v] of Object.entries(b.they_owe_me || {})) if (parseAbs(v) > 0) set.add(ccy.toUpperCase())
  return Array.from(set)
}
function sortByLastOrdered(codes: string[], lastOrdered?: string[]): string[] {
  const order = new Map<string, number>()
  ;(lastOrdered || []).forEach((c, i) => order.set((c || "").toUpperCase(), i))
  const [inLast, others] = codes.reduce<[string[], string[]]>(
    (acc, c) => (order.has(c.toUpperCase()) ? (acc[0].push(c), acc) : (acc[1].push(c), acc)),
    [[], []]
  )
  inLast.sort((a, b) => (order.get(a.toUpperCase())! - order.get(b.toUpperCase())!))
  others.sort()
  return [...inLast, ...others]
}
function pickDefaultSelection(nonZeroSorted: string[], lastOrdered?: string[]): string[] {
  if (nonZeroSorted.length === 0) return []
  const inOrder = (lastOrdered || []).map((c) => (c || "").toUpperCase()).filter((c) => nonZeroSorted.includes(c))
  const primary = inOrder.slice(0, 2)
  if (primary.length === 2) return primary
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
        // автоподписки — сразу, даже если дальше выйдем раньше
        attachAutoRefresh()

        const st = get()
        if (st.loading.global) return
        if (
          st.balance && st.activity && st.topCategories && st.summary &&
          st.recentGroups && st.topPartners && st.events && st.lastCurrenciesOrdered
        ) {
          return
        }
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
          const lastPromise = getLastCurrencies(10).catch(() => [] as string[])

          const [
            balanceRes,
            activityRes,
            topCategoriesRes,
            summaryRes,
            recentGroupsRes,
            topPartnersRes,
            eventsRes,
            lastOrdered,
          ] = await Promise.allSettled([
            getDashboardBalance(),
            getDashboardActivity(period),
            getTopCategories(period, currency),
            getDashboardSummary("month", currency),
            getRecentGroups(10),
            getTopPartners(period, 20),
            getDashboardEvents(20),
            lastPromise,
          ])

          if (balanceRes.status !== "fulfilled") {
            throw new Error(balanceRes.reason?.message || "Failed to load balance")
          }
          const balance = balanceRes.value

          const activity = activityRes.status === "fulfilled" ? activityRes.value : undefined
          const topCategories = topCategoriesRes.status === "fulfilled" ? topCategoriesRes.value : undefined
          const summary = summaryRes.status === "fulfilled" ? summaryRes.value : undefined
          const recentGroups = recentGroupsRes.status === "fulfilled" ? recentGroupsRes.value : undefined
          const topPartners = topPartnersRes.status === "fulfilled" ? topPartnersRes.value : undefined
          const events = eventsRes.status === "fulfilled" ? eventsRes.value : undefined

          const lastOrderedUp = (lastOrdered.status === "fulfilled" ? (lastOrdered.value || []) : []).map((c) =>
            (c || "").toUpperCase()
          )

          const nonZero = nonZeroCurrencies(balance)
          const nonZeroSorted = sortByLastOrdered(nonZero, lastOrderedUp)

          let nextSelected = get().ui.balanceCurrencies
          if (!get().ui.balanceChipsTouched || nextSelected.length === 0) {
            nextSelected = pickDefaultSelection(nonZeroSorted, lastOrderedUp)
          } else {
            nextSelected = nextSelected.filter((c) => nonZeroSorted.includes(c.toUpperCase()))
            if (nextSelected.length === 0) nextSelected = pickDefaultSelection(nonZeroSorted, lastOrderedUp)
          }

          set((s) => ({
            balance,
            activity,
            topCategories,
            summary,
            recentGroups,
            topPartners,
            events,
            lastCurrenciesOrdered: lastOrderedUp,
            ui: { ...s.ui, balanceCurrencies: nextSelected },
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
        set({ _isRefreshingBalance: true })
        try {
          const [balance, lastOrdered] = await Promise.all([
            getDashboardBalance(),
            getLastCurrencies(10).catch(() => [] as string[]),
          ])

          const lastOrderedUp = (lastOrdered || []).map((c) => (c || "").toUpperCase())
          const nonZero = nonZeroCurrencies(balance)
          const nonZeroSorted = sortByLastOrdered(nonZero, lastOrderedUp)

          let nextSelected = get().ui.balanceCurrencies
          if (!get().ui.balanceChipsTouched || nextSelected.length === 0) {
            nextSelected = pickDefaultSelection(nonZeroSorted, lastOrderedUp)
          } else {
            nextSelected = nextSelected.filter((c) => nonZeroSorted.includes(c.toUpperCase()))
            if (nextSelected.length === 0) nextSelected = pickDefaultSelection(nonZeroSorted, lastOrderedUp)
          }

          set((s) => ({
            balance,
            lastCurrenciesOrdered: lastOrderedUp,
            ui: { ...s.ui, balanceCurrencies: nextSelected },
            loading: { ...s.loading, balance: false },
            error: null,
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
      partialize: (state) => ({ ui: state.ui }),
      version: 3,
    }
  )
)

function attachAutoRefresh() {
  const st = useDashboardStore.getState()
  if (st._autoRefreshAttached) return

  const refetch = () => useDashboardStore.getState().refreshBalance()

  const onVisibility = () => { if (!document.hidden) refetch() }
  const onFocus = () => refetch()

  window.addEventListener("visibilitychange", onVisibility)
  window.addEventListener("focus", onFocus)

  const intervalId = window.setInterval(() => {
    if (!document.hidden) refetch()
  }, 30000)

  useDashboardStore.setState({ _autoRefreshAttached: true })
  // @ts-ignore
  ;(window as any).__splittoDashboardInterval = intervalId
}
