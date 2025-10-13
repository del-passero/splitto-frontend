// src/components/dashboard/RecentGroupsCarousel.tsx
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Users } from "lucide-react"

import CardSection from "../CardSection"
import { useDashboardStore } from "../../store/dashboardStore"
import GroupAvatar from "../GroupAvatar"
import Avatar from "../Avatar"

// ===== helpers =====
function bestActivityTs(g: any): number | null {
  // пробуем разные поля, чтобы не промахнуться со схемой ответа
  const candidates = [
    g?.last_activity_at,
    g?.lastActivityAt,
    g?.last_activity,
    g?.lastActivity,
    g?.activity_at,
    g?.updated_at,
    g?.created_at,
  ].filter(Boolean)

  for (const iso of candidates) {
    const ts = Date.parse(String(iso))
    if (!Number.isNaN(ts)) return ts
  }
  return null
}

function formatLastActivity(t: (k: string, o?: any) => string, tsOrIso?: number | string | null): string {
  if (!tsOrIso) return t("last_activity_inactive") || "Неактивна"
  const ts =
    typeof tsOrIso === "number"
      ? tsOrIso
      : (() => {
          const parsed = Date.parse(String(tsOrIso))
          return Number.isNaN(parsed) ? NaN : parsed
        })()
  if (Number.isNaN(ts)) return t("last_activity_inactive") || "Неактивна"

  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return `${t("last_activity_label")} ${t("last_activity_today")}`
  if (diffDays === 1) return `${t("last_activity_label")} ${t("last_activity_yesterday")}`
  return `${t("last_activity_label")} ${t("last_activity_days_ago", { count: diffDays })}`
}

const PARTICIPANT_SIZE = 24
const MAX_ICONS_INLINE = 5 // если >5: показываем 4 + “+N”

