// src/components/group/GroupMembersList.tsx

import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import CardSection from "../CardSection"
import UserCard from "../UserCard"
import type { GroupMember } from "../../types/group_member"
import { Trash2, UserMinus } from "lucide-react"

type Props = {
  members: GroupMember[]
  isOwner?: boolean
  ownerId?: number
  onRemove?: (memberId: number) => void
  loading?: boolean
  fetchMore?: () => void
  hasMore?: boolean
}

const GroupMembersList = ({
  members,
  isOwner = false,
  ownerId,
  onRemove,
  loading = false,
  fetchMore,
  hasMore = false,
}: Props) => {
  const { t } = useTranslation()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const canRemove = useMemo(() => isOwner && typeof onRemove === "function", [isOwner, onRemove])

  useEffect(() => {
    if (!fetchMore) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        fetchMore()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [fetchMore, hasMore, loading])

  return (
    <CardSection noPadding>
      {members.map((m: GroupMember, idx: number) => {
        const u = m.user
        const displayName =
          (u.name && u.name.trim()) ||
          `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
          (u.username ? `@${u.username}` : `#${u.id}`)

        const showRemove =
          canRemove && u.id !== ownerId // нельзя удалять владельца

        return (
          <div key={`${m.id}-${u.id}-${idx}`} className="relative">
            <div className="block">
              <UserCard
                name={displayName}
                username={u.username}
                photo_url={(u as any).photo_url}
              />
            </div>

            {/* Кнопка удаления — справа, на карточке */}
            {showRemove && (
              <button
                type="button"
                onClick={() => onRemove && onRemove(m.id)} // ВАЖНО: member.id
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full
                           hover:bg-red-500/10 active:scale-95 transition"
                aria-label={t("delete")}
                title={t("delete") as string}
              >
                {/* понятная иконка удаления участника */}
                <UserMinus className="w-5 h-5 text-red-500" />
              </button>
            )}

            {/* разделитель с отступом под аватар (как в ContactFriendsList) */}
            {idx !== members.length - 1 && (
              <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
            )}
          </div>
        )
      })}

      {/* компактный якорь — без лишнего пустого места */}
      <div ref={sentinelRef} className="h-px" />
      {loading && (
        <div className="px-3 py-2 text-sm text-[var(--tg-hint-color)]">
          {t("loading")}
        </div>
      )}
    </CardSection>
  )
}

export default GroupMembersList

