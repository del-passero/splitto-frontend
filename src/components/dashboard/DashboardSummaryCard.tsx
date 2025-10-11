import { useEffect } from "react"
import { useDashboardStore } from "../../store/dashboardStore"
import SafeSection from "../SafeSection"

const fmt = (s?: string) => {
  if (!s && s !== "0") return "—"
  const n = Number(s)
  if (!Number.isFinite(n)) return s as string
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function DashboardSummaryCard() {
  const period = useDashboardStore((s) => s.summaryPeriod)
  const setPeriod = useDashboardStore((s) => s.setSummaryPeriod)
  const currency = useDashboardStore((s) => s.summaryCurrency)
  const setCurrency = useDashboardStore((s) => s.setSummaryCurrency)
  const currencies = useDashboardStore((s) => s.currenciesRecent)
  const summary = useDashboardStore((s) => s.summary)
  const loading = useDashboardStore((s) => s.loading.summary)
  const error = useDashboardStore((s) => s.error.summary || null)
  const load = useDashboardStore((s) => s.loadSummary)

  useEffect(() => {
    if (!summary) void load(period, currency)
  }, []) // eslint-disable-line

  return (
    <SafeSection
      title="Сводка"
      controls={
        <div className="flex gap-1">
          <div className="flex gap-1 mr-2">
            {(["day", "week", "month", "year"] as const).map((p) => (
              <button
                key={p}
                className={`px-2 py-1 rounded ${period === p ? "bg-white/10" : "bg-white/5"}`}
                onClick={() => {
                  setPeriod(p)
                  void load(p, currency)
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {currencies.map((ccy) => (
              <button
                key={ccy}
                className={`px-2 py-1 rounded ${currency === ccy ? "bg-white/10" : "bg-white/5"}`}
                onClick={() => {
                  setCurrency(ccy)
                  void load(period, ccy)
                }}
              >
                {ccy}
              </button>
            ))}
          </div>
        </div>
      }
      loading={loading}
      error={error}
      onRetry={() => load(period, currency)}
    >
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-xs opacity-70 mb-1">Потрачено</div>
          <div className="text-lg font-semibold">
            {summary ? fmt(summary.spent) : "—"} {currency}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-xs opacity-70 mb-1">Средний чек</div>
          <div className="text-lg font-semibold">
            {summary ? fmt(summary.avg_check) : "—"} {currency}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-xs opacity-70 mb-1">Моя доля</div>
          <div className="text-lg font-semibold">
            {summary ? fmt(summary.my_share) : "—"} {currency}
          </div>
        </div>
      </div>
    </SafeSection>
  )
}
