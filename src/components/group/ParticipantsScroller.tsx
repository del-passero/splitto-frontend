import { UserPlus, Share2 } from "lucide-react"
import { useRef } from "react"
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

  // Telegram blue из темы
  const tgBlue =
    getComputedStyle(document.documentElement).getPropertyValue("--tg-theme-button-color") ||
    "#40A7E3"

  // ActionCard идентичная ParticipantMiniCard по стилю!
  const ActionCard = ({
    icon,
    label,
    onClick,
    key,
  }: {
    icon: React.ReactNode
    label: string
    onClick: () => void
    key: string | number
  }) => (
    <button
      key={key}
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
    ...members.map((member) => (
      <ParticipantMiniCard
        key={member.user.id + Math.random()}
        member={member}
        onClick={onParticipantClick}
        currentUserId={currentUserId}
      />
    )),
    <ActionCard
      key={"invite" + Math.random()}
      icon={<Share2 className="w-5 h-5 text-white" strokeWidth={2.2} />}
      label={t("group_invite")}
      onClick={onInviteClick}
    />,
    <ActionCard
      key={"add" + Math.random()}
      icon={<UserPlus className="w-5 h-5 text-white" strokeWidth={2.2} />}
      label={t("group_add_member")}
      onClick={onAddClick}
    />,
  ]

  // Делаем "бесконечную" ленту
  const infiniteCards = Array.from({ length: REPEAT_TIMES }).flatMap(
    (_, idx) =>
      cycle.map((el, i) =>
        el.type === ParticipantMiniCard
          ? React.cloneElement(el, { key: `c${idx}_${i}` })
          : React.cloneElement(el, { key: `c${idx}_${i}` })
      )
  )

  // Опционально: скроллим в середину при маунте (чтобы можно было и влево, и вправо)
  const scrollRef = useRef<HTMLDivElement>(null)
  React.useEffect(() => {
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
