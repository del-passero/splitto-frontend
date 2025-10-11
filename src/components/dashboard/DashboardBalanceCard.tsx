// src/components/dashboard/DashboardBalanceCard.tsx
import { useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"

const NBSP = "\u00A0"
const toStr = (v: any) => String(v ?? "")
const absNum = (x?: string | number | null) => {
  if (x === null || x === undefined) return 0
  const n = Number(String(x).replace(",", "."))
  return Number.isFinite(n) ? Math.abs(n) : 0
}
function fmt(value: number, currency: string, locale: string) {
  try {
    const nf = new Intl.NumberFormat(locale, { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })
    return `${nf.format(value)}${NBSP}${currency}`
  } catch {
    const v = Math.round(value * 100) / 100
    return `${(v % 1 ? v.toFixed(2) : String(Math.trunc(v)))}${NBSP}${currency}`
  }
}

export default function DashboardBalanceCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  const { balance, lastCurrenciesOrdered, ui, setBalanceCurrencies, loading } = useDashboardStore((s) => ({
    balance: s.balance,
    lastCurrenciesOrdered: s.lastCurrenciesOrdered || [],
    ui: s.ui,
    setBalanceCurrencies: s.setBalanceCurrencies,
    loading: s.loading.balance || s.loading.global,
  }))

  const iOwe = balance?.i_owe ?? {}
  const theyOwe = balance?.they_owe_me ?? {}

  // Валюты только с ненулём, отсортированные по «последнему использованию»
  const available = useMemo(() => {
    const set = new Set<string>()
    Object.entries(iOwe).forEach(([ccy, v]) => { if (absNum(v) > 0) set.add(toStr(ccy).toUpperCase()) })
    Object.entries(theyOwe).forEach(([ccy, v]) => { if (absNum(v) > 0) set.add(toStr(ccy).toUpperCase()) })
    const all = Array.from(set)
    if (!all.length) return []
    const order = new Map<string, number>()
    lastCurrenciesOrdered.forEach((c, i) => order.set(toStr(c).toUpperCase(), i))
    const inLast = all.filter((c) => order.has(c)).sort((a, b) => (order.get(a)! - order.get(b)!))
    const others = all.filter((c) => !order.has(c)).sort()
    return [...inLast, ...others]
  }, [iOwe, theyOwe, lastCurrenciesOrdered])

  // Активные чипы: сохранённые и валидные, иначе две последние
  const active = useMemo(() => {
    const sel = (ui.balanceCurrencies || []).map((c) => toStr(c).toUpperCase()).filter((c) => available.includes(c))
    return sel.length ? sel : available.slice(0, 2)
  }, [available, ui.balanceCurrencies])

  const toggle = useCallback(
    (ccy: string) => {
      const next = new Set(active)
      if (next.has(ccy)) {
        if (next.size === 1) return
        next.delete(ccy)
      } else next.add(ccy)
      setBalanceCurrencies(Array.from(next))
    },
    [active, setBalanceCurrencies]
  )

  const left = useMemo(() => active.map((c) => ({ c, v: absNum((iOwe as any)[c]) })).filter((x) => x.v > 0), [active, iOwe])
  const right = useMemo(() => active.map((c) => ({ c, v: absNum((theyOwe as any)[c]) })).filter((x) => x.v > 0), [active, theyOwe])

  return (
    <div className="w-full">
      {/* Заголовок по ключу group_header_my_balance */}
      <div className="px-2 pt-1 pb-1">
        <h2 className="text-[15px] font-semibold text-[var(--tg-link-color)]">
          {toStr(t("group_header_my_balance"))}
        </h2>
      </div>

      {/* Чипы — скролл по оси X, только валюты с ненулём */}
      <div className="mb-2 flex items-center gap-1.5 overflow-x-auto px-2">
        {available.map((ccy) => {
          const isActive = active.includes(ccy)
          return (
            <button
              key={ccy}
              type="button"
              onClick={() => toggle(ccy)}
              className={[
                "h-8 px-3 rounded-md text-[13px] font-semibold active:scale-95 transition",
                "border",
                isActive
                  ? "bg-[var(--tg-accent-color,#40A7E3)] text-white border-transparent"
                  : "bg-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] border-[color:var(--tg-secondary-bg-color,#e7e7e7)]",
              ].join(" ")}
              aria-pressed={isActive}
            >
              {toStr(ccy)}
            </button>
          )
        })}
        {!available.length && !loading && (
          <span className="text-sm text-[var(--tg-hint-color)]">{toStr(t("group_balance_no_debts_all"))}</span>
        )}
        {loading && <span className="text-sm text-[var(--tg-hint-color)]">{toStr(t("loading"))}</span>}
      </div>

      {/* Две половины: слева — Я должен; справа — Мне должны */}
      <div className="grid grid-cols-2 gap-2 px-2 pb-2">
        {/* Я должен */}
        <div className="p-2 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
            <ArrowRight className="w-4 h-4" style={{ color: "var(--tg-destructive-text,#d7263d)" }} />
            <span>{toStr(t("i_owe"))}</span>
          </div>
          {loading ? (
            <div className="h-5 w-32 rounded bg-[var(--tg-secondary-bg-color)] opacity-50" />
          ) : left.length ? (
            <div className="space-y-1">
              {left.map(({ c, v }) => (
                <div key={`l-${c}`} className="text-[15px] font-semibold leading-tight" style={{ color: "var(--tg-destructive-text,#d7263d)" }}>
                  {fmt(v, c, locale)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[15px] font-semibold leading-tight text-[var(--tg-hint-color)]">
              {toStr(t("group_balance_no_debts_left"))}
            </div>
          )}
        </div>

        {/* Мне должны */}
        <div className="p-2 rounded-lg text-right">
          <div className="flex items-center justify-end gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
            <span>{toStr(t("they_owe_me"))}</span>
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--tg-success-text,#1aab55)" }} />
          </div>
          {loading ? (
            <div className="ml-auto h-5 w-32 rounded bg-[var(--tg-secondary-bg-color)] opacity-50" />
          ) : right.length ? (
            <div className="space-y-1">
              {right.map(({ c, v }) => (
                <div key={`r-${c}`} className="text-[15px] font-semibold leading-tight" style={{ color: "var(--tg-success-text,#1aab55)" }}>
                  {fmt(v, c, locale)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[15px] font-semibold leading-tight text-[var(--tg-hint-color)]">
              {toStr(t("group_balance_no_debts_right"))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
