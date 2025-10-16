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
import { useNavigate } from "react-router-dom"
import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"

type FilterKey = "all" | "tx" | "edits" | "groups" | "users"

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

function bucketStyles(type: string) {
  const link = "var(--tg-link-color,#2481CC)"
  const accent = "var(--tg-accent-color,#40A7E3)"
  const common = {
    stripe: link,
    bubbleBg: "rgba(36,129,204,.10)",
    hoverBg: "rgba(36,129,204,.06)",
    iconColor: link,
  }
  const b = bucketOf(type)
  if (b === "edits" || b === "users") {
    return {
      ...common,
      stripe: accent,
      bubbleBg: "rgba(64,167,227,.10)",
      hoverBg: "rgba(64,167,227,.06)",
      iconColor: accent,
    }
  }
  return common
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

function relativeTime(iso: string): string {
  try {
    const d = new Date(iso).getTime()
    const now = Date.now()
    const diff = Math.max(0, now - d)
    const min = Math.floor(diff / 60000)
    const h = Math.floor(min / 60)
    const dd = Math.floor(h / 24)
    if (min < 1) return "только что"
    if (min < 60) return `${min} мин назад`
    if (h < 24) return `${h} ч назад`
    if (dd === 1) return "вчера"
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

type Props = {
  onOpenAll?: () => void
}

export default function DashboardEventsFeed({ onOpenAll }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const filter = useDashboardStore((s) => s.eventsFilter) as FilterKey
  const setFilter = useDashboardStore((s) => s.setEventsFilter)
  const events = useDashboardStore((s) => s.events)
  const loading = useDashboardStore((s) => s.loading.events)
  const error = useDashboardStore((s) => s.error.events || "")
  const load = useDashboardStore((s) => s.loadEvents)

  useEffect(() => {
    if (!events?.length && !loading) void load(20)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const items = useMemo(() => {
    if (filter === "all") return events || []
    return (events || []).filter((it) => bucketOf(it.type) === filter)
  }, [events, filter])

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
        <div className="flex items-center gap-2 mb-2">
          <div
            className="font-semibold"
            style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
          >
            {title}
          </div>

          <div className="ml-auto flex items-center">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              {L.all}
            </Chip>
            <Chip active={filter === "tx"} onClick={() => setFilter("tx")} ariaLabel={L.tx}>
              <HandCoins size={16} />
            </Chip>
            <Chip active={filter === "edits"} onClick={() => setFilter("edits")} ariaLabel={L.edits}>
              <Edit size={16} />
            </Chip>
            <Chip active={filter === "groups"} onClick={() => setFilter("groups")} ariaLabel={L.groups}>
              <Users size={16} />
            </Chip>
            <Chip active={filter === "users"} onClick={() => setFilter("users")} ariaLabel={L.users}>
              <UserPlus size={16} />
            </Chip>
          </div>
        </div>

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
            <div className="flex flex-col gap-2">
              {items.map((it) => {
                const Icon = IconByName[it.icon as keyof typeof IconByName] || Bell
                const styles = bucketStyles(it.type)
                const when = relativeTime(it.created_at)
                const entity = (it.entity || {}) as any
                const route = entity?.route as string | undefined
                const avatarUrl = entity?.avatar_url as string | undefined

                return (
                  <div
                    key={it.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => (route ? navigate(route) : onOpenAll?.())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        route ? navigate(route) : onOpenAll?.()
                      }
                    }}
                    className="relative rounded-lg border px-3 py-2 transition-colors cursor-pointer focus:outline-none focus:ring-2"
                    style={{ borderColor: "var(--tg-hint-color)" }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-1 rounded-l-lg"
                      style={{ background: styles.stripe, opacity: 0.35 }}
                      aria-hidden
                    />

                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="rounded-full border border-[var(--tg-hint-color)] object-cover shrink-0"
                          style={{ width: 32, height: 32 }}
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center rounded-full shrink-0"
                          style={{
                            width: 32,
                            height: 32,
                            background: styles.bubbleBg,
                            color: styles.iconColor,
                            border: "1px solid var(--tg-hint-color)",
                          }}
                          aria-hidden
                        >
                          <Icon size={18} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate" style={{ color: "var(--tg-text-color)" }}>
                          {it.title}
                        </div>
                        {it.subtitle ? (
                          <div className="text-xs opacity-70 truncate">{it.subtitle}</div>
                        ) : null}
                      </div>

                      <div className="text-[11px] opacity-60 shrink-0">{when}</div>
                    </div>

                    <div
                      className="pointer-events-none absolute inset-0 rounded-lg"
                      style={{ background: styles.hoverBg, opacity: 0, transition: "opacity .15s" }}
                    />
                    <style>{`
                      [role="button"].cursor-pointer:hover > div:last-child { opacity: .6; }
                    `}</style>
                  </div>
                )
              })}

              {!items.length && (
                <div className="opacity-60 text-sm px-1 py-2">{empty}</div>
              )}
            </div>

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
