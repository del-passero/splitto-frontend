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
  /** Чипы валют в блоке «Мой баланс» (по умолчанию две последние) */
  balanceCurrencies: string[]
  /** Период для Топ категорий (независим от активности) */
  categoriesPeriod: Period
  /** Период для «Часто делю расходы» */
  partnersPeriod: Period
  /** Период для Активности */
  activityPeriod: Period
  /** Период для Сводки (day/week/month/year) */
  summaryPeriod: SummaryPeriod
  /** Валюта для Сводки — всегда одна (по умолчанию последняя использованная) */
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

  /** Первичная инициализация, если данные ещё не загружены */
  hydrateIfNeeded: (currencyFallback?: string) => Promise<void>
  /**
   * Полная загрузка дашборда.
   * Если currency не передана — берём из UI, иначе из last_currencies после загрузки баланса.
   */
  fetchAll: (currency?: string) => Promise<void>

  // UI setters
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
  summaryCurrency: "", // пусть определится из last_currencies
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

        // если все блоки уже загружены — ничего не делаем
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

        const candidate = st.ui.summaryCurrency || currencyFallback
        await get().fetchAll(candidate)
      },

      async fetchAll(currencyArg?: string) {
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
        }))

        try {
          // 1) Сначала баланс — он даст last_currencies для дефолтов
          const balance = await getDashboardBalance()

          // Автовыбор последних валют в блок «Мой баланс»
          const last = balance?.last_currencies || []
          const needInitBalanceChips = (get().ui.balanceCurrencies.length === 0)
          if (needInitBalanceChips && last.length) {
            set((s) => ({ ui: { ...s.ui, balanceCurrencies: last.slice(0, 2) } }))
          }

          // 2) Определяем валюту для Сводки:
          // приоритет: явный аргумент -> UI.summaryCurrency -> первая из last_currencies -> USD
          let effCurrency =
            currencyArg ||
            get().ui.summaryCurrency ||
            (last.length ? last[0] : "USD")

          // Сохраняем выбранную валюту в UI (если поменялась)
          if (effCurrency !== get().ui.summaryCurrency) {
            set((s) => ({ ui: { ...s.ui, summaryCurrency: effCurrency } }))
          }

          // 3) Периоды берём ТОЛЬКО из независимых UI-состояний (не затираем их единым периодом)
          const { activityPeriod, categoriesPeriod, partnersPeriod, summaryPeriod } = get().ui

          // 4) Параллельно грузим остальные блоки
          const [
            activity,
            topCategories,
            summary,
            recentGroups,
            topPartners,
            events,
          ] = await Promise.all([
            getDashboardActivity(activityPeriod),
            getTopCategories(categoriesPeriod, effCurrency),
            getDashboardSummary(summaryPeriod, effCurrency),
            getRecentGroups(10),
            getTopPartners(partnersPeriod, 20),
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

      // ===== UI setters =====
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
