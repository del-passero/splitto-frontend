import { useEffect } from "react"
import { useDashboardStore } from "../../store/dashboardStore"
import SafeSection from "../SafeSection"

export default function RecentGroupsCarousel() {
  const groupsRaw = useDashboardStore((s) => s.groups)
  const loading = useDashboardStore((s) => s.loading.groups)
  const error = useDashboardStore((s) => s.error.groups || null)
  const refresh = useDashboardStore((s) => s.loadRecentGroups)

  useEffect(() => {
    if (!groupsRaw) void refresh()
  }, []) // eslint-disable-line

  const groups = groupsRaw ?? []

  return (
    <SafeSection
      title="Недавние группы"
      loading={loading}
      error={error}
      onRetry={() => refresh()}
      fullWidth
    >
      <div className="flex gap-3 overflow-x-auto snap-x">
        {groups.map((g) => (
          <div key={g.id} className="snap-center shrink-0 w-[70%] min-w-[260px] rounded-2xl p-3 bg-white/5">
            <div className="font-medium">{g.name}</div>
            <div className="text-xs opacity-70">
              {Object.entries(g.my_balance_by_currency)
                .map(([ccy, v]) => `${v} ${ccy}`)
                .join(" · ")}
            </div>
          </div>
        ))}
        {!groups.length && !loading && <div className="opacity-60 text-sm">Нет групп</div>}
      </div>
    </SafeSection>
  )
}
