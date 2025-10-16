// src/api/eventsAPI.ts
import type { EventItem, EventsResponse } from "../types/event"

// Получение initData из Telegram WebApp
function getTelegramInitData(): string {
  // @ts-ignore
  return (window as any)?.Telegram?.WebApp?.initData || ""
}

const API_URL =
  import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
const BASE_URL = `${API_URL}/events`

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    "x-telegram-initdata": getTelegramInitData(),
  }
  const res = await fetch(input, { ...init, headers })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData?.detail?.code || errorData?.detail || res.statusText)
  }
  return (await res.json()) as T
}

export interface GetEventsParams {
  limit?: number
  before?: string | null      // ISO created_at последнего полученного (пагинация назад)
  since?: string | null       // ISO для подкачки новых сверху
  groupId?: number | null
  type?: string | null        // поддержим и это имя — превратим в ?types=...
  actorId?: number | null     // бэкенд пока игнорирует; не мешает
}

export async function getEvents(params: GetEventsParams = {}): Promise<EventsResponse> {
  const q = new URLSearchParams()
  if (params.limit && params.limit > 0) q.set("limit", String(params.limit))
  if (params.before) q.set("before", params.before)
  if (params.since) q.set("since", params.since)
  if (params.groupId != null) q.set("group_id", String(params.groupId))

  // Бэкенд ждёт множественный параметр "types"
  if (params.type) {
    const list = String(params.type)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    for (const one of list) q.append("types", one)
  }

  // actorId оставляем как no-op для совместимости (сервер проигнорирует)
  if (params.actorId != null) q.set("actor_id", String(params.actorId))

  // Нормализуем разные возможные ответы бэка: массив / {items} / {events}
  const raw = await fetchJson<any>(`${BASE_URL}${q.toString() ? "?" + q.toString() : ""}`)
  let items: EventItem[] = []
  let nextBefore: string | null | undefined = null

  if (Array.isArray(raw)) {
    items = raw as EventItem[]
  } else if (raw?.items && Array.isArray(raw.items)) {
    items = raw.items as EventItem[]
    nextBefore = raw.next_before ?? raw.nextBefore ?? null
  } else if (raw?.events && Array.isArray(raw.events)) {
    items = raw.events as EventItem[]
    nextBefore = raw.next_before ?? raw.nextBefore ?? null
  } else {
    // на всякий случай пытаемся трактовать как один объект
    if (raw && typeof raw === "object" && "id" in raw) {
      items = [raw as EventItem]
    } else {
      items = []
    }
  }

  if (!nextBefore && items.length > 0) {
    nextBefore = items[items.length - 1].created_at || null
  }

  return { items, nextBefore }
}
