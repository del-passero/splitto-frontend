// src/components/group/ParticipantsScroller.tsx

import { UserPlus, Share2 } from "lucide-react"
import { useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { GroupMember } from "../../types/group_member"
import CardSection from "../CardSection"
import ParticipantMiniCard from "./ParticipantMiniCard"

const CARD_WIDTH = 88 // Tailwind w-22
const CARD_HEIGHT = 90

type Props = {
  members: GroupMember[]
  currentUserId: number
  onParticipantClick?: (userId: number) => void
  onInviteClick: () => void
  onAddClick: () => void
}

const REPEAT_TIMES = 50 // Сколько раз повторяем весь цикл для "вечности"

const ParticipantsScroller = ({
  members,
  currentUserId,
  onParticipantClick,
  onInviteClick,
  onAddClick,
}: Props) => {
  const { t } = useTranslation()

  // ActionCard идентичная ParticipantMiniCard по стилю!
  const ActionCard = ({
    icon,
    label,
    onClick,
    uniqKey,
  }: {
    icon: React.ReactNode
    label: string
    onClick: () => void
    uniqKey: string | number
  }) => (
    <button
      key={uniqKey}
      type="button"
      className={`
        flex flex-col items-center w-22 min-w-[88px] mx-1 py-2 bg-[var(--tg-card-bg)]
        rounded-2xl border border-[var(--tg-hint-color)]/30 shadow-sm
        hover:shadow-md transition cursor-pointer
        focus:outline-none
        flex-shrink-0
      `}
      onClick={onClick}
      tabIndex={0}
      aria-label={label}
      style={{ zIndex: 2 }}
    >
      <span
        className="rounded-full w-12 h-12 flex items-center justify-center mb-1 shadow"
        style={{ background: "var(--tg-theme-button-color, #40A7E3)" }}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold text-[var(--tg-text-color)] truncate w-full text-center">
        {label}
      </span>
    </button>
  )

  // Один проход (все участники + invite + add)
  const cycle = [
    ...members.map((member, idx) => (
      <ParticipantMiniCard
        key={`member-${member.user.id}-${idx}`}
        member={member}
        onClick={onParticipantClick}
        currentUserId={currentUserId}
      />
    )),
    <ActionCard
      uniqKey="invite"
      icon={<Share2 className="w-5 h-5 text-white" strokeWidth={2.2} />}
      label={t("group_invite")}
      onClick={onInviteClick}
    />,
    <ActionCard
      uniqKey="add"
      icon={<UserPlus className="w-5 h-5 text-white" strokeWidth={2.2} />}
      label={t("group_add_member")}
      onClick={onAddClick}
    />,
  ]

  // Бесконечная лента — повторяем cycle N раз и ключи делаем уникальными
  const infiniteCards: React.ReactNode[] = []
  for (let i = 0; i < REPEAT_TIMES; i++) {
    cycle.forEach((el, j) => {
      // el — это либо ParticipantMiniCard, либо ActionCard, оба с key/uniqKey
      if (el.type === ParticipantMiniCard) {
        infiniteCards.push(
          <ParticipantMiniCard
            key={`cycle-${i}-member-${(el.props as any).member.user.id}-${j}`}
            member={(el.props as any).member}
            onClick={onParticipantClick}
            currentUserId={currentUserId}
          />
        )
      } else {
        // Это ActionCard, берём все пропсы кроме key
        const { icon, label, onClick } = (el.props as any)
        infiniteCards.push(
          <ActionCard
            uniqKey={`cycle-${i}-${label}`}
            icon={icon}
            label={label}
            onClick={onClick}
          />
        )
      }
    })
  }

  // Скроллим в середину при маунте (можно и в начало, если не надо)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft =
        ((CARD_WIDTH + 8) * cycle.length * REPEAT_TIMES) / 2 // 8px gap
    }
  }, [])

  return (
    <CardSection noPadding className="overflow-x-visible">
      <div
        ref={scrollRef}
        className="flex items-end gap-x-2 px-0 py-2 overflow-x-auto scroll-smooth hide-scrollbar"
        style={{
          WebkitOverflowScrolling: "touch",
          width: "100%",
        }}
      >
        {infiniteCards}
      </div>
    </CardSection>
  )
}

export default ParticipantsScroller
