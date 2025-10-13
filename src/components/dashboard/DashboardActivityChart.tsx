// src/components/dashboard/DashboardActivityChart.tsx
import React, { useEffect, useMemo } from "react"
import { useDashboardStore } from "../../store/dashboardStore"

type PeriodAll = "day" | "week" | "month" | "year"

// оставляем только Week / Month / Year в UI
const PERIODS: PeriodAll[] = ["week", "month", "year"]

export default function DashboardActivityChart() {
  const period = useDashboardStore((s) => s.activityPeriod)
  const setPeriod = useDashboardStore((s) => s.setActivityPeriod)
  const activity = useDashboardStore((s) => s.activity)
  const loading = useDashboardStore((s) => s.loading.activity)
  const errorMessage = useDashboardStore((s) => s.error.activity || "")
  const load = useDashboardStore((s) => s.loadActivity)

  useEffect(() => {
    if (!activity && !loading) void load()
  }, [activity, loading, load])

  const buckets = activity?.buckets ?? []

  // максимум по оси Y
  const maxY = useMemo(
    () => Math.max(1, buckets.reduce((m: number, b: any) => Math.max(m, Number(b?.count ?? 0)), 0)),
    [buckets]
  )

  // подготовим точки для SVG (адаптивная ширина через viewBox)
  const { points, labels } = useMemo(() => {
    const W = 600
    const H = 180
    const P = 24 // padding
    const n = buckets.length
    if (n === 0) return { points: [] as Array<[number, number]>, labels: [] as string[] }

    const xs = (i: number) =>
      n === 1 ? W / 2 : P + (i / (n - 1)) * (W - P * 2)
    const ys = (v: number) => P + (1 - v / maxY) * (H - P * 2)

    const pts: Array<[number, number]> = buckets.map((b: any, i: number) => [
      xs(i),
      ys(Number(b?.count ?? 0)),
    ])

    const lbls = buckets.map((b: any, i: number) => {
      const d = String(b?.date ?? "")
      const show = i === 0 || i === Math.floor(n / 2) || i === n - 1
      return show ? d.slice(5) : ""
    })

    return { points: pts, labels: lbls }
  }, [buckets, maxY])

  const hasError = !!errorMessage && buckets.length === 0

  // path для линии
  const pathD = useMemo(() => {
    if (points.length === 0) return ""
    return "M " + points.map(([x, y]) => `${x},${y}`).join(" L ")
  }, [points])

  return (
    <div className="rounded-xl border bg-white text-black shadow p-4">
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
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 hover:bg-gray-200 border-transparent")
              }
            >
              {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Загрузка…</div>
      ) : hasError ? (
        <div className="flex items-center gap-3">
          <div className="text-sm text-red-500">
            Виджет «Активность» временно недоступен. Попробуй обновить или нажми «Повторить».
          </div>
          <button
            onClick={() => load()}
            className="px-2 py-1 text-sm rounded border bg-gray-100 hover:bg-gray-200"
          >
            Повторить
          </button>
        </div>
      ) : buckets.length === 0 ? (
        <div className="text-sm text-gray-500">Нет данных за выбранный период</div>
      ) : (
        <div className="w-full">
          {/* Линейная диаграмма */}
          <div className="h-48 w-full">
            <svg viewBox="0 0 600 200" className="h-full w-full overflow-visible">
              {/* сетка (3 горизонтальные линии) */}
              <g stroke="currentColor" className="text-gray-200">
                <line x1="24" x2="576" y1="48" y2="48" strokeWidth="1" />
                <line x1="24" x2="576" y1="100" y2="100" strokeWidth="1" />
                <line x1="24" x2="576" y1="152" y2="152" strokeWidth="1" />
              </g>

              {/* область под кривой */}
              {pathD && (
                <path
                  d={`${pathD} L 576,176 L 24,176 Z`}
                  className="fill-blue-500/10"
                  stroke="none"
                />
              )}

              {/* линия */}
              {pathD && (
                <path
                  d={pathD}
                  className="stroke-blue-600"
                  strokeWidth="2"
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* точки */}
              <g>
                {points.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="3" className="fill-blue-600" />
                ))}
              </g>

              {/* подпись максимума слева */}
              <text x="0" y="44" className="fill-gray-400 text-[10px] select-none">
                {maxY}
              </text>
              <text x="8" y="178" className="fill-gray-400 text-[10px] select-none">
                0
              </text>
            </svg>
          </div>

          {/* Ось X — три подписи: первая/середина/последняя */}
          <div className="mt-2 flex text-[10px] text-gray-500">
            {labels.map((lbl, i) => (
              <div key={`lbl-${i}`} className="flex-1 text-center">
                {lbl}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
