// src/components/dashboard/DashboardActivityChart.tsx
import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Coins } from "lucide-react"
import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"

type PeriodAll = "week" | "month" | "year"
const PERIODS: PeriodAll[] = ["week", "month", "year"]

/* ===== SVG/верстка константы (править тут) ===== */
const SVG_W = 600
const SVG_H = 160
const PAD = 22                   // внутренний отступ сверху/снизу
const X_LEFT = PAD
const X_RIGHT = SVG_W - PAD
const X_BASE = SVG_H - PAD       // ось X

const LABEL_DM_FONT = 10         // размер шрифта для "день+месяц"
const LABEL_YR_FONT = 9          // размер шрифта для "год"
const LABEL_DM_OFFSET = 2        // отступ ОТ оси X до первой строки дат (px)
const LABEL_YR_OFFSET = 12       // отступ ОТ оси X до второй строки (год)

/* ===== helpers ===== */
function pad2(n: number) { return n < 10 ? `0${n}` : String(n) }
function toYMD(d: Date): string { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }

/** Формат даты как в TransactionCard (использует date_card.months и date_card.pattern) */
function formatCardDateLike(d: Date, t: (k: string, o?: any) => any): string {
  try {
    const monthsRaw = t("date_card.months", { returnObjects: true }) as unknown
    const months = Array.isArray(monthsRaw) ? (monthsRaw as string[]) : null
    let patternStr = "{{day}} {{month}}"
    const maybe = t("date_card.pattern")
    if (typeof maybe === "string" && maybe.trim() && maybe !== "date_card.pattern") patternStr = maybe
    if (months && months.length === 12) {
      const day = String(d.getDate())
      const month = months[d.getMonth()]
      return patternStr.replace("{{day}}", day).replace("{{month}}", month)
    }
  } catch {}
  try { return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short" }).format(d) }
  catch { return d.toLocaleDateString() }
}

function ceilToEven(n: number) { const m = Math.ceil(n); return m % 2 === 0 ? m : m + 1 }
function ceilToMultiple(n: number, k: number) {
  if (k <= 0) return Math.ceil(n)
  const m = Math.ceil(n), r = m % k
  return r === 0 ? m : m + (k - r)
}

/** 4 метки для month/year (coarse; данные пока не пересчитываем) */
function getXAxisLabelsCoarse(period: PeriodAll, t: (k: string, o?: any) => any): string[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === "month") {
    const offs = [-28, -19, -9, 0]
    return offs.map((o) => { const d = new Date(today); d.setDate(d.getDate() + o); return formatCardDateLike(d, t) })
  }
  if (period === "year") {
    const y = today.getFullYear()
    return [new Date(y,0,1), new Date(y,3,1), new Date(y,6,1), new Date(y,9,1)].map((d) => formatCardDateLike(d, t))
  }
  return []
}

