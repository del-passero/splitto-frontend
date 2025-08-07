// src/components/group/ParticipantMiniCard.tsx

import Avatar from "../Avatar"
import type { GroupMember } from "../../types/group_member"

type Props = {
  member: GroupMember
  onClick?: (userId: number) => void
  currentUserId: number
}

function cropName(name: string | undefined): string {
  if (!name) return ""
  return name.length > 10 ? name.slice(0, 9) + "…" : name
}

const ParticipantMiniCard = ({
  member,
  onClick,
  currentUserId,
}: Props) => {
  const displayName = cropName(
    member.user.first_name || member.user.username
  )

  return (
    <button
      type="button"
      className={`
        flex flex-col items-center w-20 min-w-[72px] mx-0.5 py-2
        bg-[var(--tg-card-bg)]
        rounded border border-[var(--tg-hint-color)]/30 shadow-sm
        hover:shadow-md transition cursor-pointer
        focus:outline-none
      `}
      onClick={() => onClick?.(member.user.id)}
      tabIndex={0}
      aria-label={displayName}
      style={{ zIndex: 2 }}
    >
      <Avatar
        src={member.user.photo_url}
        name={displayName}
        size={44}
        className="mb-1"
      />
      <span className="text-xs font-semibold text-[var(--tg-text-color)] truncate w-full text-center">
        {displayName}
      </span>
    </button>
  )
}

export default ParticipantMiniCard
