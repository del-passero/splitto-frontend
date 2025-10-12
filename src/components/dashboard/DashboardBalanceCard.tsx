// src/components/dashboard/DashboardBalanceCard.tsx
// Совместимо с текущей структурой проекта (папка /components/dashboard)

import { useEffect, useMemo } from "react"
import { useDashboardStore } from "../../store/dashboardStore"

function mapKV(rec: Record<string, string>): Array<{ ccy: string; amt: string }> {
  return Object.entries(rec || {}).map(([ccy, amt]) => ({ ccy, amt }))
}

const DashboardBalanceCard = () => {
  const loading = useDashboardStore((s) => s.loading.balance)
  const balance = useDashboardStore((s) => s.balance)
  const reloadBalance = useDashboardStore((s) => s.reloadBalance)

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) void reloadBalance()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [reloadBalance])

  const theyOwe = useMemo(() => mapKV(balance?.they_owe_me || {}), [balance])
  const iOwe = useMemo(() => mapKV(balance?.i_owe || {}), [balance])

  return (
    <div className="rounded-2xl shadow p-3 bg-[var(--tg-card-bg,#1f1f1f)]">
      <div className="text-sm opacity-70 mb-2">Баланс по всем активным группам</div>

      {loading ? (
        <div className="text-sm opacity-80">Загрузка…</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs opacity-60 mb-1">Мне должны</div>
            {theyOwe.length === 0 ? (
              <div className="text-sm opacity-70">—</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {theyOwe.map((x) => (
                  <span
                    key={`to-me-${x.ccy}`}
                    className="px-2 py-1 text-sm rounded-full border border-white/10"
                  >
                    {x.amt} {x.ccy}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs opacity-60 mb-1">Я должен</div>
            {iOwe.length === 0 ? (
              <div className="text-sm opacity-70">—</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {iOwe.map((x) => (
                  <span
                    key={`i-owe-${x.ccy}`}
                    className="px-2 py-1 text-sm rounded-full border border-white/10"
                  >
                    {x.amt} {x.ccy}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {balance?.last_currencies?.length ? (
        <div className="mt-3 text-xs opacity-60">
          Последние валюты: {balance.last_currencies.join(", ")}
        </div>
      ) : null}
    </div>
  )
}

export default DashboardBalanceCard
