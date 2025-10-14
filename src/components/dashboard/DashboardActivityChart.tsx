import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Coins } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"

type PeriodAll = "week" | "month" | "year"
const PERIODS: PeriodAll[] = ["week", "month", "year"]

// ---- helpers for X axis labels (always 4) ----
function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}
function isRu(locale?: string) {
  return (locale || "ru").toLowerCase().startsWith("ru")
}
function formatDayMonth(d: Date, locale?: string) {
  if (isRu(locale)) {
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`
  }
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d)
}
function formatQuarterLabel(d: Date, locale?: string) {
  // "1 янв" / "1 Jan" и т.п.
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d)
}
function getXAxisLabels(period: PeriodAll, locale?: string): string[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === "week") {
    const offs = [-6, -4, -2, 0]
    return offs.map((o) => {
      const d = new Date(today)
      d.setDate(d.getDate() + o)
      return formatDayMonth(d, locale)
    })
  }
  if (period === "month") {
    const offs = [-28, -19, -9, 0]
    return offs.map((o) => {
      const d = new Date(today)
      d.setDate(d.getDate() + o)
      return formatDayMonth(d, locale)
    })
  }
  // year: current calendar year, quarter starts
  const y = today.getFullYear()
  const qs = [new Date(y, 0, 1), new Date(y, 3, 1), new Date(y, 6, 1), new Date(y, 9, 1)]
  return qs.map((d) => formatQuarterLabel(d, locale))
}

export default function DashboardActivityChart() {
  const { t, i18n } = useTranslation()
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
  const { points, values } = useMemo(() => {
    const W = 600
    const H = 150
    const P = 22
    const n = buckets.length
    if (n === 0) return { points: [] as Array<[number, number]>, values: [] as number[] }

    const xs = (i: number) => (n === 1 ? W / 2 : P + (i / (n - 1)) * (W - P * 2))
    const ys = (v: number) => P + (1 - v / maxY) * (H - P * 2)

    const pts: Array<[number, number]> = buckets.map((b: any, i: number) => [
      xs(i),
      ys(Number(b?.count ?? 0)),
    ])
    const vals = buckets.map((b: any) => Number(b?.count ?? 0))

    return { points: pts, values: vals }
  }, [buckets, maxY])

  const xLabels = useMemo(() => getXAxisLabels(period, i18n.language), [period, i18n.language])

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
      className="rounded-lg p-1.5 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]"
      style={{
        backgroundColor: cardBg,
        color: textColor,
      }}
    >
      {/* Заголовок + чипы периода */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="font-semibold"
          style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
        >
          {t("dashboard.activity")}
        </div>

        <div className="ml-auto flex gap-1">
          {PERIODS.map((p) => {
            const active = p === period
            return (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p)
                  void load() // безопасно, стор может иметь TTL
                }}
                aria-pressed={active}
                className="px-2 py-1 rounded text-sm border transition"
                style={{
                  backgroundColor: active
                    ? "var(--tg-theme-button-color, #3b82f6)"
                    : "var(--tg-theme-secondary-bg-color, #f3f4f6)",
                  color: active ? buttonText : textColor,
                  borderColor: active ? "var(--tg-theme-button-color, #3b82f6)" : "transparent",
                }}
              >
                {p === "week" ? t("period.week") : p === "month" ? t("period.month") : t("period.year")}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ color: hintColor }} className="text-sm">{t("loading")}</div>
      ) : hasError ? (
        <div className="flex items-center gap-3">
          <div className="text-sm" style={{ color: "var(--tg-theme-destructive-text-color, #ef4444)" }}>
            {t("dashboard.activity_error")}
          </div>
          <button
            onClick={() => load()}
            className="px-2 py-1 text-sm rounded border transition"
            style={{
              backgroundColor: "var(--tg-theme-secondary-bg-color, #f3f4f6)",
              color: textColor,
              borderColor: "transparent",
            }}
          >
            {t("retry")}
          </button>
        </div>
      ) : buckets.length === 0 ? (
        // Пустое состояние как в EmptyTransactions
        <div className="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
          <div className="mb-4 opacity-60">
            <Coins size={56} className="text-[var(--tg-link-color)]" />
          </div>
          <div className="text-lg font-semibold mb-2 text-[var(--tg-text-color)]">
            {t("dashboard.activity_empty_title")}
          </div>
        </div>
      ) : (
        <div className="w-full">
          {/* Линейная диаграмма — компактная высота */}
          <div className="h-32 w-full">
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
                    <text
                      x={x}
                      y={Math.max(12, y - 8)}
                      fontSize="10"
                      textAnchor="middle"
                      fill={textColor}
                    >
                      {values[i]}
                    </text>
                  </g>
                ))}
              </g>

              {/* подпись 0 и max слева */}
              <text x="4" y="56" fontSize="10" fill={hintColor}>{maxY}</text>
              <text x="8" y="142" fontSize="10" fill={hintColor}>0</text>
            </svg>
          </div>

          {/* Ось X — ровно 4 подписи */}
          <div className="mt-1 flex text-[10px]" style={{ color: hintColor }}>
            {xLabels.map((lbl, i) => (
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
