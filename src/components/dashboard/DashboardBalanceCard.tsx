// src/components/dashboard/DashboardBalanceCard.tsx
// «Мой баланс» на Главной: стиль как у карточек/вкладки баланса,
// чипы всех валют (2 последние активны по умолчанию), корректные суммы,
// вся текстовка — через i18n-ключи из ru.ts.

import { useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"
import CardSection from "../CardSection"

const NBSP = "\u00A0"

function robustToNumber(x: unknown): number {
  // аккуратно вытаскиваем первое число (поддержим +/-, запятые/точки)
  if (typeof x === "number") return Number.isFinite(x) ? x : 0
  const s = String(x ?? "").replace(/\s/g, "")
  const m = s.match(/[+-]?\d+(?:[.,]\d+)?/)
  if (!m) return 0
  const n = Number(m[0].replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

function fmtAmount(value: number, currency: string, locale: string) {
  try {
    // формат как в группах: числа с разделителями, код валюты рядом
    const abs = Math.abs(value)
    const nf = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true,
    })
    return `${nf.format(abs)}${NBSP}${currency}`
  } catch {
    const v = Math.round(Math.abs(value) * 100) / 100
    return `${v}${NBSP}${currency}`
  }
}

export default function DashboardBalanceCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  // стор: читаем по одному полю, чтобы не плодить перерендеры
  const balance = useDashboardStore((s) => s.balance)
  const selected = useDashboardStore((s) => s.ui.balanceCurrencies)
  const setSelected = useDashboardStore((s) => s.setBalanceCurrencies)
  const isLoading = useDashboardStore((s) => s.loading.balance || s.loading.global)

  const iOwe = balance?.i_owe ?? {}
  const theyOwe = balance?.they_owe_me ?? {}
  const last = balance?.last_currencies ?? []
  const extra = balance?.currencies ?? [] // если вдруг присутствует как подсказка

  // Собираем ВСЕ доступные валюты: last → ключи карт → extra; убираем дубли
  const available = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    const push = (c?: string | null) => {
      const code = String(c ?? "").trim().toUpperCase()
      if (!code || seen.has(code)) return
      seen.add(code)
      out.push(code)
    }
    last.forEach(push)
    Object.keys(iOwe).forEach(push)
    Object.keys(theyOwe).forEach(push)
    extra.forEach(push)
    // чтобы порядок был предсказуем: last сначала, остальное по алфавиту
    if (out.length > last.length) {
      const head = out.slice(0, last.length)
      const tail = out.slice(last.length).sort((a, b) => a.localeCompare(b))
      return head.concat(tail)
    }
    return out
  }, [last, iOwe, theyOwe, extra])

  // Активные чипы: из UI -> валидируем -> если пусто, берём первые 2
  const active = useMemo(() => {
    const allow = new Set(available)
    const filtered = (selected || []).filter((c) => allow.has(c))
    return filtered.length ? filtered : available.slice(0, 2)
  }, [available, selected])

  // Тоггл (держим минимум одну активную)
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

  // Левый/правый списки: только выбранные валюты, скрываем нули
  const leftRows = useMemo(() => {
    const rows: string[] = []
    for (const c of active) {
      const val = robustToNumber((iOwe as any)[c]) // ожидаем отрицательные строки
      if (val < 0) rows.push(fmtAmount(val, c, locale))
    }
    return rows
  }, [active, iOwe, locale])

  const rightRows = useMemo(() => {
    const rows: string[] = []
    for (const c of active) {
      const val = robustToNumber((theyOwe as any)[c]) // ожидаем положительные строки
      if (val > 0) rows.push(fmtAmount(val, c, locale))
    }
    return rows
  }, [active, theyOwe, locale])

  return (
    <CardSection noPadding>
      <div className="p-3">
        {/* ЧИПЫ ВАЛЮТ: показываем все, активные подсвечены */}
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pr-1">
          {available.length === 0 && (
            <span className="text-sm text-[var(--tg-hint-color)]">{t("loading")}</span>
          )}
          {available.map((ccy) => {
            const isActive = active.includes(ccy)
            return (
              <button
                key={ccy}
                type="button"
                onClick={() => toggle(ccy)}
                className={[
                  "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition border",
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
        </div>

        {/* ДВЕ КОЛОНКИ */}
        <div className="grid grid-cols-2 gap-3">
          {/* Я должен */}
          <div className="p-3 rounded-2xl bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_60%,transparent)]">
            <div className="flex items-center gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
              <ArrowRight className="w-4 h-4" style={{ color: "var(--tg-destructive-text,#d7263d)" }} />
              <span>{t("i_owe")}</span>
            </div>

            {isLoading ? (
              <div className="h-5 w-32 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
            ) : leftRows.length ? (
              <div className="text-lg font-semibold leading-tight" style={{ color: "var(--tg-destructive-text,#d7263d)" }}>
                {leftRows.join("; ")}
              </div>
            ) : (
              <div className="text-lg font-semibold leading-tight text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_left")}
              </div>
            )}
          </div>

          {/* Мне должны */}
          <div className="p-3 rounded-2xl bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_60%,transparent)] text-right">
            <div className="flex items-center justify-end gap-2 text-xs text-[var(--tg-hint-color)] mb-1">
              <span>{t("they_owe_me")}</span>
              <ArrowLeft className="w-4 h-4" style={{ color: "var(--tg-success-text,#1aab55)" }} />
            </div>

            {isLoading ? (
              <div className="ml-auto h-5 w-32 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
            ) : rightRows.length ? (
              <div className="text-lg font-semibold leading-tight" style={{ color: "var(--tg-success-text,#1aab55)" }}>
                {rightRows.join("; ")}
              </div>
            ) : (
              <div className="text-lg font-semibold leading-tight text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_right")}
              </div>
            )}
          </div>
        </div>
      </div>
    </CardSection>
  )
}
