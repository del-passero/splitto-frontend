// src/components/dashboard/DashboardBalanceCard.tsx
// «Мой баланс» на Главной: стиль как у GroupCard, корректный учёт ВСЕХ валют,
// две последние валюты активны по умолчанию, суммы берём как |value| из карт i_owe / they_owe_me.

import { useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useDashboardStore } from "../../store/dashboardStore"
import CardSection from "../CardSection"

const NBSP = "\u00A0"

function toNum(x: unknown): number {
  const n = Number(String(x ?? "").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

/** формат: число + код валюты, без лишних .00 */
function fmtAmount(value: number, currency: string, locale: string) {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "code",
    }).formatToParts(Math.abs(value))
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
    const s = Math.round((Math.abs(rounded) % 1) * 100) !== 0 ? rounded.toFixed(2) : String(Math.trunc(rounded))
    return `${s}${NBSP}${currency}`
  }
}

/** case-insensitive маппер: берём значение по коду валюты без учёта регистра */
function valueByCode(map: Record<string, string> | undefined, code: string): number {
  if (!map) return 0
  const uc = code.toUpperCase()
  // прямое попадание
  if (uc in Object.fromEntries(Object.keys(map).map(k => [k.toUpperCase(), 1])) === false) {
    // noop — просто идём дальше к поиску
  }
  // быстрый поиск
  const direct = (map as any)[code] ?? (map as any)[uc]
  if (direct != null) return toNum(direct)
  // линейный поиск по ключам в другом регистре
  for (const [k, v] of Object.entries(map)) {
    if (String(k).toUpperCase() === uc) return toNum(v)
  }
  return 0
}

export default function DashboardBalanceCard() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  // читаем стор — по одному селектору на поле, чтобы не плодить лишние ререндеры
  const balance = useDashboardStore((s) => s.balance)
  const uiSelected = useDashboardStore((s) => s.ui.balanceCurrencies)
  const setSelected = useDashboardStore((s) => s.setBalanceCurrencies)
  const isLoading = useDashboardStore((s) => s.loading.balance || s.loading.global)

  const iOweMap = balance?.i_owe
  const owedMap = balance?.they_owe_me
  const last = balance?.last_currencies ?? []

  // ВСЕ доступные валюты: сначала последние использованные (сохраняем порядок),
  // затем все ключи карт; убираем дубли (без учёта регистра).
  const available = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    const push = (code?: string | null) => {
      const raw = String(code ?? "").trim()
      if (!raw) return
      const uc = raw.toUpperCase()
      if (!seen.has(uc)) {
        seen.add(uc)
        out.push(raw.toUpperCase()) // показываем чипами в UC, как в остальных карточках
      }
    }
    last.forEach(push)
    Object.keys(iOweMap ?? {}).forEach(push)
    Object.keys(owedMap ?? {}).forEach(push)
    return out
  }, [last, iOweMap, owedMap])

  // Активные чипы: из UI → валидируем по available; если пусто — берём 2 последние
  const active = useMemo(() => {
    const allow = new Set(available)
    const filtered = (uiSelected || []).map((c) => c.toUpperCase()).filter((c) => allow.has(c))
    return filtered.length ? filtered : available.slice(0, 2)
  }, [available, uiSelected])

  // Тоггл валюты (оставляем минимум одну)
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

  // Списки по сторонам: по ТЗ показываем суммы по КАЖДОЙ выбранной валюте (без межвалютного неттинга).
  // ВАЖНО: в ответе i_owe/they_owe_me уже разделены по смыслу, поэтому берём |value| как есть.
  const oweList = useMemo(() => {
    const rows: string[] = []
    for (const c of active) {
      const val = Math.abs(valueByCode(iOweMap, c))
      if (val > 0) rows.push(fmtAmount(val, c, locale))
    }
    return rows
  }, [active, iOweMap, locale])

  const owedToMeList = useMemo(() => {
    const rows: string[] = []
    for (const c of active) {
      const val = Math.abs(valueByCode(owedMap, c))
      if (val > 0) rows.push(fmtAmount(val, c, locale))
    }
    return rows
  }, [active, owedMap, locale])

  return (
    <CardSection noPadding className="overflow-hidden">
      <div className="p-1.5">
        {/* Внешняя обёртка — как у GroupCard: фон, бордер, тени */}
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

          {/* Две строки, как у GroupCard: */}
          {/* 1) Я должен */}
          <div className="w-full text-[12px] leading-[14px] text-[var(--tg-text-color)] min-w-0 mb-1.5">
            <span className="inline-flex items-center gap-2 text-[var(--tg-hint-color)] mr-1.5">
              <ArrowRight className="w-4 h-4 text-red-500" />
              <span>{t("i_owe")}</span>
            </span>
            {isLoading ? (
              <span className="inline-block align-middle h-3 w-28 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
            ) : oweList.length === 0 ? (
              <span className="text-[var(--tg-hint-color)]">{t("group_balance_no_debts_left")}</span>
            ) : (
              <span className="text-red-500 font-semibold">{oweList.join(" · ")}</span>
            )}
          </div>

          {/* 2) Мне должны */}
          <div className="w-full text-[12px] leading-[14px] text-[var(--tg-text-color)] min-w-0">
            <span className="inline-flex items-center gap-2 text-[var(--tg-hint-color)] mr-1.5">
              <span>{t("they_owe_me")}</span>
              <ArrowLeft className="w-4 h-4 text-green-600" />
            </span>
            {isLoading ? (
              <span className="inline-block align-middle h-3 w-28 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
            ) : owedToMeList.length === 0 ? (
              <span className="text-[var(--tg-hint-color)]">{t("group_balance_no_debts_right")}</span>
            ) : (
              <span className="text-green-600 font-semibold">{owedToMeList.join(" · ")}</span>
            )}
          </div>
        </div>
      </div>
    </CardSection>
  )
}
