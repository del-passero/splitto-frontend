// src/components/group/ParticipantMiniCard.tsx

import Avatar from "../Avatar"
import { useTranslation } from "react-i18next"
import type { GroupMember } from "../../types/group_member"

type Props = {
  member: GroupMember
  balance: number // долг текущего пользователя с этим участником (может быть 0)
  onClick?: (userId: number) => void
  currentUserId: number
}

const ParticipantMiniCard = ({
  member,
  balance,
  onClick,
  currentUserId,
}: Props) => {
  const { t } = useTranslation()
  let balanceText = t("group_participant_no_debt")
  let balanceColor = "text-[var(--tg-hint-color)]"
  if (member.user.id !== currentUserId) {
    if (balance > 0) {
      balanceText = t("group_participant_owes_you", { sum: balance })
      balanceColor = "text-green-500"
    } else if (balance < 0) {
      balanceText = t("group_participant_you_owe", { sum: Math.abs(balance) })
      balanceColor = "text-red-500"
    }
  }
  return (
    <button
      type="button"
      className={`
        flex flex-col items-center w-20 mx-1 py-1 bg-[var(--tg-card-bg)]
        rounded-2xl border border-[var(--tg-hint-color)]/30 shadow-sm
        hover:shadow-md transition cursor-pointer
        focus:outline-none
      `}
      onClick={() => onClick?.(member.user.id)}
      tabIndex={0}
      aria-label={member.user.first_name || member.user.username}
    >
      <Avatar
        src={member.user.photo_url}
        name={member.user.first_name || member.user.username}
        size={44}
        className="mb-1"
      />
      <span className="text-xs font-semibold text-[var(--tg-text-color)] truncate w-full text-center">
        {member.user.first_name || member.user.username}
      </span>
      <span className={`text-[10px] mt-0.5 ${balanceColor}`}>
        {balanceText}
      </span>
    </button>
  )
}

export default ParticipantMiniCard
