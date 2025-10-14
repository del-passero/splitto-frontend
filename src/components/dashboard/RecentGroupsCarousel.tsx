// src/components/dashboard/RecentGroupsCarousel.tsx
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"
import CardSection from "../CardSection"
import GroupAvatar from "../GroupAvatar"
import Avatar from "../Avatar"
import { useDashboardStore } from "../../store/dashboardStore"

type UserMini = {
  id?: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

type PreviewMember = {
  id: number
  user: UserMini
}

type RecentGroupCard = {
  id: number
  name: string
  avatar_url?: string | null
  preview_members?: PreviewMember[]
  members_count?: number
  last_activity_at?: string | null
}

/* === helpers === */

const AVATAR_MAIN = 56       // левый квадратный аватар группы
const AVATAR_PARTICIPANT = 24 // маленькие аватарки участников (как в GroupCard)
const MAX_ICONS_INLINE = 5    // как в GroupCard: показываем 4 + "+N"
const SLIDE_MIN_W = 240       // минимальная ширина карточки
const SLIDE_GAP_X = 12        // gap между слайдами в px

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

export default function RecentGroupsCarousel() {
  const { t } = useTranslation()

  // берём недавние группы из dashboardStore
  const groupsRaw = useDashboardStore((s) => s.groups) as RecentGroupCard[] | undefined
  const loading = useDashboardStore((s) => s.loading.groups)
  const error = useDashboardStore((s) => s.error.groups || null)
  const refresh = useDashboardStore((s) => s.loadRecentGroups)

  // первичная подгрузка (как раньше)
  useEffect(() => {
    if (!groupsRaw) void refresh(10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const groups = useMemo<RecentGroupCard[]>(() => groupsRaw ?? [], [groupsRaw])

  /* === ВЕРХНЯЯ РАМКА КОМПОНЕНТА (как у GroupCard по цвету) === */
  return (
    <CardSection noPadding>
      <div
        className="rounded-2xl border bg-[var(--tg-card-bg)]"
        style={{ borderColor: "var(--tg-hint-color)" }} // как у GroupCard
      >
        {/* Заголовок — тот же стиль, что и на карточке баланса */}
        <div
          className="px-3 pt-3 pb-1 font-semibold"
          style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
        >
          {t("dashboard.recent_groups")}
        </div>

        {/* Содержимое */}
        <div className="px-2 pb-2">
          {/* Ошибка */}
          {error && !loading && (
            <div className="px-1 py-2 text-[14px] leading-[18px] text-red-500">
              {String(error)}
              <button
                type="button"
                onClick={() => refresh(10)}
                className="ml-3 underline text-[var(--tg-link-color)]"
              >
                {t("retry") || "Повторить"}
              </button>
            </div>
          )}

          {/* Лоадер */}
          {loading && (
            <div className="px-1 py-3 text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-80">
              {t("loading")}
            </div>
          )}

          {/* Пустое состояние — компактно, но как EmptyGroups по стилю */}
          {!loading && !error && groups.length === 0 && (
            <div
              className="flex items-center justify-center"
              style={{ height: 112 }} // оставляем общую высоту карусели
            >
              <div className="flex flex-col items-center justify-center">
                <div className="mb-3 opacity-60">
                  <Users size={48} className="text-[var(--tg-link-color)]" />
                </div>
                <div className="text-[15px] font-semibold mb-1 text-[var(--tg-text-color)]">
                  {t("empty_groups")}
                </div>
                <div className="text-[12px] leading-[14px] text-[var(--tg-hint-color)] text-center max-w-[520px]">
                  {t("empty_groups_hint")}
                </div>
              </div>
            </div>
          )}

          {/* Карусель */}
          {!loading && !error && groups.length > 0 && (
            <div
              className="flex overflow-x-auto snap-x"
              style={{ gap: SLIDE_GAP_X, WebkitOverflowScrolling: "touch" }}
            >
              {groups.map((g) => {
                // участники: как в GroupCard — owner первым, затем остальные
                const members: PreviewMember[] = Array.isArray(g.preview_members) ? g.preview_members : []
                const ownerId =
                  typeof (g as any)?.owner_id === "number"
                    ? (g as any).owner_id
                    : (g as any)?.owner?.id

                const membersSorted = useMemo(() => {
                  if (!members.length) return []
                  const own = typeof ownerId === "number" ? ownerId : undefined
                  return [
                    ...members.filter((m) => (own ? m.user?.id === own : false)),
                    ...members.filter((m) => (own ? m.user?.id !== own : true)),
                  ]
                }, [members, ownerId])

                const totalCount =
                  typeof g.members_count === "number" ? g.members_count : membersSorted.length
                const showPlus = totalCount > MAX_ICONS_INLINE
                const maxVisible = showPlus ? 4 : Math.min(MAX_ICONS_INLINE, membersSorted.length)
                const displayedMembers = membersSorted.slice(0, maxVisible)
                const hiddenCount = Math.max(0, totalCount - 4) // "+N" поверх 4-го

                const activityText = formatLastActivity(t, g.last_activity_at)

                return (
                  <div
                    key={g.id}
                    className="snap-center shrink-0"
                    style={{ minWidth: SLIDE_MIN_W, width: "70%" }}
                  >
                    <div
                      className="
                        h-full w-full rounded-2xl border bg-[var(--tg-card-bg)]
                        px-3 py-1.5
                      "
                      style={{ borderColor: "var(--tg-hint-color)" }} // как у GroupCard
                    >
                      <div className="grid grid-cols-12 items-center gap-2">
                        {/* левый аватар */}
                        <div className="col-span-3 min-w-0">
                          <GroupAvatar
                            name={g.name}
                            src={g.avatar_url || undefined}
                            size={AVATAR_MAIN}
                          />
                        </div>

                        {/* правая колонка — поджатые вертикальные отступы */}
                        <div className="col-span-9 min-w-0 flex flex-col gap-1">
                          {/* 1: название */}
                          <div className="text-[15px] leading-[18px] font-semibold text-[var(--tg-text-color)] truncate">
                            {g.name}
                          </div>

                          {/* 2: превью участников (4 аватарки + “+N”) */}
                          <div className="min-w-0">
                            {displayedMembers.length > 0 ? (
                              <div className="relative flex items-center justify-start">
                                {displayedMembers.map((m, idx) => (
                                  <div
                                    key={m.id}
                                    className="rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)]"
                                    style={{
                                      borderColor: "var(--tg-card-bg)",
                                      width: AVATAR_PARTICIPANT,
                                      height: AVATAR_PARTICIPANT,
                                      marginLeft: idx > 0 ? -8 : 0,
                                      zIndex: 1 + idx,
                                    }}
                                    title={
                                      m.user?.first_name
                                        ? `${m.user.first_name} ${m.user.last_name || ""}`.trim()
                                        : m.user?.username || ""
                                    }
                                  >
                                    <Avatar
                                      name={
                                        m.user?.first_name
                                          ? `${m.user.first_name} ${m.user.last_name || ""}`.trim()
                                          : m.user?.username || ""
                                      }
                                      src={m.user?.photo_url}
                                      size={AVATAR_PARTICIPANT}
                                    />
                                  </div>
                                ))}
                                {showPlus && hiddenCount > 0 && (
                                  <div
                                    className="ml-[-8px] rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)] text-[11px] text-[var(--tg-hint-color)]"
                                    style={{
                                      borderColor: "var(--tg-card-bg)",
                                      width: AVATAR_PARTICIPANT,
                                      height: AVATAR_PARTICIPANT,
                                      zIndex: 1 + maxVisible,
                                    }}
                                    title={`+${hiddenCount}`}
                                  >
                                    +{hiddenCount}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-[24px]" /> // резерв высоты, если нет данных
                            )}
                          </div>

                          {/* 3: активность (одна строка) */}
                          <div
                            className="text-[11px] leading-[13px] text-[var(--tg-hint-color)] truncate"
                            title={activityText}
                          >
                            {activityText}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Квадратная карточка «Все группы» — та же высота, строго квадрат */}
              <div
                className="snap-center shrink-0"
                style={{ minWidth: SLIDE_MIN_W / 1.6, width: "40%" }}
              >
                <div
                  className="
                    rounded-2xl border bg-[var(--tg-card-bg)]
                    flex items-center justify-center
                  "
                  style={{ borderColor: "var(--tg-hint-color)", height: 112 }}
                >
                  <button
                    type="button"
                    onClick={() => (window.location.href = "/groups")}
                    className="
                      flex flex-col items-center justify-center
                      active:scale-95 transition
                    "
                    aria-label={t("groups") || "Группы"}
                  >
                    <div
                      className="
                        rounded-full flex items-center justify-center
                        bg-[var(--tg-accent-color,#40A7E3)] text-white
                      "
                      style={{ width: 44, height: 44 }}
                    >
                      <Users size={22} />
                    </div>
                    <div className="mt-2 text-[11px] leading-[13px] text-[var(--tg-text-color)] opacity-80">
                      {t("all_groups") || "ВСЕ ГРУППЫ"}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CardSection>
  )
}