export default function DashboardActivityChart() {
  const { t } = useTranslation()
  const period = useDashboardStore((s) => s.activityPeriod as PeriodAll)
  const setPeriod = useDashboardStore((s) => s.setActivityPeriod)
  const activity = useDashboardStore((s) => s.activity)
  const loading = useDashboardStore((s) => s.loading.activity)
  const errorMessage = useDashboardStore((s) => s.error.activity || "")
  const load = useDashboardStore((s) => s.loadActivity)

  useEffect(() => { if (!activity && !loading) void load() }, [activity, loading, load])

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
    return (buckets as any[]).map((b) => ({ date: String(b?.date ?? ""), count: Number(b?.count ?? 0) }))
  }, [period, buckets])

  /* X-подписи: неделя — 7 шт, в две строки; иначе — 4 грубые */
  const xLabelsWeek = useMemo(() => {
    if (period !== "week") return { dm: [] as string[], yr: [] as string[] }
    const dm: string[] = [], yr: string[] = []
    for (const pt of series) {
      const [y, m, d] = pt.date.split("-").map((x: string) => Number(x))
      const date = Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d) ? new Date(y, m - 1, d) : new Date(pt.date)
      dm.push(formatCardDateLike(date, t as any))
      yr.push(String(date.getFullYear()))
    }
    return { dm, yr }
  }, [period, series, t])
  const xLabelsCoarse = useMemo(() => getXAxisLabelsCoarse(period, t as any), [period, t])

  /* Y-шкала и сетка */
  const { yMax, yGridValues } = useMemo(() => {
    const rawMax = Math.max(0, series.reduce((m, b) => Math.max(m, Number(b.count || 0)), 0))
    let maxEven = Math.max(2, ceilToEven(rawMax))
    if (maxEven >= 8) maxEven = ceilToMultiple(maxEven, 4)
    let grid: number[] = []
    if (maxEven === 2) grid = [2]
    else if (maxEven === 4 || maxEven === 6) grid = [maxEven / 2, maxEven]
    else { const step = maxEven / 4; grid = [step, step * 2, step * 3, maxEven] }
    return { yMax: maxEven, yGridValues: grid }
  }, [series])

  /* координаты */
  const { points, values } = useMemo(() => {
    const n = series.length
    if (n === 0) return { points: [] as Array<[number, number]>, values: [] as number[] }
    const xs = (i: number) => (n === 1 ? SVG_W / 2 : X_LEFT + (i / (n - 1)) * (X_RIGHT - X_LEFT))
    const ys = (v: number) => PAD + (1 - v / yMax) * (SVG_H - PAD * 2)
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

  /* цвета */
  const HINT = "var(--tg-hint-color)"
  const TEXT = "var(--tg-text-color)"
  const ACCENT = "var(--tg-accent-color,#40A7E3)"

  // позиционирование подписей под осью X
  const LABEL_DM_Y = X_BASE + LABEL_DM_OFFSET
  const LABEL_YR_Y = X_BASE + LABEL_YR_OFFSET

  // функция перевода значения сетки в координату Y
  const gridY = (v: number) => PAD + (1 - v / yMax) * (SVG_H - PAD * 2)

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
          <div className="text-sm" style={{ color: HINT }}>{t("loading")}</div>
        ) : hasError ? (
          <div className="flex items-center gap-3">
            <div className="text-sm" style={{ color: "var(--tg-destructive-text,#ef4444)" }}>
              {t("dashboard.activity_error")}
            </div>
            <button
              onClick={() => load()}
              className="px-2 py-1 text-sm rounded border transition bg-transparent border-[var(--tg-hint-color)]"
              style={{ color: TEXT }}
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
              <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="h-full w-full overflow-visible">
                {/* горизонтальная сетка + подписи ко всем линиям, КРОМЕ 0 */}
                <g stroke="currentColor" style={{ color: HINT, opacity: 0.35 }}>
                  {yGridValues.map((v, i) => {
                    const y = gridY(v)
                    return (
                      <g key={`gh-${i}`}>
                        <line x1={X_LEFT} x2={X_RIGHT} y1={y} y2={y} strokeWidth="1" />
                        <text x={8} y={y + 3} fontSize="10" fill={HINT}>{v}</text>
                      </g>
                    )
                  })}
                </g>

                {/* вертикальные направляющие — строго по X точек */}
                <g stroke="currentColor" style={{ color: HINT, opacity: 0.18 }}>
                  {points.map(([x], i) => (
                    <line key={`gv-${i}`} x1={x} x2={x} y1={PAD} y2={X_BASE} strokeWidth="1" />
                  ))}
                </g>

                {/* ось X + подпись 0 слева */}
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

                {/* линия графика */}
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
                      <text x={x} y={Math.max(12, y - 8)} fontSize="10" textAnchor="middle" fill={TEXT}>
                        {values[i]}
                      </text>
                    </g>
                  ))}
                </g>

                {/* подписи X */}
                {period === "week" ? (
                  // 7 подпесей, две строки: день+месяц и ниже год
                  <g>
                    {points.map(([x], i) => (
                      <g key={`xl-${i}`}>
                        <text
                          x={x}
                          y={LABEL_DM_Y}
                          fontSize={LABEL_DM_FONT}
                          textAnchor="middle"
                          fill={HINT}
                        >
                          {xLabelsWeek.dm[i] || ""}
                        </text>
                        <text
                          x={x}
                          y={LABEL_YR_Y}
                          fontSize={LABEL_YR_FONT}
                          textAnchor="middle"
                          fill={HINT}
                        >
                          {xLabelsWeek.yr[i] || ""}
                        </text>
                      </g>
                    ))}
                  </g>
                ) : (
                  // coarse: 4 равномерные подписи
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
                          fontSize={LABEL_DM_FONT}
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
