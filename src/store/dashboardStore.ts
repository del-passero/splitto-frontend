// Zustand store для дашборда: баланс + лайв-обновление

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
  // выбранные валюты для верхнего блока
  balanceCurrencies: string[]
  // периодики для остальных (на будущее)
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

  // timers
  _liveTimer?: number
  _visibilityHandlerAttached?: boolean

  // начальная загрузка, чтобы всё работало сразу на старте
  init: (currencyFallback?: string) => Promise<void>

  // полная подкачка (на будущее, когда подключим остальные секции)
  fetchAll: (currency: string, period?: Period) => Promise<void>

  // только баланс (для лайв-обновления и дешёвого рефреша)
  refreshBalance: () => Promise<void>

  // лайв (pull + visibility)
  startLive: () => void
  stopLive: () => void

  // UI setters
  setBalanceCurrencies: (codes: string[]) => void
  setCategoriesPeriod: (p: Period) => void
  setPartnersPeriod: (p: Period) => void
  setActivityPeriod: (p: Period) => void
  setSummaryPeriod: (p: SummaryPeriod) => void
  setSummaryCurrency: (ccy: string) => void
}

// служебные: получить список всех валют с ненулевыми долгами
function collectNonZeroCurrencies(bal?: DashboardBalance): string[] {
  if (!bal) return []
  const parse = (v: string) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const set = new Set<string>()
  for (const [ccy, val] of Object.entries(bal.i_owe || {})) {
    if (Math.abs(parse(val)) > 0) set.add(ccy)
  }
  for (const [ccy, val] of Object.entries(bal.they_owe_me || {})) {
    if (Math.abs(parse(val)) > 0) set.add(ccy)
  }
  return Array.from(set)
}

// сортируем валюты так, чтобы сначала шли последние использованные (как пришло от бэка), потом остальные по алфавиту
function sortCurrenciesForChips(all: string[], last: string[]): string[] {
  const lastSet = new Set(last || [])
  const head = (last || []).filter((c) => all.includes(c))
  const tail = all.filter((c) => !lastSet.has(c)).sort()
  return [...head, ...tail]
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

      async init(currencyFallback?: string) {
        // первый лёгкий заход: грузим ТОЛЬКО баланс, чтобы блок работал сразу
        set((s) => ({ loading: { ...s.loading, balance: true }, error: null }))
        try {
          const bal = await getDashboardBalance()
          // применяем
          set((s) => ({
            balance: bal,
            loading: { ...s.loading, balance: false },
            error: null,
          }))
          // чипы: только валюты с ненулевыми значениями
          const all = collectNonZeroCurrencies(bal)
          const last = Array.isArray(bal.last_currencies) ? bal.last_currencies : []
          const ordered = sortCurrenciesForChips(all, last)
          // если пользователь ещё не выбирал — берём две последние (или первую/все)
          const currentSelected = get().ui.balanceCurrencies
          if (!currentSelected || currentSelected.length === 0) {
            const initial = last.length ? last.slice(0, 2) : ordered.slice(0, 2)
            set((s) => ({ ui: { ...s.ui, balanceCurrencies: initial } }))
          } else {
            // также пересортируем выбор, если нужно
            const re = ordered.filter((c) => currentSelected.includes(c))
            if (re.length !== currentSelected.length || re.some((c, i) => c !== currentSelected[i])) {
              set((s) => ({ ui: { ...s.ui, balanceCurrencies: re } }))
            }
          }
          // заодно проставим разумную валюту для summary
          const summaryCcy =
            get().ui.summaryCurrency || last[0] || currencyFallback || "USD"
          set((s) => ({ ui: { ...s.ui, summaryCurrency: summaryCcy } }))
        } catch (e: any) {
          set((s) => ({
            loading: { ...s.loading, balance: false },
            error: e?.message || "Failed to load balance",
          }))
        }
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
          if (get().ui.balanceCurrencies.length === 0) {
            const all = collectNonZeroCurrencies(balance)
            const ordered = sortCurrenciesForChips(all, last)
            set((s) => ({ ui: { ...s.ui, balanceCurrencies: (last.length ? last.slice(0, 2) : ordered.slice(0, 2)) } }))
          }
        } catch (e: any) {
          set((s) => ({
            loading: { ...s.loading, global: false, balance: false, activity: false, categories: false, summary: false, recentGroups: false, partners: false, events: false },
            error: e?.message || "Failed to load dashboard",
          }))
        }
      },

      async refreshBalance() {
        try {
          const selected = get().ui.balanceCurrencies
          const bal = await getDashboardBalance(selected && selected.length ? selected : undefined)
          set((s) => ({ balance: bal, error: null }))
          // обновляем порядок чипов: последние — вперёд, мусор/нулевые — убираем
          const all = collectNonZeroCurrencies(bal)
          const last = Array.isArray(bal.last_currencies) ? bal.last_currencies : []
          const ordered = sortCurrenciesForChips(all, last)
          const current = get().ui.balanceCurrencies
          if (!current || current.length === 0) {
            const initial = last.length ? last.slice(0, 2) : ordered.slice(0, 2)
            set((s) => ({ ui: { ...s.ui, balanceCurrencies: initial } }))
          } else {
            const filtered = ordered.filter((c) => current.includes(c))
            if (filtered.length !== current.length || filtered.some((c, i) => c !== current[i])) {
              set((s) => ({ ui: { ...s.ui, balanceCurrencies: filtered } }))
            }
          }
        } catch (e: any) {
          // не валим UI, просто пометим ошибку
          set(() => ({ error: e?.message || "Failed to refresh balance" }))
        }
      },

      startLive() {
        const hasTimer = Boolean(get()._liveTimer)
        if (!hasTimer) {
          const id = window.setInterval(() => {
            void get().refreshBalance()
          }, 15000) // 15s
          set(() => ({ _liveTimer: id as unknown as number }))
        }
        if (!get()._visibilityHandlerAttached) {
          const onVis = () => {
            if (document.visibilityState === "visible") {
              void get().refreshBalance()
            }
          }
          document.addEventListener("visibilitychange", onVis)
          // сохраним снятие, чтобы не было утечки
          const clean = () => document.removeEventListener("visibilitychange", onVis)
          // @ts-ignore
          window.__splittoBalanceVisClean = clean
          set(() => ({ _visibilityHandlerAttached: true }))
        }
      },

      stopLive() {
        const id = get()._liveTimer
        if (id) {
          window.clearInterval(id)
          set(() => ({ _liveTimer: undefined }))
        }
        if (get()._visibilityHandlerAttached) {
          // @ts-ignore
          if (typeof window.__splittoBalanceVisClean === "function") {
            // @ts-ignore
            window.__splittoBalanceVisClean()
            // @ts-ignore
            window.__splittoBalanceVisClean = undefined
          }
          set(() => ({ _visibilityHandlerAttached: false }))
        }
      },

      setBalanceCurrencies(codes: string[]) {
        // защита от дублей + мгновенный рефреш по выбранным валютам
        const unique = Array.from(new Set(codes))
        set((s) => ({ ui: { ...s.ui, balanceCurrencies: unique } }))
        void get().refreshBalance()
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
      name: "dashboard-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ ui: state.ui }),
      version: 2,
    }
  )
)
