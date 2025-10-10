// src/components/dashboard/DashboardBalanceCard.tsx
// Главная → «Мой баланс»
// ✔ стиль как у карточек групп (CardSection, те же скругления/тени/бордеры)
// ✔ чипы: показываем ВСЕ валюты; по умолчанию активны 2 "последние", с fallback на валюты с ненулём
// ✔ суммы берём из карт бэка как есть (строки со знаком), в UI показываем абсолюты
// ✔ локализация через ru.ts

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
function hasNonZero(vals: number[]): boolean {
  return vals.some((v) => Math.abs(v) > 0)
}
function fmtMoney(value: number, currency: string, locale: string) {
  // форматируем как на карточках: число + код валюты, убираем лишние .00
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

  // Стор: читаем точечно (меньше лишних ререндеров)
  const balance = useDashboardStore((s) => s.balance)
  const selected = useDashboardStore((s) => s.ui.balanceCurrencies)
  const setSelected = useDashboardStore((s) => s.setBalanceCurrencies)
  const isLoading = useDashboardStore((s) => s.loading.balance || s.loading.global)

  // Карты от бэка: строки со знаком; мы будем брать абсолют
  const iOweMap = balance?.i_owe ?? {}           // {"USD":"-50.00", ...}
  const theyOweMap = balance?.they_owe_me ?? {}  // {"USD":"+125.00", ...}
  const last = (balance?.last_currencies ?? []).map((c) => (c || "").toUpperCase())

  // Все доступные валюты: last первыми, затем ключи карт; без дублей; UPPERCASE
  const available = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    const push = (code?: string | null) => {
      const raw = String(code ?? "").trim()
      if (!raw) return
      const up = raw.toUpperCase()
      if (!seen.has(up)) {
        seen.add(up)
        out.push(up)
      }
    }
    last.forEach(push)
    Object.keys(iOweMap).forEach(push)
    Object.keys(theyOweMap).forEach(push)
    return out
  }, [last, iOweMap, theyOweMap])

  // Значения по валютам (абсолюты)
  const amounts = useMemo(() => {
    const byCcy = new Map<
      string,
      { leftAbs: number; rightAbs: number } // left="Я должен", right="Мне должны"
    >()
    for (const c of available) {
      const leftAbs = absAmount((iOweMap as any)[c])      // i_owe гарантированно "моя" сторона
      const rightAbs = absAmount((theyOweMap as any)[c])  // they_owe_me "мне должны"
      byCcy.set(c, { leftAbs, rightAbs })
    }
    return byCcy
  }, [available, iOweMap, theyOweMap])

  // Активные чипы: из UI → фильтруем по available; если пусто — возьмём 2 из last/available
  let active = useMemo(() => {
    const allow = new Set(available)
    const filtered = (selected || []).map((c) => c.toUpperCase()).filter((c) => allow.has(c))
    return filtered.length ? filtered : (last.length ? last.slice(0, 2) : available.slice(0, 2))
  }, [available, selected, last])

  // Доп. fallback: если выбранные валюты дают нули по обеим сторонам, и при этом есть другие с ненулём —
  // заменим активный набор на первые 2 с ненулём (похоже на поведение карточек: "живые" валюты наверх)
  const nonZeroFirstTwo = useMemo(() => {
    const arr: string[] = []
    for (const c of available) {
      const v = amounts.get(c)
      if (v && (v.leftAbs > 0 || v.rightAbs > 0)) {
        arr.push(c)
        if (arr.length >= 2) break
      }
    }
    return arr
  }, [amounts, available])

  const activeGivesZeros = useMemo(() => {
    if (!active.length) return true
    const vals = active.flatMap((c) => {
      const v = amounts.get(c)
      return v ? [v.leftAbs, v.rightAbs] : [0, 0]
    })
    return !hasNonZero(vals)
  }, [active, amounts])

  if (activeGivesZeros && nonZeroFirstTwo.length) {
    active = nonZeroFirstTwo
  }

  // Тоггл валюты (оставляем минимум одну активную)
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

  // Отрисовочные списки
  const leftList = useMemo(() => {
    const rows: string[] = []
    for (const c of active) {
      const v = amounts.get(c)
      if (!v) continue
      if (v.leftAbs > 0) rows.push(fmtMoney(v.leftAbs, c, locale))
    }
    return rows
  }, [active, amounts, locale])

  const rightList = useMemo(() => {
    const rows: string[] = []
    for (const c of active) {
      const v = amounts.get(c)
      if (!v) continue
      if (v.rightAbs > 0) rows.push(fmtMoney(v.rightAbs, c, locale))
    }
    return rows
  }, [active, amounts, locale])

  return (
    <CardSection noPadding className="overflow-hidden">
      <div className="p-1.5">
        <div
          className="
            w-full rounded-lg p-1.5
            border bg-[var(--tg-card-bg)] border-[var(--tg-hint-color)]
            shadow-[0_4px_18px_-10px_rgba(83,147,231,0.14)]
          "
        >
          {/* Чипы валют */}
          <div className="mb-2 flex items-center gap-2 overflow-x-auto pr-1">
            {available.map((ccy) => {
              const isActive = active.includes(ccy)
              return (
                <button
                  key={ccy}
                  type="button"
                  onClick={() => toggle(ccy)}
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

          {/* Две строки как в GroupCard / вкладке Баланс */}
          {/* Я должен */}
          <div className="w-full text-[12px] leading-[14px] text-[var(--tg-text-color)] min-w-0 mb-1.5">
            <span className="inline-flex items-center gap-2 text-[var(--tg-hint-color)] mr-1.5">
              <ArrowRight className="w-4 h-4" style={{ color: "var(--tg-destructive-text,#d7263d)" }} />
              <span>{t("i_owe")}</span>
            </span>
            {isLoading ? (
              <span className="inline-block align-middle h-3 w-28 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
            ) : leftList.length ? (
              <span className="font-semibold" style={{ color: "var(--tg-destructive-text,#d7263d)" }}>
                {leftList.join(" · ")}
              </span>
            ) : (
              <span className="text-[var(--tg-hint-color)]">{t("group_balance_no_debts_left")}</span>
            )}
          </div>

          {/* Мне должны */}
          <div className="w-full text-[12px] leading-[14px] text-[var(--tg-text-color)] min-w-0">
            <span className="inline-flex items-center gap-2 text-[var(--tg-hint-color)] mr-1.5">
              <span>{t("they_owe_me")}</span>
              <ArrowLeft className="w-4 h-4" style={{ color: "var(--tg-success-text,#1aab55)" }} />
            </span>
            {isLoading ? (
              <span className="inline-block align-middle h-3 w-28 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
            ) : rightList.length ? (
              <span className="font-semibold" style={{ color: "var(--tg-success-text,#1aab55)" }}>
                {rightList.join(" · ")}
              </span>
            ) : (
              <span className="text-[var(--tg-hint-color)]">{t("group_balance_no_debts_right")}</span>
            )}
          </div>
        </div>
      </div>
    </CardSection>
  )
}
