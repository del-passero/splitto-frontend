// src/components/dashboard/DashboardActivityChart.tsx
import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Coins } from "lucide-react"
import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"

type PeriodAll = "week" | "month" | "year"
const PERIODS: PeriodAll[] = ["week", "month", "year"]

/* ===== helpers ===== */
function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Формат даты как на TransactionCard (использует date_card.months и date_card.pattern) */
function formatCardDateLike(d: Date, t: (k: string, o?: any) => any): string {
  try {
    const monthsRaw = t("date_card.months", { returnObjects: true }) as unknown
    const months = Array.isArray(monthsRaw) ? (monthsRaw as string[]) : null

    let patternStr = "{{day}} {{month}}"
    const maybe = t("date_card.pattern")
    if (typeof maybe === "string" && maybe.trim() && maybe !== "date_card.pattern") {
      patternStr = maybe
    }

    if (months && months.length === 12) {
      const day = String(d.getDate())
      const month = months[d.getMonth()]
      return patternStr.replace("{{day}}", day).replace("{{month}}", month)
    }
  } catch { /* ignore */ }

  try {
    return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short" }).format(d)
  } catch {
    return d.toLocaleDateString()
  }
}

/** 4 метки для month/year (пока месяц/год не трогаем по данным) */
function getXAxisLabelsCoarse(period: PeriodAll, t: (k: string, o?: any) => any): string[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === "month") {
    const offs = [-28, -19, -9, 0]
    return offs.map((o) => {
      const d = new Date(today); d.setDate(d.getDate() + o)
      return formatCardDateLike(d, t)
    })
  }
  if (period === "year") {
    const y = today.getFullYear()
    const qs = [new Date(y, 0, 1), new Date(y, 3, 1), new Date(y, 6, 1), new Date(y, 9, 1)]
    return qs.map((d) => formatCardDateLike(d, t))
  }
  return []
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

  /* ===== series =====
     Неделя: всегда 7 точек — сегодня, вчера, …, 6 дней назад (слева-направо).
     Месяц/год пока как пришло с бэка. */
  const series = useMemo(() => {
    if (period === "week") {
      const map = new Map<string, number>()
      for (const b of buckets) {
        const raw = String((b as any)?.date ?? "")
        const key = raw.length >= 10 ? raw.slice(0, 10) : raw
        const count = Number((b as any)?.count ?? 0)
        if (!Number.isFinite(count)) continue
        map.set(key, (map.get(key) || 0) + count)
      }
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const out: { date: string; count: number }[] = []
      for (let offset = 0; offset <= 6; offset++) {
        const d = new Date(today); d.setDate(today.getDate() - offset)
        const key = toYMD(d)
        out.push({ date: key, count: map.get(key) || 0 })
      }
      return out
    }
    // month/year — как есть
    return (buckets as any[]).map((b) => ({
      date: String(b?.date ?? ""),
      count: Number(b?.count ?? 0),
    }))
  }, [period, buckets])

  /* подписи по оси X:
     - неделя: 7 подписей (каждая точка)
     - месяц/год: 4 «крупные» */
  const xLabels = useMemo(() => {
    if (period === "week") {
      return series.map((pt) => {
        const [y, m, d] = pt.date.split("-").map((x: string) => Number(x))
        const date = Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)
          ? new Date(y, m - 1, d)
          : new Date(pt.date)
        return formatCardDateLike(date, t as any)
      })
    }
    return getXAxisLabelsCoarse(period, t as any)
  }, [period, series, t])

  /* Y-max */
  const maxY = useMemo(
    () => Math.max(1, series.reduce((m: number, b: any) => Math.max(m, Number(b?.count ?? 0)), 0)),
    [series]
  )

  /* координаты */
  const { points, values } = useMemo(() => {
    const W = 600
    const H = 160
    const P = 22
    const n = series.length
    if (n === 0) return { points: [] as Array<[number, number]>, values: [] as number[] }

    const xs = (i: number) => (n === 1 ? W / 2 : P + (i / (n - 1)) * (W - P * 2))
    const ys = (v: number) => P + (1 - v / maxY) * (H - P * 2)

    const pts: Array<[number, number]> = series.map((b: any, i: number) => [xs(i), ys(Number(b?.count ?? 0))])
    const vals = series.map((b: any) => Number(b?.count ?? 0))
    return { points: pts, values: vals }
  }, [series, maxY])

  const hasError = !!errorMessage && series.length === 0

  /* path */
  const pathD = useMemo(() => {
    if (points.length === 0) return ""
    return "M " + points.map(([x, y]) => `${x},${y}`).join(" L ")
  }, [points])

  /* константы осей */
  const X_LEFT = 22
  const X_RIGHT = 578
  const X_BASE = 138 // линия оси X
  const HINT = "var(--tg-hint-color)"
  const ACCENT = "var(--tg-accent-color,#40A7E3)"

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
                  onClick={() => { setPeriod(p); void load() }}
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
            <div className="h-32 w-full">
              <svg viewBox="0 0 600 160" className="h-full w-full overflow-visible">
                {/* горизонтальная сетка (2 линии) */}
                <g stroke="currentColor" style={{ color: HINT, opacity: 0.35 }}>
                  <line x1={X_LEFT} x2={X_RIGHT} y1="52" y2="52" strokeWidth="1" />
                  <line x1={X_LEFT} x2={X_RIGHT} y1="110" y2="110" strokeWidth="1" />
                </g>

                {/* вертикальные направляющие — строго по X точек (чтобы "совпадали с точками") */}
                <g stroke="currentColor" style={{ color: HINT, opacity: 0.18 }}>
                  {points.map(([x], i) => (
                    <line key={`v-${i}`} x1={x} x2={x} y1="22" y2={X_BASE} strokeWidth="1" />
                  ))}
                </g>

                {/* ось X */}
                <line x1={X_LEFT} x2={X_RIGHT} y1={X_BASE} y2={X_BASE} stroke="currentColor" style={{ color: HINT, opacity: 0.5 }} strokeWidth="1" />

                {/* область под кривой */}
                {pathD && (
                  <path
                    d={`${pathD} L ${X_RIGHT},${X_BASE} L ${X_LEFT},${X_BASE} Z`}
                    fill="currentColor"
                    style={{ color: ACCENT, opacity: 0.12 }}
                  />
                )}

                {/* линия */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="currentColor"
                    style={{ color: ACCENT }}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}

                {/* точки и значения над ними */}
                <g>
                  {points.map(([x, y], i) => (
                    <g key={`p-${i}`}>
                      <circle cx={x} cy={y} r="3" fill="currentColor" style={{ color: ACCENT }} />
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

                {/* подписи Y: 0 и max (слева) */}
                <text x="4" y="56" fontSize="10" fill={HINT}>{maxY}</text>
                <text x="8" y={X_BASE + 4} fontSize="10" fill={HINT}>0</text>

                {/* подписи X:
                    - неделя: 7 подписей — по каждой точке
                    - иначе: 4 равномерные метки (coarse) */}
                {period === "week" ? (
                  <g>
                    {points.map(([x], i) => (
                      <text
                        key={`xl-${i}`}
                        x={x}
                        y={X_BASE - 2} /* на 2px ВЫШЕ оси */
                        fontSize="9"
                        textAnchor="middle"
                        fill={HINT}
                        dominantBaseline="ideographic"
                      >
                        {xLabels[i] || ""}
                      </text>
                    ))}
                  </g>
                ) : (
                  // coarse labels: равномерно по 4 точкам
                  <g>
                    {[0, 1, 2, 3].map((k) => {
                      const n = points.length
                      if (n === 0) return null
                      const idx = Math.round((k / 3) * (n - 1))
                      const x = points[idx][0]
                      return (
                        <text
                          key={`xlc-${k}`}
                          x={x}
                          y={X_BASE - 2}
                          fontSize="9"
                          textAnchor="middle"
                          fill={HINT}
                          dominantBaseline="ideographic"
                        >
                          {xLabels[k] || ""}
                        </text>
                      )
                    })}
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}
      </div>
    </CardSection>
  )
}
