// src/components/dashboard/DashboardBalanceCard.tsx
// Блок «Мой баланс»: только названия валют; 2 последние активные — по умолчанию.

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../../store/dashboardStore"

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
  } = useDashboardStore((s) => {
    // БЕЗОПАСНО читаем ui и last_currencies
    const uiSelected = s.ui?.balanceCurrencies ?? []
    const last = s.balance?.last_currencies ?? []
    return {
      balance: s.balance,
      selected: uiSelected.length ? uiSelected : last,
      setSelectedCurrencies: s.setBalanceCurrencies,
    }
  })

  const myOweByCurrency = balance?.i_owe ?? {}
  const myOwedByCurrency = balance?.they_owe_me ?? {}

  const currencies = useMemo(() => {
    const set = new Set<string>()
    Object.keys(myOweByCurrency || {}).forEach((k) => set.add(k))
    Object.keys(myOwedByCurrency || {}).forEach((k) => set.add(k))
    return Array.from(set).sort()
  }, [myOweByCurrency, myOwedByCurrency])

  const toggleCurrency = (code: string) => {
    const safeSelected = Array.isArray(selected) ? selected : []
    const cur = new Set<string>(safeSelected.filter((c) => currencies.includes(c)))
    if (cur.has(code)) cur.delete(code)
    else cur.add(code)
    setSelectedCurrencies(Array.from(cur))
  }

  const showList = (Array.isArray(selected) ? selected : []).length ? selected : currencies

  const oweEntries = useMemo(() => {
    const arr = showList.map(
      (ccy) => [ccy, Number(myOweByCurrency?.[ccy] ?? 0)] as const
    )
    return arr.filter(([, v]) => Number.isFinite(v) && Math.abs(v) > 0.00001)
  }, [showList, myOweByCurrency])

  const owedEntries = useMemo(() => {
    const arr = showList.map(
      (ccy) => [ccy, Number(myOwedByCurrency?.[ccy] ?? 0)] as const
    )
    return arr.filter(([, v]) => Number.isFinite(v) && Math.abs(v) > 0.00001)
  }, [showList, myOwedByCurrency])

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 flex flex-wrap gap-6">
        <div className="flex flex-wrap gap-2">
          {currencies.map((ccy) => (
            <Chip
              key={ccy}
              label={ccy}
              active={(selected ?? []).includes(ccy)}
              onToggle={() => toggleCurrency(ccy)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="min-w-0 text-[12px] leading-[14px] text-[var(--tg-text-color)]">
          {oweEntries.length === 0 ? (
            <span className="text-[var(--tg-hint-color)]">
              {t("group_balance_no_debts_left")}
            </span>
          ) : (
            <>
              <span>{t("i_owe")}: </span>
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
              {t("group_balance_no_debts_right")}
            </span>
          ) : (
            <>
              <span className="mr-1">{t("they_owe_me")}:</span>
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
