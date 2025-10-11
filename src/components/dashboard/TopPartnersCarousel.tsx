import { useEffect } from "react"
import { useDashboardStore } from "../../store/dashboardStore"
import SafeSection from "../SafeSection"

type Period = "day" | "week" | "month" | "year"

// Заглушка для твоих чипов периода
function PeriodChips({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  return (
    <div className="flex gap-1">
      {(["week", "month", "year"] as Period[]).map((p) => (
        <button
          key={p}
          className={`px-2 py-1 rounded ${value === p ? "bg-white/10" : "bg-white/5"}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

export default function TopPartnersCarousel() {
  const period = useDashboardStore((s) => s.frequentPeriod)
  const setStorePeriod = useDashboardStore((s) => s.setFrequentPeriod)
  const itemsRaw = useDashboardStore((s) => s.frequentUsers)
  const loading = useDashboardStore((s) => s.loading.frequent)
  const error = useDashboardStore((s) => s.error.frequent || null)
  const load = useDashboardStore((s) => s.loadTopPartners)

  useEffect(() => {
    if (!itemsRaw) void load(period)
  }, []) // eslint-disable-line

  const handleChange = (v: Period) => {
    if (v === "day") return
    setStorePeriod(v)
    void load(v)
  }

  const items = itemsRaw ?? []

  return (
    <SafeSection
      fullWidth
      title="Часто делю расходы"
      controls={<PeriodChips value={period as Period} onChange={handleChange} />}
      loading={loading}
      error={error}
      onRetry={() => load(period)}
    >
      <div className="flex gap-3 overflow-x-auto snap-x">
        {items.map((p) => (
          <div
            key={p.user.id}
            className="snap-center shrink-0 w-[45%] min-w-[260px] rounded-2xl p-3 bg-white/5 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {p.user.photo_url ? (
                <img
                  src={p.user.photo_url}
                  className="w-12 h-12 rounded-full object-cover"
                  alt={p.user.first_name || p.user.username || "User"}
                />
              ) : (
                <div className="w-12 h-12 rounded-full grid place-items-center bg-white/10">
                  {(p.user.first_name || p.user.username || "?")[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div>
                <div className="font-medium">
                  {(p.user.first_name || "") + " " + (p.user.last_name || "") || p.user.username || "—"}
                </div>
                <div className="text-xs opacity-70">
                  {p.joint_expense_count} совместных расход(а/ов)
                </div>
              </div>
            </div>
          </div>
        ))}
        {!items.length && !loading && <div className="opacity-60 text-sm">Нет данных</div>}
      </div>
    </SafeSection>
  )
}
