// src/components/dashboard/RecentGroupsCarousel.tsx
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../../store/dashboardStore"
import { tSafe } from "../../utils/tSafe"

export default function RecentGroupsCarousel() {
  const { t } = useTranslation()
  const { groups, loading } = useDashboardStore((s) => ({
    groups: s.recentGroups || [],
    loading: !!s.loading?.recentGroups,
  }))

  if (loading) return <div className="text-[var(--tg-hint-color)] px-2 py-4">{tSafe(t, "loading", "Загрузка…")}</div>
  if (!groups.length) return <div className="text-[var(--tg-hint-color)] px-2 py-4">{tSafe(t, "groups_not_found", "Группы не найдены")}</div>

  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-1" style={{ scrollSnapType: "x mandatory" }}>
      {groups.map((g) => (
        <a key={g.id} href={`/groups/${g.id}`} className="snap-start inline-flex flex-col shrink-0 w-[72%] min-w-[72%]">
          <div
            className="w-full rounded-xl border p-3 hover:shadow transition"
            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="relative inline-flex w-12 h-12 rounded-xl overflow-hidden border"
                style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
              >
                {g.avatar_url ? (
                  <img src={g.avatar_url} alt={String(g.name)} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="w-full h-full bg-[var(--tg-link-color)]" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold truncate">{String(g.name || "")}</div>
                {g.last_event_at && (
                  <div className="text-[12px] text-[var(--tg-hint-color)]">{new Date(g.last_event_at).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
