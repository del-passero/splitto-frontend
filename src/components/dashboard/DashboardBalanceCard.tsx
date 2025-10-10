// src/components/dashboard/DashboardBalanceCard.tsx
// Ультра-надёжный минимальный вариант «Мой баланс».
// Без иконок, без кликов, только чтение стора и безопасный вывод.
// Если он рендерится стабильно — источник падения был в предыдущей логике/иконках/кликах.

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../../store/dashboardStore"

function toNum(x: unknown): number {
  // Принимаем строки "12.34" | "-5" | null | undefined
  const n = Number(String(x ?? "").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}
function fmt2(n: number): string {
  return n.toFixed(2)
}

export default function DashboardBalanceCard() {
  const { t } = useTranslation()

  // Берём строго необходимые поля по одному селектору — меньше шансов дернуть лишний ререндер
  const balance = useDashboardStore((s) => s.balance)
  const uiCurrencies = useDashboardStore((s) => s.ui.balanceCurrencies)
  const isLoading = useDashboardStore((s) => s.loading.balance || s.loading.global)

  // Безопасные мапы
  const iOweMap = balance?.i_owe ?? {}
  const theyOweMap = balance?.they_owe_me ?? {}
  const last = balance?.last_currencies ?? []

  // Список доступных валют = сначала последние использованные, затем те, что встречаются в балансах
  const available = useMemo(() => {
    const set = new Set<string>()
    const out: string[] = []
    const push = (code?: string | null) => {
      const c = String(code ?? "").trim().toUpperCase()
      if (!c) return
      if (!set.has(c)) {
        set.add(c)
        out.push(c)
      }
    }
    last.forEach(push)
    Object.keys(iOweMap).forEach(push)
    Object.keys(theyOweMap).forEach(push)
    return out
  }, [last, iOweMap, theyOweMap])

  // Выбранные валюты — только те, что реально доступны. Если пусто — берём первые 2 из available
  const selected = useMemo(() => {
    if (uiCurrencies && uiCurrencies.length) {
      const allow = new Set(available)
      const filtered = uiCurrencies.filter((c) => allow.has(c))
      if (filtered.length) return filtered
    }
    return available.slice(0, 2)
  }, [uiCurrencies, available])

  // Формируем короткие списки "12.34 USD" без нулей
  const leftList = useMemo(() => {
    const list: string[] = []
    for (const c of selected) {
      const raw = toNum((iOweMap as any)[c])
      if (raw === 0) continue
      list.push(`${fmt2(Math.abs(raw))} ${c}`)
    }
    return list
  }, [selected, iOweMap])

  const rightList = useMemo(() => {
    const list: string[] = []
    for (const c of selected) {
      const raw = toNum((theyOweMap as any)[c])
      if (raw === 0) continue
      list.push(`${fmt2(Math.abs(raw))} ${c}`)
    }
    return list
  }, [selected, theyOweMap])

  return (
    <div className="rounded-2xl p-3 bg-[var(--tg-secondary-bg-color)] border border-[color-mix(in_oklab,var(--tg-border-color)_80%,transparent)]">
      {/* Чипы валют (без кликов, только показ кодов) */}
      <div className="mb-3 flex items-center gap-2 overflow-x-auto pr-1">
        {selected.length === 0 ? (
          <span className="text-sm text-[var(--tg-hint-color)]">{t("no_data", { defaultValue: "Нет данных" })}</span>
        ) : (
          selected.map((ccy) => (
            <span
              key={ccy}
              className="px-3 py-1 text-sm rounded-full border bg-[var(--tg-secondary-bg-color)] border-[color-mix(in_oklab,var(--tg-border-color)_80%,transparent)]"
            >
              {ccy}
            </span>
          ))
        )}
      </div>

      {/* Две колонки: слева «Я должен», справа «Мне должны». Никаких интеракций */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_60%,transparent)]">
          <div className="text-xs text-[var(--tg-hint-color)] mb-1">
            {t("home_i_owe", { defaultValue: "Я должен" })}
          </div>
          {isLoading ? (
            <div className="h-5 w-28 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
          ) : leftList.length ? (
            <div className="text-lg font-semibold leading-tight">{leftList.join("; ")}</div>
          ) : (
            <div className="text-lg font-semibold leading-tight text-[var(--tg-hint-color)]">—</div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_60%,transparent)] text-right">
          <div className="text-xs text-[var(--tg-hint-color)] mb-1">
            {t("home_they_owe_me", { defaultValue: "Мне должны" })}
          </div>
          {isLoading ? (
            <div className="ml-auto h-5 w-28 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
          ) : rightList.length ? (
            <div className="text-lg font-semibold leading-tight">{rightList.join("; ")}</div>
          ) : (
            <div className="text-lg font-semibold leading-tight text-[var(--tg-hint-color)]">—</div>
          )}
        </div>
      </div>
    </div>
  )
}
