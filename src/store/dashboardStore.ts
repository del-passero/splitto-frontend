// src/store/dashboardStore.ts
// Zustand store для главного дашборда (кэш + UI-состояние)

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

  loading: LoadingState
  error?: string | null
  ui: UIState

  hydrateIfNeeded: (currencyFallback?: string) => Promise<void>
  fetchAll: (currency: string, period?: Period) => Promise<void>

  setBalanceCurrencies: (codes: string[]) => void
  setCategoriesPeriod: (p: Period) => void
  setPartnersPeriod: (p: Period) => void
  setActivityPeriod: (p: Period) => void
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

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      loading: { ...defaultLoading },
      error: null,
      ui: { ...defaultUI },

      async hydrateIfNeeded(currencyFallback?: string) {
        const st = get()
        // если уже грузимся — не стартуем вторую загрузку
        if (st.loading.global) return

        // если всё уже есть — не перезагружаем
        if (
          st.balance &&
          st.activity &&
          st.topCategories &&
          st.summary &&
          st.recentGroups &&
          st.topPartners &&
          st.events
        ) {
          return
        }

        const ccy = st.ui.summaryCurrency || currencyFallback || "USD"
        const period = st.ui.activityPeriod || "month"
        await get().fetchAll(ccy, period)
      },

      async fetchAll(currency: string, period: Period = "month") {
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
          const [
            balance,
            activity,
            topCategories,
            summary,
            recentGroups,
            topPartners,
            events,
          ] = await Promise.all([
            getDashboardBalance(),
            getDashboardActivity(period),
            getTopCategories(period, currency),
            getDashboardSummary("month", currency),
            getRecentGroups(10),
            getTopPartners(period, 20),
            getDashboardEvents(20),
          ])

          set((s) => ({
            balance,
            activity,
            topCategories,
            summary,
            recentGroups,
            topPartners,
            events,
            loading: { ...s.loading, global: false, balance: false, activity: false, categories: false, summary: false, recentGroups: false, partners: false, events: false },
            error: null,
          }))

          // Автовыбор последних валют при первом заходе
          const last = balance?.last_currencies || []
          if (get().ui.balanceCurrencies.length === 0 && last.length) {
            set((s) => ({ ui: { ...s.ui, balanceCurrencies: last.slice(0, 2) } }))
          }
        } catch (e: any) {
          set((s) => ({
            loading: { ...s.loading, global: false, balance: false, activity: false, categories: false, summary: false, recentGroups: false, partners: false, events: false },
            error: e?.message || "Failed to load dashboard",
          }))
        }
      },

      setBalanceCurrencies(codes: string[]) {
        set((s) => ({ ui: { ...s.ui, balanceCurrencies: Array.from(new Set(codes)) } }))
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
        set((s) => ({ ui: { ...s.ui, summaryCurrency: ccy } }))
      },
    }),
    {
      name: "dashboard-store", // ключ в storage
      storage: createJSONStorage(() => sessionStorage),
      // Сохраняем только UI, сетевые данные — в ОЗУ
      partialize: (state) => ({ ui: state.ui }),
      version: 1,
    }
  )
)
