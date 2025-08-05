// src/components/group/ParticipantsScroller.tsx

import { UserPlus, Share2 } from "lucide-react"
import { useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { GroupMember } from "../../types/group_member"
import ParticipantMiniCard from "./ParticipantMiniCard"

type Props = {
  members: GroupMember[]
  balances: Record<number, number>
  currentUserId: number
  onParticipantClick?: (userId: number) => void
  onInviteClick: () => void
  onAddClick: () => void
  loadMore: () => void
  hasMore: boolean
  loading: boolean
}

const ParticipantsScroller = ({
  members,
  balances,
  currentUserId,
  onParticipantClick,
  onInviteClick,
  onAddClick,
  loadMore,
  hasMore,
  loading,
}: Props) => {
  const { t } = useTranslation()
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || loading || !loaderRef.current) return
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore()
      }
    })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <div className="w-full flex items-end gap-2 px-4 py-2 overflow-x-auto scroll-smooth hide-scrollbar">
      {members.map(member => (
        <ParticipantMiniCard
          key={member.user.id}
          member={member}
          balance={balances[member.user.id] || 0}
          currentUserId={currentUserId}
          onClick={onParticipantClick}
        />
      ))}
      {/* Инфинити-скролл-плейсхолдер */}
      {hasMore && !loading && (
        <div ref={loaderRef} className="w-2" />
      )}
      {loading && (
        <div className="w-16 flex items-center justify-center text-[var(--tg-hint-color)] text-xs">
          {t("loading")}
        </div>
      )}
      {/* Кнопки "Пригласить" и "Добавить" */}
      <button
        type="button"
        className="flex flex-col items-center w-20 mx-1 py-1 focus:outline-none"
        onClick={onInviteClick}
        aria-label={t("group_invite")}
      >
        <span className="bg-[var(--tg-accent-color)] rounded-full w-11 h-11 flex items-center justify-center mb-1 shadow">
          <Share2 className="text-white w-5 h-5" />
        </span>
        <span className="text-xs text-center">{t("group_invite")}</span>
      </button>
      <button
        type="button"
        className="flex flex-col items-center w-20 mx-1 py-1 focus:outline-none"
        onClick={onAddClick}
        aria-label={t("group_add_member")}
      >
        <span className="bg-[var(--tg-accent-color)] rounded-full w-11 h-11 flex items-center justify-center mb-1 shadow">
          <UserPlus className="text-white w-5 h-5" />
        </span>
        <span className="text-xs text-center">{t("group_add_member")}</span>
      </button>
    </div>
  )
}

export default ParticipantsScroller
