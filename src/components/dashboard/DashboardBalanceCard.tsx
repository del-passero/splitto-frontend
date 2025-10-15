// src/components/dashboard/DashboardBalanceCard.tsx
// Совместимо с текущей структурой проекта (папка /components/dashboard)

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight, PartyPopper, HandCoins } from "lucide-react"
import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"

type Props = {
  onAddTransaction?: () => void
}

function mapKV(rec: Record<string, string>): Array<{ ccy: string; amt: string }> {
  return Object.entries(rec || {}).map(([ccy, amt]) => ({ ccy, amt }))
}

/** Мягкий парсер сумм из строк: убирает пробелы, заменяет запятую на точку */
function parseAmtToNumber(input: string | number | null | undefined): number {
  if (typeof input === "number") return isFinite(input) ? input : 0
  if (!input) return 0
  const s = String(input).trim().replace(/\s+/g, "").replace(",", ".")
  const n = Number(s)
  return isFinite(n) ? n : 0
}

const nbsp = "\u00A0"
/** Форматирование как в GroupBalanceTabSmart: 22 → "22 CCY", 22.30 → "22.30 CCY" */
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

/** Унифицированная сортировка: самые последние валюты (индекс 0 — самая новая) раньше, потом — по алфавиту */
function sortCcysByLast(ccys: string[], last: string[] | undefined | null): string[] {
  const src = Array.from(new Set((ccys || []).map((c) => String(c).toUpperCase())))
  const lastUp = Array.isArray(last) ? last.map((c) => String(c).toUpperCase()) : []
  const order = new Map<string, number>()
  for (let i = 0; i < lastUp.length; i++) {
    const c = lastUp[i]
    if (!order.has(c)) order.set(c, i) // индекс 0 — самый новый, самый приоритетный
  }
  return [...src].sort((a, b) => {
    const ia = order.has(a) ? (order.get(a) as number) : Number.POSITIVE_INFINITY
    const ib = order.has(b) ? (order.get(b) as number) : Number.POSITIVE_INFINITY
    if (ia !== ib) return ia - ib
    return a.localeCompare(b)
  })
}

/** Единый компаратор для отображения списков долгов в обеих колонках */
const compareDebts = (a: { ccy: string }, b: { ccy: string }) => a.ccy.localeCompare(b.ccy)

