// src/components/dashboard/RecentGroupsCarousel.tsx
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"

import CardSection from "../CardSection"
import GroupAvatar from "../GroupAvatar"
import Avatar from "../Avatar"
import { useDashboardStore } from "../../store/dashboardStore"

/* ====== helpers ====== */

// Активность — ровно как на GroupCard (с ключами last_activity_*)
function formatLastActivity(t: (k: string, o?: any) => string, iso?: string | null): string {
  if (!iso) return t("last_activity_inactive") || "Активности не было"
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return `${t("last_activity_label")} ${t("last_activity_today")}`
    if (diffDays === 1) return `${t("last_activity_label")} ${t("last_activity_yesterday")}`
    return `${t("last_activity_label")} ${t("last_activity_days_ago", { count: diffDays })}`
  } catch {
    return t("last_activity_inactive") || "Активности не было"
  }
}

// Достаём массив участников из разных форматов ответа (members | preview_members)
function extractMembers(g: any): Array<{ id?: number; user?: any }> {
  const raw = Array.isArray(g?.members)
    ? g.members
    : Array.isArray(g?.preview_members)
    ? g.preview_members
    : []
  // Приводим к унифицированному виду: { id, user }
  return raw.map((m: any) =>
    m && typeof m === "object"
      ? ("user" in m ? m : { user: m })
      : { user: undefined }
  )
}

/* ====== UI consts (поджали вертикаль без изменения размера аватара группы) ====== */
const CARD_AVATAR_SIZE = 56         // слева квадрат — как на мини-карточке группы
const MEMBER_AVA_SIZE = 24          // иконки участников справа (с оверлапом)
const MAX_ICONS_INLINE = 5          // показываем до 5 (или 4 + “+N”)
const SLIDE_MIN_W = 260             // ширина карточки
const SLIDE_H = 104                 // общая высота ряда (поджато; было ~112)

