// src/components/dashboard/TopPartnersCarousel.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
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

export default function TopPartnersCarousel() {
  const period = useDashboardStore((s) => s.frequentPeriod);
  const setPeriod = useDashboardStore((s) => s.setFrequentPeriod);
  const items = useDashboardStore((s) => s.frequentUsers);
  const loading = useDashboardStore((s) => s.loading.frequent);
  const error = useDashboardStore((s) => s.error.frequent);
  const nav = useNavigate();

  return (
    <SafeSection fullWidth title="Часто делю расходы" controls={<PeriodChips value={period as Period} onChange={setPeriod} />} loading={loading} error={error || null} onRetry={() => setPeriod(period)}>
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-3 snap-x snap-mandatory">
          {items.map((p) => (
            <div key={p.id} className="snap-center shrink-0 w-[45%] min-w-[260px] rounded-2xl p-3 bg-white/5 cursor-pointer" onClick={() => nav(`/users/${p.id}`)}>
              <div className="flex items-center gap-3">
                {p.photo_url ? <img src={p.photo_url} className="w-12 h-12 rounded-full object-cover" alt={p.first_name} /> : <div className="w-12 h-12 rounded-full grid place-items-center bg-white/10">{p.first_name?.[0]?.toUpperCase() || "?"}</div>}
                <div>
                  <div className="font-medium">{p.first_name}</div>
                  <div className="text-xs opacity-70">{p.tx_count} совместных расход(а/ов)</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs opacity-60 mt-2">Горизонтальная карусель (видно две карточки). Карточки кликабельны.</div>
      </div>
    </SafeSection>
  );
}
