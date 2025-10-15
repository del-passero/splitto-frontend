// src/components/dashboard/TopPartnersCarousel.tsx
import { useEffect, useMemo, useRef, useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { BookUser } from "lucide-react"

import CardSection from "../CardSection"
import Avatar from "../Avatar"
import { useDashboardStore } from "../../store/dashboardStore"
import { useUserStore } from "../../store/userStore"
import { getTransactions } from "../../api/transactionsApi"
import type { TopPartnerItem } from "../../types/dashboard"
import type { TransactionOut } from "../../types/transaction"

/* ===== layout ===== */
const AVATAR_SIZE = 48
type Period = "week" | "month" | "year"

/* ===== helpers ===== */
function formatCountLabel(t: (k: string, o?: any) => any) {
  return t("dashboard.joint_expenses_label") || t("dashboard.joint_expenses_count") || "Совместных расходов"
}

const PERIOD_WINDOW_DAYS: Record<Period, number> = { week: 7, month: 28, year: 365 }
function periodStart(period: Period) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (PERIOD_WINDOW_DAYS[period] - 1))
  return d
}

function isPartnerInExpenseTx(tx: any, partnerId: number): boolean {
  if ((tx?.type || "expense") !== "expense") return false
  if (Number(tx?.paid_by) === partnerId) return true
  const shares = Array.isArray(tx?.shares) ? tx.shares : []
  return shares.some((s: any) => Number(s?.user_id) === partnerId)
}

function pickLocale(i18nObj: any, locale: string): string {
  if (!i18nObj || typeof i18nObj !== "object") return ""
  const lc = (locale || "ru").toLowerCase()
  return (
    i18nObj[lc] ||
    i18nObj[lc.split("-")[0]] ||
    i18nObj.en ||
    i18nObj.ru ||
    i18nObj.es ||
    ""
  )
}

function txCategoryName(tx: any, locale: string): string {
  const cat = tx?.category
  if (!cat) return ""
  const byI18n = pickLocale(cat?.name_i18n, locale)
  if (byI18n) return String(byI18n).trim()
  return String(cat?.name || "").trim()
}

/** Универсальный резолвер названия «топ-категории» из карточки топ-партнёров (если вдруг бэк начнёт отдавать) */
function resolveTopCategoryNameFromDashboard(p: any, t: (k: string) => string, locale: string): string {
  try {
    const direct =
      (typeof p?.top_category_name === "string" && p.top_category_name) ||
      (typeof p?.most_category_name === "string" && p.most_category_name) ||
      (typeof p?.favorite_category_name === "string" && p.favorite_category_name) ||
      (typeof p?.category_name === "string" && p.category_name)
    if (direct) return String(direct).trim()

    const obj = p?.top_category || p?.most_spent_category || p?.favorite_category || p?.category
    if (obj) {
      const byI18n = pickLocale(obj?.name_i18n, locale)
      if (byI18n) return String(byI18n).trim()
      if (typeof obj?.name === "string" && obj.name.trim()) return obj.name.trim()
    }

    const key: string | undefined =
      p?.top_category_key || p?.category_key || p?.most_category_key || p?.favorite_category_key
    if (key && typeof key === "string") {
      const maybe = t(`categories.keys.${key}`)
      if (maybe && maybe !== `categories.keys.${key}`) return maybe
      return key
    }
    return ""
  } catch {
    return ""
  }
}

/* ===== чипы периода (как в графике активности) ===== */
function PeriodChips({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  const { t } = useTranslation()
  const all: Period[] = ["week", "month", "year"]
  return (
    <div className="ml-auto flex gap-1">
      {all.map((p) => {
        const active = p === value
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
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
  )
}

/* ===== скелетон карточки ===== */
function PartnerSkeleton() {
  return (
    <div
      className="
        snap-center shrink-0
        min-w-[260px] w-[70%]
        rounded-lg p-1.5 border border-[var(--tg-hint-color)]
        bg-[var(--tg-card-bg)]
      "
    >
      <div className="w-full grid grid-cols-12 gap-2 items-center">
        <div className="col-span-3 flex items-center justify-center">
          <div
            className="rounded-full animate-pulse"
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, background: "var(--tg-hint-color)", opacity: 0.25 }}
          />
        </div>
        <div className="col-span-9 flex flex-col gap-2">
          <div className="h-4 rounded animate-pulse" style={{ background: "var(--tg-hint-color)", opacity: 0.25 }} />
          <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: "var(--tg-hint-color)", opacity: 0.2 }} />
        </div>
      </div>
    </div>
  )
}

