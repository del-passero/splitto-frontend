// src/components/dashboard/TopCategoriesCard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"

type PeriodLTYear = "week" | "month" | "year"
const PERIODS: PeriodLTYear[] = ["week", "month", "year"]

type AnyTopCat = {
  category_id?: string | number
  name?: string
  sum?: string | number
  currency?: string
}

const nbsp = "\u00A0"

/** Формат: число + код валюты с «умной» дробной частью */
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

/** Сортировка валют: сначала последние (0 — самая новая), затем по алфавиту */
function sortCcysByLast(ccys: string[], last: string[] | undefined | null): string[] {
  const src = Array.from(new Set((ccys || []).map((c) => String(c).toUpperCase())))
  const lastUp = Array.isArray(last) ? last.map((c) => String(c).toUpperCase()) : []
  const order = new Map<string, number>()
  for (let i = 0; i < lastUp.length; i++) {
    const c = lastUp[i]
    if (!order.has(c)) order.set(c, i)
  }
  return [...src].sort((a, b) => {
    const ia = order.has(a) ? (order.get(a) as number) : Number.POSITIVE_INFINITY
    const ib = order.has(b) ? (order.get(b) as number) : Number.POSITIVE_INFINITY
    if (ia !== ib) return ia - ib
    return a.localeCompare(b)
  })
}

export default function TopCategoriesCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  const period = useDashboardStore((s) => s.topCategoriesPeriod as PeriodLTYear)
  const setPeriod = useDashboardStore((s) => s.setTopPeriod)
  const items = useDashboardStore((s) => s.topCategories)
  const loading = useDashboardStore((s) => s.loading.top)
  const error = useDashboardStore((s) => s.error.top || "")
  const load = useDashboardStore((s) => s.loadTopCategories)
  const currenciesRecent = useDashboardStore((s) => s.currenciesRecent)

  // Первая загрузка
  useEffect(() => {
    if (!items || items.length === 0) void load()
  }, [items, load])

  // Доступные валюты в текущей выборке
  const periodCcys = useMemo(() => {
    const raw = Array.from(
      new Set(
        (items || [])
          .map((it: any) => String((it as AnyTopCat).currency || "").toUpperCase())
          .filter((x) => !!x && x !== "XXX")
      )
    )
    return sortCcysByLast(raw, currenciesRecent)
  }, [items, currenciesRecent])

  // Активная валюта — ровно одна. Автоподбор самой свежей один раз на монтирование
  const [activeCcy, setActiveCcy] = useState<string>("")
  const autoPickedRef = useRef(false)

  // Автовыбор валюты: при появлении списка впервые, а также если активная валюта исчезла
  useEffect(() => {
    if (periodCcys.length === 0) {
      if (activeCcy) setActiveCcy("") // очистить, чтобы скрыть чипы/контент
      return
    }
    const freshest = periodCcys[0]
    if (!autoPickedRef.current && !activeCcy) {
      autoPickedRef.current = true
      setActiveCcy(freshest)
      return
    }
    // Если активная валюта больше не присутствует — переключаемся на самую свежую
    if (activeCcy && !periodCcys.includes(activeCcy)) {
      setActiveCcy(freshest)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodCcys.join("|")])

  // Пересортировать чипы, если «последние валюты» подгрузились позже — и, если активной нет, выбрать свежую
  useEffect(() => {
    if (!activeCcy && periodCcys.length > 0) {
      setActiveCcy(periodCcys[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(currenciesRecent || []).join("|")])

  // Нормализуем и фильтруем данные по активной валюте
  const chartData = useMemo(() => {
    const src = (items as unknown as AnyTopCat[]) || []
    const filtered = activeCcy ? src.filter((it) => (it.currency || "").toUpperCase() === activeCcy) : src
    const mapped = filtered.map((it, idx) => {
      const name = it.name ?? "Категория"
      const key = String(it.category_id ?? `${name}-${idx}`)
      let n =
        typeof it.sum === "string" ? Number(it.sum) : typeof it.sum === "number" ? it.sum : 0
      if (!isFinite(Number(n))) n = 0
      return { key, name, total: Number(n) }
    })
    // По сумме по убыванию
    mapped.sort((a, b) => b.total - a.total)
    return mapped
  }, [items, activeCcy])

  const totalAmount = useMemo(
    () => chartData.reduce((acc, x) => acc + (x.total || 0), 0),
    [chartData]
  )

  const title = t("dashboard.top_categories_title") || "Топ категорий"
  const hasError = !!error && chartData.length === 0
  const hasData = chartData.length > 0

  return (
    <CardSection noPadding>
      <div className="rounded-lg p-1.5 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
        {/* Заголовок + чипы периода */}
        <div className="flex items-center gap-2 mb-2">
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
                  onClick={() => setPeriod(p)} // стор сам перезагрузит
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

        {/* Чипы валют — ровно одна активная; показываем только если есть данные/валюты */}
        {!loading && periodCcys.length > 0 ? (
          <div className="mb-2 -mx-1 px-1 overflow-x-auto whitespace-nowrap" style={{ WebkitOverflowScrolling: "touch" }}>
            {periodCcys.map((ccy) => {
              const isActive = activeCcy === ccy
              return (
                <button
                  key={`topcat-ccy-${ccy}`}
                  type="button"
                  onClick={() => !isActive && setActiveCcy(ccy)}
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

        {/* Состояния */}
        {loading ? (
          <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-80">
            {t("loading")}
          </div>
        ) : hasError ? (
          <div className="flex items-center gap-3">
            <div className="text-[14px] leading-[18px]" style={{ color: "var(--tg-destructive-text,#ef4444)" }}>
              {error}
            </div>
            <button
              onClick={() => load()}
              className="px-2 py-1 text-sm rounded border transition bg-transparent border-[var(--tg-hint-color)]"
              style={{ color: "var(--tg-text-color)" }}
            >
              {t("retry")}
            </button>
          </div>
        ) : !hasData ? (
          <div className="text-[14px] leading-[18px] text-[var(--tg-hint-color)]">
            {t("no_data_for_period") || "Нет данных за выбранный период"}
          </div>
        ) : (
          // Контент: список категорий с прогресс-баром и суммой справа
          <div className="flex flex-col gap-2">
            {chartData.map((it) => {
              const pct = totalAmount > 0 ? (it.total / totalAmount) * 100 : 0
              return (
                <div key={it.key} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="truncate text-[var(--tg-text-color)]">{it.name}</span>
                      <span className="tabular-nums font-semibold text-[var(--tg-text-color)]">
                        {fmtAmountSmart(it.total, activeCcy || (periodCcys[0] || "USD"), locale)}
                      </span>
                    </div>
                    <div
                      className="mt-1 h-2 w-full rounded"
                      style={{ background: "var(--tg-secondary-bg-color,#e7e7e7)" }}
                    >
                      <div
                        className="h-2 rounded"
                        style={{
                          width: `${Math.max(2, Math.min(100, pct))}%`,
                          background: "color-mix(in oklab, var(--tg-link-color,#2481CC) 70%, transparent)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </CardSection>
  )
}
