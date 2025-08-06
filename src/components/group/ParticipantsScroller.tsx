// src/components/group/ParticipantsScroller.tsx

import { UserPlus, Share2 } from "lucide-react"
import { useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { GroupMember } from "../../types/group_member"
import ParticipantMiniCard from "./ParticipantMiniCard"

type Props = {
  members: GroupMember[]
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

  // Infinity scroll
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

  // Карточка-экшен (для "Пригласить" и "Добавить")
  const ActionCard = ({
    icon,
    label,
    onClick,
  }: {
    icon: React.ReactNode
    label: string
    onClick: () => void
  }) => (
    <button
      type="button"
      className={`
        flex flex-col items-center w-20 min-w-[76px] mx-1 py-2 bg-[var(--tg-card-bg)]
        rounded-2xl border border-[var(--tg-hint-color)]/30 shadow-sm
        hover:shadow-md transition cursor-pointer
        focus:outline-none
        relative
      `}
      onClick={onClick}
      tabIndex={0}
      aria-label={label}
    >
      <span className="bg-[var(--tg-accent-color)] rounded-full w-11 h-11 flex items-center justify-center mb-1 shadow">
        {icon}
      </span>
      <span className="text-xs text-center text-[var(--tg-accent-color)] font-medium truncate max-w-[68px]">{label}</span>
    </button>
  )

  const allCards = [
    ...(members.map((member, idx) => (
      <div key={member.user.id} className="relative flex flex-col items-center">
        {/* Вертикальная Wallet-style разделительная линия (после первой карточки) */}
        {idx > 0 && (
          <div
            className="absolute right-[-9px] top-4 bottom-2 w-px bg-[var(--tg-hint-color)] opacity-30"
            style={{ height: "75%" }}
          />
        )}
        <ParticipantMiniCard
          member={member}
          onClick={onParticipantClick}
          currentUserId={currentUserId}
        />
      </div>
    ))),
    // Action-cards: "Пригласить" и "Добавить"
    <div key="invite" className="relative flex flex-col items-center">
      {members.length > 0 && (
        <div
          className="absolute right-[-9px] top-4 bottom-2 w-px bg-[var(--tg-hint-color)] opacity-30"
          style={{ height: "75%" }}
        />
      )}
      <ActionCard
        icon={<Share2 className="text-white w-5 h-5" />}
        label={t("group_invite")}
        onClick={onInviteClick}
      />
    </div>,
    <div key="add" className="relative flex flex-col items-center">
      <div
        className="absolute right-[-9px] top-4 bottom-2 w-px bg-[var(--tg-hint-color)] opacity-30"
        style={{ height: "75%" }}
      />
      <ActionCard
        icon={<UserPlus className="text-white w-5 h-5" />}
        label={t("group_add_member")}
        onClick={onAddClick}
      />
    </div>,
  ]

  return (
    <div className="w-full flex items-end gap-2 px-4 py-2 overflow-x-auto scroll-smooth hide-scrollbar">
      {allCards}
      {/* Infinity scroll placeholder */}
      {hasMore && !loading && (
        <div ref={loaderRef} className="w-2" />
      )}
      {loading && (
        <div className="w-16 flex items-center justify-center text-[var(--tg-hint-color)] text-xs">
          {t("loading")}
        </div>
      )}
    </div>
  )
}

export default ParticipantsScroller
