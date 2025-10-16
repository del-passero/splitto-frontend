// src/store/dashboardStore.ts
import { formatEventCard } from "../utils/events/formatEventCard"
import { create } from "zustand"
import {
  getDashboardBalance,
  getDashboardLastCurrencies,
  getDashboardRecentGroups,
  getDashboardEvents,
  getDashboardActivity,
  getDashboardSummary,
  getDashboardTopCategories,
  getDashboardTopPartners,
} from "../api/dashboardApi"
import type {
  DashboardBalance,
  DashboardActivity,
  DashboardSummaryOut,
  TopCategoryItem,
  TopPartnerItem,
  RecentGroupCard,
  EventFeedItem,
  PeriodAll,
  PeriodLTYear,
} from "../types/dashboard"

type LoadingFlags = {
  balance: boolean
  activity: boolean
  summary: boolean
  top: boolean
  frequent: boolean
  groups: boolean
  events: boolean
}

type ErrorMap = {
  balance?: string
  activity?: string
  summary?: string
  top?: string
  frequent?: string
  groups?: string
  events?: string
}

type DashboardState = {
  loading: LoadingFlags
  error: ErrorMap

  // данные
  balance: DashboardBalance | null
  activity: DashboardActivity | null
  summary: DashboardSummaryOut | null
  topCategories: TopCategoryItem[]
  frequentUsers: TopPartnerItem[]
  groups: RecentGroupCard[]
  events: EventFeedItem[]
  currenciesRecent: string[]

  // фильтры/периоды
  activityPeriod: PeriodAll
  summaryPeriod: PeriodAll
  topCategoriesPeriod: PeriodLTYear
  frequentPeriod: PeriodLTYear
  summaryCurrency: string
  eventsFilter: string

  // live
  liveTimer: number | null

  // внутреннее: отложенная перезагрузка summary
  summaryNeedsReload: boolean

  /** НОВОЕ: локаль последней загрузки топ-категорий (для инвалидации кэша по языку) */
  topLocale: string | null

  // методы
  init: () => void
  startLive: (ms?: number) => void
  stopLive: () => void

  // balance
  reloadBalance: (force?: boolean) => Promise<void>

  // activity
  loadActivity: (period?: PeriodAll) => Promise<void>
  setActivityPeriod: (p: PeriodAll) => void

  // summary
  loadSummary: (period?: PeriodAll, currency?: string) => Promise<void>
  setSummaryPeriod: (p: PeriodAll) => void
  setSummaryCurrency: (ccy: string) => void

  // top categories
  /** Принимает либо период (как раньше), либо объект опций { period, locale, force } */
  loadTopCategories: (
    arg?: PeriodLTYear | { period?: PeriodLTYear; locale?: string; force?: boolean }
  ) => Promise<void>
  setTopPeriod: (p: PeriodLTYear) => void

  // top partners
  loadTopPartners: (period?: PeriodLTYear) => Promise<void>
  setFrequentPeriod: (p: PeriodLTYear) => void

  // recent groups
  loadRecentGroups: (limit?: number) => Promise<void>

  // events
  loadEvents: (limit?: number) => Promise<void>
  setEventsFilter: (f: string) => void
}

const now = () => Date.now()
const TTL_BALANCE = 15_000
const TTL_DEFAULT = 60_000

