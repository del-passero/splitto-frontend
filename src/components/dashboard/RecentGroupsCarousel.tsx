// src/components/dashboard/RecentGroupsCarousel.tsx
import { useEffect, useMemo, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Users } from "lucide-react"

import GroupAvatar from "../GroupAvatar"
import Avatar from "../Avatar"
import type { GroupMember } from "../../types/group_member"
import { getUserGroups } from "../../api/groupsApi"
import { useUserStore } from "../../store/userStore"

type RecentGroupCard = {
  id: number
  name: string
  avatar_url?: string | null

  // активность
  last_activity_at?: string | null

  // участники (превью)
  preview_members?: GroupMember[]
  members_count?: number
  owner_id?: number
}

// ===== layout consts =====
const AVATAR_SIZE = 62            // ↑ было 56, увеличили ~на 10%
const PARTICIPANT_SIZE = 24
const MAX_ICONS_INLINE = 5        // показываем до 5, если больше — 4 + “+N”
const SLIDE_HEIGHT = 112          // единая высота карточек

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
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<RecentGroupCard[]>([])

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const { items } = await getUserGroups(user.id, {
        limit: 5,
        offset: 0,
        includeHidden: false,
        includeArchived: false,
        includeDeleted: false,
        sortBy: "last_activity",
        sortDir: "desc",
      })
      // На всякий случай — пересортируем по last_activity_at, затем по id
      const sorted: RecentGroupCard[] = [...(items || [])].sort((a: any, b: any) => {
        const ta = a?.last_activity_at ? new Date(a.last_activity_at).getTime() : 0
        const tb = b?.last_activity_at ? new Date(b.last_activity_at).getTime() : 0
        if (tb !== ta) return tb - ta
        return (b?.id || 0) - (a?.id || 0)
      })
      setGroups(sorted.slice(0, 5))
    } catch (e: any) {
      setError(e?.message || "Failed to load recent groups")
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void load()
  }, [load])

  const content = useMemo(() => {
    if (loading) {
      return <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-80">{t("loading")}</div>
    }
    if (error) {
      return (
        <div className="text-[14px] leading-[18px] text-red-500">
          {error}
          <button
            type="button"
            className="ml-3 underline text-[var(--tg-link-color,#2481CC)]"
            onClick={() => load()}
          >
            {t("apply") || "Применить"}
          </button>
        </div>
      )
    }

    if (!groups.length) {
      // Пустое состояние — как EmptyGroups, но в компактной карточке фиксированной высоты
      return (
        <div
          className="h-[112px] rounded-lg border border-[var(--tg-hint-color)] flex items-center justify-center text-center p-3 bg-[var(--tg-card-bg)]"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="mb-2 opacity-60">
              <Users size={56} className="text-[var(--tg-link-color)]" />
            </div>
            <div className="text-[15px] leading-[18px] font-semibold text-[var(--tg-text-color)] mb-1">
              {t("empty_groups")}
            </div>
            <div className="text-[12px] leading-[14px] text-[var(--tg-hint-color)]">
              {t("empty_groups_hint")}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="-mx-1 px-1 flex gap-3 overflow-x-auto snap-x" style={{ WebkitOverflowScrolling: "touch" }}>
        {/* Карточки групп */}
        {groups.map((g) => {
          const members: GroupMember[] = Array.isArray(g.preview_members) ? g.preview_members : []
          const ownerId = typeof g.owner_id === "number" ? g.owner_id : undefined

          // owner — первым
          const membersSorted = members.length
            ? [
                ...members.filter((m) => (ownerId ? m.user?.id === ownerId : false)),
                ...members.filter((m) => (ownerId ? m.user?.id !== ownerId : true)),
              ]
            : []

          const totalCount = typeof g.members_count === "number" ? g.members_count : membersSorted.length
          const showPlus = totalCount > MAX_ICONS_INLINE
          const maxVisible = showPlus ? 4 : Math.min(MAX_ICONS_INLINE, membersSorted.length)
          const displayedMembers = membersSorted.slice(0, maxVisible)
          const hiddenCount = Math.max(0, totalCount - 4)

          const activityText = formatLastActivity(t, g.last_activity_at)

          return (
            <button
              key={g.id}
              type="button"
              onClick={() => navigate(`/groups/${g.id}`)}
              className="
                snap-center shrink-0 min-w-[260px] w-[70%] h-[112px]
                rounded-lg p-1.5 border border-[var(--tg-hint-color)]
                text-left active:scale-[0.99] transition bg-[var(--tg-card-bg)]
              "
              aria-label={g.name}
            >
              {/* ВЫРАВНИВАНИЕ ПО АВАТАРУ:
                  - карта фиксированной высоты SLIDE_HEIGHT,
                  - слева — контейнер AVATAR_SIZE x AVATAR_SIZE по центру,
                  - справа — коробка ровно AVATAR_SIZE по высоте с трёхрядной сеткой:
                    top (название) — к верху,
                    middle (участники) — по центру (self-center),
                    bottom (активность) — к низу.
              */}
              <div className="w-full h-full grid grid-cols-12 gap-2 items-center">
                {/* Левая колонка — аватар в коробке AVATAR_SIZE */}
                <div className="col-span-4 flex items-center justify-center">
                  <div className="flex items-center justify-center" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
                    <GroupAvatar
                      name={g.name}
                      src={g.avatar_url || undefined}
                      size={AVATAR_SIZE}
                      className="relative"
                    />
                  </div>
                </div>

                {/* Правая колонка — коробка ровно AVATAR_SIZE по высоте */}
                <div className="col-span-8 min-w-0 flex items-center">
                  <div
                    className="w-full"
                    style={{
                      height: AVATAR_SIZE,
                      display: "grid",
                      gridTemplateRows: "auto 1fr auto",
                    }}
                  >
                    {/* 1) Название — верх по коробке */}
                    <div className="text-[17px] leading-[18px] font-semibold text-[var(--tg-text-color)] truncate self-start">
                      {g.name}
                    </div>

                    {/* 2) Участники — ровно по центру коробки, выравнивание по левому краю */}
                    <div className="relative flex items-center justify-start min-h-[24px] self-center">
                      {displayedMembers.map((m, idx) => (
                        <div
                          key={m.id}
                          className="rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)]"
                          style={{
                            borderColor: "var(--tg-card-bg)",
                            width: PARTICIPANT_SIZE,
                            height: PARTICIPANT_SIZE,
                            marginLeft: idx > 0 ? -8 : 0,
                            zIndex: 1 + idx,
                          }}
                          title={
                            m.user.first_name
                              ? `${m.user.first_name} ${m.user.last_name || ""}`.trim()
                              : m.user.username || ""
                          }
                        >
                          <Avatar
                            name={
                              m.user.first_name
                                ? `${m.user.first_name} ${m.user.last_name || ""}`.trim()
                                : m.user.username || ""
                            }
                            src={m.user.photo_url}
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

                    {/* 3) Активность — низ по коробке */}
                    <div
                      className="text-[11px] leading-[14px] text-[var(--tg-hint-color)] truncate self-end"
                      title={activityText}
                    >
                      {activityText}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}

        {/* Последняя — “Все группы”: динамическая ширина под текст, фиксированная высота */}
        <button
          type="button"
          onClick={() => navigate("/groups")}
          className="
            snap-center shrink-0 h-[112px] px-4
            rounded-lg border border-[var(--tg-hint-color)]
            flex items-center justify-center
            active:scale-[0.98] transition bg-[var(--tg-card-bg)]
          "
          aria-label={t("dashboard.all_groups")}
        >
          <div className="flex flex-col items-center justify-center">
            <div
              className="rounded-full w-[48px] h-[48px] flex items-center justify-center mb-2"
              style={{ background: "var(--tg-accent-color,#40A7E3)" }}
            >
              <Users size={24} color="#fff" />
            </div>
            <div className="text-[11px] leading-[13px] font-semibold text-[var(--tg-text-color)] uppercase tracking-wide">
              {t("dashboard.all_groups")}
            </div>
          </div>
        </button>
      </div>
    )
  }, [loading, error, groups, navigate, t, load])

  return (
    <div className="rounded-2xl border border-[var(--tg-hint-color)] p-3 bg-[var(--tg-card-bg)]">
      <div
        className="mb-2 font-semibold"
        style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
      >
        {t("dashboard.recent_groups")}
      </div>

      {content}
    </div>
  )
}
