// src/components/dashboard/DashboardSummaryCard.tsx
import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"

/* ===== helpers ===== */
const nbsp = "\u00A0"

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

function parseAmtToNumber(input: string | number | null | undefined): number {
  if (typeof input === "number") return isFinite(input) ? input : 0
  if (!input && input !== "0") return 0
  const s = String(input).trim().replace(/\s+/g, "").replace(",", ".")
  const n = Number(s)
  return isFinite(n) ? n : 0
}

function sortCcysByRecent(ccys: string[], recent: string[]): string[] {
  if (!ccys?.length) return []
  const order = new Map<string, number>()
  // Самые новые — правее в recent → ставим их первыми
  for (let i = recent.length - 1, rank = 0; i >= 0; i--, rank++) {
    const c = recent[i]
    if (!order.has(c)) order.set(c, rank)
  }
  return [...ccys].sort((a, b) => {
    const ia = order.has(a) ? (order.get(a) as number) : Number.POSITIVE_INFINITY
    const ib = order.has(b) ? (order.get(b) as number) : Number.POSITIVE_INFINITY
    if (ia !== ib) return ia - ib
    return a.localeCompare(b)
  })
}

type Period = "week" | "month" | "year"

export default function DashboardSummaryCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  // period & currency из стора
  const period = useDashboardStore((s) => s.summaryPeriod as Period)
  const setPeriod = useDashboardStore((s) => s.setSummaryPeriod)
  const currency = useDashboardStore((s) => s.summaryCurrency)
  const setCurrency = useDashboardStore((s) => s.setSummaryCurrency)

  // данные виджета
  const summary = useDashboardStore((s) => s.summary)
  const loading = useDashboardStore((s) => s.loading.summary)
  const error = useDashboardStore((s) => s.error.summary || null)
  const load = useDashboardStore((s) => s.loadSummary)

  // «последние валюты» (для сортировки и дефолтов)
  const recentCcys = useDashboardStore((s: any) => s.currenciesRecent || [])

  // Валюты ЗА ВЫБРАННЫЙ ПЕРИОД (если стор отдаёт период-зависимые; иначе — fallback на recent)
  const periodCcys = useDashboardStore(
    (s: any) => s.summaryCurrencies?.[period] || s.currenciesByPeriod?.[period] || []
  )
  const availableCcysRaw = periodCcys.length ? periodCcys : recentCcys
  const availableCcys = useMemo(
    () => sortCcysByRecent(availableCcysRaw, recentCcys),
    [availableCcysRaw.join("|"), recentCcys.join("|")]
  )

  // При маунте/смене периода:
  // 1) если выбранная валюта не доступна — переключаемся на первую доступную (по приоритету recent)
  // 2) грузим сводку
  useEffect(() => {
    if (!availableCcys.length) return
    if (!currency || !availableCcys.includes(currency)) {
      const fallback = availableCcys[0]
      setCurrency(fallback)
      void load(period, fallback)
      return
    }
    void load(period, currency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, availableCcys.join("|")])

  const onPickPeriod = (p: Period) => {
    if (p === period) return
    setPeriod(p)
    // далее сработает useEffect(), который сам подберёт валюту и загрузит
  }

  const onPickCurrency = (ccy: string) => {
    if (ccy === currency) return
    setCurrency(ccy)
    void load(period, ccy)
  }

  return (
    <CardSection noPadding>
      <div className="rounded-lg p-1.5 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
        {/* Заголовок + чипы периода (как в ActivityChart) */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="font-semibold"
            style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
          >
            {t("dashboard.summary_title")}
          </div>

          <div className="ml-auto flex gap-1">
            {(["week", "month", "year"] as Period[]).map((p) => {
              const active = p === period
              return (
                <button
                  key={p}
                  onClick={() => onPickPeriod(p)}
                  aria-pressed={active}
                  className={[
                    "px-2 py-1 rounded text-sm border transition",
                    active
                      ? "bg-[var(--tg-link-color,#2481CC)] text-white border-[var(--tg-link-color,#2481CC)]"
                      : "bg-transparent text-[var(--tg-text-color)]/90 border-[var(--tg-hint-color)]",
                  ].join(" ")}
                >
                  {p === "week" ? t("period.week") : p === "month" ? t("period.month") : t("period.year")}
                </button>
              )
            })}
          </div>
        </div>

        {/* Чипы валют — всегда ОДНА активна; под заголовком; как в балансе */}
        {!loading && availableCcys.length > 0 ? (
          <div
            className="mb-2 -mx-1 px-1 overflow-x-auto whitespace-nowrap"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {availableCcys.map((ccy) => {
              const active = currency === ccy
              return (
                <button
                  key={`ccy-chip-${ccy}`}
                  type="button"
                  onClick={() => onPickCurrency(ccy)}
                  className={[
                    "inline-flex items-center h-7 px-3 mr-2 rounded-full text-xs select-none transition-colors",
                    active
                      ? "bg-[var(--tg-link-color,#2481CC)] text-white"
                      : "bg-transparent text-[var(--tg-text-color)]/80 border border-[var(--tg-hint-color)]",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {ccy}
                </button>
              )
            })}
          </div>
        ) : null}

        {/* Контент */}
        {loading ? (
          <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-80">
            {t("loading")}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3">
            <div className="text-sm" style={{ color: "var(--tg-destructive-text,#ef4444)" }}>
              {error}
            </div>
            <button
              onClick={() => load(period, currency)}
              className="px-2 py-1 text-sm rounded border transition bg-transparent border-[var(--tg-hint-color)]"
              style={{ color: "var(--tg-text-color)" }}
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {/* Потрачено */}
            <div className="rounded-lg p-2 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
              <div className="text-[12px] leading-[14px] text-[var(--tg-hint-color)] mb-1">
                {t("dashboard.spent")}
              </div>
              <div className="text-[14px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                {summary ? fmtAmountSmart(parseAmtToNumber(summary.spent), currency, locale) : `—${nbsp}${currency}`}
              </div>
            </div>

            {/* Средний чек */}
            <div className="rounded-lg p-2 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
              <div className="text-[12px] leading-[14px] text-[var(--tg-hint-color)] mb-1">
                {t("dashboard.avg_check")}
              </div>
              <div className="text-[14px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                {summary ? fmtAmountSmart(parseAmtToNumber(summary.avg_check), currency, locale) : `—${nbsp}${currency}`}
              </div>
            </div>

            {/* Моя доля */}
            <div className="rounded-lg p-2 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
              <div className="text-[12px] leading-[14px] text-[var(--tg-hint-color)] mb-1">
                {t("dashboard.my_share")}
              </div>
              <div className="text-[14px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                {summary ? fmtAmountSmart(parseAmtToNumber(summary.my_share), currency, locale) : `—${nbsp}${currency}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </CardSection>
  )
}
