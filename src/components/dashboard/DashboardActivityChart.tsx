// src/components/dashboard/DashboardActivityChart.tsx
import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Coins } from "lucide-react"
import CardSection from "../CardSection"
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
  if (isRu(locale)) return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d)
}
function formatQuarterLabel(d: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d)
}
function getXAxisLabels(period: PeriodAll, locale?: string): string[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === "week") {
    // сегодня, -2, -4, -6 (всего 4 метки; порядок слева-направо как и точки)
    const offs = [0, -2, -4, -6]
    return offs.map((o) => {
      const d = new Date(today)
      d.setDate(d.getDate() + o)
      return formatDayMonth(d, locale)
    })
  }
  if (period === "month") {
    const offs = [-28, -19, -9, 0] // пока без изменений
    return offs.map((o) => {
      const d = new Date(today)
      d.setDate(d.getDate() + o)
      return formatDayMonth(d, locale)
    })
  }
  const y = today.getFullYear()
  const qs = [new Date(y, 0, 1), new Date(y, 3, 1), new Date(y, 6, 1), new Date(y, 9, 1)]
  return qs.map((d) => formatQuarterLabel(d, locale))
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  return `${y}-${m}-${dd}`
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

  // исходные "бакеты" с бэка
  const buckets = activity?.buckets ?? []

  // нормализация для НЕДЕЛИ: фиксированно 7 точек: сегодня, вчера, ..., 6 дней назад
  const weekSeries = useMemo(() => {
    if (period !== "week") return null
    // строим map по дате
    const byDate = new Map<string, number>()
    for (const b of buckets) {
      const raw = String((b as any)?.date ?? "")
      const key = raw.length >= 10 ? raw.slice(0, 10) : raw // "YYYY-MM-DD"
      const count = Number((b as any)?.count ?? 0)
      if (!Number.isFinite(count)) continue
      byDate.set(key, (byDate.get(key) || 0) + count)
    }
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    // порядок слева-направо: сегодня → вчера → ... → -6 дней
    const days: { date: string; count: number }[] = []
    for (let offset = 0; offset <= 6; offset++) {
      const d = new Date(today)
      d.setDate(today.getDate() - offset)
      const key = toYMD(d)
      days.push({ date: key, count: byDate.get(key) || 0 })
    }
    return days
  }, [period, buckets])

  // что рисуем: если неделя — всегда 7 точек из weekSeries, иначе — как есть
  const series = useMemo(() => {
    if (period === "week") return weekSeries ?? []
    // для month/year пока оставляем оригинальные данные
    return (buckets as any[]).map((b) => ({
      date: String(b?.date ?? ""),
      count: Number(b?.count ?? 0),
    }))
  }, [period, weekSeries, buckets])

  // максимум по оси Y (>=1, чтобы не делить на 0)
  const maxY = useMemo(
    () => Math.max(1, series.reduce((m: number, b: any) => Math.max(m, Number(b?.count ?? 0)), 0)),
    [series]
  )

  // координаты для SVG — по нашей "series"
  const { points, values } = useMemo(() => {
    const W = 600
    const H = 150
    const P = 22
    const n = series.length
    if (n === 0) return { points: [] as Array<[number, number]>, values: [] as number[] }

    const xs = (i: number) => (n === 1 ? W / 2 : P + (i / (n - 1)) * (W - P * 2))
    const ys = (v: number) => P + (1 - v / maxY) * (H - P * 2)

    const pts: Array<[number, number]> = series.map((b: any, i: number) => [xs(i), ys(Number(b?.count ?? 0))])
    const vals = series.map((b: any) => Number(b?.count ?? 0))
    return { points: pts, values: vals }
  }, [series, maxY])

  const xLabels = useMemo(() => getXAxisLabels(period, i18n.language), [period, i18n.language])
  const hasError = !!errorMessage && series.length === 0

  const pathD = useMemo(() => {
    if (points.length === 0) return ""
    return "M " + points.map(([x, y]) => `${x},${y}`).join(" L ")
  }, [points])

  return (
    <CardSection noPadding>
      <div className="rounded-lg p-1.5 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
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
                    void load()
                  }}
                  aria-pressed={active}
                  className={[
                    "px-2 py-1 rounded text-sm border transition",
                    active
                      ? "bg-[var(--tg-link-color,#2481CC)] text-white border-[var(--tg-link-color,#2481CC)]"
                      : "bg-transparent text-[var(--tg-text-color)]/90 border-[var(--tg-hint-color)]",
                  ].join(" ")}
                >
                  {p === "week" ? t("period.week") : p === "month" ? t("period.month") : t("period.year")}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-sm" style={{ color: "var(--tg-hint-color)" }}>{t("loading")}</div>
        ) : hasError ? (
          <div className="flex items-center gap-3">
            <div className="text-sm" style={{ color: "var(--tg-destructive-text,#ef4444)" }}>
              {t("dashboard.activity_error")}
            </div>
            <button
              onClick={() => load()}
              className="px-2 py-1 text-sm rounded border transition bg-transparent border-[var(--tg-hint-color)]"
              style={{ color: "var(--tg-text-color)" }}
            >
              {t("retry")}
            </button>
          </div>
        ) : series.length === 0 ? (
          // Пустое состояние — как EmptyTransactions
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
                {/* сетка */}
                <g stroke="currentColor" style={{ color: "var(--tg-hint-color)", opacity: 0.35 }}>
                  <line x1="22" x2="578" y1="52" y2="52" strokeWidth="1" />
                  <line x1="22" x2="578" y1="110" y2="110" strokeWidth="1" />
                </g>

                {/* область под кривой */}
                {pathD && (
                  <path
                    d={`${pathD} L 578,138 L 22,138 Z`}
                    fill="currentColor"
                    style={{ color: "var(--tg-accent-color,#40A7E3)", opacity: 0.12 }}
                  />
                )}

                {/* линия */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="currentColor"
                    style={{ color: "var(--tg-accent-color,#40A7E3)" }}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}

                {/* точки и подписи значений */}
                <g>
                  {points.map(([x, y], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r="3" fill="currentColor" style={{ color: "var(--tg-accent-color,#40A7E3)" }} />
                      <text
                        x={x}
                        y={Math.max(12, y - 8)}
                        fontSize="10"
                        textAnchor="middle"
                        fill="var(--tg-text-color)"
                      >
                        {values[i]}
                      </text>
                    </g>
                  ))}
                </g>

                {/* подпись 0 и max слева */}
                <text x="4" y="56" fontSize="10" fill="var(--tg-hint-color)">{maxY}</text>
                <text x="8" y="142" fontSize="10" fill="var(--tg-hint-color)">0</text>
              </svg>
            </div>

            {/* Ось X — 4 подписи */}
            <div className="mt-1 flex text-[10px]" style={{ color: "var(--tg-hint-color)" }}>
              {xLabels.map((lbl, i) => (
                <div key={`lbl-${i}`} className="flex-1 text-center">
                  {lbl}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardSection>
  )
}
