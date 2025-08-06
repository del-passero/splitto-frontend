// src/components/group/ParticipantsScroller.tsx

import { UserPlus, Share2 } from "lucide-react"
import { useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { GroupMember } from "../../types/group_member"
import CardSection from "../CardSection"
import ParticipantMiniCard from "./ParticipantMiniCard"

// ВНИМАНИЕ: значения для ширины карточек и отступов должны совпадать с ParticipantMiniCard
const CARD_WIDTH = 88 // px, соответствует w-22/min-w-[88px]
const CARD_GAP = 8    // px, соответствует mx-1
const BORDER_TOP = 48 // px, линия начинается ниже аватарки/имени
const BORDER_WIDTH = 2

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

  // ActionCard стилизуем абсолютно так же, как и участника!
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
        flex flex-col items-center w-22 min-w-[88px] mx-1 py-2 bg-[var(--tg-card-bg)]
        rounded-2xl border border-[var(--tg-hint-color)]/30 shadow-sm
        hover:shadow-md transition cursor-pointer
        focus:outline-none
      `}
      onClick={onClick}
      tabIndex={0}
      aria-label={label}
      style={{ zIndex: 2 }}
    >
      <span
        className="rounded-full w-12 h-12 flex items-center justify-center mb-1 shadow"
        style={{
          background: "var(--tg-accent-color, #229ED9)",
        }}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold text-[var(--tg-text-color)] truncate w-full text-center">
        {label}
      </span>
    </button>
  )

  // Собираем массив всех карточек
  const allCards = [
    ...members.map((member) => (
      <ParticipantMiniCard
        key={member.user.id}
        member={member}
        onClick={onParticipantClick}
        currentUserId={currentUserId}
      />
    )),
    <ActionCard
      key="invite"
      icon={<Share2 className="w-5 h-5 text-white" strokeWidth={2.2} />}
      label={t("group_invite")}
      onClick={onInviteClick}
    />,
    <ActionCard
      key="add"
      icon={<UserPlus className="w-5 h-5 text-white" strokeWidth={2.2} />}
      label={t("group_add_member")}
      onClick={onAddClick}
    />,
  ]

  return (
    <CardSection noPadding className="overflow-x-auto">
      <div className="relative w-full">
        <div className="flex items-end gap-x-2 px-0 py-2 overflow-x-auto scroll-smooth hide-scrollbar">
          {allCards.map((card, i) => (
            <div
              key={i}
              className="relative flex flex-col items-center"
              style={{ width: CARD_WIDTH, minWidth: CARD_WIDTH }}
            >
              {/* BORDER LINE между карточками (кроме первой) */}
              {i !== 0 && (
                <div
                  className="absolute"
                  style={{
                    left: -CARD_GAP / 2 - BORDER_WIDTH / 2,
                    top: BORDER_TOP,
                    bottom: 0,
                    width: BORDER_WIDTH,
                    background: "var(--tg-hint-color, #b0b6be)",
                    opacity: 0.18,
                    borderRadius: 2,
                    zIndex: 1,
                  }}
                />
              )}
              {card}
            </div>
          ))}
          {/* Infinity scroll placeholder */}
          {hasMore && !loading && <div ref={loaderRef} className="w-2" />}
          {loading && (
            <div className="w-16 flex items-center justify-center text-[var(--tg-hint-color)] text-xs">
              {t("loading")}
            </div>
          )}
        </div>
      </div>
    </CardSection>
  )
}

export default ParticipantsScroller
