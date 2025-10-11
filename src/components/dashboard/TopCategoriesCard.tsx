import { useEffect, useMemo } from "react"
import { useDashboardStore } from "../../store/dashboardStore"
import SafeSection from "../SafeSection"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export default function TopCategoriesCard() {
  const period = useDashboardStore((s) => s.topCategoriesPeriod)
  const setPeriod = useDashboardStore((s) => s.setTopPeriod)
  const itemsRaw = useDashboardStore((s) => s.topCategories)
  const loading = useDashboardStore((s) => s.loading.top)
  const error = useDashboardStore((s) => s.error.top || null)
  const load = useDashboardStore((s) => s.loadTopCategories)

  useEffect(() => {
    if (!itemsRaw) void load(period)
  }, []) // eslint-disable-line

  const items = itemsRaw ?? []
  const chartData = useMemo(
    () =>
      items.map((it) => ({
        key: it.category_id,
        name: it.name ?? "—",
        total: Number(it.sum) || 0,
        currency: it.currency,
      })),
    [items]
  )

  return (
    <SafeSection
      title="Топ категории"
      controls={
        <div className="flex gap-1">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              className={`px-2 py-1 rounded ${period === p ? "bg-white/10" : "bg-white/5"}`}
              onClick={() => {
                setPeriod(p)
                void load(p)
              }}
            >
              {p}
            </button>
          ))}
        </div>
      }
      loading={loading}
      error={error}
      onRetry={() => load(period)}
    >
      <div className="grid grid-cols-2 gap-3">
        <ul className="flex flex-col gap-2">
          {chartData.map((it) => (
            <li
              key={it.key}
              className="flex items-center justify-between bg-white/5 rounded-xl px-2 py-2"
            >
              <div className="truncate">{it.name}</div>
              <div className="text-sm font-medium">
                {it.total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {it.currency}
              </div>
            </li>
          ))}
          {!chartData.length && !loading && <div className="opacity-60 text-sm">Нет данных</div>}
        </ul>

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="total" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={1}>
                {chartData.map((it) => (
                  <Cell key={it.key} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SafeSection>
  )
}
