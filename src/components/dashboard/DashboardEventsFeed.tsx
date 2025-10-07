// src/components/dashboard/DashboardEventsFeed.tsx
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../../store/dashboardStore"
import type { DashboardEventFeedItem } from "../../types/dashboard"

type Filter = "all" | "transactions" | "members" | "groups"

function itemMatches(i: DashboardEventFeedItem, f: Filter) {
  if (f === "all") return true
  if (f === "transactions") return i.type.includes("transaction")
  if (f === "members") return i.type.includes("member")
  if (f === "groups") return i.type.includes("group")
  return true
}

export default function DashboardEventsFeed() {
  const { t } = useTranslation()
  const { events, loading } = useDashboardStore((s) => ({
    events: s.events?.items || [],
    loading: !!s.loading?.events,
  }))
  const [filter, setFilter] = useState<Filter>("all")

  const items = useMemo(() => events.filter((i) => itemMatches(i, filter)), [events, filter])

  return (
    <div className="w-full">
      <div className="mb-2 flex gap-2">
        {(["all", "transactions", "members", "groups"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition
            ${filter === f ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "bg-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)]"}`}
          >
            {t(`feed_filter_${f}`)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border"
           style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}>
        {loading ? (
          <div className="text-[var(--tg-hint-color)] px-3 py-4">{t("loading")}</div>
        ) : items.length === 0 ? (
          <div className="text-[var(--tg-hint-color)] px-3 py-4">{t("events_not_found")}</div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
            {items.map((it) => (
              <li key={it.id} className="px-3 py-2">
                <div className="text-[12px] text-[var(--tg-hint-color)]">{new Date(it.created_at).toLocaleString()}</div>
                <div className="text-[14px] font-medium">{it.title}</div>
                {it.subtitle && <div className="text-[12px]">{it.subtitle}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