export default function TopPartnersCarousel() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language || "ru").toLowerCase()
  const navigate = useNavigate()

  const period = useDashboardStore((s) => s.frequentPeriod as Period)
  const setPeriod = useDashboardStore((s) => s.setFrequentPeriod)
  const items = useDashboardStore((s) => s.frequentUsers)
  const loading = useDashboardStore((s) => s.loading.frequent)
  const error = useDashboardStore((s) => s.error.frequent || "")
  const loadTopPartners = useDashboardStore((s) => s.loadTopPartners)
  const currentUser = useUserStore((s) => s.user)
  const currentUserId = currentUser?.id

  const hadSuccessRef = useRef(false)

  // Фолбэк-словарь: partnerUserId -> categoryName (подсчитано по транзакциям)
  const [topCatById, setTopCatById] = useState<Record<number, string>>({})

  // первичная загрузка
  useEffect(() => {
    if (!items?.length && !loading) void loadTopPartners(period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (items?.length) hadSuccessRef.current = true
  }, [items])

  // тихий ретрай при фокусе/онлайне
  useEffect(() => {
    const onFocusOrOnline = () => {
      if (!loading && (!hadSuccessRef.current || error)) void loadTopPartners(period)
    }
    window.addEventListener("focus", onFocusOrOnline)
    window.addEventListener("online", onFocusOrOnline)
    return () => {
      window.removeEventListener("focus", onFocusOrOnline)
      window.removeEventListener("online", onFocusOrOnline)
    }
  }, [loading, error, loadTopPartners, period])

  const onChangePeriod = useCallback(
    (p: Period) => {
      setPeriod(p)
      void loadTopPartners(p)
      // сбрасываем фолбэк-кеш категорий при смене периода
      setTopCatById({})
    },
    [setPeriod, loadTopPartners]
  )

  /* Стабильная сортировка: count ↓, user.id ↑ */
  const sorted: TopPartnerItem[] = useMemo(() => {
    const arr = Array.isArray(items) ? items.slice() : []
    arr.sort((a: any, b: any) => {
      const ca = Number(a?.joint_expense_count || 0)
      const cb = Number(b?.joint_expense_count || 0)
      if (cb !== ca) return cb - ca
      const ia = Number(a?.user?.id || 0)
      const ib = Number(b?.user?.id || 0)
      return ia - ib
    })
    return arr
  }, [items])

  // === ФОЛБЭК-КАТЕГОРИИ ПО ТРАНЗАКЦИЯМ ===
  useEffect(() => {
    if (!sorted.length || !currentUserId) return

    // у каких партнёров нет категории в ответе дашборда
    const needIds = sorted
      .filter((p: any) => {
        const fromDash = resolveTopCategoryNameFromDashboard(p, t, locale)
        return !fromDash
      })
      .map((p) => Number(p?.user?.id))
      .filter((id): id is number => Number.isFinite(id) && id > 0 && !topCatById[id])

    if (!needIds.length) return

    let cancelled = false
    const controller = new AbortController()

    ;(async () => {
      const start = periodStart(period)
      const counts: Record<number, Record<string, number>> = {} // partnerId -> { categoryName -> count }
      let offset = 0
      const limit = 50

      // пагинируем, пока не уйдём старше границы периода
      outer: while (!cancelled) {
        const { items: txs } = await getTransactions({
          userId: currentUserId,
          type: "expense",
          offset,
          limit,
          signal: controller.signal,
        })
        if (cancelled || !txs.length) break

        for (const raw of txs as TransactionOut[]) {
          const txDate = new Date((raw as any).date)
          if (txDate < start) break outer // дальше только старше

          const name = txCategoryName(raw, locale)
          if (!name) continue

          for (const pid of needIds) {
            if (isPartnerInExpenseTx(raw, pid)) {
              counts[pid] ||= {}
              counts[pid][name] = (counts[pid][name] || 0) + 1 // по частоте
              // Если нужен подсчёт по сумме — меняем +1 на +Number(raw.amount || 0)
            }
          }
        }

        offset += txs.length
        if (txs.length < limit) break
      }

      if (cancelled) return

      const resolved: Record<number, string> = {}
      Object.entries(counts).forEach(([pidStr, map]) => {
        let top = "", best = -Infinity
        Object.entries(map).forEach(([name, val]) => {
          if (val > best) { best = val; top = name }
        })
        if (top) resolved[Number(pidStr)] = top
      })

      if (!cancelled && Object.keys(resolved).length) {
        setTopCatById((prev) => ({ ...prev, ...resolved }))
      }
    })().catch(() => { /* no-op */ })

    return () => { cancelled = true; controller.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUserId,
    period,
    locale,
    t,
    // зависимость по списку партнёров (только ids, чтобы не триггерить лишний раз)
    sorted.map((p) => p?.user?.id).join(","),
  ])

  /* ===== header ===== */
  const header = (
    <div className="flex items-center gap-2 mb-2">
      <div
        className="font-semibold"
        style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
      >
        {t("dashboard.top_partners") || "Часто делю расходы"}
      </div>
      <PeriodChips value={period} onChange={onChangePeriod} />
    </div>
  )

  /* ===== content ===== */
  const content = useMemo(() => {
    if (loading && !hadSuccessRef.current) {
      return (
        <div className="-mx-1 px-1 flex gap-3 overflow-x-auto snap-x" style={{ WebkitOverflowScrolling: "touch" }}>
          <PartnerSkeleton />
          <PartnerSkeleton />
          <PartnerSkeleton />
        </div>
      )
    }

    if (!!error && !hadSuccessRef.current) {
      return (
        <div className="text-[14px] leading-[18px] text-red-500 flex items-center gap-3">
          <span>{error}</span>
          <button
            type="button"
            className="px-2 py-1 text-sm rounded border transition bg-transparent border-[var(--tg-hint-color)]"
            style={{ color: "var(--tg-text-color)" }}
            onClick={() => loadTopPartners(period)}
          >
            {t("retry")}
          </button>
        </div>
      )
    }

    if (!sorted.length) {
      return (
        <div className="rounded-lg border border-[var(--tg-hint-color)] flex items-center justify-center text-center p-3 bg-[var(--tg-card-bg)]">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-2 opacity-60">
              <BookUser size={56} className="text-[var(--tg-link-color)]" />
            </div>
            <div className="text-[15px] leading-[18px] font-semibold text-[var(--tg-text-color)] mb-1">
              {t("dashboard.top_partners_empty") || "Пока нет совместных расходов"}
            </div>
            <div className="text-[12px] leading-[14px] text-[var(--tg-hint-color)]">
              {t("dashboard.top_partners_hint") || "Создайте группу или добавьте друзей в существующие"}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="-mx-1 px-1 flex gap-3 overflow-x-auto snap-x" style={{ WebkitOverflowScrolling: "touch" }}>
        {sorted.map((p) => {
          const u = p.user || ({} as any)
          const fullName =
            [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.username || t("unknown") || "—"
          const count = Number(p.joint_expense_count || 0)

          // 1) если бэк начнёт отдавать — берём оттуда; 2) иначе — наш фолбэк
          const fromDashboard = resolveTopCategoryNameFromDashboard(p as any, t as any, locale)
          const topCategoryName = fromDashboard || topCatById[Number(u.id)] || ""

          return (
            <button
              key={u.id}
              type="button"
              onClick={() => navigate(`/contacts/${u.id}`)}
              className="
                snap-center shrink-0
                min-w-[260px] w-[70%]
                rounded-lg p-1.5 border border-[var(--tg-hint-color)]
                text-left active:scale-[0.99] transition bg-[var(--tg-card-bg)]
              "
              aria-label={fullName}
            >
              <div className="w-full grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3 flex items-center justify-center">
                  <Avatar
                    name={fullName}
                    src={u.photo_url ?? undefined}
                    size={AVATAR_SIZE}
                    className="relative"
                  />
                </div>

                {/* Правая колонка: фиксируем высоту = AVATAR_SIZE */}
                <div
                  className="col-span-9 min-w-0"
                  style={{ height: AVATAR_SIZE, display: "grid", gridTemplateRows: "auto 1fr auto" }}
                >
                  {/* Имя */}
                  <div
                    className="text-[16px] leading-[18px] font-semibold text-[var(--tg-text-color)] truncate self-start"
                    title={fullName}
                  >
                    {fullName}
                  </div>

                  <div />

                  {/* Низ карточки */}
                  <div className="self-end">
                    {/* Совместные расходы: лейбл + жирное число */}
                    <div className="text-[11px] leading-[14px] text-[var(--tg-hint-color)] truncate">
                      {formatCountLabel(t as any)}:{" "}
                      <b className="text-[12px] text-[var(--tg-text-color)]">{count}</b>
                    </div>

                    {/* Категория: показываем если есть (две строки, высоту не увеличиваем) */}
                    {topCategoryName ? (
                      <>
                        <div className="text-[11px] leading-[14px] text-[var(--tg-hint-color)] truncate">
                          {t("dashboard.most_spent_category") || "Чаще всего тратили в категории"}
                        </div>
                        <div
                          className="text-[13px] leading-[16px] font-semibold text-[var(--tg-text-color)] truncate"
                          title={topCategoryName}
                        >
                          {topCategoryName}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          )
        })}

        {/* Карточка «Все контакты» */}
        <button
          type="button"
          onClick={() => navigate("/contacts")}
          className="
            snap-center shrink-0 px-4
            rounded-lg p-1.5 border border-[var(--tg-hint-color)]
            flex items-center justify-center
            active:scale-[0.98] transition bg-[var(--tg-card-bg)]
          "
          aria-label={t("dashboard.all_contacts") || "Все контакты"}
        >
          <div className="flex flex-col items-center justify-center">
            <div
              className="rounded-full w-[48px] h-[48px] flex items-center justify-center mb-2"
              style={{ background: "var(--tg-accent-color,#40A7E3)" }}
            >
              <BookUser size={24} color="#fff" />
            </div>
            <div className="text-[11px] leading-[13px] font-semibold text-[var(--tg-text-color)] uppercase tracking-wide">
              {t("dashboard.all_contacts") || "Все контакты"}
            </div>
          </div>
        </button>
      </div>
    )
  }, [sorted, loading, error, loadTopPartners, period, navigate, t, locale, topCatById])

  return (
    <CardSection noPadding>
      <div className="rounded-lg border border-[var(--tg-hint-color)] p-1.5 bg-[var(--tg-card-bg)]">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="font-semibold"
            style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
          >
            {t("dashboard.top_partners") || "Часто делю расходы"}
          </div>
          <PeriodChips value={period} onChange={onChangePeriod} />
        </div>
        {content}
      </div>
    </CardSection>
  )
}
