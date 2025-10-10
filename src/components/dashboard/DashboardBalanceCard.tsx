// src/components/dashboard/DashboardBalanceCard.tsx
// «Мой баланс» на Главной — локализовано, стилизовано как в других компонентах,
// чипы всех доступных валют (2 последние активны по умолчанию), стрелки и цвета
// как на балансе группы.

import { useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"

const nbsp = "\u00A0"

// Формат как в GroupBalanceTabSmart: число + код валюты, без лишних копеек
function fmtAmountSmart(value: number, currency: string, locale?: string) {
  try {
    const nfCurrency = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "code",
    })
    const parts = nfCurrency.formatToParts(Math.abs(value))
    const fractionPart = parts.find((p) => p.type === "fraction")
    const hasCents = !!fractionPart && Number(fractionPart.value) !== 0
    const nfNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
      useGrouping: true,
    })
    return `${nfNumber.format(value)}${nbsp}${currency}`
  } catch {
    const rounded = Math.round(value * 100) / 100
    const hasCents = Math.round((Math.abs(rounded) % 1) * 100) !== 0
    return `${hasCents ? rounded.toFixed(2) : Math.trunc(rounded)}${nbsp}${currency}`
  }
}

function toNum(x: unknown): number {
  const n = Number(String(x ?? "").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

export default function DashboardBalanceCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  // читаем стор по одному полю — минимум лишних ререндеров
  const balance = useDashboardStore((s) => s.balance)
  const selectedCurrencies = useDashboardStore((s) => s.ui.balanceCurrencies)
  const setCurrencies = useDashboardStore((s) => s.setBalanceCurrencies)
  const isLoading = useDashboardStore((s) => s.loading.balance || s.loading.global)

  const iOweMap = balance?.i_owe ?? {}
  const theyOweMap = balance?.they_owe_me ?? {}
  const last = balance?.last_currencies ?? []

  // Доступные валюты: last_currencies первыми, затем ключи карт
  const available = useMemo(() => {
    const set = new Set<string>()
    const out: string[] = []
    const push = (code?: string | null) => {
      const c = String(code ?? "").trim().toUpperCase()
      if (!c) return
      if (!set.has(c)) {
        set.add(c)
        out.push(c)
      }
    }
    last.forEach(push)
    Object.keys(iOweMap).forEach(push)
    Object.keys(theyOweMap).forEach(push)
    return out
  }, [last, iOweMap, theyOweMap])

  // Активные чипы: из UI → фильтруем по доступным; если пусто — первые 2 из available
  const active = useMemo(() => {
    const allow = new Set(available)
    const filtered = (selectedCurrencies || []).filter((c) => allow.has(c))
    return filtered.length ? filtered : available.slice(0, 2)
  }, [available, selectedCurrencies])

  // Тоггл чипа (держим минимум 1 активную валюту)
  const toggleCurrency = useCallback(
    (ccy: string) => {
      const set = new Set(active)
      if (set.has(ccy)) {
        if (set.size === 1) return
        set.delete(ccy)
      } else {
        set.add(ccy)
      }
      setCurrencies(Array.from(set))
    },
    [active, setCurrencies]
  )

  // Собираем списки сумм по выбранным валютам (скрываем нули)
  const leftList = useMemo(() => {
    const rows: string[] = []
    for (const c of active) {
      const raw = toNum((iOweMap as any)[c]) // в API могут прийти отрицательные строки
      const val = Math.abs(raw)
      if (val > 0) rows.push(fmtAmountSmart(val, c, locale))
    }
    return rows
  }, [active, iOweMap, locale])

  const rightList = useMemo(() => {
    const rows: string[] = []
    for (const c of active) {
      const raw = toNum((theyOweMap as any)[c])
      const val = Math.abs(raw)
      if (val > 0) rows.push(fmtAmountSmart(val, c, locale))
    }
    return rows
  }, [active, theyOweMap, locale])

  return (
    <div
      className="
        rounded-2xl p-3
        border bg-[var(--tg-card-bg)] border-[var(--tg-hint-color)]
        shadow-[0_4px_18px_-10px_rgba(83,147,231,0.14)]
      "
    >
      {/* Чипы валют: показываем ВСЕ доступные, активные — подсвечены */}
      <div className="mb-3 flex items-center gap-2 overflow-x-auto pr-1">
        {available.map((ccy) => {
          const isActive = active.includes(ccy)
          return (
            <button
              key={ccy}
              type="button"
              onClick={() => toggleCurrency(ccy)}
              className={`
                h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition
                border
                ${isActive
                  ? "bg-[var(--tg-accent-color,#40A7E3)] text-white border-transparent"
                  : "bg-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] border-[color:var(--tg-secondary-bg-color,#e7e7e7)]"}
              `}
              aria-pressed={isActive}
            >
              {ccy}
            </button>
          )
        })}
        {available.length === 0 && (
          <span className="text-sm text-[var(--tg-hint-color)]">{t("loading")}</span>
        )}
      </div>

      {/* Две колонки — слева «Я должен», справа «Мне должны» */}
      <div className="grid grid-cols-2 gap-3">
        {/* Я должен */}
        <div
          className="p-3 rounded-xl"
          style={{ background: "var(--tg-card-bg)" }}
        >
          <div className="flex items-center gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
            <ArrowRight className="w-4 h-4" style={{ color: "var(--tg-destructive-text,#d7263d)" }} />
            <span>{t("i_owe")}</span>
          </div>

          {isLoading ? (
            <div className="h-5 w-32 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
          ) : leftList.length ? (
            <div className="text-lg font-semibold leading-tight" style={{ color: "var(--tg-destructive-text,#d7263d)" }}>
              {leftList.join("; ")}
            </div>
          ) : (
            <div className="text-lg font-semibold leading-tight text-[var(--tg-hint-color)]">
              {t("group_balance_no_debts_left")}
            </div>
          )}
        </div>

        {/* Мне должны */}
        <div
          className="p-3 rounded-xl text-right"
          style={{ background: "var(--tg-card-bg)" }}
        >
          <div className="flex items-center justify-end gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
            <span>{t("they_owe_me")}</span>
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--tg-success-text,#1aab55)" }} />
          </div>

          {isLoading ? (
            <div className="ml-auto h-5 w-32 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
          ) : rightList.length ? (
            <div className="text-lg font-semibold leading-tight" style={{ color: "var(--tg-success-text,#1aab55)" }}>
              {rightList.join("; ")}
            </div>
          ) : (
            <div className="text-lg font-semibold leading-tight text-[var(--tg-hint-color)]">
              {t("group_balance_no_debts_right")}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
