// src/store/dashboardStore.ts
// Zustand store: фикс типов setActivityPeriod (+ предыдущие правки по last-currencies и fallback’ам)

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

  /** Упорядоченный список валют по последнему использованию */
  lastCurrenciesOrdered?: string[]

  loading: LoadingState
  error?: string | null
  ui: UIState

  hydrateIfNeeded: (currencyFallback?: string) => Promise<void>
  fetchAll: (currency: string, period?: Period) => Promise<void>

  setBalanceCurrencies: (codes: string[]) => void
  setCategoriesPeriod: (p: Period) => void
  setPartnersPeriod: (p: Period) => void
  setActivityPeriod: (p: Period) => void     // ← фикс: Period, не SummaryPeriod
  setSummaryPeriod: (p: SummaryPeriod) => void
  setSummaryCurrency: (ccy: string) => void
}

const defaultLoading: LoadingState = {
  global: false,
  balance: false,
  activity: false,
  categories: false,
  summary: false,
  recentGroups: false,
  partners: false,
  events: false,
}

const defaultUI: UIState = {
  balanceCurrencies: [],
  categoriesPeriod: "month",
  partnersPeriod: "month",
  activityPeriod: "month",
  summaryPeriod: "month",
  summaryCurrency: "USD",
}

function parseAbs(x?: string | null): number {
  if (!x) return 0
  const n = Number(String(x).replace(",", "."))
  return Number.isFinite(n) ? Math.abs(n) : 0
}

function pickAvailableCurrencies(b?: DashboardBalance, orderHint?: string[]): string[] {
  const seen = new Set<string>()
  const add = (ccy?: string | null) => {
    const up = String(ccy ?? "").trim().toUpperCase()
    if (up && !seen.has(up)) seen.add(up)
  }
  ;(orderHint ?? []).forEach(add)
  b?.last_currencies?.forEach(add)
  Object.keys(b?.i_owe ?? {}).forEach(add)
  Object.keys(b?.they_owe_me ?? {}).forEach(add)
  return Array.from(seen)
}

function pickFirstTwoNonZero(b?: DashboardBalance, avail?: string[]): string[] {
  const out: string[] = []
  if (!b) return out
  const list = avail ?? pickAvailableCurrencies(b)
  for (const c of list) {
    const l = parseAbs((b.i_owe as any)?.[c])
    const r = parseAbs((b.they_owe_me as any)?.[c])
    if (l > 0 || r > 0) {
      out.push(c)
      if (out.length >= 2) break
    }
  }
  return out
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
        if (
          st.balance &&
          st.activity &&
          st.topCategories &&
          st.summary &&
          st.recentGroups &&
          st.topPartners &&
          st.events &&
          st.lastCurrenciesOrdered
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
          loading: {
            ...s.loading,
            global: true,
            balance: true,
            activity: true,
            categories: true,
            summary: true,
            recentGroups: true,
            partners: true,
            events: true,
          },
          error: null,
          ui: {
            ...s.ui,
            summaryCurrency: currency,
            activityPeriod: period,
            categoriesPeriod: period,
            partnersPeriod: period,
          },
        }))

        try {
          const lastPromise = getLastCurrencies(10).catch(() => [] as string[])

          const [
            balance,
            activity,
            topCategories,
            summary,
            recentGroups,
            topPartners,
            events,
            lastOrdered,
          ] = await Promise.all([
            getDashboardBalance(),
            getDashboardActivity(period),
            getTopCategories(period, currency),
            getDashboardSummary("month", currency),
            getRecentGroups(10),
            getTopPartners(period, 20),
            getDashboardEvents(20),
            lastPromise,
          ])

          set((s) => ({
            balance,
            activity,
            topCategories,
            summary,
            recentGroups,
            topPartners,
            events,
            lastCurrenciesOrdered: (lastOrdered || []).map((c) => (c || "").toUpperCase()),
            loading: {
              ...s.loading,
              global: false,
              balance: false,
              activity: false,
              categories: false,
              summary: false,
              recentGroups: false,
              partners: false,
              events: false,
            },
            error: null,
          }))

          const last = (lastOrdered || []).map((c) => (c || "").toUpperCase())
          const currentSel = get().ui.balanceCurrencies
          const avail = pickAvailableCurrencies(balance, last)
          let nextSel =
            currentSel && currentSel.length
              ? currentSel.map((c) => c.toUpperCase())
              : last.length
              ? last.slice(0, 2)
              : avail.slice(0, 2)

          const zeroSelected =
            !nextSel.length ||
            nextSel.every((c) => {
              const l = parseAbs((balance?.i_owe as any)?.[c])
              const r = parseAbs((balance?.they_owe_me as any)?.[c])
              return l === 0 && r === 0
            })

          if (zeroSelected) {
            const nonZero = pickFirstTwoNonZero(balance, avail)
            if (nonZero.length) nextSel = nonZero
            else if (!nextSel.length) nextSel = avail.slice(0, 2)
          }

          const prev = get().ui.balanceCurrencies.map((c) => c.toUpperCase())
          const same =
            prev.length === nextSel.length && prev.every((c, i) => c === nextSel[i])
          if (!same) {
            set((s) => ({ ui: { ...s.ui, balanceCurrencies: nextSel } }))
          }
        } catch (e: any) {
          set((s) => ({
            loading: {
              ...s.loading,
              global: false,
              balance: false,
              activity: false,
              categories: false,
              summary: false,
              recentGroups: false,
              partners: false,
              events: false,
            },
            error: e?.message || "Failed to load dashboard",
          }))
        }
      },

      setBalanceCurrencies(codes: string[]) {
        set((s) => ({
          ui: { ...s.ui, balanceCurrencies: Array.from(new Set(codes.map((c) => c.toUpperCase()))) },
        }))
      },
      setCategoriesPeriod(p: Period) {
        set((s) => ({ ui: { ...s.ui, categoriesPeriod: p } }))
      },
      setPartnersPeriod(p: Period) {
        set((s) => ({ ui: { ...s.ui, partnersPeriod: p } }))
      },
      setActivityPeriod(p: Period) {
        set((s) => ({ ui: { ...s.ui, activityPeriod: p } }))
      },
      setSummaryPeriod(p: SummaryPeriod) {
        set((s) => ({ ui: { ...s.ui, summaryPeriod: p } }))
      },
      setSummaryCurrency(ccy: string) {
        set((s) => ({ ui: { ...s.ui, summaryCurrency: ccy.toUpperCase() } }))
      },
    }),
    {
      name: "dashboard-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ ui: state.ui }),
      version: 1,
    }
  )
)
