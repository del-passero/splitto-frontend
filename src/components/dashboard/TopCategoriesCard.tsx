// src/components/dashboard/TopCategoriesCard.tsx
import { useEffect, useMemo } from "react"
import { useDashboardStore } from "../../store/dashboardStore"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import type { PeriodLTYear } from "../../types/dashboard"

const PERIODS: PeriodLTYear[] = ["week", "month", "year"]

export default function TopCategoriesCard() {
  const period = useDashboardStore((s) => s.topCategoriesPeriod)
  const setPeriod = useDashboardStore((s) => s.setTopPeriod)
  const itemsRaw = useDashboardStore((s) => s.topCategories)
  const loading = useDashboardStore((s) => s.loading.top)
  const error = useDashboardStore((s) => s.error.top || null)
  const load = useDashboardStore((s) => s.loadTopCategories)

  useEffect(() => {
    if (!itemsRaw || itemsRaw.length === 0) void load(period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chartData = useMemo(() => {
    const list = (itemsRaw ?? [])
      .map((it) => ({
        name: it.name,
        value: Number.parseFloat(it.sum || "0"),
        currency: it.currency,
        category_id: it.category_id,
      }))
      .filter((x) => Number.isFinite(x.value) && x.value > 0)

    const top = list.slice(0, 8)
    const rest = list.slice(8)
    const restSum = rest.reduce((acc, x) => acc + x.value, 0)
    return restSum > 0 ? [...top, { name: "Прочее", value: restSum, currency: top[0]?.currency }] : top
  }, [itemsRaw])

  const listItems = useMemo(
    () =>
      (itemsRaw ?? []).map((it) => ({
        id: it.category_id,
        title: it.name,
        subtitle: it.currency ? `${it.sum} ${it.currency}` : it.sum,
      })),
    [itemsRaw]
  )

  return (
    <div className="rounded-2xl shadow p-3 bg-[var(--tg-card-bg,#1f1f1f)] w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm opacity-70">Топ категорий</div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p)
                void load(p)
              }}
              className={[
                "px-2 py-1 rounded text-xs",
                p === period ? "bg-white/10" : "hover:bg-white/5",
              ].join(" ")}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-2">
          <div className="text-red-400 text-sm truncate">{error}</div>
          <button
            className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm shrink-0"
            onClick={() => void load(period)}
          >
            Повторить
          </button>
        </div>
      ) : loading ? (
        <div className="text-sm opacity-80">Загрузка…</div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Array.isArray(chartData) ? chartData : []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={70}
                  isAnimationActive={false}
                >
                  {(chartData || []).map((_, idx) => (
                    <Cell key={`c-${idx}`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2">
            {listItems.map((it) => (
              <div key={it.id} className="rounded-xl bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.title}</div>
                    {it.subtitle ? (
                      <div className="text-xs opacity-70 truncate">{it.subtitle}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {listItems.length === 0 && (
              <div className="opacity-60 text-sm">Нет расходов за период</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
