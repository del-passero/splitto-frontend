// src/components/dashboard/TopPartnersCarousel.tsx
import { useEffect, useMemo, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Users } from "lucide-react"

import Avatar from "../Avatar"
import { useDashboardStore } from "../../store/dashboardStore"
import type { TopPartnerItem } from "../../types/dashboard"

/* ===== layout consts — как в RecentGroupsCarousel ===== */
const CARD_MIN_W = 260
const CARD_W_PCT = "70%"
const AVATAR_SIZE = 48

type Period = "week" | "month" | "year"

type Props = {
  /** Клик по карточке партнёра (например, открыть его профиль / фильтр транзакций). Необязательно. */
  onOpenPartner?: (userId: number, partner: TopPartnerItem) => void
  /** Клик по «Все контакты». Необязательно. */
  onOpenAll?: () => void
}

/* ===== helpers (единообразные подписи) ===== */
function formatCountLabel(t: (k: string, o?: any) => string, n: number) {
  // i18n-ключ: dashboard.joint_expenses_count, с pluralization
  // ru пример: "{{count}} совместных расход(а/ов)"
  try {
    return t("dashboard.joint_expenses_count", { count: n })
  } catch {
    return `${n} ${n === 1 ? "совместный расход" : "совместных расхода"}`
  }
}

/* ===== чипы периода — стиль как в DashboardActivity ===== */
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

/* ===== скелетон карточки (первичная загрузка) ===== */
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

export default function TopPartnersCarousel({ onOpenPartner, onOpenAll }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const period = useDashboardStore((s) => s.frequentPeriod as Period)
  const setPeriod = useDashboardStore((s) => s.setFrequentPeriod)
  const items = useDashboardStore((s) => s.frequentUsers)
  const loading = useDashboardStore((s) => s.loading.frequent)
  const error = useDashboardStore((s) => s.error.frequent || "")
  const load = useDashboardStore((s) => s.loadTopPartners)

  const hadSuccessRef = useRef(false)

  /* Первая загрузка:
     - если данных нет — грузим
     - если была ошибка и окно вернулось в фокус/онлайн — пробуем снова
  */
  useEffect(() => {
    if (!items?.length && !loading) void load(period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (items?.length) hadSuccessRef.current = true
  }, [items])

  useEffect(() => {
    const onFocusOrOnline = () => {
      if (!loading && (!hadSuccessRef.current || error)) void load(period)
    }
    window.addEventListener("focus", onFocusOrOnline)
    window.addEventListener("online", onFocusOrOnline)
    return () => {
      window.removeEventListener("focus", onFocusOrOnline)
      window.removeEventListener("online", onFocusOrOnline)
    }
  }, [loading, error, load, period])

  const onChangePeriod = useCallback(
    (p: Period) => {
      setPeriod(p)
      void load(p)
    },
    [setPeriod, load]
  )

  /* Стабильная сортировка: по количеству ↓, затем по user.id ↑ */
  const sorted = useMemo(() => {
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
            onClick={() => load(period)}
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
              <Users size={56} className="text-[var(--tg-link-color)]" />
            </div>
            <div className="text-[15px] leading-[18px] font-semibold text-[var(--tg-text-color)] mb-1">
              {t("dashboard.top_partners_empty") || "Пока нет совместных расходов"}
            </div>
            <div className="text-[12px] leading-[14px] text-[var(--tg-hint-color)]">
              {t("dashboard.top_partners_hint") || "Создайте группу или добавьте друзей в существующие."}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="-mx-1 px-1 flex gap-3 overflow-x-auto snap-x" style={{ WebkitOverflowScrolling: "touch" }}>
        {sorted.map((p) => {
          const u = p.user || {}
          const fullName =
            [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.username || t("unknown") || "—"
          const count = Number(p.joint_expense_count || 0)

          const handleClick = () => {
            if (onOpenPartner) onOpenPartner(u.id, p as TopPartnerItem)
          }

          return (
            <button
              key={u.id}
              type="button"
              onClick={handleClick}
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
                    src={u.photo_url ?? undefined}  // <-- было src={u.photo_url}
                    size={AVATAR_SIZE}
                    className="relative"
                  />
                </div>
                <div className="col-span-9 min-w-0" style={{ display: "grid", gridTemplateRows: "auto auto" }}>
                  <div
                    className="text-[16px] leading-[18px] font-semibold text-[var(--tg-text-color)] truncate self-start"
                    title={fullName}
                  >
                    {fullName}
                  </div>
                  <div className="text-[11px] leading-[14px] text-[var(--tg-hint-color)] truncate self-end">
                    {formatCountLabel(t, count)}
                  </div>
                </div>
              </div>
            </button>
          )
        })}

        {/* Карточка «Все контакты» (опционально) */}
        <button
          type="button"
          onClick={() => (onOpenAll ? onOpenAll() : navigate("/contacts"))}
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
              <Users size={24} color="#fff" />
            </div>
            <div className="text-[11px] leading-[13px] font-semibold text-[var(--tg-text-color)] uppercase tracking-wide">
              {t("dashboard.all_contacts") || "Все контакты"}
            </div>
          </div>
        </button>
      </div>
    )
  }, [sorted, loading, error, load, period, navigate, onOpenAll, onOpenPartner, t])

  return (
    <div className="rounded-lg border border-[var(--tg-hint-color)] p-1.5 bg-[var(--tg-card-bg)]">
      {header}
      {content}
    </div>
  )
}