export default function RecentGroupsCarousel() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const groupsRaw = useDashboardStore((s) => s.groups)
  const loading = useDashboardStore((s) => s.loading.groups)
  const error = useDashboardStore((s) => s.error.groups || null)
  const refresh = useDashboardStore((s) => s.loadRecentGroups)

  // первичная подгрузка, если стора ещё нет
  useEffect(() => {
    if (!groupsRaw) void refresh(10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const groups = useMemo(() => {
    const arr = Array.isArray(groupsRaw) ? groupsRaw.slice() : []
    // сортируем по «лучшей оценке» последней активности (desc)
    arr.sort((a: any, b: any) => {
      const ta = bestActivityTs(a)
      const tb = bestActivityTs(b)
      if (ta === null && tb === null) return 0
      if (ta === null) return 1
      if (tb === null) return -1
      return tb - ta
    })
    return arr.slice(0, 5) // пять последних
  }, [groupsRaw])

  // ==== содержимое =====
  return (
    <CardSection noPadding>
      {/* Внутренняя рамка со скруглением + заголовок как у DashboardBalanceCard */}
      <div
        className="rounded-2xl border p-3 bg-[var(--tg-card-bg)]"
        style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
      >
        <div
          className="mb-2 font-semibold"
          style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}
        >
          {t("dashboard.recent_groups")}
        </div>

        {/* error */}
        {error ? (
          <div className="text-center">
            <div className="text-red-500 text-sm mb-2">{String(error)}</div>
            <button
              type="button"
              onClick={() => refresh(10)}
              className="h-9 px-3 rounded-xl font-semibold active:scale-95 transition text-white"
              style={{ background: "var(--tg-accent-color,#40A7E3)" }}
            >
              {t("apply") || "Применить"}
            </button>
          </div>
        ) : loading && (!groupsRaw || groupsRaw.length === 0) ? (
          <div className="text-center text-[var(--tg-hint-color)] text-sm">{t("loading")}</div>
        ) : !loading && (!groups || groups.length === 0) ? (
          // пустое состояние
          <div className="w-full">
            <div
              className="rounded-2xl border p-6 text-center mx-auto bg-[var(--tg-card-bg)]"
              style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", maxWidth: 520 }}
            >
              <div className="flex justify-center mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "var(--tg-accent-color,#40A7E3)" }}
                >
                  <Users size={24} color="#fff" />
                </div>
              </div>
              <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                {t("recent_groups_empty_title")}
              </div>
              <div className="text-[13px] opacity-80 mb-3" style={{ color: "var(--tg-hint-color)" }}>
                {t("recent_groups_empty_desc")}
              </div>
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => navigate("/groups")}
                  className="h-10 px-4 rounded-xl text-white font-semibold active:scale-95 transition"
                  style={{ background: "var(--tg-accent-color,#40A7E3)" }}
                >
                  {t("groups")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Карусель
          <div
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {groups.map((g: any) => {
              // участники (owner first), как в GroupCard
              const members: any[] =
                (Array.isArray(g?.members) && g.members.length > 0
                  ? g.members
                  : Array.isArray(g?.preview_members)
                  ? g.preview_members
                  : []) || []

              const ownerId = g?.owner_id
              const sortedMembers = [
                ...members.filter((m) => m?.user?.id === ownerId),
                ...members.filter((m) => m?.user?.id !== ownerId),
              ]

              const totalCount = g?.members_count ?? sortedMembers.length
              const showPlus = totalCount > MAX_ICONS_INLINE
              const maxVisible = showPlus ? 4 : Math.min(MAX_ICONS_INLINE, sortedMembers.length)
              const displayedMembers = sortedMembers.slice(0, maxVisible)
              const hiddenCount = Math.max(0, totalCount - 4)

              const ts = bestActivityTs(g)
              const activityText = formatLastActivity(t, ts)

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate(`/groups/${g.id}`)}
                  className="snap-center shrink-0 w-[70%] min-w-[280px] text-left active:opacity-90"
                >
                  <div
                    className="
                      rounded-2xl border p-3 bg-[var(--tg-card-bg)]
                      shadow-[0_4px_18px_-10px_rgba(83,147,231,0.14)]
                      hover:shadow-[0_10px_28px_-12px_rgba(83,147,231,0.20)]
                      transition
                    "
                    style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Левая: квадратный аватар */}
                      <GroupAvatar
                        name={g?.name}
                        src={g?.avatar_url || undefined}
                        size={56}
                        className="relative flex-shrink-0"
                      />

                      {/* Правая колонка — ТРИ СТРОКИ: 1) Название, 2) Участники, 3) Активность */}
                      <div className="flex-1 min-w-0">
                        {/* 1) Название */}
                        <div className="text-[17px] font-semibold text-[var(--tg-text-color)] truncate">
                          {g?.name}
                        </div>

                        {/* 2) Участники (4 + “+N” как в GroupCard) */}
                        <div className="mt-1 relative flex items-center justify-start">
                          {displayedMembers.map((m, idx) => (
                            <div
                              key={m.id || idx}
                              className="rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)]"
                              style={{
                                borderColor: "var(--tg-card-bg)",
                                width: PARTICIPANT_SIZE,
                                height: PARTICIPANT_SIZE,
                                marginLeft: idx > 0 ? -8 : 0,
                                zIndex: 1 + idx,
                              }}
                              title={
                                m?.user?.first_name
                                  ? `${m.user.first_name} ${m.user.last_name || ""}`.trim()
                                  : m?.user?.username || ""
                              }
                            >
                              <Avatar
                                name={
                                  m?.user?.first_name
                                    ? `${m.user.first_name} ${m.user.last_name || ""}`.trim()
                                    : m?.user?.username || ""
                                }
                                src={m?.user?.photo_url}
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
                              title={t("and_more_members", { count: hiddenCount }) || `+${hiddenCount}`}
                            >
                              +{hiddenCount}
                            </div>
                          )}
                        </div>

                        {/* 3) Активность */}
                        <div
                          className="mt-1 text-[11px] leading-[14px] text-[var(--tg-hint-color)] truncate"
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

            {/* последняя плитка — СТРОГО КВАДРАТНАЯ с переходом ко всем группам */}
            <div className="snap-center shrink-0">
              <div
                className="w-[140px] h-[140px] min-w-[140px] rounded-2xl border p-3 flex items-center justify-center bg-[var(--tg-card-bg)]"
                style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
              >
                <button
                  type="button"
                  onClick={() => navigate("/groups")}
                  className="flex flex-col items-center gap-2 active:scale-95 transition text-center"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "var(--tg-accent-color,#40A7E3)" }}
                  >
                    <Users size={22} color="#fff" />
                  </div>
                  <div className="text-[12px] font-semibold tracking-wide" style={{ color: "var(--tg-text-color)" }}>
                    {t("all_groups")}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CardSection>
  )
}
