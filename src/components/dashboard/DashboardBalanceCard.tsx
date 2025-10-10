// src/components/dashboard/DashboardBalanceCard.tsx
// Главная → «Мой баланс»
// • Чипы отсортированы по последнему использованию (из store.lastCurrenciesOrdered)
// • По умолчанию включены 2 последние валюты, с fallback на валюты с ненулём
// • Под чипами — две колонки: слева «Я должен», справа «Мне должны»
// • Каждая валюта на НОВОЙ строке
// • Внешний CardSection — без горизонтальных отступов
// • Чипы — меньшее скругление и лёгкий 3D-эффект

import { useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"
import CardSection from "../CardSection"

const NBSP = "\u00A0"

function absAmount(x?: string | number | null): number {
  if (x === null || x === undefined) return 0
  const n = Number(String(x).replace(",", "."))
  return Number.isFinite(n) ? Math.abs(n) : 0
}

function fmtMoney(value: number, currency: string, locale: string) {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "code",
    }).formatToParts(value)
    const frac = parts.find((p) => p.type === "fraction")
    const hasCents = !!frac && Number(frac.value) !== 0
    const nf = new Intl.NumberFormat(locale, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
      useGrouping: true,
    })
    return `${nf.format(value)}${NBSP}${currency}`
  } catch {
    const rounded = Math.round(value * 100) / 100
    const s =
      Math.round((Math.abs(rounded) % 1) * 100) !== 0
        ? rounded.toFixed(2)
        : String(Math.trunc(rounded))
    return `${s}${NBSP}${currency}`
  }
}

export default function DashboardBalanceCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  const balance = useDashboardStore((s) => s.balance)
  const lastOrdered = useDashboardStore((s) => s.lastCurrenciesOrdered || [])
  const selected = useDashboardStore((s) => s.ui.balanceCurrencies)
  const setSelected = useDashboardStore((s) => s.setBalanceCurrencies)
  const isLoading = useDashboardStore((s) => s.loading.balance || s.loading.global)

  const iOweMap = balance?.i_owe ?? {}
  const theyOweMap = balance?.they_owe_me ?? {}

  // Полный набор валют: сперва упорядоченная по последнему использованию подсказка,
  // затем недостающие из карт баланса (в UPPERCASE, без дублей)
  const available = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    const push = (code?: string | null) => {
      const up = String(code ?? "").trim().toUpperCase()
      if (!up || seen.has(up)) return
      seen.add(up)
      out.push(up)
    }
    lastOrdered.forEach(push)
    Object.keys(iOweMap).forEach(push)
    Object.keys(theyOweMap).forEach(push)
    return out
  }, [lastOrdered, iOweMap, theyOweMap])

  // Словари абсолютов по сторонам
  const absBySide = useMemo(() => {
    const map = new Map<string, { left: number; right: number }>()
    for (const c of available) {
      map.set(c, {
        left: absAmount((iOweMap as any)[c]),
        right: absAmount((theyOweMap as any)[c]),
      })
    }
    return map
  }, [available, iOweMap, theyOweMap])

  // Активные чипы — берём из UI; если пусто, то 2 последние из lastOrdered;
  // если по ним нули — fallback на первые 2 валюты с ненулём
  const active = useMemo(() => {
    const sel = (selected || []).map((c) => c.toUpperCase()).filter((c) => available.includes(c))
    if (sel.length) return sel
    const def = lastOrdered.length ? lastOrdered.slice(0, 2) : available.slice(0, 2)
    const zeros = def.every((c) => {
      const v = absBySide.get(c)
      return !v || (v.left === 0 && v.right === 0)
    })
    if (!zeros) return def
    const nonZero: string[] = []
    for (const c of available) {
      const v = absBySide.get(c)
      if (v && (v.left > 0 || v.right > 0)) {
        nonZero.push(c)
        if (nonZero.length >= 2) break
      }
    }
    return nonZero.length ? nonZero : def
  }, [selected, available, lastOrdered, absBySide])

  // Тоггл (минимум 1 активная валюта)
  const toggle = useCallback(
    (ccy: string) => {
      const set = new Set(active)
      if (set.has(ccy)) {
        if (set.size === 1) return
        set.delete(ccy)
      } else {
        set.add(ccy)
      }
      setSelected(Array.from(set))
    },
    [active, setSelected]
  )

  // Отрисовка списков (каждая валюта — новая строка)
  const leftLines = useMemo(() => {
    return active
      .map((c) => {
        const v = absBySide.get(c)
        if (!v || v.left <= 0) return null
        return { c, text: fmtMoney(v.left, c, locale) }
      })
      .filter(Boolean) as { c: string; text: string }[]
  }, [active, absBySide, locale])

  const rightLines = useMemo(() => {
    return active
      .map((c) => {
        const v = absBySide.get(c)
        if (!v || v.right <= 0) return null
        return { c, text: fmtMoney(v.right, c, locale) }
      })
      .filter(Boolean) as { c: string; text: string }[]
  }, [active, absBySide, locale])

  return (
    <CardSection noPadding className="overflow-hidden px-0">
      {/* только вертикальный внутренний отступ, без горизонтальных */}
      <div className="py-1.5">
        <div
          className="
            w-full rounded-lg p-2
            border bg-[var(--tg-card-bg)] border-[var(--tg-hint-color)]
            shadow-[0_4px_18px_-10px_rgba(83,147,231,0.14)]
          "
        >
          {/* Чипы валют (сортировка уже учтена) */}
          <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pr-1">
            {available.map((ccy) => {
              const isActive = active.includes(ccy)
              return (
                <button
                  key={ccy}
                  type="button"
                  onClick={() => toggle(ccy)}
                  className={[
                    "h-8 px-3 rounded-lg text-[13px] font-semibold active:scale-95 transition",
                    // 3D-эффект: тонкий верхний бликовый inset и лёгкая внешняя тень
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_0_rgba(0,0,0,0.06)]",
                    "border",
                    isActive
                      ? "bg-[var(--tg-accent-color,#40A7E3)] text-white border-transparent hover:brightness-105"
                      : "bg-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] border-[color:var(--tg-secondary-bg-color,#e7e7e7)] hover:brightness-[1.03]",
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

          {/* Две половины: слева «Я должен», справа «Мне должны» */}
          <div className="grid grid-cols-2 gap-2">
            {/* Левая колонка */}
            <div className="p-2 rounded-lg" style={{ background: "var(--tg-card-bg)" }}>
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

            {/* Правая колонка */}
            <div className="p-2 rounded-lg text-right" style={{ background: "var(--tg-card-bg)" }}>
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
      </div>
    </CardSection>
  )
}
