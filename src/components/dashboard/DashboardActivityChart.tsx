// src/components/dashboard/DashboardActivityChart.tsx
import React, { useEffect, useMemo } from "react"
import { useDashboardStore } from "../../store/dashboardStore"

type PeriodAll = "day" | "week" | "month" | "year"
const PERIODS: PeriodAll[] = ["day", "week", "month", "year"]

export default function DashboardActivityChart() {
  const period = useDashboardStore((s) => s.activityPeriod)
  const setPeriod = useDashboardStore((s) => s.setActivityPeriod)
  const activity = useDashboardStore((s) => s.activity)
  const loading = useDashboardStore((s) => s.loading.activity)
  const error = useDashboardStore((s) => s.error.activity)
  const load = useDashboardStore((s) => s.loadActivity)

  useEffect(() => {
    if (!activity && !loading) void load()
  }, [activity, loading, load])

  const buckets = activity?.buckets ?? []
  const max = useMemo(
    () => buckets.reduce((m: number, b: any) => Math.max(m, Number(b?.count ?? 0)), 0),
    [buckets]
  )

  const hasError = !!error && buckets.length === 0

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-base">Активность</h3>
        <div className="ml-auto flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={
                "px-2 py-1 rounded text-sm border " +
                (p === period
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted hover:bg-muted/70 border-transparent")
              }
            >
              {p === "day" ? "День" : p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
            </button>
          ))}
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
      ) : buckets.length === 0 ? (
        <div className="text-sm text-muted-foreground">Нет данных за выбранный период</div>
      ) : (
        <div className="w-full">
          {/* простой столбчатый чартик без сторонних библиотек */}
          <div className="h-40 w-full flex items-end gap-[6px]">
            {buckets.map((b: any, i: number) => {
              const v = Number(b?.count ?? 0)
              const h = max > 0 ? Math.round((v / max) * 100) : 0
              return (
                <div key={`${b?.date ?? i}`} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t bg-primary/70"
                    style={{ height: `${Math.max(4, h)}%` }}
                    title={`${b?.date ?? ""}: ${v}`}
                  />
                </div>
              )
            })}
          </div>
          {/* подписи оси X — первая/середина/последняя */}
          <div className="mt-2 flex text-[10px] text-muted-foreground">
            {buckets.map((b: any, i: number) => {
              const label =
                i === 0 || i === Math.floor(buckets.length / 2) || i === buckets.length - 1
                  ? String(b?.date ?? "").slice(5)
                  : ""
              return (
                <div key={`lbl-${b?.date ?? i}`} className="flex-1 text-center">
                  {label}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

