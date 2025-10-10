// src/components/dashboard/DashboardBalanceCard.tsx
// «Мой баланс» на Главной: стиль как у GroupCard (через CardSection), корректная работа с валютами,
// чипы всех валют, по умолчанию активны 2 последние. Стрелки/цвета — как на балансе группы.

import { useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"
import CardSection from "../CardSection"

const nbsp = "\u00A0"

function toNum(x: unknown): number {
  const n = Number(String(x ?? "").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

/** Быстрый формат в стиле карточек (число + код, без лишних .00) */
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

/** Строим case-insensitive карту валют => значений (по верхнему регистру) */
function buildUpperValueMap(map?: Record<string, string>): Record<string, number> {
  const out: Record<string, number> = {}
  if (!map) return out
  for (const [k, v] of Object.entries(map)) {
    const key = String(k || "").toUpperCase()
    out[key] = toNum(v)
  }
  return out
}

export default function DashboardBalanceCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  // читаем стор
  const balance = useDashboardStore((s) => s.balance)
  const selectedCurrencies = useDashboardStore((s) => s.ui.balanceCurrencies)
  const setCurrencies = useDashboardStore((s) => s.setBalanceCurrencies)
  const isLoading = useDashboardStore((s) => s.loading.balance || s.loading.global)

  // Мапы значений (по верхнему регистру ключей) — это фикс проблемы «Я должен пусто»
  const iOweUpper = useMemo(() => buildUpperValueMap(balance?.i_owe), [balance?.i_owe])
  const theyOweUpper = useMemo(() => buildUpperValueMap(balance?.they_owe_me), [balance?.they_owe_me])

  // Доступные валюты: сначала last_currencies (как есть), затем ключи из обеих мап
  const available = useMemo(() => {
    const set = new Set<string>()
    const out: string[] = []
    const push = (code?: string | null) => {
      const c = String(code ?? "").trim()
      if (!c) return
      const up = c.toUpperCase()
      if (!set.has(up)) {
        set.add(up)
        out.push(up) // показываем чипы в верхнем регистре
      }
    }
    for (const c of balance?.last_currencies ?? []) push(c)
    for (const k of Object.keys(balance?.i_owe ?? {})) push(k)
    for (const k of Object.keys(balance?.they_owe_me ?? {})) push(k)
    return out
  }, [balance?.last_currencies, balance?.i_owe, balance?.they_owe_me])

  // Активные чипы: из UI (фильтруем по доступным). Если пусто — первые 2 из available
  const active = useMemo(() => {
    const allow = new Set(available)
    const filtered = (selectedCurrencies || []).map((c) => c.toUpperCase()).filter((c) => allow.has(c))
    return filtered.length ? filtered : available.slice(0, 2)
  }, [available, selectedCurrencies])

  // Тоггл чипа (минимум 1 активная валюта)
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

  // Перечни значений по выбранным валютам (по ТЗ показываем суммы по каждой валюте; без межвалютного неттинга)
  const oweList = useMemo(() => {
    const rows: string[] = []
    for (const c of active) {
      // «Я должен»: берём значение из iOweUpper (там обычно отрицательные строки), отображаем модуль
      const raw = iOweUpper[c] ?? 0
      const val = Math.abs(raw < 0 ? raw : Math.min(0, raw)) // гарантия, что не попадём на случайный плюс
      if (val > 0) rows.push(fmtAmountSmart(val, c, locale))
    }
    return rows
  }, [active, iOweUpper, locale])

  const owedToMeList = useMemo(() => {
    const rows: string[] = []
    for (const c of active) {
      // «Мне должны»: берём положительную часть theyOweUpper
      const raw = theyOweUpper[c] ?? 0
      const val = raw > 0 ? raw : Math.max(0, raw) // защита от случайного минуса
      if (val > 0) rows.push(fmtAmountSmart(val, c, locale))
    }
    return rows
  }, [active, theyOweUpper, locale])

  return (
    <CardSection noPadding className="overflow-hidden">
      <div className="p-3">
        {/* Чипы валют — показываем ВСЕ доступные; активные подсвечены */}
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pr-1">
          {available.map((ccy) => {
            const isActive = active.includes(ccy)
            return (
              <button
                key={ccy}
                type="button"
                onClick={() => toggleCurrency(ccy)}
                className={[
                  "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition",
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
          {available.length === 0 && (
            <span className="text-sm text-[var(--tg-hint-color)]">{t("loading")}</span>
          )}
        </div>

        {/* Две колонки — слева «Я должен», справа «Мне должны». Цвета/иконки как на балансе группы */}
        <div className="grid grid-cols-2 gap-3">
          {/* Я должен */}
          <div className="p-3 rounded-xl" style={{ background: "var(--tg-card-bg)" }}>
            <div className="flex items-center gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
              <ArrowRight className="w-4 h-4" style={{ color: "var(--tg-destructive-text,#d7263d)" }} />
              <span>{t("i_owe")}</span>
            </div>
            {isLoading ? (
              <div className="h-5 w-32 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
            ) : oweList.length ? (
              <div className="text-lg font-semibold leading-tight" style={{ color: "var(--tg-destructive-text,#d7263d)" }}>
                {oweList.join("; ")}
              </div>
            ) : (
              <div className="text-lg font-semibold leading-tight text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_left")}
              </div>
            )}
          </div>

          {/* Мне должны */}
          <div className="p-3 rounded-xl text-right" style={{ background: "var(--tg-card-bg)" }}>
            <div className="flex items-center justify-end gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
              <span>{t("they_owe_me")}</span>
              <ArrowLeft className="w-4 h-4" style={{ color: "var(--tg-success-text,#1aab55)" }} />
            </div>
            {isLoading ? (
              <div className="ml-auto h-5 w-32 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
            ) : owedToMeList.length ? (
              <div className="text-lg font-semibold leading-tight" style={{ color: "var(--tg-success-text,#1aab55)" }}>
                {owedToMeList.join("; ")}
              </div>
            ) : (
              <div className="text-lg font-semibold leading-tight text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_right")}
              </div>
            )}
          </div>
        </div>
      </div>
    </CardSection>
  )
}
