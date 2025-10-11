import { useMemo, useEffect } from "react"
import { useDashboardStore } from "../../store/dashboardStore"
import SafeSection from "../SafeSection"

function itemMatches(
  it: { type: string; title: string; subtitle?: string | null },
  filter: string
) {
  if (!filter || filter === "all") return true
  const q = filter.toLowerCase()
  return (
    it.type.toLowerCase().includes(q) ||
    it.title.toLowerCase().includes(q) ||
    (it.subtitle ?? "").toLowerCase().includes(q)
  )
}

export default function DashboardEventsFeed() {
  const filter = useDashboardStore((s) => s.eventsFilter)
  const setFilter = useDashboardStore((s) => s.setEventsFilter)
  const eventsRaw = useDashboardStore((s) => s.events)
  const loading = useDashboardStore((s) => s.loading.events)
  const error = useDashboardStore((s) => s.error.events || null)
  const load = useDashboardStore((s) => s.loadEvents)

  useEffect(() => {
    if (!eventsRaw) void load()
  }, []) // eslint-disable-line

  const events = eventsRaw ?? []
  const items = useMemo(() => events.filter((i) => itemMatches(i, filter)), [events, filter])

  return (
    <SafeSection
      title="Лента"
      controls={
        <input
          className="bg-white/5 rounded px-2 py-1 text-sm"
          placeholder="Фильтр"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      }
      loading={loading}
      error={error}
      onRetry={() => load()}
    >
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl bg-white/5 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{it.title}</div>
                {it.subtitle ? (
                  <div className="text-xs opacity-70 truncate">{it.subtitle}</div>
                ) : null}
              </div>
              <div className="text-xs opacity-60 shrink-0">
                {new Date(it.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        {!items.length && !loading && <div className="opacity-60 text-sm">Пусто</div>}
      </div>
    </SafeSection>
  )
}
