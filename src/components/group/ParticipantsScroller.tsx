// src/components/group/ParticipantsScroller.tsx

import { UserPlus, Share2 } from "lucide-react"
import { useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { GroupMember } from "../../types/group_member"
import CardSection from "../CardSection"
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
        flex flex-col items-center w-16 min-w-[60px] mx-0.5 py-2 bg-[var(--tg-card-bg)]
        rounded-2xl border border-[var(--tg-hint-color)]/30 shadow-sm
        hover:shadow-md transition cursor-pointer
        focus:outline-none
      `}
      onClick={onClick}
      tabIndex={0}
      aria-label={label}
    >
      <span
        className="rounded-full w-9 h-9 flex items-center justify-center mb-1 shadow"
        style={{
          background: "var(--tg-accent-color, #229ED9)",
        }}
      >
        {/* Иконки всегда белые */}
        {icon}
      </span>
      <span
        className="text-xs font-bold text-center truncate max-w-[54px]"
        style={{
          color: "#191919", // Чёрный текст для invite/add, всегда
        }}
      >
        {label}
      </span>
    </button>
  )

  // Собираем все карточки (участники + экшены)
  const allCards = [
    ...members.map((member) => (
      <ParticipantMiniCard
        key={member.user.id}
        member={member}
        onClick={onParticipantClick}
        currentUserId={currentUserId}
      />
    )),
    // Action-cards: "Пригласить" и "Добавить"
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

  // Рендерим бордеры между карточками (между первой и второй, второй и третьей и т.д.)
  const borderLines = []
  for (let i = 1; i < allCards.length; i++) {
    borderLines.push(
      <div
        key={`border-${i}`}
        className="absolute top-0 bottom-0"
        style={{
          left: `calc(${i * 100}% / ${allCards.length} + ${(i - 0.5) * 8}px)`, // ~ между карточками
          width: "1.5px",
          background: "var(--tg-hint-color, #b0b6be)",
          opacity: 0.2,
          zIndex: 1,
          // линия начинается чуть ниже верха секции и доходит до низа карточек
          top: "12px", // top отступ от CardSection, чтобы не доходило до верха
          bottom: "8px", // bottom равен нижней границе карточки
        }}
      />
    )
  }

  return (
    <CardSection noPadding className="overflow-x-auto">
      <div className="relative w-full">
        {/* Вертикальные разделители между карточками */}
        <div
          className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none"
          aria-hidden
        >
          {/* Бордеры между карточками */}
          {allCards.length > 1 &&
            allCards.slice(1).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `calc(${(i + 1) * 80}px - 4px)`, // между карточками (80 = w-16 min-w-[60px] + mx-0.5)
                  width: "2px",
                  top: "12px", // top-отступ от CardSection
                  bottom: "8px", // bottom-отступ, чтобы не доходило до конца
                  background: "var(--tg-hint-color, #b0b6be)",
                  opacity: 0.16,
                  borderRadius: "2px",
                }}
              />
            ))}
        </div>
        <div className="flex items-end gap-x-1 px-0 py-2 overflow-x-auto scroll-smooth hide-scrollbar">
          {allCards.map((card, i) => (
            <div
              key={i}
              className={`relative flex flex-col items-center ${i === 0 ? "ml-0" : ""}`}
              style={{
                zIndex: 2, // поверх линий
              }}
            >
              {card}
            </div>
          ))}
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
      </div>
    </CardSection>
  )
}

export default ParticipantsScroller
