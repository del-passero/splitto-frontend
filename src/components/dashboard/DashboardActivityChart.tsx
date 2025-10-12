// src/components/dashboard/DashboardActivityChart.tsx
import { useEffect, useMemo } from "react"
import { useDashboardStore } from "../../store/dashboardStore"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import type { PeriodAll } from "../../types/dashboard"

const PERIODS: PeriodAll[] = ["day", "week", "month", "year"]

export default function DashboardActivityChart() {
  const period = useDashboardStore((s) => s.activityPeriod)
  const setPeriod = useDashboardStore((s) => s.setActivityPeriod)
  const activity = useDashboardStore((s) => s.activity)
  const loading = useDashboardStore((s) => s.loading.activity)
  const error = useDashboardStore((s) => s.error.activity || null)
  const load = useDashboardStore((s) => s.loadActivity)

  useEffect(() => {
    if (!activity) void load(period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const data = useMemo(
    () => (activity?.buckets ?? []).map((b) => ({ date: b.date, count: Number(b.count || 0) })),
    [activity]
  )

  return (
    <div className="rounded-2xl shadow p-3 bg-[var(--tg-card-bg,#1f1f1f)] w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm opacity-70">Активность</div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p)
                void load(p)
              }}
              className={[
                "px-2 py-1 rounded text-xs",
                p === period ? "bg-white/10" : "hover:bg-white/5",
              ].join(" ")}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-2">
          <div className="text-red-400 text-sm truncate">{error}</div>
          <button
            className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm shrink-0"
            onClick={() => void load(period)}
          >
            Повторить
          </button>
        </div>
      ) : loading ? (
        <div className="text-sm opacity-80">Загрузка…</div>
      ) : (
        <div className="w-full">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={Array.isArray(data) ? data : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="currentColor" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {(!data || data.length === 0) && (
            <div className="opacity-60 text-sm mt-2">Пока нет активности за выбранный период</div>
          )}
        </div>
      )}
    </div>
  )
}
