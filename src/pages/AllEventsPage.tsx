// src/pages/AllEventsPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Bell,
  PlusCircle,
  Edit,
  Users,
  Archive,
  UserPlus,
  UserMinus,
  FileText,
  HandCoins,
} from "lucide-react"
import { getDashboardEvents } from "../api/dashboardApi"
import type { EventFeedItem } from "../types/dashboard"
import { formatEventCard } from "../utils/events/formatEventCard"

/* локальный тип фильтра */
type FilterKey = "all" | "tx" | "edits" | "groups" | "users"

/* маппинг иконок — такой же, как в DashboardEventsFeed */
const IconByName: Record<string, React.ComponentType<any>> = {
  Bell,
  PlusCircle,
  Edit,
  Users,
  Archive,
  UserPlus,
  UserMinus,
  FileText,
  HandCoins,
}

function bucketOf(type: string): Exclude<FilterKey, "all"> | null {
  const t = (type || "").toLowerCase()
  if (t.startsWith("transaction_") || t.includes("receipt")) return "tx"
  if (t.endsWith("_updated") || t.includes("updated")) return "edits"
  if (t.startsWith("group_")) return "groups"
  if (t.startsWith("member_") || t.includes("user")) return "users"
  return null
}

function Chip({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center h-8 px-3 mr-2 rounded-full text-sm select-none transition-colors",
        active
          ? "bg-[var(--tg-link-color,#2481CC)] text-white"
          : "bg-transparent text-[var(--tg-text-color)]/80 border border-[var(--tg-hint-color)]",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

export default function AllEventsPage() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<FilterKey>("all")
  const [items, setItems] = useState<EventFeedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [limit, setLimit] = useState<number>(100)
  const [canLoadMore, setCanLoadMore] = useState<boolean>(true)

  // защита от гонок / двойных кликов
  const inflight = useRef(false)

  const L = {
    title: t("events.all_title") || "Все события",
    all: t("dashboard.filter_all") || "Все",
    tx: t("dashboard.filter_tx") || "Транзакции",
    edits: t("dashboard.filter_edits") || "Редактирования",
    groups: t("dashboard.filter_groups") || "Группы",
    users: t("dashboard.filter_users") || "Юзеры",
    loadMore: t("common.load_more") || "Показать ещё",
    empty: t("dashboard.no_events") || "Событий пока нет",
    retry: t("retry") || "Повторить",
    loading: t("loading") || "Загрузка…",
  }

  async function fetchEvents(requestedLimit: number) {
    if (inflight.current) return
    inflight.current = true
    setLoading(true)
    setError("")
    try {
      const res = await getDashboardEvents(requestedLimit)
      const raw = res?.items || []

      const looksPreformatted =
        raw.length > 0 && typeof raw[0]?.title === "string" && !!raw[0]?.icon

      const normalized: EventFeedItem[] = looksPreformatted
        ? raw
        : raw.map((r: any, i: number) => {
            const c = formatEventCard(r, { meId: 0, usersMap: {}, groupsMap: {} })
            return {
              id: c.id,
              type: c.type,
              created_at: c.created_at,
              icon: c.icon,
              title: c.title,
              subtitle: c.subtitle ?? null,
              entity: raw[i]?.entity ?? {},
            }
          })

      // определим, есть ли смысл дальше «грузить ещё»
      // если сервер вернул больше, чем было, значит можно ещё увеличивать лимит
      setCanLoadMore(normalized.length > items.length)
      setItems(normalized)
    } catch (e: any) {
      setError(e?.message || "Failed to load events")
    } finally {
      setLoading(false)
      inflight.current = false
    }
  }

  // первичная загрузка
  useEffect(() => {
    void fetchEvents(limit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // отфильтрованный список
  const filtered = useMemo(() => {
    if (filter === "all") return items
    return items.filter((it) => bucketOf(it.type) === filter)
  }, [items, filter])

  return (
    <div className="max-w-3xl mx-auto px-3 py-4">
      {/* Заголовок + фильтры */}
      <div className="mb-3 flex items-center gap-2">
        <h1 className="text-xl font-semibold" style={{ color: "var(--tg-text-color)" }}>
          {L.title}
        </h1>

        <div className="ml-auto flex items-center">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            {L.all}
          </Chip>
          <Chip active={filter === "tx"} onClick={() => setFilter("tx")} ariaLabel={L.tx}>
            <HandCoins size={18} />
          </Chip>
          <Chip active={filter === "edits"} onClick={() => setFilter("edits")} ariaLabel={L.edits}>
            <Edit size={18} />
          </Chip>
          <Chip active={filter === "groups"} onClick={() => setFilter("groups")} ariaLabel={L.groups}>
            <Users size={18} />
          </Chip>
          <Chip active={filter === "users"} onClick={() => setFilter("users")} ariaLabel={L.users}>
            <UserPlus size={18} />
          </Chip>
        </div>
      </div>

      {/* Состояния */}
      {loading && !items.length ? (
        <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-80">{L.loading}</div>
      ) : error ? (
        <div className="flex items-center gap-3">
          <div className="text-[14px] leading-[18px]" style={{ color: "var(--tg-destructive-text,#ef4444)" }}>
            {error}
          </div>
          <button
            onClick={() => fetchEvents(limit)}
            className="px-2 py-1 text-sm rounded border transition bg-transparent border-[var(--tg-hint-color)]"
            style={{ color: "var(--tg-text-color)" }}
          >
            {L.retry}
          </button>
        </div>
      ) : (
        <>
          {/* Лист */}
          <div className="flex flex-col gap-2">
            {filtered.map((it) => {
              const Icon = IconByName[it.icon as keyof typeof IconByName] || Bell
              const dateStr = (() => {
                try {
                  return new Date(it.created_at).toLocaleString()
                } catch {
                  return String(it.created_at)
                }
              })()
              return (
                <div
                  key={it.id}
                  className="rounded-lg border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        border: "1px solid var(--tg-hint-color)",
                        color: "var(--tg-link-color,#2481CC)",
                      }}
                      aria-hidden
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-[var(--tg-text-color)]">{it.title}</div>
                      {it.subtitle ? (
                        <div className="text-xs opacity-70 truncate">{it.subtitle}</div>
                      ) : null}
                    </div>

                    <div className="text-xs opacity-60 shrink-0">{dateStr}</div>
                  </div>
                </div>
              )
            })}

            {!filtered.length && (
              <div className="opacity-60 text-sm px-1 py-2">{L.empty}</div>
            )}
          </div>

          {/* Пагинация: догрузка лимита */}
          <div className="mt-3 flex items-center justify-center">
            {canLoadMore && (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  const next = limit + 50
                  setLimit(next)
                  void fetchEvents(next)
                }}
                className="px-3 py-1.5 text-sm rounded border transition bg-transparent border-[var(--tg-hint-color)]"
                style={{ color: "var(--tg-link-color,#2481CC)" }}
              >
                {L.loadMore}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
