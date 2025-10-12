// src/components/dashboard/DashboardBalanceCard.tsx
// Карточка баланса на дашборде: заголовок + чипы валют + две колонки.

import { useMemo, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"
import SectionTitle from "../SectionTitle"

const NBSP = "\u00A0"

function toNum(x: unknown): number {
  if (x === null || x === undefined) return 0
  if (typeof x === "number") return x
  if (typeof x === "string") {
    const n = Number(x.replace(",", ".").trim())
    return Number.isFinite(n) ? n : 0
  }
  if (typeof x === "object") {
    // @ts-ignore
    const cand = (x?.amount ?? x?.value ?? x?.total ?? x?.sum) as unknown
    return toNum(cand)
  }
  return 0
}

type MoneyLike =
  | Record<string, unknown>
  | Array<{ currency?: string; ccy?: string; code?: string; amount?: unknown; value?: unknown; total?: unknown; sum?: unknown }>
  | null
  | undefined

function normalizeMoneyMap(input: MoneyLike): Record<string, number> {
  const acc: Record<string, number> = {}
  if (!input) return acc

  if (Array.isArray(input)) {
    for (const row of input) {
      const rawCcy = (row?.currency ?? row?.ccy ?? row?.code) as string | undefined
      if (!rawCcy) continue
      const ccy = rawCcy.toUpperCase().trim()
      const v = Math.abs(toNum(row))
      if (!acc[ccy]) acc[ccy] = 0
      acc[ccy] += v
    }
    return acc
  }

  for (const [k, v] of Object.entries(input)) {
    const ccy = (k || "").toUpperCase().trim()
    const num = Math.abs(toNum(v))
    if (!acc[ccy]) acc[ccy] = 0
    acc[ccy] += num
  }
  return acc
}

function fmtMoney(value: number, currency: string, locale: string) {
  try {
    const nf = new Intl.NumberFormat(locale, {
      minimumFractionDigits: value % 1 ? 2 : 0,
      maximumFractionDigits: 2,
      useGrouping: true,
    })
    return `${nf.format(value)}${NBSP}${currency}`
  } catch {
    const rounded = Math.round(value * 100) / 100
    const s = Math.round((Math.abs(rounded) % 1) * 100) !== 0 ? rounded.toFixed(2) : String(Math.trunc(rounded))
    return `${s}${NBSP}${currency}`
  }
}

export default function DashboardBalanceCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  const balance = useDashboardStore((s: any) => (s as any).balance)
  const lastOrdered = useDashboardStore((s: any) => (s as any).lastCurrenciesOrdered || [])
  const selected = useDashboardStore((s: any) => (s as any).ui?.balanceCurrencies)
  const isLoading = useDashboardStore((s: any) => Boolean((s as any).loading?.balance || (s as any).loading?.global))
  const ui = useDashboardStore((s: any) => (s as any).ui)
  const fetchAll = useDashboardStore((s: any) => (s as any).fetchAll as (ccy: string, period?: string) => Promise<void> | void)
  const refreshBalance = useDashboardStore((s: any) => (s as any).refreshBalance as () => Promise<void> | void)

  useEffect(() => {
    if (!balance && !isLoading) {
      const ccy = ui?.summaryCurrency || "USD"
      const period = (ui?.activityPeriod as string) || "month"
      try {
        if (typeof fetchAll === "function") fetchAll(ccy, period)
        else if (typeof refreshBalance === "function") refreshBalance()
      } catch {}
    }
  }, [balance, isLoading, ui, fetchAll, refreshBalance])

  const iOwe = useMemo(() => normalizeMoneyMap((balance as any)?.i_owe as MoneyLike), [balance])
  const theyOwe = useMemo(() => normalizeMoneyMap((balance as any)?.they_owe_me as MoneyLike), [balance])

  const available = useMemo<string[]>(() => {
    const set = new Set<string>()
    for (const [ccy, v] of Object.entries(iOwe)) if (v > 0) set.add(ccy)
    for (const [ccy, v] of Object.entries(theyOwe)) if (v > 0) set.add(ccy)
    const list = Array.from(set)
    if (!list.length) return []

    const order = new Map<string, number>()
    ;(lastOrdered as string[]).forEach((c, i) => order.set((c || "").toUpperCase(), i))
    const inLast: string[] = []
    const others: string[] = []
    for (const c of list) (order.has(c) ? inLast : others).push(c)
    inLast.sort((a, b) => (order.get(a)! - order.get(b)!))
    others.sort()
    return [...inLast, ...others]
  }, [iOwe, theyOwe, lastOrdered])

  const active = useMemo<string[]>(() => {
    const sel = (selected || []).map((c: string) => c.toUpperCase()).filter((c: string) => available.includes(c))
    if (sel.length) return sel
    return available.slice(0, 2)
  }, [selected, available])

  const toggle = useCallback(
    (ccy: string) => {
      const set = new Set(active)
      if (set.has(ccy)) {
        if (set.size === 1) return
        set.delete(ccy)
      } else {
        set.add(ccy)
      }
      try {
        (useDashboardStore.getState() as any).setBalanceCurrencies(Array.from(set))
      } catch {}
    },
    [active]
  )

  const leftLines = useMemo(() => {
    return active
      .map((c: string) => {
        const v = iOwe[c] || 0
        if (v <= 0) return null
        return { c, text: fmtMoney(v, c, locale) }
      })
      .filter(Boolean) as { c: string; text: string }[]
  }, [active, iOwe, locale])

  const rightLines = useMemo(() => {
    return active
      .map((c: string) => {
        const v = theyOwe[c] || 0
        if (v <= 0) return null
        return { c, text: fmtMoney(v, c, locale) }
      })
      .filter(Boolean) as { c: string; text: string }[]
  }, [active, theyOwe, locale])

  const emptyAll = !available.length && !isLoading

  return (
    <div
      className="
        w-full rounded-lg p-2
        border bg-[var(--tg-card-bg)] border-[var(--tg-hint-color)]
        shadow-[0_8px_32px_0_rgba(50,60,90,0.08)]
      "
    >
      <SectionTitle className="!mb-2">{t("group_header_my_balance")}</SectionTitle>

      <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pr-1">
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
              {ccy}
            </button>
          )
        })}
        {emptyAll && (
          <span className="text-sm text-[var(--tg-hint-color)]">
            {t("dashboard_balance_no_debts_all", { defaultValue: "Нет долгов" })}
          </span>
        )}
        {isLoading && <span className="text-sm text-[var(--tg-hint-color)]">{t("loading")}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
            <ArrowRight className="w-4 h-4" style={{ color: "var(--tg-destructive-text,#d7263d)" }} />
            <span>{t("i_owe", { defaultValue: "Я должен" })}</span>
          </div>
          {isLoading ? (
            <div className="h-5 w-32 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
          ) : leftLines.length ? (
            <div className="space-y-1">
              {leftLines.map((row) => (
                <div
                  key={`l-${row.c}`}
                  className="text-[15px] font-semibold leading-tight"
                  style={{ color: "var(--tg-destructive-text,#d7263d)" }}
                >
                  {row.text}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[15px] font-semibold leading-tight text-[var(--tg-hint-color)]">
              {t("dashboard_balance_no_debts_left", { defaultValue: "Вы никому не должны" })}
            </div>
          )}
        </div>

        <div className="p-2 rounded-lg text-right">
          <div className="flex items-center justify-end gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
            <span>{t("they_owe_me", { defaultValue: "Мне должны" })}</span>
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--tg-success-text,#1aab55)" }} />
          </div>
          {isLoading ? (
            <div className="ml-auto h-5 w-32 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
          ) : rightLines.length ? (
            <div className="space-y-1">
              {rightLines.map((row) => (
                <div
                  key={`r-${row.c}`}
                  className="text-[15px] font-semibold leading-tight"
                  style={{ color: "var(--tg-success-text,#1aab55)" }}
                >
                  {row.text}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[15px] font-semibold leading-tight text-[var(--tg-hint-color)]">
              {t("dashboard_balance_no_debts_right", { defaultValue: "Вам никто не должен" })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
