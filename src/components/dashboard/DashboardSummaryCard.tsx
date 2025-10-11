// src/components/dashboard/DashboardSummaryCard.tsx
import React from "react";
import { useDashboardStore } from "../../store/dashboardStore";
import SafeSection from "../SafeSection";

type Period = "day" | "week" | "month" | "year";

function PeriodChips({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  const items: Period[] = ["day", "week", "month", "year"];
  return (
    <div className="flex gap-1">
      {items.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-2 py-1 rounded-full text-xs ${value === p ? "bg-[var(--tg-link-color,#2481cc)] text-white" : "bg-white/10"}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

export default function DashboardSummaryCard() {
  const period = useDashboardStore((s) => s.summaryPeriod);
  const setPeriod = useDashboardStore((s) => s.setSummaryPeriod);
  const currency = useDashboardStore((s) => s.summaryCurrency);
  const setCurrency = useDashboardStore((s) => s.setSummaryCurrency);
  const currencies = useDashboardStore((s) => s.currenciesRecent);
  const summary = useDashboardStore((s) => s.summary);
  const loading = useDashboardStore((s) => s.loading.summary);
  const error = useDashboardStore((s) => s.error.summary);

  return (
    <SafeSection
      title="Сводка"
      controls={
        <div className="flex items-center gap-3">
          <PeriodChips value={period} onChange={setPeriod} />
          <div className="flex gap-1">
            {currencies.map((ccy) => (
              <button
                key={ccy}
                onClick={() => setCurrency(ccy)}
                className={`px-2 py-1 rounded-full text-xs ${currency === ccy ? "bg-[var(--tg-link-color,#2481cc)] text-white" : "bg-white/10"}`}
              >
                {ccy}
              </button>
            ))}
          </div>
        </div>
      }
      loading={loading}
      error={error || null}
      onRetry={() => setPeriod(period)}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs opacity-70 mb-1">Потрачено</div>
          <div className="text-lg font-semibold">{summary ? summary.spent.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} {currency}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs opacity-70 mb-1">Средний чек</div>
          <div className="text-lg font-semibold">{summary ? summary.avg_check.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} {currency}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs opacity-70 mb-1">Моя доля</div>
          <div className="text-lg font-semibold">{summary ? summary.my_share.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} {currency}</div>
        </div>
      </div>
      <div className="text-xs opacity-60 mt-2">Элемент не кликабелен</div>
    </SafeSection>
  );
}
