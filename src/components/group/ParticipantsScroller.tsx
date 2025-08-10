// src/components/group/ParticipantsScroller.tsx

import { UserPlus, Share2 } from "lucide-react"
import { useRef, useEffect, useMemo } from "react"
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
  /** Новый: точный владелец группы */
  ownerId?: number
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
  ownerId,
}: Props) => {
  const { t } = useTranslation()
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || loading || !loaderRef.current) return
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) loadMore()
    })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  // Владелец первым, остальные по алфавиту
  const sortedMembers = useMemo(() => {
    if (!members || members.length === 0) return members
    const collator = new Intl.Collator(undefined, { sensitivity: "base" })
    const key = (m: GroupMember) => {
      const n = `${m.user?.first_name ?? ""} ${m.user?.last_name ?? ""}`.trim()
      return n || m.user?.username || String(m.user?.id ?? "")
    }

    let ownerIdx = -1
    if (typeof ownerId === "number") {
      ownerIdx = members.findIndex(m => Number(m.user?.id) === Number(ownerId))
    }
    if (ownerIdx < 0) {
      // фоллбэк: просто алфавит
      return [...members].sort((a, b) => collator.compare(key(a), key(b)))
    }
    const owner = members[ownerIdx]
    const rest = members.filter((_, i) => i !== ownerIdx).sort((a, b) => collator.compare(key(a), key(b)))
    return [owner, ...rest]
  }, [members, ownerId])

  const ActionCard = ({
    icon,
    label,
    onClick,
  }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
    <button
      type="button"
      className="flex flex-col items-center w-20 min-w-[60px] py-2 bg-[var(--tg-card-bg)]
                 rounded border border-[var(--tg-hint-color)]/30 shadow-sm hover:shadow-md transition
                 cursor-pointer focus:outline-none flex-shrink-0"
      onClick={onClick}
      tabIndex={0}
      aria-label={label}
      style={{ zIndex: 2 }}
    >
      <span
        className="rounded-full w-11 h-11 flex items-center justify-center mb-1 shadow"
        style={{ background: "var(--tg-theme-button-color, #40A7E3)" }}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold text-[var(--tg-text-color)] truncate w-full text-center">
        {label}
      </span>
    </button>
  )

  return (
    <CardSection noPadding className="overflow-x-visible">
      <div
        className="flex items-end gap-x-1 px-0 py-2 overflow-x-auto scroll-smooth hide-scrollbar"
        style={{ WebkitOverflowScrolling: "touch", width: "100%" }}
      >
        {sortedMembers.map(member => (
          <ParticipantMiniCard
            key={member.user.id}
            member={member}
            onClick={onParticipantClick}
            currentUserId={currentUserId}
          />
        ))}
        <ActionCard
          key="invite"
          icon={<Share2 className="w-5 h-5 text-white" strokeWidth={2.2} />}
          label={t("group_invite")}
          onClick={onInviteClick}
        />
        <ActionCard
          key="add"
          icon={<UserPlus className="w-5 h-5 text-white" strokeWidth={2.2} />}
          label={t("group_add_member")}
          onClick={onAddClick}
        />
        {hasMore && !loading && <div ref={loaderRef} className="w-2" />}
        {loading && (
          <div className="w-10 flex items-center justify-center text-[var(--tg-hint-color)] text-xs">
            {t("loading")}
          </div>
        )}
      </div>
    </CardSection>
  )
}

export default ParticipantsScroller
