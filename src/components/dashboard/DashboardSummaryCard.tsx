// src/components/dashboard/DashboardSummaryCard.tsx
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../../store/dashboardStore"
import { Loader2 } from "lucide-react"

type Period = "day" | "week" | "month" | "year"

const DashboardSummaryCard = () => {
  const { t } = useTranslation()

  const {
    period,
    setPeriod,
    currency,
    setCurrency,
    currenciesAvailable,
    values,
    loading,
    lastCurrency,
  } = useDashboardStore((s) => ({
    period: (s.summary?.period as Period) || "month",
    setPeriod: s.setSummaryPeriod,
    currency: s.summary?.currency || "USD",
    setCurrency: s.setSummaryCurrency,
    currenciesAvailable: s.summary?.currenciesAvailable || [],
    values: s.summary?.values || { spent: 0, avg: 0, myShare: 0 },
    loading: !!s.loading?.summary,
    lastCurrency: s.summary?.lastCurrency || "",
  }))

  return (
    <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl p-4 shadow-sm border border-[var(--tg-theme-hint-color)]">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2">
          {(["day", "week", "month", "year"] as Period[]).map((p) => (
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
        <div className="flex gap-2">
          {currenciesAvailable.map((ccy) => (
            <button
              key={ccy}
              onClick={() => setCurrency(ccy)}
              className={`px-2 py-1 text-xs rounded-full ${
                ccy === currency
                  ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
                  : "bg-[var(--tg-theme-secondary-bg-color)]"
              }`}
            >
              {ccy}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[100px]">
          <Loader2 className="animate-spin opacity-70" />
        </div>
      ) : (
        <div className="grid grid-cols-3 text-center gap-4 mt-2">
          <div>
            <div className="text-xs text-[var(--tg-theme-hint-color)] mb-1">{t("spent")}</div>
            <div className="font-medium">
              {values.spent.toFixed(2)} {lastCurrency}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--tg-theme-hint-color)] mb-1">{t("avg_check")}</div>
            <div className="font-medium">
              {values.avg.toFixed(2)} {lastCurrency}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--tg-theme-hint-color)] mb-1">{t("my_share")}</div>
            <div className="font-medium">
              {values.myShare.toFixed(2)} {lastCurrency}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardSummaryCard
