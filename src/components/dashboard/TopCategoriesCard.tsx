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
  icon?: string | null
  color?: string | null
}

type CatMeta = {
  id: number
  icon?: string | null
  color?: string | null
  parent_id?: number | null
  localizedName?: string | null
}

const LIMITS: Record<PeriodLTYear, number> = { week: 3, month: 5, year: 10 }
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

// ===== минимальный fallback-клиент для /expense-categories/{id} =====
const API_URL = (import.meta.env as any).VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}
async function fetchCategoryById(id: number, _locale: string, signal?: AbortSignal): Promise<CatMeta | null> {
  try {
    const res = await fetch(`${API_URL}/expense-categories/${id}`, {
      credentials: "include",
      headers: { "x-telegram-initdata": getTelegramInitData() },
      signal,
    })
    if (!res.ok) return null
    const json = await res.json()
    return {
      id: json?.id,
      icon: json?.icon ?? null,
      color: json?.color ?? null,
      parent_id: json?.parent_id ?? null,
      localizedName: null, // имя уже локализует /dashboard/top-categories
    }
  } catch {
    return null
  }
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

  // Первая загрузка (сервер сам получает locale через клиентский API)
  useEffect(() => {
    if (!items || items.length === 0) void load()
  }, [items, load])

  // Валюты в текущей выдаче
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

  // Активная валюта: сохраняем между периодами, если она присутствует в новой выборке
  const [activeCcy, setActiveCcy] = useState<string>("")
  const userTouchedRef = useRef<Record<PeriodLTYear, boolean>>({ week: false, month: false, year: false })

  // Период поменялся — просто сбрасываем «юзер кликал». ВАЛЮТУ НЕ ТРОГАЕМ тут.
  useEffect(() => {
    userTouchedRef.current[period] = false
  }, [period])

  // Когда приехал новый список валют — если текущей нет, переключаемся на свежую.
  // Если текущая есть — НИЧЕГО не меняем (не «следуем за свежей»).
  useEffect(() => {
    if (!periodCcys.length) {
      if (activeCcy) setActiveCcy("")
      return
    }
    const current = (activeCcy || "").toUpperCase()
    const inList = !!current && periodCcys.includes(current)
    if (!inList) {
      setActiveCcy(periodCcys[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodCcys.join("|")])

  // Нормализация данных по активной валюте + трим по лимиту периода
  const baseData = useMemo(() => {
    const src = ((items as unknown as AnyTopCat[]) || []).filter(
      (it) => !activeCcy || (it.currency || "").toUpperCase() === activeCcy
    )

    const mapped = src.map((it, idx) => {
      const id = Number(it.category_id ?? idx)
      let n =
        typeof it.sum === "string" ? Number(it.sum) : typeof it.sum === "number" ? it.sum : 0
      if (!isFinite(Number(n))) n = 0
      return {
        id,
        key: String(it.category_id ?? `${it.name ?? "cat"}-${idx}`),
        rawName: it.name ?? "",        // уже локализовано бэком по ?locale
        total: Number(n),
        icon: it.icon ?? null,         // приходит из бэка
        color: it.color ?? null,       // цвет категории либо родителя
      }
    })

    mapped.sort((a, b) => b.total - a.total)
    return mapped.slice(0, LIMITS[period])
  }, [items, activeCcy, period])

  // Дотягиваем недостающие метаданные (редко нужно)
  const [catMeta, setCatMeta] = useState<Record<number, CatMeta>>({})
  const metaAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!baseData.length) return

    try { metaAbortRef.current?.abort() } catch {}
    const ctrl = new AbortController()
    metaAbortRef.current = ctrl

    const toFetch: number[] = []
    const patch: Record<number, CatMeta> = {}

    for (const row of baseData) {
      if (!row.id) continue
      if (catMeta[row.id]) continue
      if (row.icon || row.color) {
        patch[row.id] = { id: row.id, icon: row.icon, color: row.color, parent_id: undefined, localizedName: null }
      } else {
        toFetch.push(row.id)
      }
    }
    if (Object.keys(patch).length) setCatMeta((prev) => ({ ...prev, ...patch }))
    if (!toFetch.length) return

    ;(async () => {
      const metas = await Promise.all(toFetch.map((id) => fetchCategoryById(id, locale, ctrl.signal)))
      const fetched: Record<number, CatMeta> = {}
      metas.forEach((m) => { if (m?.id) fetched[m.id] = m })
      if (Object.keys(fetched).length) {
        setCatMeta((prev) => ({ ...prev, ...fetched }))
      }

      // добираем цвета родителей, если у детей нет
      const needParents = Object.values(fetched)
        .filter((m) => !m?.color && typeof m?.parent_id === "number")
        .map((m) => m.parent_id as number)
      const uniqParents = Array.from(new Set(needParents)).filter(Boolean)
      if (uniqParents.length === 0) return

      const parents = await Promise.all(uniqParents.map((pid) => fetchCategoryById(pid, locale, ctrl.signal)))
      const parentColor = new Map<number, string | null>()
      parents.forEach((pm) => { if (pm?.id) parentColor.set(pm.id, pm.color ?? null) })

      setCatMeta((prev) => {
        const next = { ...prev }
        for (const id of Object.keys(fetched).map(Number)) {
          const child = next[id]
          if (!child) continue
          if (!child.color && child.parent_id && parentColor.has(child.parent_id)) {
            next[id] = { ...child, color: parentColor.get(child.parent_id) ?? null }
          }
        }
        return next
      })
    })().catch(() => void 0)

    return () => { try { ctrl.abort() } catch {} }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseData.map((x) => x.id).join("|"), locale])

  const chartData = useMemo(() => {
    return baseData.map((row) => {
      const meta = catMeta[row.id]
      return {
        ...row,
        name: row.rawName || meta?.localizedName || "Категория",
        icon: row.icon ?? meta?.icon ?? "🏷️",
        color: row.color ?? meta?.color ?? null,
      }
    })
  }, [baseData, catMeta])

  const totalAmount = useMemo(
    () => chartData.reduce((acc, x) => acc + (x.total || 0), 0),
    [chartData]
  )

  const title = t("dashboard.top_categories_title") || t("dashboard.top_categories") || "Топ категорий"
  const hasError = !!error && chartData.length === 0
  const hasAnyData = (items?.length || 0) > 0 && periodCcys.length > 0
  const showEmpty = !loading && !hasError && !hasAnyData

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

        {/* Чипы валют — одна активная, НЕ сбрасываем между периодами если валюта есть */}
        {!loading && periodCcys.length > 0 ? (
          <div className="mb-2 -mx-1 px-1 overflow-x-auto whitespace-nowrap" style={{ WebkitOverflowScrolling: "touch" }}>
            {periodCcys.map((ccy) => {
              const isActive = (activeCcy || "").toUpperCase() === ccy
              return (
                <button
                  key={`topcat-ccy-${ccy}`}
                  type="button"
                  onClick={() => {
                    userTouchedRef.current[period] = true
                    if (!isActive) setActiveCcy(ccy)
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
        ) : showEmpty ? (
          <div className="text-[14px] leading-[18px] text-[var(--tg-hint-color)]">
            {t("dashboard.activity_empty_title")}
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-[14px] leading-[18px] text-[var(--tg-hint-color)]">
            {t("dashboard.activity_empty_title")}
          </div>
        ) : (
          // Контент
          <div className="flex flex-col gap-2">
            {chartData.map((it) => {
              const pct = totalAmount > 0 ? (it.total / totalAmount) * 100 : 0
              return (
                <div key={it.key} className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{
                      width: 34,
                      height: 34,
                      fontSize: 18,
                      background: it.color ? `${it.color}22` : "transparent",
                      border: it.color ? `1px solid ${it.color}55` : "1px solid var(--tg-hint-color)",
                    }}
                  >
                    <span aria-hidden>{it.icon || "🏷️"}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="truncate text-[var(--tg-text-color)]">{it.name}</span>
                      <span className="tabular-nums font-semibold text-[var(--tg-text-color)]">
                        {fmtAmountSmart(it.total, (activeCcy || periodCcys[0] || "USD"), locale)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded" style={{ background: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
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
