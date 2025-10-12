// src/components/dashboard/TopCategoriesCard.tsx
import React, { useEffect, useMemo } from "react"
import { useDashboardStore } from "../../store/dashboardStore"

type PeriodLTYear = "week" | "month" | "year"
const PERIODS: PeriodLTYear[] = ["week", "month", "year"]

type AnyTopCat = {
  category_id?: string | number
  name?: string
  sum?: string | number
  currency?: string
}

export default function TopCategoriesCard() {
  const period = useDashboardStore((s) => s.topCategoriesPeriod)
  const setPeriod = useDashboardStore((s) => s.setTopPeriod)
  const items = useDashboardStore((s) => s.topCategories)
  const loading = useDashboardStore((s) => s.loading.top)
  const error = useDashboardStore((s) => s.error.top)
  const load = useDashboardStore((s) => s.loadTopCategories)

  useEffect(() => {
    if (!items || items.length === 0) void load()
  }, [items, load])

  const chartData = useMemo(
    () =>
      (items as unknown as AnyTopCat[]).map((it, idx) => {
        const name = it.name ?? "Категория"
        const key = String(it.category_id ?? `${name}-${idx}`)
        let n =
          typeof it.sum === "string" ? Number(it.sum) : typeof it.sum === "number" ? it.sum : 0
        if (!isFinite(Number(n))) n = 0
        return { key, name, total: Number(n), currency: it.currency }
      }),
    [items]
  )

  const totalAmount = useMemo(
    () => chartData.reduce((acc, x) => acc + (x.total || 0), 0),
    [chartData]
  )

  const hasError = !!error && chartData.length === 0

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-base">Топ категорий</h3>
        <div className="ml-auto flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={
                "px-2 py-1 rounded text-sm border " +
                (p === period
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted hover:bg-muted/70 border-transparent")
              }
            >
              {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
            </button>
          ))}
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
        <div className="flex flex-col gap-2">
          {chartData.map((it) => {
            const pct = totalAmount > 0 ? (it.total / totalAmount) * 100 : 0
            return (
              <div key={it.key} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{it.name}</span>
                    <span className="tabular-nums">{it.total.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full bg-muted rounded">
                    <div
                      className="h-2 rounded bg-primary/70"
                      style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
