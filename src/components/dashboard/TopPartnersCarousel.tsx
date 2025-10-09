// src/components/dashboard/TopPartnersCarousel.tsx
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../../store/dashboardStore"
import { tSafe } from "../../utils/tSafe"

type Period = "week" | "month" | "year"

function PeriodChip({
  label,
  active,
  onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition
        ${active ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "bg-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)]"}`}
    >
      {label}
    </button>
  )
}

export default function TopPartnersCarousel() {
  const { t } = useTranslation()
  const { period, setPeriod, items, loading } = useDashboardStore((s) => ({
    period: s.ui?.partnersPeriod || "month",
    setPeriod: s.setPartnersPeriod,
    items: s.topPartners || [],
    loading: !!s.loading?.partners,
  }))

  const visible = useMemo(() => items, [items])

  return (
    <div className="w-full">
      <div className="mb-2 flex gap-2">
        <PeriodChip label={tSafe(t, "week", "Неделя")} active={period === "week"} onClick={() => setPeriod("week")} />
        <PeriodChip label={tSafe(t, "month", "Месяц")} active={period === "month"} onClick={() => setPeriod("month")} />
        <PeriodChip label={tSafe(t, "year", "Год")} active={period === "year"} onClick={() => setPeriod("year")} />
      </div>

      <div className="rounded-xl border p-2"
           style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}>
        {loading ? (
          <div className="text-[var(--tg-hint-color)] px-2 py-4">{tSafe(t, "loading", "Загрузка…")}</div>
        ) : visible.length === 0 ? (
          <div className="text-[var(--tg-hint-color)] px-2 py-4">{tSafe(t, "contacts_not_found", "Контакты не найдены")}</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-1" style={{ scrollSnapType: "x mandatory" }}>
            {visible.map((p) => {
              const u = p.user || { id: 0 as number, first_name: "", last_name: "" }
              const name =
                `${String(u.first_name || "").trim()} ${String(u.last_name || "").trim()}`.trim() ||
                String((u as any).username || "") ||
                `#${u.id}`
              return (
                <a
                  key={u.id}
                  href={`/contacts/${u.id}`}
                  className="snap-start inline-flex flex-col items-center shrink-0 w-[48%] min-w-[48%]"
                >
                  <div
                    className="w-full rounded-xl border p-3 hover:shadow transition"
                    style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="relative inline-flex w-12 h-12 rounded-full overflow-hidden border"
                            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
                        {(u as any).photo_url ? (
                          <img
                            src={(u as any).photo_url}
                            alt={name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="w-full h-full bg-[var(--tg-link-color)]" aria-hidden />
                        )}
                      </span>

                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold truncate">{name}</div>
                        <div className="text-[12px] text-[var(--tg-hint-color)]">
                          {tSafe(t, "joint_expense_count", `${p.joint_expense_count} транзакций`)
                            .replace("{{count}}", String(p.joint_expense_count))}
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
