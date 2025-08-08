// src/store/currenciesStore.ts
// Стор валют: кэш по коду, список с пагинацией/поиском, «популярные».
// Все запросы идут через /api/currencies*, локаль можно прокидывать в стор.

import { create } from "zustand"
import type { Currency } from "../types/currency"
import {
  listCurrencies,
  listPopularCurrencies,
  getCurrency,
} from "../api/currenciesApi"

type Dict<T> = Record<string, T>

interface CurrenciesStore {
  // — Кэш по коду валюты (быстрый доступ без повторного запроса)
  byCode: Dict<Currency>

  // — Список валют (результат последнего поиска/пагинации)
  items: Currency[]
  total: number
  limit: number
  offset: number
  hasMore: boolean

  // — Управление запросом
  q: string
  locale?: string
  loading: boolean
  error: string | null

  // — Действия
  setLocale: (locale?: string) => void
  setQuery: (q: string) => void
  resetList: () => void

  fetchPopular: () => Promise<void>
  fetchList: (opts?: { reset?: boolean }) => Promise<void>
  loadMore: () => Promise<void>
  ensureCurrency: (code: string) => Promise<Currency>
}

const DEFAULT_LIMIT = 100

export const useCurrenciesStore = create<CurrenciesStore>((set, get) => ({
  byCode: {},

  items: [],
  total: 0,
  limit: DEFAULT_LIMIT,
  offset: 0,
  hasMore: true,

  q: "",
  locale: undefined,
  loading: false,
  error: null,

  setLocale(locale) {
    // При смене локали сбрасываем текущий список (названия валют локализованы)
    set({ locale, items: [], total: 0, offset: 0, hasMore: true, error: null })
  },

  setQuery(q) {
    set({ q, items: [], total: 0, offset: 0, hasMore: true, error: null })
  },

  resetList() {
    set({ items: [], total: 0, offset: 0, hasMore: true, error: null })
  },

  async fetchPopular() {
    set({ loading: true, error: null })
    try {
      const { locale } = get()
      const list = await listPopularCurrencies(locale)
      // Обновим кэш по коду; «популярные» не влияют на state.items/total
      set((state) => {
        const byCode = { ...state.byCode }
        for (const c of list) byCode[c.code] = c
        return { byCode, loading: false }
      })
    } catch (e: any) {
      set({ loading: false, error: e?.message || "Не удалось загрузить популярные валюты" })
    }
  },

  async fetchList(opts) {
    const { limit, offset, q, locale, items } = get()
    const reset = !!opts?.reset
    const effOffset = reset ? 0 : offset

    if (reset) set({ items: [], total: 0, offset: 0, hasMore: true })
    set({ loading: true, error: null })

    try {
      const { items: newItems, total } = await listCurrencies({
        q: q || undefined,
        locale,
        limit,
        offset: effOffset,
      })

      set((state) => {
        // Кладём в кэш
        const byCode = { ...state.byCode }
        for (const c of newItems) byCode[c.code] = c

        const merged = effOffset === 0 ? newItems : [...items, ...newItems]
        const nextOffset = effOffset + newItems.length
        const hasMore = nextOffset < total

        return {
          byCode,
          items: merged,
          total,
          offset: nextOffset,
          hasMore,
          loading: false,
          error: null,
        }
      })
    } catch (e: any) {
      set({ loading: false, error: e?.message || "Ошибка загрузки валют" })
    }
  },

  async loadMore() {
    const { hasMore, loading } = get()
    if (!hasMore || loading) return
    await get().fetchList({ reset: false })
  },

  async ensureCurrency(code: string) {
    const { byCode, locale } = get()
    const key = (code || "").toUpperCase()
    if (byCode[key]) return byCode[key]
    const c = await getCurrency(key, locale)
    set((state) => ({ byCode: { ...state.byCode, [key]: c } }))
    return c
  },
}))