const DashboardBalanceCard = ({ onAddTransaction }: Props) => {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").split("-")[0]

  // берём reloadBalance из стора, чтобы гарантированно стриггерить первичную загрузку
  const reloadBalance = useDashboardStore((s) => s.reloadBalance)
  const currenciesRecent = useDashboardStore((s) => s.currenciesRecent)

  // Снимок стора — чтобы виджет не «дёргался» от live-обновлений
  const [snap, setSnap] = useState(() => {
    const st = (useDashboardStore as any).getState?.() || {}
    return { loading: !!st.loading?.balance, balance: st.balance }
  })

  useEffect(() => {
    let startedExplicitLoad = false
    // Если сейчас не идёт загрузка — инициируем (исправляет пустоту после refresh/первого захода)
    const st = (useDashboardStore as any).getState?.()
    if (!st?.loading?.balance) {
      startedExplicitLoad = true
      try {
        void reloadBalance()
      } catch {}
    }

    let unsubscribe: () => void = () => {}
    unsubscribe =
      (useDashboardStore as any).subscribe?.((s: any) => {
        const next = { loading: !!s.loading?.balance, balance: s.balance }
        setSnap(next)
        // Отписываемся ПОСЛЕ первой завершённой загрузки, которую мы инициировали
        if (startedExplicitLoad && !next.loading) {
          try {
            unsubscribe()
          } catch {}
        }
      }) || (() => {})

    return () => {
      try {
        unsubscribe()
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // один раз на маунт

  const loading = snap.loading
  const balance = snap.balance

  const theyOwe = useMemo(() => mapKV(balance?.they_owe_me || {}), [balance])
  const iOwe = useMemo(() => mapKV(balance?.i_owe || {}), [balance])

  // Валюты, по которым есть реальные долги (строго != 0 в одной из сторон)
  const debtCcys = useMemo(() => {
    const set = new Set<string>()
    const they = balance?.they_owe_me || {}
    const i = balance?.i_owe || {}
    const all = new Set<string>([...Object.keys(they || {}), ...Object.keys(i || {})])
    for (const c of all) {
      const v1 = parseAmtToNumber((they as any)[c])
      const v2 = parseAmtToNumber((i as any)[c])
      if (v1 !== 0 || v2 !== 0) set.add(String(c).toUpperCase())
    }
    return Array.from(set)
  }, [balance])

  // Источник «последних валют»: сначала из баланса (если есть), иначе — из стора (currenciesRecent)
  const lastList = (balance?.last_currencies && balance.last_currencies.length > 0)
    ? balance.last_currencies
    : currenciesRecent

  // Отсортированный список валют для чипов
  const sortedDebtCcys = useMemo(
    () => sortCcysByLast(debtCcys, lastList),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debtCcys.join("|"), (lastList || []).join("|")]
  )

  // Выбор по умолчанию: первые 2 из отсортированного (если одна валюта — один чип)
  const defaultSelected = useMemo(() => {
    const n = Math.min(2, sortedDebtCcys.length)
    return sortedDebtCcys.slice(0, n)
  }, [sortedDebtCcys])

  // Состояние выбранных валют (обеспечиваем минимум 1)
  const [activeCcys, setActiveCcys] = useState<Set<string>>(new Set(defaultSelected))
  // Если набор валют изменился — пересоберём выбор
  useEffect(() => {
    const allContain = [...activeCcys].every((c) => sortedDebtCcys.includes(c))
    if (!allContain || activeCcys.size === 0) {
      setActiveCcys(new Set(defaultSelected))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedDebtCcys.join("|")])

  const toggleCcy = (ccy: string) => {
    setActiveCcys((prev) => {
      const next = new Set(prev)
      if (next.has(ccy)) {
        if (next.size === 1) return prev // минимум 1 чип всегда включён
        next.delete(ccy)
      } else {
        next.add(ccy)
      }
      return next
    })
  }

  // Фильтрация по активным валютам (когда долгов нет — без чипов и без фильтра)
  const theyOweFiltered = useMemo(() => {
    if (!sortedDebtCcys.length) return theyOwe
    return theyOwe.filter((x) => activeCcys.has(String(x.ccy).toUpperCase()))
  }, [theyOwe, activeCcys, sortedDebtCcys])

  const iOweFiltered = useMemo(() => {
    if (!sortedDebtCcys.length) return iOwe
    return iOwe.filter((x) => activeCcys.has(String(x.ccy).toUpperCase()))
  }, [iOwe, activeCcys, sortedDebtCcys])

  // ЕДИНАЯ сортировка содержимого колонок
  const theyOweSorted = useMemo(() => [...theyOweFiltered].sort(compareDebts), [theyOweFiltered])
  const iOweSorted = useMemo(() => [...iOweFiltered].sort(compareDebts), [iOweFiltered])

  const noDebts = !loading && theyOweSorted.length === 0 && iOweSorted.length === 0

  return (
    <CardSection noPadding>
      {/* Внутренний box с рамкой и скруглением (как у GroupCard) */}
      <div className="rounded-lg p-1.5 border border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)]">
        {/* Заголовок — жирный, акцентный (голубой Telegram) */}
        <div
          className="mb-2 font-semibold"
          style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
        >
          {t("dashboard_balance_title")}
        </div>

        {/* Чипы-фильтры: одна строка, горизонтальный скролл; цвета Telegram */}
        {!loading && sortedDebtCcys.length > 0 ? (
          <div
            className="mb-2 -mx-1 px-1 overflow-x-auto whitespace-nowrap"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {sortedDebtCcys.map((ccy) => {
              const active = activeCcys.has(ccy)
              return (
                <button
                  key={`ccy-chip-${ccy}`}
                  type="button"
                  onClick={() => toggleCcy(ccy)}
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
        ) : noDebts ? (
          // ===== ПУСТОЕ СОСТОЯНИЕ (вариант B) =====
          <div
            className="flex flex-col items-center justify-center text-center py-6"
            role="status"
            aria-live="polite"
          >
            <PartyPopper size={40} style={{ color: "var(--tg-accent-color,#40A7E3)" }} aria-hidden />
            <div className="mt-2 text-[15px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
              {t("dashboard_balance_zero_title")}
            </div>
            <div className="mt-1 text-[13px]" style={{ color: "var(--tg-hint-color)" }}>
              {t("dashboard_balance_zero_desc")}
            </div>

            {onAddTransaction ? (
              <button
                type="button"
                onClick={onAddTransaction}
                className="mt-3 h-10 px-4 rounded-xl font-semibold active:scale-95 transition inline-flex items-center gap-2"
                style={{
                  background: "var(--tg-accent-color,#40A7E3)",
                  color: "white",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                <HandCoins size={18} />
                {t("add_transaction")}
              </button>
            ) : null}
          </div>
        ) : (
          // ===== ОСНОВНОЕ СОСТОЯНИЕ =====
          // СЛЕВА — "Я должен" (красные, БЕЗ минуса), СПРАВА — "Мне должны" (зелёные)
          <div className="grid grid-cols-2 gap-3">
            {/* Я должен */}
            <div>
              <div className="mb-1 text-[12px] leading-[14px] text-[var(--tg-hint-color)]">
                {t("i_owe")}
              </div>
              {iOweSorted.length === 0 ? (
                <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-70">
                  —
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {iOweSorted.map((x) => {
                    const num = parseAmtToNumber(x.amt)
                    if (!isFinite(num) || num === 0) return null
                    return (
                      <div key={`i-owe-${x.ccy}`} className="flex items-center gap-1">
                        <ArrowRight
                          size={14}
                          style={{ color: "var(--tg-destructive-text,#d7263d)" }}
                          aria-hidden
                        />
                        <span
                          className="text-[14px] font-semibold"
                          style={{ color: "var(--tg-destructive-text,#d7263d)" }}
                        >
                          {fmtAmountSmart(Math.abs(num), x.ccy, locale)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Мне должны */}
            <div>
              <div className="mb-1 text-[12px] leading-[14px] text-[var(--tg-hint-color)]">
                {t("they_owe_me")}
              </div>
              {theyOweSorted.length === 0 ? (
                <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-70">
                  —
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {theyOweSorted.map((x) => {
                    const num = parseAmtToNumber(x.amt)
                    if (!isFinite(num) || num === 0) return null
                    return (
                      <div key={`to-me-${x.ccy}`} className="flex items-center gap-1">
                        <ArrowLeft
                          size={14}
                          style={{ color: "var(--tg-success-text,#1aab55)" }}
                          aria-hidden
                        />
                        <span
                          className="text-[14px] font-semibold"
                          style={{ color: "var(--tg-success-text,#1aab55)" }}
                        >
                          {fmtAmountSmart(num, x.ccy, locale)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CardSection>
  )
}

export default DashboardBalanceCard
