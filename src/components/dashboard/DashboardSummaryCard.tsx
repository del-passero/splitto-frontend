// src/components/dashboard/DashboardSummaryCard.tsx
import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"

const nbsp = "\u00A0"

const fmtNumber = (s?: string) => {
  if (!s && s !== "0") return "—"
  const n = Number(s)
  if (!Number.isFinite(n)) return s as string
  try {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  } catch {
    return String(n)
  }
}

type PeriodAll = "week" | "month" | "year"
const PERIODS: PeriodAll[] = ["week", "month", "year"]

export default function DashboardSummaryCard() {
  const { t } = useTranslation()

  // ===== store bindings
  const period = useDashboardStore((s) => s.summaryPeriod as PeriodAll)
  const setPeriod = useDashboardStore((s) => s.setSummaryPeriod)
  const currency = useDashboardStore((s) => s.summaryCurrency)
  const setCurrency = useDashboardStore((s) => s.setSummaryCurrency)
  const currencies = useDashboardStore((s) => s.currenciesRecent) // предполагаем, что список соответствует текущему периоду
  const summary = useDashboardStore((s) => s.summary)
  const loading = useDashboardStore((s) => s.loading.summary)
  const errorMessage = useDashboardStore((s) => s.error.summary || "")
  const load = useDashboardStore((s) => s.loadSummary)

  // ===== ensure a single active currency (default = last used from list)
  const normalizedCurrencies = useMemo(
    () => (Array.isArray(currencies) ? currencies.filter(Boolean) : []),
    [currencies]
  )

  // Если текущая валюта отсутствует в списке — выбираем первую из доступных
  useEffect(() => {
    if (normalizedCurrencies.length === 0) return
    if (!currency || !normalizedCurrencies.includes(currency)) {
      const next = normalizedCurrencies[0]
      setCurrency(next)
      // перезагрузим Summary под новую валюту
      try { void load(period, next) } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedCurrencies.join("|")])

  // Первичная загрузка или смена периода — всегда перезагружаем с активной валютой
  useEffect(() => {
    if (!currency) return
    try { void load(period, currency) } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  // Если ещё ничего не грузили — инициируем
  useEffect(() => {
    if (!summary && currency) {
      try { void load(period, currency) } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // один раз на маунт

  const hasError = !!errorMessage && !loading && !summary

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
            {PERIODS.map((p) => {
              const active = p === period
              return (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); /* load триггерится эффектом выше */ }}
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

        {/* Чипы валют — под заголовком, как в BalanceCard; активен ровно один */}
        {normalizedCurrencies.length > 0 ? (
          <div
            className="mb-2 -mx-1 px-1 overflow-x-auto whitespace-nowrap"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {normalizedCurrencies.map((ccy) => {
              const active = ccy === currency
              return (
                <button
                  key={`ccy-${ccy}`}
                  type="button"
                  onClick={() => {
                    if (ccy === currency) return
                    setCurrency(ccy)
                    try { void load(period, ccy) } catch {}
                  }}
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

        {loading ? (
          <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-80">
            {t("loading")}
          </div>
        ) : hasError ? (
          <div className="flex items-center gap-3">
            <div className="text-sm" style={{ color: "var(--tg-destructive-text,#ef4444)" }}>
              {t("dashboard.summary_error")}
            </div>
            <button
              onClick={() => { if (currency) void load(period, currency) }}
              className="px-2 py-1 text-sm rounded border transition bg-transparent border-[var(--tg-hint-color)]"
              style={{ color: "var(--tg-text-color)" }}
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-[12px] leading-[14px] opacity-70 mb-1" style={{ color: "var(--tg-hint-color)" }}>
                {t("dashboard.summary_spent")}
              </div>
              <div className="text-[14px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                {summary ? fmtNumber(summary.spent) : "—"}{nbsp}{currency}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-[12px] leading-[14px] opacity-70 mb-1" style={{ color: "var(--tg-hint-color)" }}>
                {t("dashboard.summary_avg_check")}
              </div>
              <div className="text-[14px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                {summary ? fmtNumber(summary.avg_check) : "—"}{nbsp}{currency}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-[12px] leading-[14px] opacity-70 mb-1" style={{ color: "var(--tg-hint-color)" }}>
                {t("dashboard.summary_my_share")}
              </div>
              <div className="text-[14px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                {summary ? fmtNumber(summary.my_share) : "—"}{nbsp}{currency}
              </div>
            </div>
          </div>
        )}
      </div>
    </CardSection>
  )
}
