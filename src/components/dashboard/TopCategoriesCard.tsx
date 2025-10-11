// src/components/dashboard/TopCategoriesCard.tsx
import React from "react";
import { useDashboardStore } from "../../store/dashboardStore";
import SafeSection from "../SafeSection";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Period = "week" | "month" | "year";

function PeriodChips({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  const items: Period[] = ["week", "month", "year"];
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

export default function TopCategoriesCard() {
  const period = useDashboardStore((s) => s.topCategoriesPeriod);
  const setPeriod = useDashboardStore((s) => s.setTopPeriod);
  const items = useDashboardStore((s) => s.topCategories);
  const loading = useDashboardStore((s) => s.loading.top);
  const error = useDashboardStore((s) => s.error.top);

  return (
    <SafeSection
      title="Топ категорий"
      controls={<PeriodChips value={period} onChange={setPeriod} />}
      loading={loading}
      error={error || null}
      onRetry={() => setPeriod(period)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="max-h-48 overflow-y-auto pr-1">
          <ul className="flex flex-col gap-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between bg-white/5 rounded-xl px-2 py-2">
                <div className="truncate">{it.name}</div>
                <div className="text-sm font-medium">{it.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={items} dataKey="total" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={1}>
                {items.map((it) => (<Cell key={it.id} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="text-xs opacity-60 mt-2">Вертикальный скролл. Только выбор периода кликабелен</div>
    </SafeSection>
  );
}
