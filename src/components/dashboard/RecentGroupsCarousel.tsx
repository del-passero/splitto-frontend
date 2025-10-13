// src/components/dashboard/RecentGroupsCarousel.tsx
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"
import { useNavigate } from "react-router-dom"

import CardSection from "../CardSection"
import Avatar from "../Avatar"
import { useDashboardStore } from "../../store/dashboardStore"

/* ===== helpers ===== */

function formatLastActivity(t: (k: string, o?: any) => string, iso?: string | null): string {
  if (!iso) return t("last_activity_inactive") || "Неактивна"
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return `${t("last_activity_label")} ${t("last_activity_today")}`
    if (diffDays === 1) return `${t("last_activity_label")} ${t("last_activity_yesterday")}`
    return `${t("last_activity_label")} ${t("last_activity_days_ago", { count: diffDays })}`
  } catch {
    return t("last_activity_inactive") || "Неактивна"
  }
}

const PARTICIPANT_SIZE = 24
const MAX_INLINE = 5 // показываем 4 + "+N" при >5
const TILE_HEIGHT = 120 // визуально совпадает с мини-карточкой группы

// Достаём превью участников в едином формате (массив user-объектов)
function getPreviewUsers(g: any): Array<any> {
  const raw = Array.isArray(g?.members) ? g.members : Array.isArray(g?.preview_members) ? g.preview_members : []
  // элементы могут быть либо GroupMember { user: {...} }, либо уже user
  const users = raw
    .map((m: any) => (m && typeof m === "object" && "user" in m ? (m as any).user : m))
    .filter(Boolean)
  return users
}

// Владелец первым (если owner_id/owner.id известны)
function sortOwnerFirst(users: any[], ownerId?: number) {
  if (!ownerId || !users.length) return users
  const own = Number(ownerId)
  return [
    ...users.filter((u) => Number((u as any)?.id) === own),
    ...users.filter((u) => Number((u as any)?.id) !== own),
  ]
}

// Вычисление даты активности с фоллбэками
function getActivityIso(g: any): string | undefined {
  return g?.last_activity_at || g?.last_activity || g?.updated_at || g?.created_at
}

