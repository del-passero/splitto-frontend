// src/components/dashboard/DashboardBalanceCard.tsx
// Блок «Мой баланс» для Главной (дашборд).
// Соответствует ТЗ:
//  - Чипы с кодами валют (без сумм). По умолчанию активны 2 последние использованные.
//  - Слева: сколько я должен (агрегировано по выбранным валютам, без межвалютного неттинга).
//  - Справа: сколько должны мне (агрегировано по выбранным валютам).
//  - Цвет/стрелки — базовые (красный для «должен», зелёный для «мне должны»). Компонент не кликабелен.

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"

type AmountMap = Record<string, string>

function parseNum(v: string | number | null | undefined): number {
  if (typeof v === "number") return v
  const n = Number(String(v ?? "").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

function format2(n: number): string {
  return n.toFixed(2)
}

/** Склеиваем суммы по выбранным валютам: возвращаем массив строк вида "12.34 USD" */
function listPerCurrency(
  data: AmountMap | undefined,
  selected: string[],
  opts?: { absolute?: boolean; nonzeroOnly?: boolean }
): string[] {
  const absolute = !!opts?.absolute
  const nonzeroOnly = !!opts?.nonzeroOnly
  if (!data) return []
  const out: string[] = []
  for (const ccy of selected) {
    const raw = parseNum(data[ccy])
    const val = absolute ? Math.abs(raw) : raw
    if (nonzeroOnly && val === 0) continue
    // показываем только если по валюте есть значение (или оно 0? по UX лучше скрыть нули)
    if (raw === 0) continue
    out.push(`${format2(val)} ${ccy}`)
  }
  return out
}

export default function DashboardBalanceCard() {
  const { t } = useTranslation()

  const { balance, uiCurrencies, setCurrencies, isLoading } = useDashboardStore((s) => ({
    balance: s.balance,
    uiCurrencies: s.ui.balanceCurrencies,
    setCurrencies: s.setBalanceCurrencies,
    isLoading: s.loading.balance || s.loading.global,
  }))

  // Источник доступных валют: ключи из обеих мап + last_currencies (для порядка)
  const availableCurrencies = useMemo(() => {
    const keys = new Set<string>()
    const order: string[] = []
    const push = (ccy: string) => {
      if (!keys.has(ccy)) {
        keys.add(ccy)
        order.push(ccy)
      }
    }
    // сначала последние использованные — чтобы они шли первыми
    for (const c of balance?.last_currencies ?? []) push(c)
    // затем все из карт
    for (const k of Object.keys(balance?.i_owe ?? {})) push(k)
    for (const k of Object.keys(balance?.they_owe_me ?? {})) push(k)
    return order
  }, [balance])

  // Выбранные валюты (если в UI пусто — возьмём первые 2 из availableCurrencies)
  const selectedCurrencies = useMemo(() => {
    if (uiCurrencies && uiCurrencies.length > 0) {
      // оставляем только те, что действительно доступны
      const allowed = new Set(availableCurrencies)
      return uiCurrencies.filter((x) => allowed.has(x))
    }
    return (availableCurrencies.slice(0, 2) || [])
  }, [uiCurrencies, availableCurrencies])

  // Списки сумм по сторонам
  const leftList = useMemo(
    () =>
      listPerCurrency(balance?.i_owe, selectedCurrencies, {
        absolute: true,
        nonzeroOnly: true,
      }),
    [balance?.i_owe, selectedCurrencies]
  )

  const rightList = useMemo(
    () =>
      listPerCurrency(balance?.they_owe_me, selectedCurrencies, {
        absolute: true,
        nonzeroOnly: true,
      }),
    [balance?.they_owe_me, selectedCurrencies]
  )

  // Тоггл валюты в чипе (не даём снять последнюю активную, чтобы всегда была хотя бы одна)
  const toggleCurrency = (ccy: string) => {
    const set = new Set(selectedCurrencies)
    if (set.has(ccy)) {
      if (set.size === 1) return // минимум одна валюта
      set.delete(ccy)
    } else {
      set.add(ccy)
    }
    setCurrencies(Array.from(set))
  }

  return (
    <div className="rounded-2xl p-3 bg-[var(--tg-secondary-bg-color)] border border-[color-mix(in_oklab,var(--tg-border-color)_80%,transparent)]">
      {/* Чипы валют — только коды */}
      <div className="mb-3 flex items-center gap-2 overflow-x-auto pr-1">
        {availableCurrencies.length === 0 && (
          <span className="text-sm text-[var(--tg-hint-color)]">{t("no_data", { defaultValue: "Нет данных" })}</span>
        )}
        {availableCurrencies.map((ccy) => {
          const active = selectedCurrencies.includes(ccy)
          return (
            <button
              key={ccy}
              type="button"
              onClick={() => toggleCurrency(ccy)}
              className={[
                "px-3 py-1 text-sm rounded-full border whitespace-nowrap",
                active
                  ? "bg-[var(--tg-link-color)]/15 border-[var(--tg-link-color)]/30"
                  : "bg-[var(--tg-secondary-bg-color)] border-[color-mix(in_oklab,var(--tg-border-color)_80%,transparent)]",
              ].join(" ")}
              aria-pressed={active}
            >
              {ccy}
            </button>
          )
        })}
      </div>

      {/* Две колонки: слева должен, справа должны мне. Ничего не кликабельно */}
      <div className="grid grid-cols-2 gap-3">
        {/* Я должен */}
        <div className="p-3 rounded-xl bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_60%,transparent)]">
          <div className="flex items-center gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
            <ArrowRight className="w-4 h-4 text-rose-500" />
            <span>{t("home_i_owe", { defaultValue: "Я должен" })}</span>
          </div>
          {isLoading ? (
            <div className="h-5 w-28 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
          ) : leftList.length > 0 ? (
            <div className="text-lg font-semibold leading-tight text-rose-500">
              {leftList.join("; ")}
            </div>
          ) : (
            <div className="text-lg font-semibold leading-tight text-[var(--tg-hint-color)]">—</div>
          )}
        </div>

        {/* Мне должны */}
        <div className="p-3 rounded-xl bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_60%,transparent)] text-right">
          <div className="flex items-center justify-end gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
            <span>{t("home_they_owe_me", { defaultValue: "Мне должны" })}</span>
            <ArrowLeft className="w-4 h-4 text-emerald-500" />
          </div>
          {isLoading ? (
            <div className="ml-auto h-5 w-28 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
          ) : rightList.length > 0 ? (
            <div className="text-lg font-semibold leading-tight text-emerald-500">
              {rightList.join("; ")}
            </div>
          ) : (
            <div className="text-lg font-semibold leading-tight text-[var(--tg-hint-color)]">—</div>
          )}
        </div>
      </div>
    </div>
  )
}
