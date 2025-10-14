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

/** Формат даты как в TransactionCard (использует date_card.months и date_card.pattern, но мы берём только "день+месяц") */
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

/** Только название месяца (для режима "Год") */
function formatMonthOnly(d: Date, t: (k: string, o?: any) => any): string {
  try {
    const monthsRaw = t("date_card.months", { returnObjects: true }) as unknown
    const months = Array.isArray(monthsRaw) ? (monthsRaw as string[]) : null
    if (months && months.length === 12) return months[d.getMonth()]
  } catch { /* ignore */ }
  try {
    return new Intl.DateTimeFormat(undefined, { month: "long" }).format(d)
  } catch {
    return `${d.getMonth() + 1}`
  }
}

function ceilToEven(n: number) {
  const m = Math.ceil(n)
  return m % 2 === 0 ? m : m + 1
}
function ceilToMultiple(n: number, k: number) {
  if (k <= 0) return Math.ceil(n)
  const m = Math.ceil(n)
  const r = m % k
  return r === 0 ? m : m + (k - r)
}

/* ===== layout/visual constants (КАК РАНЬШЕ) ===== */
const FONT_SIZE_DM = 16           // размер шрифта для дня+месяца
const FONT_SIZE_YR = 16           // размер шрифта для года
const GAP_HEADER_TO_TOP = 2       // отступ от чипов (хедера) до верхней границы области графика (px)
const GAP_X_TO_DM = 20            // от оси X до подписи день+месяц (px вниз)
const GAP_DM_TO_YR = 20           // от подписи день+месяц до года (px вниз)
const GAP_YR_TO_BOTTOM = 2        // от года до нижней границы компонента (px)

/* Подписи для 4 недель в режиме "Месяц" (текущая, прошлая, 2/3 недели назад) */
function monthBucketLabels(t: (k: string) => string) {
  return [
    t("period.week_this"),
    t("period.week_prev"),
    t("period.weeks_ago_2"),
    t("period.weeks_ago_3"),
  ]
}

