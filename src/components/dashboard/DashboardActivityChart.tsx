// src/components/dashboard/DashboardActivityChart.tsx
import React, { useEffect, useMemo } from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useDashboardStore } from "../../store/dashboardStore"

const PERIODS: Array<"week" | "month" | "year"> = ["week", "month", "year"]

type Bucket = { date: string; count: number }

export default function DashboardActivityChart() {
  const period = useDashboardStore((s) => s.activityPeriod)
  const setPeriod = useDashboardStore((s) => s.setActivityPeriod)
  const activity = useDashboardStore((s) => s.activity)
  const loading = useDashboardStore((s) => s.loading.activity)
  const rawError = useDashboardStore((s) => (s as any).error ?? null) as any
  const load = useDashboardStore((s) => s.loadActivity)

  // вытащим "свою" ошибку из разных возможных форматов стора
  const activityError: string | null =
    typeof rawError === "string" ? rawError : rawError?.activity ?? null

  // подгружаем при маунте/если данных ещё нет
  useEffect(() => {
    if (!activity && !loading) void load()
  }, [activity, loading, load])

  const data = useMemo(
    () =>
      ((activity?.buckets ?? []) as Bucket[]).map((b) => ({
        date: b.date,
        count: Number(b.count ?? 0),
      })),
    [activity]
  )

  // считаем ошибкой только если нет собственных данных
  const hasError = Boolean(activityError) && (data.length === 0)

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-base">Активность</h3>
        <div className="ml-auto flex gap-1">
          {PERIODS.map((p) => {
            const active = p === period
            return (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p)
                  // загрузчик сам прочитает период из стора
                  void load()
                }}
                className={
                  "px-2 py-1 rounded text-sm border " +
                  (active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted hover:bg-muted/70 border-transparent")
                }
              >
                {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Загрузка…</div>
      ) : hasError ? (
        <div className="flex items-center gap-3">
          <div className="text-sm text-red-500">
            Виджет «Активность» временно недоступен. Попробуй обновить или нажми «Повторить».
          </div>
          <button
            onClick={() => load()}
            className="px-2 py-1 text-sm rounded border bg-muted hover:bg-muted/70"
          >
            Повторить
          </button>
        </div>
      ) : data.length === 0 ? (
        <div className="text-sm text-muted-foreground">Нет данных за выбранный период</div>
      ) : (
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => (typeof d === "string" ? d.slice(5) : d)}
                fontSize={12}
              />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#activityFill)"
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
