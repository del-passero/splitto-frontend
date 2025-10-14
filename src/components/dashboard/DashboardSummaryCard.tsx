// src/components/dashboard/DashboardSummaryCard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"

const nbsp = "\u00A0"

function parseAmtToNumber(input: string | number | null | undefined): number {
  if (typeof input === "number") return isFinite(input) ? input : 0
  if (!input) return 0
  const s = String(input).trim().replace(/\s+/g, "").replace(",", ".")
  const n = Number(s)
  return isFinite(n) ? n : 0
}

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

type Period = "week" | "month" | "year"
const PERIODS: Period[] = ["week", "month", "year"]

export default function DashboardSummaryCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  const period = useDashboardStore((s) => s.summaryPeriod as Period)
  const setPeriod = useDashboardStore((s) => s.setSummaryPeriod)
  const currency = useDashboardStore((s) => s.summaryCurrency) as string
  const setCurrency = useDashboardStore((s) => s.setSummaryCurrency)
  const currenciesRecent = useDashboardStore((s) => s.currenciesRecent) as string[]
  const summary = useDashboardStore((s) => s.summary)
  const loading = useDashboardStore((s) => s.loading.summary)
  const error = useDashboardStore((s) => s.error.summary || null)
  const load = useDashboardStore((s) => s.loadSummary)

  const [periodCcys, setPeriodCcys] = useState<string[]>([])
  const fetchingCcys = useRef(false)

  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    const startCcy: string =
      (currency && String(currency)) || (currenciesRecent?.[0] ?? "USD")
    if (startCcy && startCcy !== currency) {
      try { setCurrency(startCcy) } catch {}
      try { void load(period, startCcy) } catch {}
    } else {
      try { void load(period, currency || "USD") } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let aborted = false
    const run = async () => {
      if (fetchingCcys.current) return
      fetchingCcys.current = true
      try {
        const res = await fetch(`/dashboard/top-categories?period=${encodeURIComponent(period)}&limit=500`)
        if (!res.ok) throw new Error(String(res.status))
        const data: any = await res.json()
        const items: any[] = Array.isArray(data?.items) ? (data.items as any[]) : []
        const list: string[] = Array.from(
          new Set(
            items
              .map((it: any) => String(it?.currency || "").toUpperCase())
              .filter((x: string) => !!x && x !== "XXX")
          )
        )

        if (aborted) return
        setPeriodCcys(list)

        // выберем актуальную валюту и перезагрузим summary
        let keep: string = String(currency || "").toUpperCase()
        if (!keep || !list.includes(keep)) {
          keep = (list[0] || currenciesRecent?.[0] || currency || "USD") as string
          keep = String(keep).toUpperCase()
        }
        if (keep !== currency) {
          try { setCurrency(keep) } catch {}
          try { void load(period, keep) } catch {}
        } else {
          try { void load(period, keep || "USD") } catch {}
        }
      } catch {
        if (!aborted) {
          setPeriodCcys([])
          try { void load(period, currency || currenciesRecent?.[0] || "USD") } catch {}
        }
      } finally {
        fetchingCcys.current = false
      }
    }
    run()
    return () => { aborted = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const chipsCcys: string[] = useMemo(() => {
    const base = periodCcys.length ? periodCcys : (Array.isArray(currenciesRecent) ? currenciesRecent : [])
    if (currency && !base.includes(currency)) return [currency, ...base]
    return base
  }, [periodCcys, currenciesRecent, currency])

  const onChangePeriod = (p: Period) => {
    if (p === period) return
    setPeriod(p)
  }
  const onChangeCurrency = (ccy: string) => {
    const next = (ccy || "").toUpperCase()
    if (!next || next === currency) return
    setCurrency(next)
    void load(period, next)
  }

  const spent = parseAmtToNumber(summary?.spent)
  const avg = parseAmtToNumber(summary?.avg_check)
  const my = parseAmtToNumber(summary?.my_share)

  return (
    <CardSection noPadding>
      <div className="rounded-lg p-1.5 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
        <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
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
                  onClick={() => onChangePeriod(p)}
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

        {chipsCcys.length > 0 ? (
          <div
            className="mb-2 -mx-1 px-1 overflow-x-auto whitespace-nowrap"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {chipsCcys.map((ccy) => {
              const active = ccy === currency
              return (
                <button
                  key={`ccy-chip-${ccy}`}
                  type="button"
                  onClick={() => onChangeCurrency(ccy)}
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
        ) : error ? (
          <div className="flex items-center gap-3">
            <div className="text-sm" style={{ color: "var(--tg-destructive-text,#ef4444)" }}>
              {t("error")}
            </div>
            <button
              onClick={() => void load(period, currency || "USD")}
              className="px-2 py-1 text-sm rounded border transition bg-transparent border-[var(--tg-hint-color)]"
              style={{ color: "var(--tg-text-color)" }}
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/5 p-3 border border-[var(--tg-hint-color)]">
              <div className="text-xs opacity-70 mb-1">{t("dashboard.spent")}</div>
              <div className="text-[14px] font-semibold text-[var(--tg-text-color)]">
                {fmtAmountSmart(spent, currency || "USD", locale)}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-[var(--tg-hint-color)]">
              <div className="text-xs opacity-70 mb-1">{t("dashboard.avg_check")}</div>
              <div className="text-[14px] font-semibold text-[var(--tg-text-color)]">
                {fmtAmountSmart(avg, currency || "USD", locale)}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-[var(--tg-hint-color)]">
              <div className="text-xs opacity-70 mb-1">{t("dashboard.my_share")}</div>
              <div className="text-[14px] font-semibold text-[var(--tg-text-color)]">
                {fmtAmountSmart(my, currency || "USD", locale)}
              </div>
            </div>
          </div>
        )}
      </div>
    </CardSection>
  )
}
