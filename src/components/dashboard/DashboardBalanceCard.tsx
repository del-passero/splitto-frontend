// src/components/dashboard/DashboardBalanceCard.tsx
import React, { useMemo } from "react";
import { useDashboardStore } from "../../store/dashboardStore";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

function CurrencyChips() {
  const currenciesRecent = useDashboardStore((s) => s.currenciesRecent);
  const active = useDashboardStore((s) => s.balanceActive);
  const setActive = useDashboardStore((s) => s.setBalanceActive);

  if (!currenciesRecent?.length) return <div className="text-xs opacity-60">Нет валют</div>;

  return (
    <div className="flex flex-wrap gap-1">
      {currenciesRecent.map((c: string) => {
        const isActive = active.includes(c);
        return (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`px-2 py-1 rounded-full text-xs ${isActive ? "bg-[var(--tg-link-color,#2481cc)] text-white" : "bg-white/10"}`}
            aria-pressed={isActive}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

export default function DashboardBalanceCard() {
  const balance = useDashboardStore((s) => s.balance);
  const active = useDashboardStore((s) => s.balanceActive);

  const sums = useMemo(() => {
    const set = new Set(active);
    let iOwe = 0, owedToMe = 0;
    for (const row of balance) {
      if (!set.has(row.currency)) continue;
      iOwe += row.i_owe || 0;
      owedToMe += row.owed_to_me || 0;
    }
    return { iOwe, owedToMe };
  }, [balance, active]);

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="rounded-2xl p-3 w-full bg-[var(--tg-card-bg,#1c1c1e)]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold opacity-80">Мой баланс</div>
        <CurrencyChips />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 bg-white/5 flex items-center justify-between select-none">
          <div className="text-sm opacity-75">Я должен</div>
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-red-400" />
            <div className="text-lg font-semibold">{fmt(sums.iOwe)}</div>
          </div>
        </div>
        <div className="rounded-xl p-3 bg-white/5 flex items-center justify-between select-none">
          <div className="text-sm opacity-75">Мне должны</div>
          <div className="flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-green-400" />
            <div className="text-lg font-semibold">{fmt(sums.owedToMe)}</div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs opacity-60">Элемент не кликабелен</div>
    </div>
  );
}