export default function RecentGroupsCarousel() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const groupsRaw = useDashboardStore((s) => s.groups)
  const loading = useDashboardStore((s) => s.loading.groups)
  const error = useDashboardStore((s) => s.error.groups || null)
  const refresh = useDashboardStore((s) => s.loadRecentGroups)

  // первичная загрузка: просим 5 последних
  useEffect(() => {
    if (!Array.isArray(groupsRaw) || groupsRaw.length === 0) void refresh(5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Страхуемся сортировкой по "самой свежей" дате активности
  const groups = useMemo(() => {
    const arr = Array.isArray(groupsRaw) ? [...groupsRaw] : []
    arr.sort((a: any, b: any) => {
      const ta = getActivityIso(a) ? new Date(getActivityIso(a)!).getTime() : 0
      const tb = getActivityIso(b) ? new Date(getActivityIso(b)!).getTime() : 0
      return tb - ta
    })
    return arr.slice(0, 5)
  }, [groupsRaw])

  return (
    <CardSection noPadding>
      <div
        className="rounded-2xl border p-3 bg-[var(--tg-card-bg)]"
        style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
      >
        {/* заголовок — как у DashboardBalanceCard */}
        <div
          className="mb-2 font-semibold"
          style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
        >
          {t("dashboard.recent_groups")}
        </div>

        {/* Состояния */}
        {loading && (
          <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-80">
            {t("loading")}
          </div>
        )}
        {!loading && error && (
          <div className="text-[14px] leading-[18px] text-red-500">
            {String(error)}
          </div>
        )}

        {!loading && !error && (
          <>
            {groups.length === 0 ? (
              // Пустое состояние — без кнопки перехода
              <div
                className="rounded-2xl border p-6 text-center"
                style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
              >
                <div className="text-3xl mb-2">🎉</div>
                <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                  {t("recent_groups_empty_title")}
                </div>
                <div className="text-[13px] opacity-80" style={{ color: "var(--tg-hint-color)" }}>
                  {t("recent_groups_empty_desc")}
                </div>
              </div>
            ) : (
              <div
                className="flex gap-3 overflow-x-auto snap-x -mx-1 px-1"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {/* Карточки групп */}
                {groups.map((g: any) => {
                  const ownerId: number | undefined =
                    typeof g?.owner_id === "number"
                      ? g.owner_id
                      : typeof g?.owner?.id === "number"
                      ? g.owner.id
                      : undefined

                  const usersRaw = getPreviewUsers(g)
                  const users = sortOwnerFirst(usersRaw, ownerId)

                  const totalCount =
                    typeof g?.members_count === "number" ? g.members_count : users.length
                  const showPlus = totalCount > MAX_INLINE
                  const maxVisible = showPlus ? 4 : Math.min(MAX_INLINE, users.length)
                  const displayed = users.slice(0, maxVisible)
                  const hiddenCount = Math.max(0, totalCount - 4)

                  const activityText = formatLastActivity(t, getActivityIso(g))

                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => navigate(`/groups/${g.id}`)}
                      className="snap-center shrink-0 w-[68%] min-w-[240px] rounded-2xl p-3 border bg-[var(--tg-card-bg)] text-left active:scale-[0.99] transition"
                      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", height: TILE_HEIGHT }}
                      aria-label={g?.name}
                    >
                      {/* Название */}
                      <div className="text-[15px] font-semibold text-[var(--tg-text-color)] truncate mb-2">
                        {g.name}
                      </div>

                      {/* Участники 4 + N */}
                      <div className="relative flex items-center mb-2">
                        {displayed.map((u: any, idx: number) => (
                          <div
                            key={u?.id ?? idx}
                            className="rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)]"
                            style={{
                              borderColor: "var(--tg-card-bg)",
                              width: PARTICIPANT_SIZE,
                              height: PARTICIPANT_SIZE,
                              marginLeft: idx > 0 ? -8 : 0,
                              zIndex: 1 + idx,
                            }}
                            title={
                              u?.first_name
                                ? `${u.first_name} ${u.last_name || ""}`.trim()
                                : u?.username || ""
                            }
                          >
                            <Avatar
                              name={
                                u?.first_name
                                  ? `${u.first_name} ${u.last_name || ""}`.trim()
                                  : u?.username || ""
                              }
                              src={u?.photo_url}
                              size={PARTICIPANT_SIZE}
                            />
                          </div>
                        ))}

                        {showPlus && hiddenCount > 0 && (
                          <div
                            className="ml-[-8px] rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)] text-[11px] text-[var(--tg-hint-color)]"
                            style={{
                              borderColor: "var(--tg-card-bg)",
                              width: PARTICIPANT_SIZE,
                              height: PARTICIPANT_SIZE,
                              zIndex: 1 + maxVisible,
                            }}
                            title={`+${hiddenCount}`}
                          >
                            +{hiddenCount}
                          </div>
                        )}
                      </div>

                      {/* Активность */}
                      <div
                        className="text-[11px] leading-[14px] text-[var(--tg-hint-color)] truncate"
                        title={activityText}
                      >
                        {activityText}
                      </div>
                    </button>
                  )
                })}

                {/* Квадрат «Все группы» — высота = как у карточек */}
                <button
                  type="button"
                  onClick={() => navigate("/groups")}
                  className="snap-center shrink-0 rounded-2xl p-3 border flex items-center justify-center active:scale-95 transition"
                  style={{
                    borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                    background: "var(--tg-card-bg)",
                    height: TILE_HEIGHT,
                    aspectRatio: "1 / 1",
                  }}
                  aria-label={t("all_groups") as string}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users size={22} className="opacity-90" />
                    <div className="text-[12px] font-semibold text-[var(--tg-text-color)] opacity-90">
                      {t("all_groups")}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </CardSection>
  )
}


