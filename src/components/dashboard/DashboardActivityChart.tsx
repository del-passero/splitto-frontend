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

// Безопасное форматирование даты -> "dd.mm"
function trimDate(value: unknown): string {
  if (value == null) return ""
  let s: string
  if (typeof value === "string") s = value
  else if (value instanceof Date) s = value.toISOString()
  else if (typeof value === "number") s = new Date(value).toISOString()
  else s = String(value)

  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (m) return `${m[3]}.${m[2]}`

  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    return `${dd}.${mm}`
  }
  return s
}

export default function DashboardActivityChart() {
  const {
    activity,
    activityPeriod,
    loadActivity,
    setActivityPeriod,
    loading,
    error,
  } = useDashboardStore((s) => ({
    activity: s.activity,
    activityPeriod: s.activityPeriod,
    loadActivity: s.loadActivity,
    setActivityPeriod: s.setActivityPeriod,
    loading: s.loading,
    error: s.error,
  }))

  React.useEffect(() => {
    // первый рендер — подгрузим (TTL в сторе защитит от лишнего)
    void loadActivity()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const buckets = activity?.buckets ?? []
  const maxCount = React.useMemo(() => {
    const arr = buckets.map((b: any) => Number(b?.count) || 0)
    return Math.max(1, ...arr, 0)
  }, [buckets])

  // подписи X не чаще чем ~6 штук
  const labelStep = React.useMemo(() => {
    const n = buckets.length
    if (n <= 6) return 1
    return Math.ceil(n / 6)
  }, [buckets.length])

  // ---------- UI helpers ----------
  const renderHeader = () => (
    <div className="mb-3 flex items-center justify-between">
      <div className="text-white/90 font-medium">Активность</div>
      <div className="flex gap-1">
        {PERIODS.map((p) => {
          const active = activityPeriod === p.key
          return (
            <button
              key={p.key}
              onClick={() => setActivityPeriod(p.key)}
              className={[
                "rounded-md px-2 py-1 text-xs transition",
                active
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10",
              ].join(" ")}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderLoading = () => (
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
  )

  const renderError = (msg: string) => (
    <div className="flex h-44 flex-col items-center justify-center gap-2 text-center">
      <div className="text-white/80">
        Виджет «Активность» временно недоступен.
      </div>
      <div className="text-white/50 text-sm">{msg}</div>
      <button
        onClick={() => loadActivity()}
        className="mt-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15"
      >
        Повторить
      </button>
    </div>
  )

  const renderEmpty = () => (
    <div className="flex h-44 items-center justify-center text-white/60">
      Нет данных за выбранный период
    </div>
  )

  const renderChart = () => (
    <div className="relative">
      {/* сетка по Y */}
      <div className="absolute inset-0">
        {[0, 25, 50, 75, 100].map((p) => (
          <div
            key={p}
            className="absolute left-0 right-0 border-t border-white/10"
            style={{ bottom: `${p}%` }}
          />
        ))}
      </div>

      {/* бары */}
      <div className="h-44 w-full pl-4">
        <div className="flex h-full items-end gap-[6px]">
          {buckets.map((b: any, i: number) => {
            const v = Number(b?.count) || 0
            const h = Math.max(4, Math.round((v / maxCount) * 100))
            return (
              <div key={`${b?.date ?? i}`} className="flex-1 h-full flex items-end">
                <div
                  title={`${trimDate(b?.date)}: ${v}`}
                  className="w-full rounded-t-[6px] bg-white/70"
                  style={{ height: `${h}%` }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* подписи X */}
      {buckets.length > 0 && (
        <div className="mt-2 flex justify-between pl-4 text-[10px] text-white/60">
          {buckets.map((b: any, i: number) => (
            <span key={`lbl-${i}`} className="flex-1 text-center">
              {i % labelStep === 0 ? trimDate(b?.date) : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  // ---------- render ----------
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      {renderHeader()}

      {loading.activity
        ? renderLoading()
        : error.activity
        ? renderError(error.activity || "")
        : buckets.length === 0
        ? renderEmpty()
        : renderChart()}
    </div>
  )
}
