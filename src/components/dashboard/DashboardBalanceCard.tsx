// src/components/dashboard/DashboardBalanceCard.tsx
// Карточка баланса: заголовок через SectionTitle + чипы + две колонки.

import { useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"
import SectionTitle from "../SectionTitle"

const NBSP = "\u00A0"

function absAmount(x?: string | number | null): number {
  if (x === null || x === undefined) return 0
  const n = Number(String(x).replace(",", "."))
  return Number.isFinite(n) ? Math.abs(n) : 0
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
    const s =
      Math.round((Math.abs(rounded) % 1) * 100) !== 0 ? rounded.toFixed(2) : String(Math.trunc(rounded))
    return `${s}${NBSP}${currency}`
  }
}

// Нормализация словаря валют к верхнему регистру ключей
function normalizeCurrencyMap<T extends Record<string, string> | undefined>(m: T) {
  const out: Record<string, string> = {}
  if (!m) return out
  for (const [k, v] of Object.entries(m)) out[(k || "").toUpperCase()] = v
  return out
}

export default function DashboardBalanceCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  const balance = useDashboardStore((s) => s.balance)
  const lastOrdered = useDashboardStore((s) => s.lastCurrenciesOrdered || [])
  const selected = useDashboardStore((s) => s.ui.balanceCurrencies)
  const setSelected = useDashboardStore((s) => s.setBalanceCurrencies)
  const isLoading = useDashboardStore((s) => s.loading.balance || s.loading.global)
  const reloadBalance = useDashboardStore((s) => s.reloadBalance)

  // 👉 страхуем первый запрос, если страница не дернула init()
  useEffect(() => {
    if (!balance && !isLoading) {
      void reloadBalance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Нормализованные карты (ключи в UPPERCASE, чтобы не терять значения)
  const iOweMapU = useMemo(() => normalizeCurrencyMap(balance?.i_owe), [balance])
  const theyOweMapU = useMemo(() => normalizeCurrencyMap(balance?.they_owe_me), [balance])

  // Валюты с ненулём по обеим сторонам
  const nonZero = useMemo(() => {
    const set = new Set<string>()
    for (const [ccy, v] of Object.entries(iOweMapU)) if (absAmount(v) > 0) set.add(ccy)
    for (const [ccy, v] of Object.entries(theyOweMapU)) if (absAmount(v) > 0) set.add(ccy)
    return Array.from(set)
  }, [iOweMapU, theyOweMapU])

  // Доступные чипы с сортировкой: сперва по последним использованным, затем по алфавиту
  const available = useMemo(() => {
    if (!nonZero.length) return []
    const order = new Map<string, number>()
    lastOrdered.forEach((c, i) => order.set((c || "").toUpperCase(), i))
    const [inLast, others] = nonZero.reduce<[string[], string[]]>(
      (acc, c) => {
        if (order.has(c)) acc[0].push(c)
        else acc[1].push(c)
        return acc
      },
      [[], []]
    )
    inLast.sort((a, b) => (order.get(a)! - order.get(b)!))
    others.sort()
    return [...inLast, ...others]
  }, [nonZero, lastOrdered])

  // Активные чипы: если пользователь ничего не выбирал — берём первые две доступные
  const active = useMemo(() => {
    const sel = (selected || []).map((c) => c.toUpperCase()).filter((c) => available.includes(c))
    return sel.length ? sel : available.slice(0, 2)
  }, [selected, available])

  const toggle = useCallback(
    (ccy: string) => {
      const set = new Set(active)
      if (set.has(ccy)) {
        if (set.size === 1) return // оставляем минимум одну валюту включённой
        set.delete(ccy)
      } else {
        set.add(ccy)
      }
      setSelected(Array.from(set))
    },
    [active, setSelected]
  )

  // Левая колонка — «Я должен»
  const leftLines = useMemo(() => {
    return active
      .map((c) => {
        const v = absAmount(iOweMapU[c])
        if (v <= 0) return null
        return { c, text: fmtMoney(v, c, locale) }
      })
      .filter(Boolean) as { c: string; text: string }[]
  }, [active, iOweMapU, locale])

  // Правая колонка — «Мне должны»
  const rightLines = useMemo(() => {
    return active
      .map((c) => {
        const v = absAmount(theyOweMapU[c])
        if (v <= 0) return null
        return { c, text: fmtMoney(v, c, locale) }
      })
      .filter(Boolean) as { c: string; text: string }[]
  }, [active, theyOweMapU, locale])

  return (
    <div
      className="
        w-full rounded-lg p-2
        border bg-[var(--tg-card-bg)] border-[var(--tg-hint-color)]
        shadow-[0_8px_32px_0_rgba(50,60,90,0.08)]
      "
    >
      {/* Заголовок секции внутри карточки */}
      <SectionTitle className="!mb-2">{t("group_header_my_balance")}</SectionTitle>

      {/* Чипы валют */}
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
        {!available.length && !isLoading && (
          <span className="text-sm text-[var(--tg-hint-color)]">{t("group_balance_no_debts_all")}</span>
        )}
        {isLoading && <span className="text-sm text-[var(--tg-hint-color)]">{t("loading")}</span>}
      </div>

      {/* Две половины */}
      <div className="grid grid-cols-2 gap-2">
        {/* Левая: Я должен */}
        <div className="p-2 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
            <ArrowRight className="w-4 h-4" style={{ color: "var(--tg-destructive-text,#d7263d)" }} />
            <span>{t("i_owe")}</span>
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
              {t("group_balance_no_debts_left")}
            </div>
          )}
        </div>

        {/* Правая: Мне должны */}
        <div className="p-2 rounded-lg text-right">
          <div className="flex items-center justify-end gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
            <span>{t("they_owe_me")}</span>
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
              {t("group_balance_no_debts_right")}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
