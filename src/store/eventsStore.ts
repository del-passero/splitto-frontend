// src/store/eventsStore.ts
import { create } from "zustand"
import type { EventItem } from "../types/event"
import { getEvents, type GetEventsParams } from "../api/eventsApi"

type EventsFilters = {
  groupId: number | null
  type: string | null
  actorId: number | null
}

interface EventsStore {
  items: EventItem[]
  loading: boolean
  error: string | null
  hasMore: boolean
  beforeCursor: string | null // используем для пагинации "назад"
  filters: EventsFilters

  // Инициализация/перезагрузка ленты
  fetchFirst: (params?: Partial<GetEventsParams>) => Promise<void>
  // Догрузка старых
  fetchMore: (limit?: number) => Promise<void>
  // Подгрузка новых событий "сверху"
  refreshSince: () => Promise<number> // вернёт количество новых

  // Фильтры
  setGroupFilter: (groupId: number | null) => Promise<void>
  setTypeFilter: (type: string | null) => Promise<void>
  setActorFilter: (actorId: number | null) => Promise<void>

  // Сброс
  reset: () => void
}

const PAGE_SIZE = 30

export const useEventsStore = create<EventsStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  hasMore: true,
  beforeCursor: null,
  filters: { groupId: null, type: null, actorId: null },

  async fetchFirst(params = {}) {
    set({ loading: true, error: null, items: [], beforeCursor: null, hasMore: true })
    const { filters } = get()
    try {
      const res = await getEvents({
        limit: params.limit ?? PAGE_SIZE,
        since: params.since ?? null,
        before: null,
        groupId: params.groupId ?? filters.groupId,
        type: params.type ?? filters.type,
        actorId: params.actorId ?? filters.actorId,
      })
      set({
        items: res.items,
        loading: false,
        beforeCursor: res.nextBefore ?? null,
        hasMore: (res.items?.length || 0) >= (params.limit ?? PAGE_SIZE),
      })
    } catch (e: any) {
      set({ error: e.message || "errors.events_load", loading: false })
    }
  },

  async fetchMore(limit = PAGE_SIZE) {
    const { loading, hasMore, beforeCursor, filters, items } = get()
    if (loading || !hasMore) return
    set({ loading: true, error: null })
    try {
      const res = await getEvents({
        limit,
        before: beforeCursor,
        groupId: filters.groupId,
        type: filters.type,
        actorId: filters.actorId,
      })
      const merged = [...items, ...(res.items || [])]
      set({
        items: merged,
        loading: false,
        beforeCursor: res.nextBefore ?? beforeCursor,
        hasMore: (res.items?.length || 0) >= limit,
      })
    } catch (e: any) {
      set({ error: e.message || "errors.events_more", loading: false })
    }
  },

  async refreshSince() {
    const { items, filters } = get()
    if (items.length === 0) {
      await get().fetchFirst()
      return 0
    }
    const since = items[0].created_at
    try {
      const res = await getEvents({
        limit: PAGE_SIZE,
        since,
        groupId: filters.groupId,
        type: filters.type,
        actorId: filters.actorId,
      })
      if (!res.items?.length) return 0

      // Сшиваем без дублей по id, новые — наверх
      const existingIds = new Set(items.map(i => i.id))
      const newOnTop = res.items.filter(i => !existingIds.has(i.id))
      set({ items: [...newOnTop, ...items] })
      return newOnTop.length
    } catch {
      return 0
    }
  },

  async setGroupFilter(groupId) {
    set(state => ({ filters: { ...state.filters, groupId } }))
    await get().fetchFirst()
  },

  async setTypeFilter(type) {
    set(state => ({ filters: { ...state.filters, type } }))
    await get().fetchFirst()
  },

  async setActorFilter(actorId) {
    set(state => ({ filters: { ...state.filters, actorId } }))
    await get().fetchFirst()
  },

  reset() {
    set({
      items: [],
      loading: false,
      error: null,
      hasMore: true,
      beforeCursor: null,
      filters: { groupId: null, type: null, actorId: null },
    })
  },
}))
