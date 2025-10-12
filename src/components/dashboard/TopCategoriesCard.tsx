// src/components/dashboard/TopCategoriesCard.tsx
import React, { useEffect, useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useDashboardStore } from "../../store/dashboardStore"

const PERIODS: Array<"week" | "month" | "year"> = ["week", "month", "year"]

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#8dd1e1",
  "#a4de6c", "#d0ed57", "#d4a1ff", "#ffb3ba", "#bae1ff",
]

type AnyTopCat = {
  id?: string | number
  category_id?: string | number
  name?: string
  sum?: string | number
  total?: number
  amount?: number
  value?: number
  currency?: string
}

export default function TopCategoriesCard() {
  const period = useDashboardStore((s) => s.topCategoriesPeriod)
  const setPeriod = useDashboardStore((s) => s.setTopPeriod)
  const itemsRaw = useDashboardStore((s) => s.topCategories)
  const loading = useDashboardStore((s) => s.loading.top)
  const rawError = useDashboardStore((s) => (s as any).error ?? null) as any
  const load = useDashboardStore((s) => s.loadTopCategories)

  const topError: string | null =
    typeof rawError === "string" ? rawError : rawError?.top ?? null

  useEffect(() => {
    if (!itemsRaw && !loading) void load()
  }, [itemsRaw, loading, load])

  const items = itemsRaw ?? []

  const chartData = useMemo(
    () =>
      (items as unknown as AnyTopCat[]).map((it, idx) => {
        const name = it.name ?? "Категория"
        const key = String(it.id ?? it.category_id ?? `${name}-${idx}`)
        let n =
          typeof it.sum === "string"
            ? Number(it.sum)
            : typeof it.sum === "number"
            ? it.sum
            : it.total ?? it.amount ?? it.value ?? 0
        if (!isFinite(Number(n))) n = 0
        return { key, name, total: Number(n), currency: it.currency }
      }),
    [items]
  )

  const totalAmount = useMemo(
    () => chartData.reduce((acc, x) => acc + (x.total || 0), 0),
    [chartData]
  )

  const hasError = Boolean(topError) && (chartData.length === 0)

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-base">Топ категорий</h3>
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
                className={
                  "px-2 py-1 rounded text-sm border " +
                  (active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted hover:bg-muted/70 border-transparent")
                }
              >
                {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Загрузка…</div>
      ) : hasError ? (
        <div className="flex items-center gap-3">
          <div className="text-sm text-red-500">
            Виджет «Топ категорий» временно недоступен. Попробуй обновить или нажми «Повторить».
          </div>
          <button
            onClick={() => load()}
            className="px-2 py-1 text-sm rounded border bg-muted hover:bg-muted/70"
          >
            Повторить
          </button>
        </div>
      ) : chartData.length === 0 ? (
        <div className="text-sm text-muted-foreground">Нет данных за выбранный период</div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={1}
                  isAnimationActive
                >
                  {chartData.map((it, i) => (
                    <Cell key={it.key} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => (Array.isArray(v) ? v : [v, "Сумма"])} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 min-w-0">
            <ul className="space-y-2">
              {chartData.map((it, i) => {
                const pct = totalAmount > 0 ? Math.round((it.total / totalAmount) * 100) : 0
                return (
                  <li key={it.key} className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ background: COLORS[i % COLORS.length] }}
                      aria-hidden
                    />
                    <span className="truncate">{it.name}</span>
                    <span className="ml-auto tabular-nums">{it.total.toFixed(2)}</span>
                    {totalAmount > 0 && (
                      <span className="w-10 text-right text-muted-foreground text-xs tabular-nums">
                        {pct}%
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
