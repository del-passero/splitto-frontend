// src/components/dashboard/DashboardBalanceCard.tsx
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"
import SectionTitle from "../SectionTitle"
import CardSection from "../CardSection"

// Утилиты форматирования
function parseNum(x?: string): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}
function fmtAbs(x: number): string {
  return Math.abs(x).toFixed(2)
}

const Chip = ({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "px-2.5 h-8 text-[13px] font-medium",
        "rounded-lg border",
        active
          ? "border-[var(--tg-accent-color,#40A7E3)] text-[var(--tg-accent-color,#40A7E3)] bg-transparent"
          : "border-[color-mix(in_srgb,var(--tg-secondary-bg-color,#e7e7e7)_70%,transparent)] text-[var(--tg-hint-color)] bg-transparent",
      ].join(" ")}
      style={{ WebkitTapHighlightColor: "transparent" as any }}
    >
      {label}
    </button>
  )
}

export default function DashboardBalanceCard() {
  const { t } = useTranslation()

  const {
    balance,
    loading,
    error,
    ui,
    setBalanceCurrencies,
    refreshBalance,
  } = useDashboardStore((s) => ({
    balance: s.balance,
    loading: s.loading.balance,
    error: s.error,
    ui: s.ui,
    setBalanceCurrencies: s.setBalanceCurrencies,
    refreshBalance: s.refreshBalance,
  }))

  // список доступных валют: только с ненулевыми значениями в i_owe/they_owe_me
  const allCurrencies = useMemo(() => {
    if (!balance) return []
    const set = new Set<string>()
    for (const [ccy, v] of Object.entries(balance.i_owe || {})) {
      if (Math.abs(parseNum(v)) > 0) set.add(ccy)
    }
    for (const [ccy, v] of Object.entries(balance.they_owe_me || {})) {
      if (Math.abs(parseNum(v)) > 0) set.add(ccy)
    }
    // сортировка: сначала last_currencies (как пришло), потом остальные по алфавиту
    const last = Array.isArray(balance.last_currencies) ? balance.last_currencies : []
    const head = last.filter((c) => set.has(c))
    const tail = Array.from(set).filter((c) => !head.includes(c)).sort()
    return [...head, ...tail]
  }, [balance])

  // первичная автонастройка выбора, если стор ещё пуст
  useEffect(() => {
    if (!ui.balanceCurrencies?.length && allCurrencies.length) {
      const last = Array.isArray(balance?.last_currencies) ? balance!.last_currencies : []
      const initial = last.length ? last.slice(0, 2) : allCurrencies.slice(0, 2)
      setBalanceCurrencies(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCurrencies.length])

  const selected = ui.balanceCurrencies || []

  const leftRows = useMemo(() => {
    // Я должен: выбранные валюты со знаком < 0
    return selected
      .filter((c) => parseNum(balance?.i_owe?.[c]) < 0)
      .map((c) => ({ ccy: c, amount: fmtAbs(parseNum(balance?.i_owe?.[c])) }))
  }, [selected, balance])

  const rightRows = useMemo(() => {
    // Мне должны: выбранные валюты со знаком > 0
    return selected
      .filter((c) => parseNum(balance?.they_owe_me?.[c]) > 0)
      .map((c) => ({ ccy: c, amount: fmtAbs(parseNum(balance?.they_owe_me?.[c])) }))
  }, [selected, balance])

  const nothingLeft = leftRows.length === 0
  const nothingRight = rightRows.length === 0

  const toggleChip = (ccy: string) => {
    const set = new Set(selected)
    if (set.has(ccy)) set.delete(ccy)
    else set.add(ccy)
    setBalanceCurrencies(Array.from(set))
  }

  return (
    <CardSection noPadding>
      {/* Заголовок через i18n — SectionTitle принимает children */}
      <SectionTitle>{t("group_header_my_balance")}</SectionTitle>

      <div className="px-3 pb-3">
        {/* Чипы валют — только коды */}
        <div className="flex flex-wrap gap-2 mb-3">
          {allCurrencies.map((ccy) => (
            <Chip
              key={ccy}
              label={ccy}
              active={selected.includes(ccy)}
              onClick={() => toggleChip(ccy)}
            />
          ))}
        </div>

        {/* Две колонки: слева «Я должен», справа «Мне должны» */}
        <div
          className="w-full rounded-2xl border shadow-sm bg-[var(--tg-card-bg)]"
          style={{
            borderColor: "var(--tg-secondary-bg-color, #e7e7e7)",
            color: "var(--tg-text-color)",
          }}
        >
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
            {/* LEFT */}
            <div className="p-3">
              <div className="text-[12px] font-semibold flex items-center gap-1 text-[var(--tg-hint-color)] mb-2">
                <ArrowUpRight size={16} className="text-red-500" />
                {t("i_owe")}
              </div>
              {nothingLeft ? (
                <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_left")}</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {leftRows.map((row) => (
                    <div key={`left-${row.ccy}`} className="flex items-baseline justify-between">
                      <span className="text-[13px] text-[var(--tg-hint-color)]">{row.ccy}</span>
                      <span className="text-[15px] font-semibold text-red-500">{row.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="p-3">
              <div className="text-[12px] font-semibold flex items-center gap-1 text-[var(--tg-hint-color)] mb-2">
                <ArrowDownRight size={16} className="text-emerald-500" />
                {t("they_owe_me")}
              </div>
              {nothingRight ? (
                <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_right")}</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {rightRows.map((row) => (
                    <div key={`right-${row.ccy}`} className="flex items-baseline justify-between">
                      <span className="text-[13px] text-[var(--tg-hint-color)]">{row.ccy}</span>
                      <span className="text-[15px] font-semibold text-emerald-500">{row.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* helper-строка (aria) */}
          <div className="px-3 py-2 text-[11px] text-[var(--tg-hint-color)]">
            {t("group_balance_totals_aria")}
          </div>
        </div>

        {/* Кнопка тестового рефреша (по желанию можно скрыть) */}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => refreshBalance()}
            className="px-3 h-9 text-[13px] font-semibold rounded-xl border bg-transparent active:scale-95 transition"
            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", color: "var(--tg-link-color)" }}
          >
            {t("loading")}
          </button>
        </div>

        {!!error && (
          <div className="mt-2 text-[12px] text-red-500">
            {String(error)}
          </div>
        )}
      </div>
    </CardSection>
  )
}
