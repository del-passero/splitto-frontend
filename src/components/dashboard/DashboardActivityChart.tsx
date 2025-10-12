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
import SafeSection from "../SafeSection"
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

  const PeriodButtons = (
    <div className="flex gap-1 justify-end mb-2">
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
  )

  return (
    <SafeSection
      title="Активность"
      loading={loading}
      error={error}
      onRetry={() => load(period)}
    >
      {PeriodButtons}
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
      {!loading && (!data || data.length === 0) ? (
        <div className="opacity-60 text-sm mt-2">Пока нет активности за выбранный период</div>
      ) : null}
    </SafeSection>
  )
}
