// src/components/dashboard/TopCategoriesCard.tsx
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../../store/dashboardStore"
import { tSafe } from "../../utils/tSafe"

type Period = "week" | "month" | "year"

function PeriodChip({
  label,
  active,
  onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition
        ${active ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "bg-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)]"}`}
    >
      {label}
    </button>
  )
}

export default function TopCategoriesCard() {
  const { t } = useTranslation()
  const { period, setPeriod, items, loading } = useDashboardStore((s) => ({
    period: (s.topCategories?.period as Period) || s.ui?.categoriesPeriod || "month",
    setPeriod: s.setCategoriesPeriod,
    items: s.topCategories?.items || [],
    loading: !!s.loading?.categories,
  }))

  const totals = useMemo(() => {
    const map = new Map<string, number>()
    for (const it of items) {
      const num = Number(it.sum || 0)
      if (!Number.isFinite(num)) continue
      map.set(it.currency, (map.get(it.currency) || 0) + num)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  return (
    <div className="w-full">
      <div className="mb-2 flex gap-2">
        <PeriodChip label={tSafe(t, "week", "Неделя")} active={period === "week"} onClick={() => setPeriod("week")} />
        <PeriodChip label={tSafe(t, "month", "Месяц")} active={period === "month"} onClick={() => setPeriod("month")} />
        <PeriodChip label={tSafe(t, "year", "Год")} active={period === "year"} onClick={() => setPeriod("year")} />
      </div>

      <div className="rounded-xl border p-3"
           style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}>
        {loading ? (
          <div className="text-[var(--tg-hint-color)]">{tSafe(t, "loading", "Загрузка…")}</div>
        ) : items.length === 0 ? (
          <div className="text-[var(--tg-hint-color)]">{tSafe(t, "group_transactions_not_found", "Транзакции не найдены")}</div>
        ) : (
          <div className="max-h-[260px] overflow-y-auto pr-1">
            <ul className="flex flex-col gap-2">
              {items.map((it) => {
                const name =
                  (String(it.name || "").trim()) ||
                  `${tSafe(t, "category.not_found", "Категория")} #${it.category_id}`
                const sum = Number(it.sum || 0)
                return (
                  <li key={`${it.category_id}-${it.currency}`} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium truncate">{name}</div>
                      <div className="text-[11px] text-[var(--tg-hint-color)]">{it.currency}</div>
                    </div>
                    <div className="text-[14px] font-semibold whitespace-nowrap">{sum}&nbsp;{it.currency}</div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {totals.length > 0 && (
          <div className="mt-3 pt-2 border-t" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
            <div className="text-[12px] text-[var(--tg-hint-color)] mb-1">
              {tSafe(t, "group_balance_totals_aria", "Итого по валютам")}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {totals.map(([ccy, val]) => (
                <div key={ccy} className="text-[13px]">
                  <span className="font-semibold">{Math.round(val * 100) / 100}</span>&nbsp;{ccy}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