/* ====== Component ====== */
export default function RecentGroupsCarousel() {
  const { t } = useTranslation()

  // Берём данные из dashboardStore
  const groupsRaw = useDashboardStore((s) => s.groups)
  const loading   = useDashboardStore((s) => s.loading.groups)
  const error     = useDashboardStore((s) => s.error.groups || null)
  const refresh   = useDashboardStore((s) => s.loadRecentGroups)

  // Первичная загрузка (если стор пустой)
  useEffect(() => {
    if (!Array.isArray(groupsRaw) || groupsRaw.length === 0) {
      void refresh(5)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Нормализуем и сортируем по активности убыванию
  const groups = useMemo(() => {
    const arr = Array.isArray(groupsRaw) ? (groupsRaw as any[]) : []
    return [...arr]
      .map((g) => {
        const ts =
          (g?.last_activity_at && Date.parse(g.last_activity_at)) ||
          (g?.updated_at && Date.parse(g.updated_at)) ||
          (g?.created_at && Date.parse(g.created_at)) ||
          0
        return { ...g, __ts: isFinite(ts) ? ts : 0 }
      })
      .sort((a, b) => b.__ts - a.__ts)
      .slice(0, 5)
  }, [groupsRaw])

  /* ====== Empty state ====== */
  if (!loading && !error && groups.length === 0) {
    return (
      <CardSection noPadding>
        <div className="rounded-2xl border bg-[var(--tg-card-bg)] p-3"
             style={{ borderColor: "var(--tg-hint-color)" }}>
          {/* Заголовок секции — как в DashboardBalanceCard */}
          <div
            className="mb-2 font-semibold"
            style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
          >
            {t("dashboard.recent_groups")}
          </div>

          {/* Пустое состояние в стиле EmptyGroups (без кнопки) */}
          <div
            className="flex items-center justify-center"
            style={{ height: SLIDE_H }}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="mb-3 opacity-60">
                <Users size={56} className="text-[var(--tg-link-color)]" />
              </div>
              <div className="text-[15px] font-semibold mb-1 text-[var(--tg-text-color)]">
                {t("empty_groups")}
              </div>
              <div className="text-[13px] text-[var(--tg-hint-color)] text-center">
                {t("empty_groups_hint")}
              </div>
            </div>
          </div>
        </div>
      </CardSection>
    )
  }

  return (
    <CardSection noPadding>
      <div className="rounded-2xl border bg-[var(--tg-card-bg)] p-3"
           style={{ borderColor: "var(--tg-hint-color)" }}>
        {/* Заголовок секции — как у карточки баланса */}
        <div
          className="mb-2 font-semibold"
          style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
        >
          {t("dashboard.recent_groups")}
        </div>

        {/* Карусель */}
        <div className="flex gap-3 overflow-x-auto snap-x"
             style={{ WebkitOverflowScrolling: "touch" }}>
          {/* Карточки групп */}
          {groups.map((g: any) => {
            const members = extractMembers(g)

            // владельца ставим первым, как в GroupCard
            const ownerId: number | undefined =
              typeof g?.owner_id === "number" ? g.owner_id : (g?.owner?.id as number | undefined)

            const membersSorted = ownerId
              ? [
                  ...members.filter((m) => (m?.user?.id ? m.user.id === ownerId : false)),
                  ...members.filter((m) => (m?.user?.id ? m.user.id !== ownerId : true)),
                ]
              : members

            // логика 4 + “+N”
            const totalCount =
              typeof g?.members_count === "number" ? g.members_count : membersSorted.length
            const showPlus = totalCount > MAX_ICONS_INLINE
            const maxVisible = showPlus ? 4 : Math.min(MAX_ICONS_INLINE, membersSorted.length)
            const displayedMembers = membersSorted.slice(0, maxVisible)
            const hiddenCount = Math.max(0, totalCount - 4)

            const activityText = formatLastActivity(t, g?.last_activity_at || g?.updated_at || g?.created_at)

            return (
              <div
                key={g.id ?? `${g.name}-${g.__ts}`}
                className="snap-start shrink-0"
                style={{ minWidth: SLIDE_MIN_W, width: "70%" }}
              >
                <div
                  className="
                    h-full
                    rounded-lg border bg-[var(--tg-card-bg)]
                    shadow-[0_4px_18px_-10px_rgba(83,147,231,0.14)]
                    hover:shadow-[0_10px_28px_-12px_rgba(83,147,231,0.20)]
                    transition
                  "
                  style={{
                    borderColor: "var(--tg-hint-color)",
                    height: SLIDE_H,
                  }}
                >
                  <div className="flex h-full items-stretch gap-2 p-2">
                    {/* Левая колонка — квадратный аватар группы */}
                    <div className="flex-shrink-0">
                      <GroupAvatar
                        name={g?.name}
                        src={g?.avatar_url || undefined}
                        size={CARD_AVATAR_SIZE}
                        className="relative"
                      />
                    </div>

                    {/* Правая колонка — три строки, поджаты line-height и отступы */}
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      {/* 1. Название */}
                      <div className="text-[15px] leading-[18px] font-semibold text-[var(--tg-text-color)] truncate">
                        {g?.name}
                      </div>

                      {/* 2. Участники (4 + “+N”), как в GroupCard */}
                      <div className="min-w-0">
                        <div className="relative flex items-center">
                          {displayedMembers.map((m, idx) => {
                            const u = m?.user || {}
                            return (
                              <div
                                key={`m-${g.id}-${u.id || idx}`}
                                className="rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)]"
                                style={{
                                  borderColor: "var(--tg-card-bg)",
                                  width: MEMBER_AVA_SIZE,
                                  height: MEMBER_AVA_SIZE,
                                  marginLeft: idx > 0 ? -8 : 0,
                                  zIndex: 1 + idx,
                                }}
                                title={
                                  u.first_name
                                    ? `${u.first_name} ${u.last_name || ""}`.trim()
                                    : u.username || ""
                                }
                              >
                                <Avatar
                                  name={
                                    u.first_name
                                      ? `${u.first_name} ${u.last_name || ""}`.trim()
                                      : u.username || ""
                                  }
                                  src={u.photo_url}
                                  size={MEMBER_AVA_SIZE}
                                />
                              </div>
                            )
                          })}

                          {showPlus && hiddenCount > 0 && (
                            <div
                              className="ml-[-8px] rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)] text-[11px] text-[var(--tg-hint-color)]"
                              style={{
                                borderColor: "var(--tg-card-bg)",
                                width: MEMBER_AVA_SIZE,
                                height: MEMBER_AVA_SIZE,
                                zIndex: 1 + maxVisible,
                              }}
                              title={t("and_more_members", { count: hiddenCount }) || `+${hiddenCount}`}
                            >
                              +{hiddenCount}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Активность */}
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

          {/* Последний слайд — «ВСЕ ГРУППЫ» (строго квадрат по высоте карточек) */}
          <div className="snap-start shrink-0" style={{ minWidth: SLIDE_MIN_W, width: "70%" }}>
            <div
              className="
                rounded-lg border bg-[var(--tg-card-bg)]
                flex items-center justify-center
                shadow-[0_4px_18px_-10px_rgba(83,147,231,0.14)]
                hover:shadow-[0_10px_28px_-12px_rgba(83,147,231,0.20)]
                transition
              "
              style={{ borderColor: "var(--tg-hint-color)", height: SLIDE_H }}
            >
              <button
                type="button"
                className="flex items-center justify-center flex-col active:scale-95 transition"
                onClick={() => {
                  // переход на страницу всех групп
                  try {
                    // если роутер в проекте, лучше: navigate('/groups')
                    window.history.pushState({}, "", "/groups")
                    window.dispatchEvent(new PopStateEvent("popstate"))
                  } catch {
                    window.location.href = "/groups"
                  }
                }}
                aria-label={t("dashboard_all_groups") || "Все группы"}
              >
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    background: "var(--tg-accent-color,#40A7E3)",
                    color: "white",
                  }}
                >
                  <Users size={24} />
                </div>
                <div className="mt-2 text-[11px] leading-[13px] text-[var(--tg-text-color)] opacity-80">
                  {t("dashboard_all_groups")}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Ошибка (если есть) — компактно под каруселью */}
        {error && (
          <div className="mt-2 text-[13px] text-red-500">
            {String(error)}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => refresh(5)}
            >
              {t("apply") || "Повторить"}
            </button>
          </div>
        )}
      </div>
    </CardSection>
  )
}