let lastAt: Partial<Record<keyof LoadingFlags, number>> = {}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  loading: {
    balance: false,
    activity: false,
    summary: false,
    top: false,
    frequent: false,
    groups: false,
    events: false,
  },
  error: {},

  balance: null,
  activity: null,
  summary: null,
  topCategories: [],
  frequentUsers: [],
  groups: [],
  events: [],
  currenciesRecent: [],

  activityPeriod: "month",
  summaryPeriod: "month",
  topCategoriesPeriod: "month",
  frequentPeriod: "month",
  summaryCurrency: "",
  eventsFilter: "all",

  liveTimer: null,

  summaryNeedsReload: false,

  // НОВОЕ: локаль, на которой загружены topCategories
  topLocale: null,

  init() {
    void get().reloadBalance(true)
    void get().loadRecentGroups(10)
    void get().loadEvents(20)

    // подтягиваем «последние валюты» и сразу триггерим первую загрузку summary
    getDashboardLastCurrencies(2)
      .then((ccys) => {
        set({ currenciesRecent: ccys })
        const existing = (get().summaryCurrency || "").toUpperCase()
        const fallback = ccys[0] ? String(ccys[0]).toUpperCase() : "USD"
        const next = existing || fallback
        get().setSummaryCurrency(next) // внутри сам вызовет load
      })
      .catch(() => void 0)
  },

  startLive(ms = 30_000) {
    const prev = get().liveTimer
    if (prev) window.clearInterval(prev)
    const id = window.setInterval(() => {
      void get().reloadBalance()
    }, Math.max(5_000, ms))
    set({ liveTimer: id })
  },

  stopLive() {
    const id = get().liveTimer
    if (id) window.clearInterval(id)
    set({ liveTimer: null })
  },

  async reloadBalance(force = false) {
    if (get().loading.balance) return
    const ts = lastAt.balance ?? 0
    if (!force && now() - ts < TTL_BALANCE) return
    set((s) => ({ loading: { ...s.loading, balance: true }, error: { ...s.error, balance: "" } }))
    try {
      const data = await getDashboardBalance()
      if (!data.last_currencies?.length) {
        const cc = await getDashboardLastCurrencies(2).catch(() => [])
        data.last_currencies = cc
      }
      set((s) => ({ balance: data, loading: { ...s.loading, balance: false } }))
      lastAt.balance = now()
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, balance: false },
        error: { ...s.error, balance: e?.message || "Failed to load balance" },
      }))
    }
  },

  async loadActivity(periodArg?: PeriodAll) {
    if (periodArg) {
      set({ activityPeriod: periodArg })
      lastAt.activity = 0
    }
    if (get().loading.activity) return
    const ts = lastAt.activity ?? 0
    if (now() - ts < TTL_DEFAULT) return
    const period = get().activityPeriod
    set((s) => ({ loading: { ...s.loading, activity: true }, error: { ...s.error, activity: "" } }))
    try {
      const data = await getDashboardActivity({ period })
      set((s) => ({ activity: data, loading: { ...s.loading, activity: false } }))
      lastAt.activity = now()
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, activity: false },
        error: { ...s.error, activity: e?.message || "Failed to load activity" },
      }))
    }
  },

  setActivityPeriod(p) {
    set({ activityPeriod: p })
    lastAt.activity = 0
    void get().loadActivity()
  },

  async loadSummary(periodArg?: PeriodAll, currencyArg?: string) {
    // применяем входные аргументы к состоянию перед загрузкой
    if (periodArg) set({ summaryPeriod: periodArg })
    if (currencyArg) set({ summaryCurrency: currencyArg.toUpperCase?.() || currencyArg })

    // если уже грузимся — не стартуем новую; она будет запланирована флагом
    if (get().loading.summary) return

    const ts = lastAt.summary ?? 0
    if (now() - ts < TTL_DEFAULT) return

    const period = get().summaryPeriod
    const currency = get().summaryCurrency || "USD"

    set((s) => ({ loading: { ...s.loading, summary: true }, error: { ...s.error, summary: "" } }))
    try {
      const data = await getDashboardSummary({ period, currency })
      set((s) => ({ summary: data }))
    } catch (e: any) {
      set((s) => ({ error: { ...s.error, summary: e?.message || "Failed to load summary" } }))
    } finally {
      // помечаем завершение загрузки
      set((s) => ({ loading: { ...s.loading, summary: false } }))
      lastAt.summary = now()

      // если во время загрузки успели поменять период/валюту — сразу перезагрузим
      if (get().summaryNeedsReload) {
        set({ summaryNeedsReload: false })
        lastAt.summary = 0 // снять TTL
        void get().loadSummary()
      }
    }
  },

  setSummaryPeriod(p) {
    set({ summaryPeriod: p })
    lastAt.summary = 0
    // если идёт загрузка — отложим перезагрузку
    if (get().loading.summary) {
      set({ summaryNeedsReload: true })
      return
    }
    void get().loadSummary()
  },

  setSummaryCurrency(ccy) {
    set({ summaryCurrency: ccy?.toUpperCase?.() || ccy })
    lastAt.summary = 0
    if (get().loading.summary) {
      set({ summaryNeedsReload: true })
      return
    }
    void get().loadSummary()
  },

  /** ВАЖНО: совместимость.
   *  - старый вызов: loadTopCategories("month")
   *  - новый вызов:  loadTopCategories({ period: "month", locale: "ru", force: true })
   */
  async loadTopCategories(
    arg?: PeriodLTYear | { period?: PeriodLTYear; locale?: string; force?: boolean }
  ) {
    // распарсим аргументы
    let requestedPeriod = get().topCategoriesPeriod
    let localeFromArg: string | undefined
    let force = false

    if (typeof arg === "string") {
      requestedPeriod = arg
      set({ topCategoriesPeriod: arg })
      lastAt.top = 0
    } else if (arg && typeof arg === "object") {
      if (arg.period) {
        requestedPeriod = arg.period
        set({ topCategoriesPeriod: arg.period })
        lastAt.top = 0
      }
      localeFromArg = arg.locale
      force = !!arg.force
    }

    // вычислим локаль (ui → короткий код)
    const prevLocale = get().topLocale || null
    const nextLocale = (localeFromArg || prevLocale || (navigator?.language || "ru"))
      .split("-")[0]

    const localeChanged = prevLocale !== nextLocale

    // защита от гонок
    if (get().loading.top) return

    // TTL: пропускаем, если не force и не менялась локаль
    const ts = lastAt.top ?? 0
    if (!force && !localeChanged && now() - ts < TTL_DEFAULT) return

    // если локаль сменилась — можно очистить список (мгновенная визуальная смена),
    // но это безопасно: чип валют не трогаем, он хранится в компоненте.
    set((s) => ({
      loading: { ...s.loading, top: true },
      error: { ...s.error, top: "" },
      topLocale: nextLocale,
      ...(localeChanged ? { topCategories: [] } : {}),
    }))

    try {
      const data = await getDashboardTopCategories({
        period: requestedPeriod,
        limit: 50,
        offset: 0,
        // НОВОЕ: прокидываем локаль на бэкенд
        // (убедись, что getDashboardTopCategories поддерживает { locale } в api)
        locale: nextLocale,
      } as any)
      set((s) => ({ topCategories: data.items || [] }))
    } catch (e: any) {
      set((s) => ({ error: { ...s.error, top: e?.message || "Failed to load top categories" } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, top: false } }))
      lastAt.top = now()
    }
  },

  setTopPeriod(p) {
    set({ topCategoriesPeriod: p })
    lastAt.top = 0
    // локаль берём из состояния topLocale, чтобы не сбрасывать её при простом переключении периода
    void get().loadTopCategories()
  },

  async loadTopPartners(periodArg?: PeriodLTYear) {
    if (periodArg) {
      set({ frequentPeriod: periodArg })
      lastAt.frequent = 0
    }
    if (get().loading.frequent) return
    const ts = lastAt.frequent ?? 0
    if (now() - ts < TTL_DEFAULT) return
    const period = get().frequentPeriod

    set((s) => ({ loading: { ...s.loading, frequent: true }, error: { ...s.error, frequent: "" } }))
    try {
      const data = await getDashboardTopPartners({ period, limit: 20 })
      set((s) => ({ frequentUsers: data || [] }))
    } catch (e: any) {
      set((s) => ({ error: { ...s.error, frequent: e?.message || "Failed to load top partners" } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, frequent: false } }))
      lastAt.frequent = now()
    }
  },

  setFrequentPeriod(p) {
    set({ frequentPeriod: p })
    lastAt.frequent = 0
    void get().loadTopPartners()
  },

  async loadRecentGroups(limit = 10) {
    if (get().loading.groups) return
    const ts = lastAt.groups ?? 0
    if (now() - ts < TTL_DEFAULT) return

    set((s) => ({ loading: { ...s.loading, groups: true }, error: { ...s.error, groups: "" } }))
    try {
      const data = await getDashboardRecentGroups(limit)
      set((s) => ({ groups: data || [] }))
    } catch (e: any) {
      set((s) => ({ error: { ...s.error, groups: e?.message || "Failed to load recent groups" } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, groups: false } }))
      lastAt.groups = now()
    }
  },

  async loadEvents(limit = 20) {
    if (get().loading.events) return

    const prevCount = get().events.length
    const ts = lastAt.events ?? 0
    const ttlAlive = Date.now() - ts < TTL_DEFAULT
    if (ttlAlive && limit <= prevCount) return

    set((s) => ({ loading: { ...s.loading, events: true }, error: { ...s.error, events: "" } }))
    try {
      const feed = await getDashboardEvents(limit)
      const rawItems: any[] = feed?.items || []
      if (!rawItems.length && prevCount) { lastAt.events = Date.now(); return }

      // 1) стартовые мапы из стора
      const groupsMap: Record<number, { name?: string }> = {}
      for (const g of get().groups || []) {
        if (g?.id) groupsMap[g.id] = { name: g.name }
      }
      const usersMap: Record<number, { name?: string }> = {}
      for (const p of get().frequentUsers || []) {
        const u = p?.user
        if (u?.id) {
          const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || undefined
          usersMap[u.id] = { name }
        }
      }

      // 2) добираем имена из самих событий
      const parseData = (d: any) => {
        if (typeof d === "string") { try { return JSON.parse(d) } catch { return {} } }
        return d || {}
      }
      for (const r of rawItems) {
        const d = parseData(r?.data)
        const gid = typeof r?.group_id === "number" ? r.group_id
          : typeof d?.group_id === "number" ? d.group_id : undefined
        if (gid && typeof d?.group_name === "string" && d.group_name) {
          groupsMap[gid] = { name: d.group_name }
        }
        if (typeof r?.actor_id === "number" && typeof d?.actor_name === "string" && d.actor_name) {
          usersMap[r.actor_id] = { name: d.actor_name }
        }
        if (typeof r?.target_user_id === "number" && typeof d?.target_name === "string" && d.target_name) {
          usersMap[r.target_user_id] = { name: d.target_name }
        }
      }

      // 3) нормализация: форматируем только «сырые» записи
      const shouldFormat = (r: any) => {
        const hasTitle = typeof r?.title === "string" && r.title.trim() !== ""
        const hasIcon  = typeof r?.icon === "string" && r.icon.trim() !== ""
        const typeStr  = typeof r?.type === "string" ? r.type.trim().toLowerCase() : ""
        const titleEq  = hasTitle && typeStr && r.title.trim().toLowerCase() === typeStr
        const iconIsFallback = hasIcon && r.icon.trim().toLowerCase() === "bell"
        return !hasTitle || !hasIcon || titleEq || iconIsFallback
      }

      const ctx = { meId: 0, usersMap, groupsMap }
      const items: EventFeedItem[] = rawItems.map((r: any) => {
        if (!shouldFormat(r)) return r as EventFeedItem
        const c = formatEventCard(r as any, ctx)
        return {
          id: c.id,
          type: c.type,
          created_at: c.created_at,
          icon: c.icon,
          title: c.title,
          subtitle: c.subtitle ?? null,
          entity: r?.entity ?? {},
        }
      })

      set((s) => ({ events: items }))
    } catch (e: any) {
      set((s) => ({ error: { ...s.error, events: e?.message || "Failed to load events" } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, events: false } }))
      lastAt.events = Date.now()
    }
  },

  setEventsFilter(f) {
    set({ eventsFilter: f })
  },
}))
