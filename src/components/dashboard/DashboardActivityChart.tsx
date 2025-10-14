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

/** Формат даты как в TransactionCard (использует date_card.months и date_card.pattern) */
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

/** 4 метки для month/year (coarse; данные для этих режимов пока не пересчитываем) */
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

/* ===== layout/visual constants (НЕ МЕНЯЕМ РАЗМЕРЫ, только выносим) ===== */
const FONT_SIZE_DM = 16           // размер шрифта для дня+месяца
const FONT_SIZE_YR = 16            // размер шрифта для года
const GAP_HEADER_TO_TOP = 2       // отступ от чипов (хедера) до верхней границы области графика (px)
const GAP_X_TO_DM = 20            // от оси X до подписи день+месяц (px вниз)
const GAP_DM_TO_YR = 10           // от подписи день+месяц до года (px вниз)
const GAP_YR_TO_BOTTOM = 2        // от года до нижней границы компонента (px)

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

  /* ===== series =====
     Неделя: 7 точек — сегодня, вчера, …, 6 дней назад (слева → направо).
     Месяц/год: как пришло с бэка. */
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

  /* X-подписи:
     - неделя: 7 подписей (каждая точка) → 2 строки (день+месяц; год ниже)
     - месяц/год: 4 «крупные» метки */
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
  const xLabelsCoarse = useMemo(() => getXAxisLabelsCoarse(period, t as any), [period, t])

  /* Y-шкала:
     1) raw max
     2) округляем вверх до чётного
     3) если >=8 — дополнительно до кратного 4
     4) линии: 2→1; 4/6→2; >=8→4 (равномерно) */
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

  // позиционирование подписей под осью X (соблюдаем исходные размеры)
  const LABEL_DM_Y = X_BASE + GAP_X_TO_DM
  const LABEL_YR_Y = LABEL_DM_Y + GAP_DM_TO_YR
  // контрольный нижний зазор (должен получиться GAP_YR_TO_BOTTOM)
  // const bottomGap = H - LABEL_YR_Y  // ( = 160 - (138+10+10) = 2 )

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

                {/* ось X (0) + подпись 0 слева */}
                <line
                  x1={X_LEFT}
                  x2={X_RIGHT}
                  y1={X_BASE}
                  y2={X_BASE}
                  stroke="currentColor"
                  style={{ color: HINT, opacity: 0.5 }}
                  strokeWidth="1"
                />
                <text x={8} y={X_BASE + 4} fontSize="10" fill={HINT}>0</text>

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
                        fill={TEXT}
                      >
                        {values[i]}
                      </text>
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
                ) : (
                  // coarse: 4 равномерные подписи (одной строкой — день+месяц)
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
                          y={LABEL_DM_Y}
                          fontSize={FONT_SIZE_DM}
                          textAnchor="middle"
                          fill={HINT}
                        >
                          {xLabelsCoarse[k] || ""}
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
