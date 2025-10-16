// src/components/dashboard/DashboardEventsFeed.tsx
import React, { useEffect, useMemo } from "react"
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
import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"

/* ===== тип фильтра (в сторе хранится строкой) ===== */
type FilterKey = "all" | "tx" | "edits" | "groups" | "users"

/* ===== иконка события из строки backend'а ===== */
const IconByName: Record<string, React.ComponentType<any>> = {
  Bell,
  PlusCircle,
  Edit,
  Users,
  Archive,
  UserPlus,
  UserMinus,
  FileText,
  HandCoins, // добавлено: чтобы события с этой иконкой рендерились без фолбэка
}

/* ===== определение «ведёрка» для фильтра ===== */
function bucketOf(type: string): Exclude<FilterKey, "all"> | null {
  const t = (type || "").toLowerCase()
  if (t.startsWith("transaction_") || t.includes("receipt")) return "tx"
  if (t.endsWith("_updated") || t.includes("updated")) return "edits"
  if (t.startsWith("group_")) return "groups"
  if (t.startsWith("member_") || t.includes("user")) return "users"
  return null
}

/* ===== кнопка-чип ===== */
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
        "inline-flex items-center h-7 px-3 mr-2 rounded-full text-xs select-none transition-colors",
        active
          ? "bg-[var(--tg-link-color,#2481CC)] text-white"
          : "bg-transparent text-[var(--tg-text-color)]/80 border border-[var(--tg-hint-color)]",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

type Props = {
  /** Клик по ленте ведёт на страницу «Все события» */
  onOpenAll?: () => void
}

export default function DashboardEventsFeed({ onOpenAll }: Props) {
  const { t } = useTranslation()

  const filter = useDashboardStore((s) => s.eventsFilter) as FilterKey
  const setFilter = useDashboardStore((s) => s.setEventsFilter)
  const events = useDashboardStore((s) => s.events)
  const loading = useDashboardStore((s) => s.loading.events)
  const error = useDashboardStore((s) => s.error.events || "")
  const load = useDashboardStore((s) => s.loadEvents)

  // первичная загрузка
  useEffect(() => {
    if (!events?.length && !loading) void load(20)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // отфильтрованный список
  const items = useMemo(() => {
    if (filter === "all") return events || []
    return (events || []).filter((it) => bucketOf(it.type) === filter)
  }, [events, filter])

  // лейблы фильтров
  const L = {
    all: t("dashboard.filter_all") || "Все",
    tx: t("dashboard.filter_tx") || "Транзакции",
    edits: t("dashboard.filter_edits") || "Редактирования",
    groups: t("dashboard.filter_groups") || "Группы",
    users: t("dashboard.filter_users") || "Юзеры",
  }

  const title = t("dashboard.events_feed") || "Лента событий"
  const seeAll = t("dashboard.see_all_events") || "Все события"
  const empty = t("dashboard.no_events") || "Событий пока нет"

  return (
    <CardSection noPadding>
      <div className="rounded-lg p-1.5 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
        {/* Заголовок + чипы-фильтры */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="font-semibold"
            style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
          >
            {title}
          </div>

          <div className="ml-auto flex items-center">
            {/* «Все» — с текстом */}
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              {L.all}
            </Chip>

            {/* Остальные — только иконки (без текста), с aria-label */}
            <Chip
              active={filter === "tx"}
              onClick={() => setFilter("tx")}
              ariaLabel={L.tx}
            >
              <HandCoins size={16} />
            </Chip>

            <Chip
              active={filter === "edits"}
              onClick={() => setFilter("edits")}
              ariaLabel={L.edits}
            >
              <Edit size={16} />
            </Chip>

            <Chip
              active={filter === "groups"}
              onClick={() => setFilter("groups")}
              ariaLabel={L.groups}
            >
              <Users size={16} />
            </Chip>

            <Chip
              active={filter === "users"}
              onClick={() => setFilter("users")}
              ariaLabel={L.users}
            >
              {/* Для «Юзеры» используем Users тоже — можно заменить на User, если хотите */}
              <UserPlus size={16} />
            </Chip>
          </div>
        </div>

        {/* Состояния */}
        {loading ? (
          <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-80">
            {t("loading")}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3">
            <div className="text-[14px] leading-[18px]" style={{ color: "var(--tg-destructive-text,#ef4444)" }}>
              {error}
            </div>
            <button
              onClick={() => load(20)}
              className="px-2 py-1 text-sm rounded border transition bg-transparent border-[var(--tg-hint-color)]"
              style={{ color: "var(--tg-text-color)" }}
            >
              {t("retry") || "Повторить"}
            </button>
          </div>
        ) : (
          <>
            {/* Вся лента — кликабельна (ведёт на «Все события») */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onOpenAll?.()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onOpenAll?.()
                }
              }}
              className="rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--tg-link-color,#2481CC)]"
            >
              <div className="flex flex-col gap-2 cursor-pointer">
                {items.map((it) => {
                  const Icon =
                    IconByName[it.icon as keyof typeof IconByName] ||
                    Bell // фолбэк
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
                        {/* слева — иконка события в кружке */}
                        <div
                          className="flex items-center justify-center rounded-full shrink-0"
                          style={{
                            width: 32,
                            height: 32,
                            border: "1px solid var(--tg-hint-color)",
                            color: "var(--tg-link-color,#2481CC)",
                          }}
                          aria-hidden
                        >
                          <Icon size={18} />
                        </div>

                        {/* текст/сабтайтл */}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate text-[var(--tg-text-color)]">{it.title}</div>
                          {it.subtitle ? (
                            <div className="text-xs opacity-70 truncate">{it.subtitle}</div>
                          ) : null}
                        </div>

                        {/* дата */}
                        <div className="text-xs opacity-60 shrink-0">{dateStr}</div>
                      </div>
                    </div>
                  )
                })}

                {!items.length && (
                  <div className="opacity-60 text-sm px-1 py-2">{empty}</div>
                )}
              </div>
            </div>

            {/* Линк «Все события» (на случай, если не кликнули по области) */}
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => onOpenAll?.()}
                className="text-[13px] underline underline-offset-2 opacity-80 hover:opacity-100 transition"
                style={{ color: "var(--tg-link-color,#2481CC)" }}
              >
                {seeAll}
              </button>
            </div>
          </>
        )}
      </div>
    </CardSection>
  )
}
