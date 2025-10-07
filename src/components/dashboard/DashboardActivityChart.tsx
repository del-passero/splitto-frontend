// src/components/dashboard/DashboardActivityChart.tsx
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../../store/dashboardStore"
import { useMemo } from "react"
import { Loader2 } from "lucide-react"

type Period = "week" | "month" | "year"

const DashboardActivityChart = () => {
  const { t } = useTranslation()

  const { period, setPeriod, points, loading } = useDashboardStore((s) => ({
    period: (s.activity?.period as Period) || "month",
    setPeriod: s.setActivityPeriod,
    points:
      (s.activity?.points as { date: string; total: number }[]) ||
      ([] as { date: string; total: number }[]),
    loading: !!s.loading?.activity,
  }))

  // ===== CHART COMPUTATION =====
  const svg = useMemo(() => {
    if (!points.length)
      return { path: "", width: 300, height: 120, pts: [] as { x: number; y: number }[] }

    const width = 300
    const height = 120
    const pad = 10

    const xs = points.map((p) => new Date(p.date).getTime())
    const ys = points.map((p) => Number(p.total || 0))

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = 0
    const maxY = Math.max(...ys)

    const toX = (x: number) =>
      pad + ((x - minX) / Math.max(maxX - minX, 1)) * (width - pad * 2)
    const toY = (y: number) => height - pad - (y / Math.max(maxY, 1)) * (height - pad * 2)

    const pts = points.map((p) => ({
      x: toX(new Date(p.date).getTime()),
      y: toY(Number(p.total || 0)),
    }))

    const path =
      pts.length > 1
        ? pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
        : ""

    return { path, width, height, pts }
  }, [points])

  return (
    <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl p-4 shadow-sm border border-[var(--tg-theme-hint-color)]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-base">{t("dashboard_activity")}</h3>
        <div className="flex gap-2">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              className={`px-2 py-1 text-xs rounded-full ${
                p === period
                  ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
                  : "bg-[var(--tg-theme-secondary-bg-color)]"
              }`}
              onClick={() => setPeriod(p)}
            >
              {t(`period_${p}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[120px]">
          <Loader2 className="animate-spin opacity-70" />
        </div>
      ) : (
        <svg width="100%" height={svg.height} viewBox={`0 0 ${svg.width} ${svg.height}`}>
          <path
            d={svg.path}
            fill="none"
            stroke="var(--tg-theme-button-color)"
            strokeWidth={2}
          />
          {svg.pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={2.5}
              fill="var(--tg-theme-button-color)"
            />
          ))}
        </svg>
      )}
    </div>
  )
}

export default DashboardActivityChart
