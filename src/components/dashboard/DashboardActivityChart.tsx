// src/components/dashboard/DashboardActivityChart.tsx
import React, { useEffect, useMemo } from "react"
import { useDashboardStore } from "../../store/dashboardStore"

type PeriodAll = "week" | "month" | "year"
const PERIODS: PeriodAll[] = ["week", "month", "year"]

export default function DashboardActivityChart() {
  const period = useDashboardStore((s) => s.activityPeriod as PeriodAll)
  const setPeriod = useDashboardStore((s) => s.setActivityPeriod)
  const activity = useDashboardStore((s) => s.activity)
  const loading = useDashboardStore((s) => s.loading.activity)
  const errorMessage = useDashboardStore((s) => s.error.activity || "")
  const load = useDashboardStore((s) => s.loadActivity)

  useEffect(() => {
    if (!activity && !loading) void load()
  }, [activity, loading, load])

  const buckets = activity?.buckets ?? []

  // максимум по оси Y (>=1, чтобы не делить на 0)
  const maxY = useMemo(
    () => Math.max(1, buckets.reduce((m: number, b: any) => Math.max(m, Number(b?.count ?? 0)), 0)),
    [buckets]
  )

  // координаты для SVG
  const { points, labels, values } = useMemo(() => {
    const W = 600
    const H = 150  // меньше высота, компактнее
    const P = 22   // внутренние отступы SVG
    const n = buckets.length
    if (n === 0) return { points: [] as Array<[number, number]>, labels: [] as string[], values: [] as number[] }

    const xs = (i: number) => (n === 1 ? W / 2 : P + (i / (n - 1)) * (W - P * 2))
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

    const vals = buckets.map((b: any) => Number(b?.count ?? 0))

    return { points: pts, labels: lbls, values: vals }
  }, [buckets, maxY])

  const hasError = !!errorMessage && buckets.length === 0

  const pathD = useMemo(() => {
    if (points.length === 0) return ""
    return "M " + points.map(([x, y]) => `${x},${y}`).join(" L ")
  }, [points])

  // Цвета из темы Telegram
  const cardBg = "var(--tg-theme-secondary-bg-color, var(--tg-theme-bg-color, #ffffff))"
  const textColor = "var(--tg-theme-text-color, #0f0f0f)"
  const hintColor = "var(--tg-theme-hint-color, #6b7280)"
  const accentColor = "var(--tg-theme-accent-text-color, var(--tg-theme-button-color, #3b82f6))"
  const buttonText = "var(--tg-theme-button-text-color, #ffffff)"

  return (
    <div
      className="rounded-xl border shadow p-3" // компактнее: p-3, меньше отступы
      style={{
        backgroundColor: cardBg,
        color: textColor,
        borderColor: "var(--tg-theme-hint-color, rgba(0,0,0,0.12))",
      }}
    >
      <div className="flex items-center gap-2 mb-2">{/* уменьшил mb */}
        <h3 className="font-semibold text-base">Активность</h3>
        <div className="ml-auto flex gap-1">
          {PERIODS.map((p) => {
            const active = p === period
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-2 py-1 rounded text-sm border"
                style={{
                  backgroundColor: active
                    ? "var(--tg-theme-button-color, #3b82f6)"
                    : "var(--tg-theme-secondary-bg-color, #f3f4f6)",
                  color: active ? buttonText : textColor,
                  borderColor: active
                    ? "var(--tg-theme-button-color, #3b82f6)"
                    : "transparent",
                }}
              >
                {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ color: hintColor }} className="text-sm">Загрузка…</div>
      ) : hasError ? (
        <div className="flex items-center gap-3">
          <div className="text-sm" style={{ color: "var(--tg-theme-destructive-text-color, #ef4444)" }}>
            Виджет «Активность» временно недоступен. Попробуй обновить или нажми «Повторить».
          </div>
          <button
            onClick={() => load()}
            className="px-2 py-1 text-sm rounded border"
            style={{
              backgroundColor: "var(--tg-theme-secondary-bg-color, #f3f4f6)",
              color: textColor,
              borderColor: "transparent",
            }}
          >
            Повторить
          </button>
        </div>
      ) : buckets.length === 0 ? (
        <div className="text-sm" style={{ color: hintColor }}>Нет данных за выбранный период</div>
      ) : (
        <div className="w-full">
          {/* Линейная диаграмма — компактная высота */}
          <div className="h-32 w-full">{/* было h-48 */}
            <svg viewBox="0 0 600 160" className="h-full w-full overflow-visible">
              {/* сетка (2 линии) */}
              <g stroke="currentColor" style={{ color: hintColor, opacity: 0.35 }}>
                <line x1="22" x2="578" y1="52" y2="52" strokeWidth="1" />
                <line x1="22" x2="578" y1="110" y2="110" strokeWidth="1" />
              </g>

              {/* область под кривой */}
              {pathD && (
                <path
                  d={`${pathD} L 578,138 L 22,138 Z`}
                  fill="currentColor"
                  style={{ color: accentColor, opacity: 0.12 }}
                />
              )}

              {/* линия */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="currentColor"
                  style={{ color: accentColor }}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* точки и подписи значений */}
              <g>
                {points.map(([x, y], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="currentColor" style={{ color: accentColor }} />
                    {/* значение над точкой */}
                    <text
                      x={x}
                      y={Math.max(12, y - 8)} // чтобы не уехало за верх
                      fontSize="10"
                      textAnchor="middle"
                      fill={textColor}
                    >
                      {values[i]}
                    </text>
                  </g>
                ))}
              </g>

              {/* подпись 0 и max слева (маленькие, ненавязчивые) */}
              <text x="4" y="56" fontSize="10" fill={hintColor}>{maxY}</text>
              <text x="8" y="142" fontSize="10" fill={hintColor}>0</text>
            </svg>
          </div>

          {/* Ось X — три подписи (меньше отступ) */}
          <div className="mt-1 flex text-[10px]" style={{ color: hintColor }}>
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
