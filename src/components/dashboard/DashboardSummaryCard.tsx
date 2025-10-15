// src/components/dashboard/DashboardSummaryCard.tsx
import React, { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"
import { getDashboardTopCategories } from "../../api/dashboardApi"

type Period = "week" | "month" | "year"
const PERIODS: Period[] = ["week", "month", "year"]

const nbsp = "\u00A0"

const fmt = (s?: string) => {
  if (!s && s !== "0") return "—"
  const n = Number(s)
  if (!Number.isFinite(n)) return s as string
  try {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  } catch {
    return String(n)
  }
}

/** Форматирование как в компоненте баланса (число + код валюты, с умной дробной частью) */
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

/** Унифицированная сортировка: последние валюты (индекс 0 — самая новая) раньше, потом — по алфавиту */
function sortCcysByLast(ccys: string[], last: string[] | undefined | null): string[] {
  const src = Array.from(new Set((ccys || []).map((c) => String(c).toUpperCase())))
  const lastUp = Array.isArray(last) ? last.map((c) => String(c).toUpperCase()) : []
  const order = new Map<string, number>()
  for (let i = 0; i < lastUp.length; i++) {
    const c = lastUp[i]
    if (!order.has(c)) order.set(c, i) // индекс 0 — самый новый
  }
  return [...src].sort((a, b) => {
    const ia = order.has(a) ? (order.get(a) as number) : Number.POSITIVE_INFINITY
    const ib = order.has(b) ? (order.get(b) as number) : Number.POSITIVE_INFINITY
    if (ia !== ib) return ia - ib
    return a.localeCompare(b)
  })
}

export default function DashboardSummaryCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  // store
  const period = useDashboardStore((s) => s.summaryPeriod as Period)
  const setPeriod = useDashboardStore((s) => s.setSummaryPeriod)
  const currency = useDashboardStore((s) => s.summaryCurrency)
  const setCurrency = useDashboardStore((s) => s.setSummaryCurrency)
  const currenciesRecent = useDashboardStore((s) => s.currenciesRecent)
  const summary = useDashboardStore((s) => s.summary)
  const loading = useDashboardStore((s) => s.loading.summary)
  const error = useDashboardStore((s) => s.error.summary || null)
  const load = useDashboardStore((s) => s.loadSummary)

  // Валюты, в которых реально были траты в выбранном периоде (сортированные)
  const [periodCcys, setPeriodCcys] = useState<string[]>([])
  const [hasDataInPeriod, setHasDataInPeriod] = useState<boolean>(true)

  // Первичная загрузка summary
  useEffect(() => {
    if (!summary) void load(period, currency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // один раз

  // Подтягиваем список валют для текущего периода (и корректируем активную валюту при необходимости)
  const refreshPeriodCurrencies = async (p: Period) => {
    try {
      const res = await getDashboardTopCategories({ period: p, limit: 200 })
      const raw: string[] = Array.from(
        new Set(
          (res?.items || [])
            .map((it: any) => String(it?.currency || "").toUpperCase())
            .filter((ccy: string) => !!ccy && ccy !== "XXX")
        )
      )

      if (raw.length === 0) {
        setPeriodCcys([])
        setHasDataInPeriod(false)
        return
      }

      const sorted = sortCcysByLast(raw, currenciesRecent)
      setPeriodCcys(sorted)
      setHasDataInPeriod(true)

      const current = (currency || "").toUpperCase()
      if (sorted.includes(current)) {
        // текущая валюта присутствует — ничего не меняем
        return
      }
      // Пытаемся предпочесть последнюю использованную
      const recentPick = (currenciesRecent || []).find((ccy) =>
        sorted.includes(String(ccy).toUpperCase())
      )
      const next: string = (recentPick ? String(recentPick).toUpperCase() : sorted[0]) || ""
      if (next && next !== current) {
        try {
          setCurrency(next) // стор сам вызовет loadSummary
        } catch {}
      }
    } catch {
      // В случае ошибки просто считаем, что данных нет (чтобы не рушить UI)
      setPeriodCcys([])
      setHasDataInPeriod(false)
    }
  }

  // При смене периода — обновляем валюты периода и перезагружаем summary (store сам дернёт)
  useEffect(() => {
    void refreshPeriodCurrencies(period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  // Если currenciesRecent подгрузились позже — пересортируем текущий список чипов без запроса
  useEffect(() => {
    if (!periodCcys.length) return
    setPeriodCcys((prev) => sortCcysByLast(prev, currenciesRecent))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(currenciesRecent || []).join("|")])

  const title = t("dashboard.summary_title", "Сводка")

  // Значения для мини-карточек
  const spentNum = useMemo(() => Number(summary?.spent || 0), [summary])
  const avgNum = useMemo(() => Number(summary?.avg_check || 0), [summary])
  const myShareNum = useMemo(() => Number(summary?.my_share || 0), [summary])

  return (
    <CardSection noPadding>
      <div className="rounded-lg p-1.5 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
        {/* Заголовок + чипы периода (как в ActivityChart) */}
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <div
            className="font-semibold"
            style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
          >
            {title}
          </div>

          <div className="ml-auto flex gap-1">
            {PERIODS.map((p) => {
              const active = p === period
              return (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p) // стор сам сбросит TTL и перезагрузит summary
                  }}
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

        {/* Чипы валют — одна строка, ровно один активный. Показываем только если в периоде есть данные */}
        {!loading && hasDataInPeriod && periodCcys.length > 0 ? (
          <div
            className="mb-2 -mx-1 px-1 overflow-x-auto whitespace-nowrap"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {periodCcys.map((ccy) => {
              const isActive = (currency || "").toUpperCase() === ccy
              return (
                <button
                  key={`sum-ccy-${ccy}`}
                  type="button"
                  onClick={() => {
                    if (!isActive) {
                      try {
                        setCurrency(ccy) // стор сам вызовет loadSummary
                      } catch {}
                    }
                  }}
                  className={[
                    "inline-flex items-center h-7 px-3 mr-2 rounded-full text-xs select-none transition-colors",
                    isActive
                      ? "bg-[var(--tg-link-color,#2481CC)] text-white"
                      : "bg-transparent text-[var(--tg-text-color)]/80 border border-[var(--tg-hint-color)]",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  {ccy}
                </button>
              )
            })}
          </div>
        ) : null}

        {/* Состояния загрузки/ошибки/пусто */}
        {loading ? (
          <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-80">
            {t("loading")}
          </div>
        ) : error ? (
          <div className="text-[14px] leading-[18px]" style={{ color: "var(--tg-destructive-text,#ef4444)" }}>
            {error}
          </div>
        ) : !hasDataInPeriod ? (
          <div className="text-[14px] leading-[18px] text-[var(--tg-hint-color)]">
            {t("dashboard.activity_empty_title")}
          </div>
        ) : (
          // Основной контент: 3 мини-карточки, каждая с рамкой (как просили)
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)] p-3">
              <div className="text-xs opacity-70 mb-1">{t("dashboard.spent")}</div>
              <div className="text-[14px] leading-[18px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                {fmtAmountSmart(spentNum, (currency || "").toUpperCase(), locale)}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)] p-3">
              <div className="text-xs opacity-70 mb-1">{t("dashboard.avg_check")}</div>
              <div className="text-[14px] leading-[18px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                {fmtAmountSmart(avgNum, (currency || "").toUpperCase(), locale)}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)] p-3">
              <div className="text-xs opacity-70 mb-1">{t("dashboard.my_share")}</div>
              <div className="text-[14px] leading-[18px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                {fmtAmountSmart(myShareNum, (currency || "").toUpperCase(), locale)}
              </div>
            </div>
          </div>
        )}
      </div>
    </CardSection>
  )
}
