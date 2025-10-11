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

export default function DashboardActivityChart() {
  const period = useDashboardStore((s) => s.activityPeriod)
  const setPeriod = useDashboardStore((s) => s.setActivityPeriod)
  const activity = useDashboardStore((s) => s.activity)
  const loading = useDashboardStore((s) => s.loading.activity)
  const error = useDashboardStore((s) => s.error.activity || null)
  const load = useDashboardStore((s) => s.loadActivity)

  useEffect(() => {
    if (!activity) void load(period)
  }, []) // eslint-disable-line

  const data = useMemo(
    () => (activity?.buckets ?? []).map((b) => ({ date: b.date, count: b.count })),
    [activity]
  )

  return (
    <SafeSection
      title="Активность"
      controls={
        <div className="flex gap-1">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              className={`px-2 py-1 rounded ${period === p ? "bg-white/10" : "bg-white/5"}`}
              onClick={() => {
                setPeriod(p)
                void load(p)
              }}
            >
              {p}
            </button>
          ))}
        </div>
      }
      loading={loading}
      error={error}
      onRetry={() => load(period)}
    >
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="currentColor" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SafeSection>
  )
}