export default function DashboardActivityChart() {
  const { t } = useTranslation()
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

  /* Подготовим map "YYYY-MM-DD" -> count, чтобы быстро агрегировать */
  const byDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of buckets as any[]) {
      const key = String(b?.date ?? "")
      const count = Number(b?.count ?? 0)
      if (!key) continue
      m.set(key.length >= 10 ? key.slice(0, 10) : key, (m.get(key) || 0) + (Number.isFinite(count) ? count : 0))
    }
    return m
  }, [buckets])

  /* ===== series =====
     Неделя: 7 точек — сегодня, вчера, …, 6 дней назад (слева → направо).
     Месяц: 4 точки — 4 недельных окна по 7 дней от сегодняшней даты назад.
     Год: 12 точек — по месяцу, начиная с текущего, назад 11 (сумма за месяц). */
  const series = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (period === "week") {
      const out: { date: string; count: number }[] = []
      for (let offset = 0; offset <= 6; offset++) {
        const d = new Date(today); d.setDate(today.getDate() - offset)
        const key = toYMD(d)
        out.push({ date: key, count: byDay.get(key) || 0 })
      }
      return out
    }

    if (period === "month") {
      const out: { date: string; count: number }[] = []
      // 4 окна по 7 дней: [0..6], [7..13], [14..20], [21..27]
      for (let w = 0; w < 4; w++) {
        let sum = 0
        for (let i = 0; i < 7; i++) {
          const d = new Date(today)
          d.setDate(today.getDate() - (w * 7 + i))
          sum += byDay.get(toYMD(d)) || 0
        }
        // "якорная" дата бакета — первый день окна (сегодня - w*7)
        const anchor = new Date(today); anchor.setDate(today.getDate() - w * 7)
        out.push({ date: toYMD(anchor), count: sum })
      }
      return out
    }

    if (period === "year") {
      const out: { date: string; count: number }[] = []
      // 12 месяцев: 0 — текущий месяц, 1 — предыдущий, ...
      for (let mIdx = 0; mIdx < 12; mIdx++) {
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        start.setMonth(start.getMonth() - mIdx)
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)

        // суммируем по дням месяца
        let d = new Date(start)
        let sum = 0
        while (d < end) {
          sum += byDay.get(toYMD(d)) || 0
          d.setDate(d.getDate() + 1)
        }
        // якорь — 1-е число месяца
        out.push({ date: toYMD(start), count: sum })
      }
      return out
    }

    // fallback
    return (buckets as any[]).map((b) => ({
      date: String(b?.date ?? ""),
      count: Number(b?.count ?? 0),
    }))
  }, [period, buckets, byDay])

  /* X-подписи */
  const xLabelsWeek = useMemo(() => {
    if (period !== "week") return { dm: [] as string[], yr: [] as string[] }
    const dm: string[] = []
    const yr: string[] = []
    for (const pt of series) {
      const [y, m, d] = pt.date.split("-").map((x: string) => Number(x))
      const date = Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)
        ? new Date(y, m - 1, d)
        : new Date(pt.date)
      dm.push(formatCardDateLike(date, t as any))
      yr.push(String(date.getFullYear()))
    }
    return { dm, yr }
  }, [period, series, t])

  const xLabelsMonth = useMemo(() => {
    if (period !== "month") return [] as string[]
    return monthBucketLabels(t as any)
  }, [period, t])

  const xLabelsYear = useMemo(() => {
    if (period !== "year") return { m: [] as string[], y: [] as string[] }
    const mNames: string[] = []
    const years: string[] = []
    for (const pt of series) {
      const [y, m/*, d*/] = pt.date.split("-").map((x: string) => Number(x))
      const date = Number.isFinite(y) && Number.isFinite(m)
        ? new Date(y, m - 1, 1)
        : new Date(pt.date)
      mNames.push(formatMonthOnly(date, t as any))
      years.push(String(date.getFullYear()))
    }
    return { m: mNames, y: years }
  }, [period, series, t])

  /* Y-шкала (как было): 2→1 линия; 4/6→2; ≥8→4 (равномерно), округление вверх до чётного/кратно 4 */
  const { yMax, yGridValues } = useMemo(() => {
    const rawMax = Math.max(0, series.reduce((m, b) => Math.max(m, Number(b.count || 0)), 0))
    let maxEven = Math.max(2, ceilToEven(rawMax))
    if (maxEven >= 8) maxEven = ceilToMultiple(maxEven, 4)

    let grid: number[] = []
    if (maxEven === 2) {
      grid = [2]
    } else if (maxEven === 4 || maxEven === 6) {
      grid = [maxEven / 2, maxEven]
    } else {
      const step = maxEven / 4
      grid = [step, step * 2, step * 3, maxEven]
    }
    return { yMax: maxEven, yGridValues: grid }
  }, [series])

  /* координаты */
  const { points, values } = useMemo(() => {
    const W = 600
    const H = 160
    const P = 22
    const n = series.length
    if (n === 0) return { points: [] as Array<[number, number]>, values: [] as number[] }

    const xs = (i: number) => (n === 1 ? W / 2 : P + (i / (n - 1)) * (W - P * 2))
    const ys = (v: number) => P + (1 - v / yMax) * (H - P * 2)

    const pts: Array<[number, number]> = series.map((b: any, i: number) => [xs(i), ys(Number(b?.count ?? 0))])
    const vals = series.map((b: any) => Number(b?.count ?? 0))
    return { points: pts, values: vals }
  }, [series, yMax])

  const hasError = !!errorMessage && series.length === 0

  /* path */
  const pathD = useMemo(() => {
    if (points.length === 0) return ""
    return "M " + points.map(([x, y]) => `${x},${y}`).join(" L ")
  }, [points])

  /* оси/цвета/разметка */
  const W = 600
  const H = 160
  const P = 22
  const X_LEFT = 22
  const X_RIGHT = 578
  const X_BASE = 138 // ось X
  const HINT = "var(--tg-hint-color)"
  const TEXT = "var(--tg-text-color)"
  const ACCENT = "var(--tg-accent-color,#40A7E3)"

  // позиционирование подписей под осью X
  const LABEL_DM_Y = X_BASE + GAP_X_TO_DM
  const LABEL_YR_Y = LABEL_DM_Y + GAP_DM_TO_YR

  return (
    <CardSection noPadding>
      <div className="rounded-lg p-1.5 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
        {/* Заголовок + чипы периода */}
        <div className="flex items-center gap-2" style={{ marginBottom: GAP_HEADER_TO_TOP }}>
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
              <svg viewBox={`${0} ${0} ${W} ${H}`} className="h-full w-full overflow-visible">
                {/* горизонтальная сетка (динамика по правилам) + подписи всех линий (кроме 0) */}
                <g stroke="currentColor" style={{ color: HINT, opacity: 0.35 }}>
                  {yGridValues.map((v, i) => {
                    const y = P + (1 - v / yMax) * (H - P * 2)
                    return (
                      <g key={`gh-${i}`}>
                        <line x1={X_LEFT} x2={X_RIGHT} y1={y} y2={y} strokeWidth="1" />
                        <text x={4} y={y + 3} fontSize="10" fill={HINT}>{Math.round(v)}</text>
                      </g>
                    )
                  })}
                </g>

                {/* вертикальные направляющие — строго по X точек */}
                <g stroke="currentColor" style={{ color: HINT, opacity: 0.18 }}>
                  {points.map(([x], i) => (
                    <line key={`gv-${i}`} x1={x} x2={x} y1={P} y2={X_BASE} strokeWidth="1" />
                  ))}
                </g>

                {/* ось X (без подписи "0") */}
                <line
                  x1={X_LEFT}
                  x2={X_RIGHT}
                  y1={X_BASE}
                  y2={X_BASE}
                  stroke="currentColor"
                  style={{ color: HINT, opacity: 0.5 }}
                  strokeWidth="1"
                />

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

                {/* точки и значения (подпись слева; 0 не показываем) */}
                <g>
                  {points.map(([x, y], i) => (
                    <g key={`p-${i}`}>
                      <circle cx={x} cy={y} r="3" fill="currentColor" style={{ color: ACCENT }} />
                      {values[i] > 0 && (
                        <text
                          x={x - 6}
                          y={y + 3}
                          fontSize="10"
                          textAnchor="end"
                          fill={TEXT}
                        >
                          {values[i]}
                        </text>
                      )}
                    </g>
                  ))}
                </g>

                {/* подписи X */}
                {period === "week" ? (
                  // 7 подписей, две строки: день+месяц и ниже год
                  <g>
                    {points.map(([x], i) => (
                      <g key={`xl-${i}`}>
                        <text
                          x={x}
                          y={LABEL_DM_Y}
                          fontSize={FONT_SIZE_DM}
                          textAnchor="middle"
                          fill={HINT}
                        >
                          {xLabelsWeek.dm[i] || ""}
                        </text>
                        <text
                          x={x}
                          y={LABEL_YR_Y}
                          fontSize={FONT_SIZE_YR}
                          textAnchor="middle"
                          fill={HINT}
                        >
                          {xLabelsWeek.yr[i] || ""}
                        </text>
                      </g>
                    ))}
                  </g>
                ) : period === "month" ? (
                  // 4 подписи бакетов: эта/прошлая/2/3 недели назад
                  <g>
                    {points.map(([x], i) => {
                      const anchor =
                        i === 0 ? "start" :
                        i === points.length - 1 ? "end" :
                        "middle"
                      const dx =
                        i === 0 ? 2 :
                        i === points.length - 1 ? -2 :
                        0
                      return (
                        <text
                          key={`xlm-${i}`}
                          x={x + dx}
                          y={LABEL_DM_Y}
                          fontSize={FONT_SIZE_DM}
                          textAnchor={anchor as "start" | "middle" | "end"}
                          fill={HINT}
                        >
                          {xLabelsMonth[i] || ""}
                        </text>
                      )
                    })}
                  </g>
                ) : (
                  // "Год": 12 меток, подписи через одну (месяц + год в 2 строки на чётных индексах: 0,2,4,…)
                  <g>
                    {points.map(([x], i) => (
                      (i % 2 === 0) ? (
                        <g key={`xly-${i}`}>
                          <text
                            x={x}
                            y={LABEL_DM_Y}
                            fontSize={FONT_SIZE_DM}
                            textAnchor="middle"
                            fill={HINT}
                          >
                            {xLabelsYear.m[i] || ""}
                          </text>
                          <text
                            x={x}
                            y={LABEL_YR_Y}
                            fontSize={FONT_SIZE_YR}
                            textAnchor="middle"
                            fill={HINT}
                          >
                            {xLabelsYear.y[i] || ""}
                          </text>
                        </g>
                      ) : (
                        <g key={`xly-${i}`} />
                      )
                    ))}
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
