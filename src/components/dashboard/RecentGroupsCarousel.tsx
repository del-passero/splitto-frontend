// src/components/dashboard/RecentGroupsCarousel.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react"
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
  last_activity_at?: string | null
  preview_members?: GroupMember[]
  members_count?: number
  owner_id?: number
}

// ===== layout consts =====
const AVATAR_SIZE = 62
const PARTICIPANT_SIZE = 24
const MAX_ICONS_INLINE = 5

// ---------- mini-app auth helpers ----------
function tg() {
  // @ts-ignore
  return window?.Telegram?.WebApp
}
function getTelegramInitData(): string {
  try {
    return tg()?.initData || ""
  } catch {
    return ""
  }
}
async function waitForInitData(maxWaitMs = 6000, stepMs = 120): Promise<string> {
  const deadline = Date.now() + maxWaitMs
  let init = getTelegramInitData()
  while (!init && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, stepMs))
    init = getTelegramInitData()
  }
  return init
}
async function ensureTelegramAuthOnce(flagRef: React.MutableRefObject<boolean>): Promise<void> {
  if (flagRef.current) return
  const initData = await waitForInitData()
  try {
    await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "x-telegram-initdata": initData },
      credentials: "include",
    })
  } catch { /* ignore */ }
  flagRef.current = true
}

// ---------- misc ----------
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

  // флаги поведения
  const authEnsuredRef = useRef(false)     // делаем /api/auth/telegram только один раз
  const hadSuccessRef = useRef(false)      // хотя бы одна успешная загрузка состоялась
  const retryTimerRef = useRef<number | null>(null)

  // чистим таймер на размонтирование
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
    }
  }, [])

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user?.id) return

    // первый и единственный «принудительный» логин
    await ensureTelegramAuthOnce(authEnsuredRef)

    if (!opts?.silent) {
      setLoading(true)
      setError(null)
    }

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

      const sorted: RecentGroupCard[] = [...(items || [])].sort((a: any, b: any) => {
        const ta = a?.last_activity_at ? new Date(a.last_activity_at).getTime() : 0
        const tb = b?.last_activity_at ? new Date(b.last_activity_at).getTime() : 0
        if (tb !== ta) return tb - ta
        return (b?.id || 0) - (a?.id || 0)
      })

      setGroups(sorted.slice(0, 5))
      setError(null)
      setLoading(false)
      hadSuccessRef.current = true
    } catch (e: any) {
      const msg = String(e?.message || "").toLowerCase()
      const isAuthish = msg.includes("403") || msg.includes("forbidden") || msg.includes("401") || msg.includes("unauth")

      // если уже был успешный показ — НЕ ломаем UI, делаем тихий ретрай и выходим
      if (hadSuccessRef.current && isAuthish) {
        setLoading(false)
        if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
        retryTimerRef.current = window.setTimeout(() => {
          void load({ silent: true })
        }, 500)
        return
      }

      // первичный заход или другая ошибка — покажем как раньше
      setError(e?.message || "Failed to load recent groups")
      setGroups([])
      setLoading(false)
    }
  }, [user?.id])

  // первичная загрузка + при смене пользователя
  useEffect(() => { void load() }, [load])

  // если первый заход не удался — подтянем повторно при фокусе/онлайне
  useEffect(() => {
    const onFocusOrOnline = () => {
      if (!loading && (!hadSuccessRef.current || error)) void load()
    }
    window.addEventListener("focus", onFocusOrOnline)
    window.addEventListener("online", onFocusOrOnline)
    return () => {
      window.removeEventListener("focus", onFocusOrOnline)
      window.removeEventListener("online", onFocusOrOnline)
    }
  }, [loading, error, load])

  const content = useMemo(() => {
    if (loading && !hadSuccessRef.current) {
      return <div className="text-[14px] leading-[18px] text-[var(--tg-text-color)] opacity-80">{t("loading")}</div>
    }
    if (error && !hadSuccessRef.current) {
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
      // Пустое состояние — компактная карточка
      return (
        <div className="rounded-lg border border-[var(--tg-hint-color)] flex items-center justify-center text-center p-3 bg-[var(--tg-card-bg)]">
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
        {groups.map((g) => {
          const members: GroupMember[] = Array.isArray(g.preview_members) ? g.preview_members : []
          const ownerId = typeof g.owner_id === "number" ? g.owner_id : undefined

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
                snap-center shrink-0 min-w-[260px] w-[70%]
                rounded-lg p-1.5 border border-[var(--tg-hint-color)]
                text-left active:scale-[0.99] transition bg-[var(--tg-card-bg)]
              "
              aria-label={g.name}
            >
              <div className="w-full grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4 flex items-center justify-center">
                  <div className="flex items-center justify-center" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
                    <GroupAvatar name={g.name} src={g.avatar_url || undefined} size={AVATAR_SIZE} className="relative" />
                  </div>
                </div>

                <div className="col-span-8 min-w-0 flex items-center">
                  <div className="w-full" style={{ height: AVATAR_SIZE, display: "grid", gridTemplateRows: "auto 1fr auto" }}>
                    <div className="text-[17px] leading-[18px] font-semibold text-[var(--tg-text-color)] truncate self-start">
                      {g.name}
                    </div>

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
                          title={m.user.first_name ? `${m.user.first_name} ${m.user.last_name || ""}`.trim() : m.user.username || ""}
                        >
                          <Avatar
                            name={m.user.first_name ? `${m.user.first_name} ${m.user.last_name || ""}`.trim() : m.user.username || ""}
                            src={m.user.photo_url}
                            size={PARTICIPANT_SIZE}
                          />
                        </div>
                      ))}

                      {showPlus && hiddenCount > 0 && (
                        <div
                          className="ml-[-8px] rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)] text-[11px] text-[var(--tg-hint-color)]"
                          style={{ borderColor: "var(--tg-card-bg)", width: PARTICIPANT_SIZE, height: PARTICIPANT_SIZE, zIndex: 1 + maxVisible }}
                          title={`+${hiddenCount}`}
                        >
                          +{hiddenCount}
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] leading-[14px] text-[var(--tg-hint-color)] truncate self-end" title={activityText}>
                      {activityText}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => navigate("/groups")}
          className="
            snap-center shrink-0 px-4
            rounded-lg p-1.5 border border-[var(--tg-hint-color)]
            flex items-center justify-center
            active:scale-[0.98] transition bg-[var(--tg-card-bg)]
          "
          aria-label={t("dashboard.all_groups")}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="rounded-full w-[48px] h-[48px] flex items-center justify-center mb-2" style={{ background: "var(--tg-accent-color,#40A7E3)" }}>
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

  // Внешняя обёртка — такая же, как у баланса
  return (
    <div className="rounded-lg border border-[var(--tg-hint-color)] p-1.5 bg-[var(--tg-card-bg)]">
      <div className="mb-2 font-semibold" style={{ fontSize: "15px", lineHeight: "18px", color: "var(--tg-accent-color,#40A7E3)" }}>
        {t("dashboard.recent_groups")}
      </div>
      {content}
    </div>
  )
}
