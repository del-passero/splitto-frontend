// src/components/dashboard/DashboardBalanceCard.tsx
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../../store/dashboardStore"
import { tSafe } from "../../utils/tSafe"

function Chip({
  label,
  active,
  onToggle,
}: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition
                  ${active ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "bg-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)]"}`}
    >
      {label}
    </button>
  )
}

export default function DashboardBalanceCard() {
  const { t } = useTranslation()
  const {
    balance,
    selected,
    setSelectedCurrencies,
  } = useDashboardStore((s) => ({
    balance: s.balance,
    selected: s.ui.balanceCurrencies.length
      ? s.ui.balanceCurrencies
      : (s.balance?.last_currencies || []),
    setSelectedCurrencies: s.setBalanceCurrencies,
  }))

  const myOweByCurrency = balance?.i_owe || {}
  const myOwedByCurrency = balance?.they_owe_me || {}

  const currencies = useMemo(() => {
    const set = new Set<string>()
    Object.keys(myOweByCurrency).forEach((k) => set.add(k))
    Object.keys(myOwedByCurrency).forEach((k) => set.add(k))
    return Array.from(set).sort()
  }, [myOweByCurrency, myOwedByCurrency])

  const toggleCurrency = (code: string) => {
    const cur = new Set<string>(selected.filter((c) => currencies.includes(c)))
    if (cur.has(code)) cur.delete(code)
    else cur.add(code)
    setSelectedCurrencies(Array.from(cur))
  }

  const oweEntries = useMemo(() => {
    const arr = (selected.length ? selected : currencies).map(
      (ccy) => [ccy, Number((myOweByCurrency as any)[ccy] || 0)] as const
    )
    return arr.filter((pair) => Math.abs(pair[1]) > 0.00001)
  }, [selected, currencies, myOweByCurrency])

  const owedEntries = useMemo(() => {
    const arr = (selected.length ? selected : currencies).map(
      (ccy) => [ccy, Number((myOwedByCurrency as any)[ccy] || 0)] as const
    )
    return arr.filter((pair) => Math.abs(pair[1]) > 0.00001)
  }, [selected, currencies, myOwedByCurrency])

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 flex flex-wrap gap-6">
        <div className="flex flex-wrap gap-2">
          {currencies.map((ccy) => (
            <Chip key={ccy} label={ccy} active={selected.includes(ccy)} onToggle={() => toggleCurrency(ccy)} />
          ))}
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="min-w-0 text-[12px] leading-[14px] text-[var(--tg-text-color)]">
          {oweEntries.length === 0 ? (
            <span className="text-[var(--tg-hint-color)]">
              {tSafe(t, "group_balance_no_debts_left", "Никому не должен")}
            </span>
          ) : (
            <>
              <span>{tSafe(t, "i_owe", "Я должен")}:</span>{" "}
              <span className="inline whitespace-normal break-normal">
                {oweEntries.map(([ccy, amt], i) => (
                  <span key={`${ccy}-${i}`} className="inline">
                    <span className="font-semibold text-red-500 whitespace-nowrap">
                      {amt}&nbsp;{ccy}
                    </span>
                    {i < oweEntries.length - 1 ? "; " : ""}
                  </span>
                ))}
              </span>
            </>
          )}
        </div>

        <div className="min-w-0 text-[12px] leading-[14px] text-[var(--tg-text-color)] text-right">
          {owedEntries.length === 0 ? (
            <span className="text-[var(--tg-hint-color)]">
              {tSafe(t, "group_balance_no_debts_right", "Никто не должен")}
            </span>
          ) : (
            <>
              <span className="mr-1">{tSafe(t, "they_owe_me", "Мне должны")}:</span>
              <span className="inline whitespace-normal break-normal">
                {owedEntries.map(([ccy, amt], i) => (
                  <span key={`${ccy}-${i}`} className="inline">
                    <span className="font-semibold text-green-600 whitespace-nowrap">
                      {amt}&nbsp;{ccy}
                    </span>
                    {i < owedEntries.length - 1 ? "; " : ""}
                  </span>
                ))}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
