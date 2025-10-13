// src/components/dashboard/DashboardBalanceCard.tsx
// Совместимо с текущей структурой проекта (папка /components/dashboard)

import { useEffect, useMemo, useState } from "react"
import { useDashboardStore } from "../../store/dashboardStore"

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

/** Сортируем валюты: сначала те, что встречаются в last_currencies (от самой новой к старой), затем остальные по алфавиту */
function sortCcysByLast(ccys: string[], last: string[] | undefined | null): string[] {
  if (!ccys.length) return []
  const order = new Map<string, number>()
  if (Array.isArray(last) && last.length) {
    // последние использованные — раньше: идём с конца массива (самые новые) к началу
    for (let i = last.length - 1, rank = 0; i >= 0; i--, rank++) {
      const c = last[i]
      if (!order.has(c)) order.set(c, rank)
    }
  }
  return [...ccys].sort((a, b) => {
    const ia = order.has(a) ? (order.get(a) as number) : Number.POSITIVE_INFINITY
    const ib = order.has(b) ? (order.get(b) as number) : Number.POSITIVE_INFINITY
    if (ia !== ib) return ia - ib
    return a.localeCompare(b) // остальные по алфавиту
  })
}

const DashboardBalanceCard = () => {
  const loading = useDashboardStore((s) => s.loading.balance)
  const balance = useDashboardStore((s) => s.balance)
  const reloadBalance = useDashboardStore((s) => s.reloadBalance)

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) void reloadBalance()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [reloadBalance])

  const theyOwe = useMemo(() => mapKV(balance?.they_owe_me || {}), [balance])
  const iOwe = useMemo(() => mapKV(balance?.i_owe || {}), [balance])

  // --- Валюты, по которым есть реальные долги (строго != 0 в одной из сторон) ---
  const debtCcys = useMemo(() => {
    const set = new Set<string>()
    const they = balance?.they_owe_me || {}
    const i = balance?.i_owe || {}
    const all = new Set<string>([...Object.keys(they || {}), ...Object.keys(i || {})])
    for (const c of all) {
      const v1 = parseAmtToNumber((they as any)[c])
      const v2 = parseAmtToNumber((i as any)[c])
      if (v1 !== 0 || v2 !== 0) set.add(c)
    }
    return Array.from(set)
  }, [balance])

  // Отсортированный список валют для чипов
  const sortedDebtCcys = useMemo(
    () => sortCcysByLast(debtCcys, balance?.last_currencies),
    [debtCcys, balance?.last_currencies]
  )

  // Выбор по умолчанию: первые 2 из отсортированного (если одна валюта — один чип)
  const defaultSelected = useMemo(() => {
    const n = Math.min(2, sortedDebtCcys.length)
    return sortedDebtCcys.slice(0, n)
  }, [sortedDebtCcys])

  // Состояние выбранных валют (обеспечиваем минимум 1)
  const [activeCcys, setActiveCcys] = useState<Set<string>>(new Set(defaultSelected))
  // Сбрасываем выбор, если набор доступных валют поменялся (сохраняем UX: не трогаем при обычном обновлении сумм)
  useEffect(() => {
    const keyNow = sortedDebtCcys.join("|")
    // Если активные валюты отсутствуют среди доступных — пересоздаём выбор по умолчанию
    const allContain = [...activeCcys].every((c) => sortedDebtCcys.includes(c))
    if (!allContain || activeCcys.size === 0) {
      setActiveCcys(new Set(defaultSelected))
      return
    }
    // Если, например, стало доступно меньше валют: гарантируем минимум 1 в пределах доступного
    if (activeCcys.size > 0) return
    setActiveCcys(new Set(defaultSelected))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedDebtCcys.join("|")])

  const toggleCcy = (ccy: string) => {
    setActiveCcys((prev) => {
      const next = new Set(prev)
      if (next.has(ccy)) {
        if (next.size === 1) {
          // минимум 1 чип всегда включён — игнорируем попытку выключить последний
          return prev
        }
        next.delete(ccy)
      } else {
        next.add(ccy)
      }
      return next
    })
  }

  // Фильтруем вывод по активным валютам (если чипов нет, не фильтруем — но чипов нет только когда долгов нет)
  const theyOweFiltered = useMemo(() => {
    if (!sortedDebtCcys.length) return theyOwe // долгов нет — поведение как раньше
    return theyOwe.filter((x) => activeCcys.has(x.ccy))
  }, [theyOwe, activeCcys, sortedDebtCcys])

  const iOweFiltered = useMemo(() => {
    if (!sortedDebtCcys.length) return iOwe
    return iOwe.filter((x) => activeCcys.has(x.ccy))
  }, [iOwe, activeCcys, sortedDebtCcys])

  return (
    <div className="rounded-2xl shadow p-3 bg-[var(--tg-card-bg,#1f1f1f)]">
      <div className="text-sm opacity-70 mb-2">Баланс по всем активным группам</div>

      {/* Чипы-фильтры: показываем только если есть валюта с долгами и не идёт загрузка */}
      {!loading && sortedDebtCcys.length > 0 ? (
        <div className="mb-2 -mx-1 px-1 overflow-x-auto whitespace-nowrap" style={{ WebkitOverflowScrolling: "touch" }}>
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
                    : "bg-transparent border border-white/10 text-[var(--tg-theme-text-color,#fff)]/80",
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
        <div className="text-sm opacity-80">Загрузка…</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs opacity-60 mb-1">Мне должны</div>
            {theyOweFiltered.length === 0 ? (
              <div className="text-sm opacity-70">—</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {theyOweFiltered.map((x) => (
                  <span
                    key={`to-me-${x.ccy}`}
                    className="px-2 py-1 text-sm rounded-full border border-white/10"
                  >
                    {x.amt} {x.ccy}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs opacity-60 mb-1">Я должен</div>
            {iOweFiltered.length === 0 ? (
              <div className="text-sm opacity-70">—</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {iOweFiltered.map((x) => (
                  <span
                    key={`i-owe-${x.ccy}`}
                    className="px-2 py-1 text-sm rounded-full border border-white/10"
                  >
                    {x.amt} {x.ccy}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {balance?.last_currencies?.length ? (
        <div className="mt-3 text-xs opacity-60">
          Последние валюты: {balance.last_currencies.join(", ")}
        </div>
      ) : null}
    </div>
  )
}

export default DashboardBalanceCard
