// src/components/dashboard/DashboardActivityChart.tsx
import React from "react"
import { useDashboardStore } from "../../store/dashboardStore"

type Period = "day" | "week" | "month" | "year"
const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "День" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "year", label: "Год" },
]

// безопасно превращаем дату в "dd.mm"
function toDdMm(input: unknown): string {
  if (typeof input === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input)
    if (m) return `${m[3]}.${m[2]}`
  }
  const d = new Date(String(input))
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    return `${dd}.${mm}`
  }
  return String(input ?? "")
}

export default function DashboardActivityChart() {
  const {
    activity,
    activityPeriod,
    loading,
    error,
    loadActivity,
    setActivityPeriod,
  } = useDashboardStore((s) => ({
    activity: s.activity,
    activityPeriod: s.activityPeriod,
    loading: s.loading,
    error: s.error,
    loadActivity: s.loadActivity,
    setActivityPeriod: s.setActivityPeriod,
  }))

  React.useEffect(() => {
    void loadActivity()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bucketsRaw = activity?.buckets ?? []
  const buckets = React.useMemo(
    () =>
      Array.isArray(bucketsRaw)
        ? bucketsRaw.map((b: any) => ({
            date: toDdMm(b?.date),
            count: Number(b?.count) || 0,
          }))
        : [],
    [bucketsRaw]
  )

  const max = React.useMemo(
    () => Math.max(1, ...buckets.map((b) => b.count)),
    [buckets]
  )
  const labelStep = React.useMemo(() => {
    const n = buckets.length
    if (n <= 6) return 1
    return Math.ceil(n / 6)
  }, [buckets])

  const isLoading = !!loading.activity
  const errMsg = error.activity || ""
  const isError = !isLoading && !!errMsg
  const isEmpty = !isLoading && !isError && buckets.length === 0

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      {/* header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-white/90 font-medium">Активность</div>
        <div className="flex gap-1">
          {PERIODS.map((p) => {
            const active = activityPeriod === p.key
            return (
              <button
                key={p.key}
                onClick={() => setActivityPeriod(p.key)}
                className={
                  active
                    ? "rounded-md px-2 py-1 text-xs bg-white/15 text-white"
                    : "rounded-md px-2 py-1 text-xs bg-white/5 text-white/70 hover:bg-white/10"
                }
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* loading */}
      {isLoading && (
        <div className="h-44 w-full pl-4 flex items-end gap-[6px]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 h-full flex items-end">
              <div
                className="w-full rounded-t-[6px] bg-white/15 animate-pulse"
                style={{ height: `${Math.max(10, (i % 10) * 8)}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* error */}
      {isError && (
        <div className="flex h-44 flex-col items-center justify-center gap-2 text-center">
          <div className="text-white/80">
            Виджет «Активность» временно недоступен.
          </div>
          <div className="text-white/50 text-sm">{errMsg}</div>
          <button
            onClick={() => loadActivity()}
            className="mt-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15"
          >
            Повторить
          </button>
        </div>
      )}

      {/* empty */}
      {isEmpty && (
        <div className="flex h-44 items-center justify-center text-white/60">
          Нет данных за выбранный период
        </div>
      )}

      {/* chart */}
      {!isLoading && !isError && buckets.length > 0 && (
        <div className="relative">
          {/* grid */}
          <div className="absolute inset-0">
            {[0, 25, 50, 75, 100].map((p) => (
              <div
                key={p}
                className="absolute left-0 right-0 border-t border-white/10"
                style={{ bottom: `${p}%` }}
              />
            ))}
          </div>

          {/* bars */}
          <div className="h-44 w-full pl-4">
            <ul className="m-0 flex h-full list-none items-end gap-[6px] p-0">
              {buckets.map((b, i) => {
                const h = Math.max(4, Math.round((b.count / max) * 100))
                return (
                  <li key={i} className="flex-1 h-full flex items-end">
                    <div
                      aria-label={`${b.date}: ${b.count}`}
                      className="w-full rounded-t-[6px] bg-white/70"
                      style={{ height: `${h}%` }}
                    />
                  </li>
                )
              })}
            </ul>
          </div>

          {/* labels */}
          <div
            className="mt-2 grid text-[10px] text-white/60"
            style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0,1fr))` }}
          >
            {buckets.map((b, i) => (
              <div key={`lbl-${i}`} className="text-center">
                {i % labelStep === 0 ? b.date : ""}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

