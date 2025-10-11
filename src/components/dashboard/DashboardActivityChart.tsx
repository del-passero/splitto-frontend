// src/components/dashboard/DashboardActivityChart.tsx
import React from "react";
import { useDashboardStore } from "../../store/dashboardStore";
import SafeSection from "../SafeSection";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

export default function DashboardActivityChart() {
  const period = useDashboardStore((s) => s.activityPeriod);
  const setPeriod = useDashboardStore((s) => s.setActivityPeriod);
  const points = useDashboardStore((s) => s.activity);
  const loading = useDashboardStore((s) => s.loading.activity);
  const error = useDashboardStore((s) => s.error.activity);

  return (
    <SafeSection
      title="Активность"
      controls={<PeriodChips value={period} onChange={setPeriod} />}
      loading={loading}
      error={error || null}
      onRetry={() => setPeriod(period)}
    >
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="amount" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs opacity-60 mt-2">Кроме выбора периода элемент не кликабелен</div>
    </SafeSection>
  );
}
