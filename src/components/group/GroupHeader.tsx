// src/components/group/GroupHeader.tsx

import { Settings, ArrowDownCircle, ArrowUpCircle, CheckCircle } from "lucide-react"
import GroupAvatar from "../GroupAvatar"
import { useTranslation } from "react-i18next"
import type { Group } from "../../types/group"

type Props = {
  group: Group
  userBalance: number
  onSettingsClick: () => void
  onBalanceClick: () => void
}

const GroupHeader = ({
  group,
  userBalance,
  onSettingsClick,
  onBalanceClick,
}: Props) => {
  const { t } = useTranslation()

  // Определяем тип баланса пользователя для цветовой карточки
  let balanceColor = "bg-gray-300 text-gray-700"
  let BalanceIcon = CheckCircle
  let balanceText = t("group_balance_zero")

  if (userBalance > 0) {
    balanceColor = "bg-green-500 text-white"
    BalanceIcon = ArrowDownCircle
    balanceText = t("group_balance_you_get", { sum: userBalance })
  } else if (userBalance < 0) {
    balanceColor = "bg-red-500 text-white"
    BalanceIcon = ArrowUpCircle
    balanceText = t("group_balance_you_owe", { sum: Math.abs(userBalance) })
  }

  return (
    <div className="w-full flex items-center px-4 py-4 bg-[var(--tg-bg-color)] border-b border-[var(--tg-hint-color)]">
      <GroupAvatar
        name={group.name}
        size={56}
        className="mr-4"
      />
      <div className="flex flex-col flex-grow min-w-0">
        <div className="font-bold text-xl break-words text-[var(--tg-text-color)] leading-tight">
          {group.name}
        </div>
        {group.description && (
          <div className="text-[var(--tg-hint-color)] text-sm mt-1 line-clamp-2">
            {group.description}
          </div>
        )}
        <button
          className={`
            mt-3 flex items-center gap-2 px-4 py-2 rounded-xl shadow
            font-semibold cursor-pointer transition active:scale-95
            ${balanceColor}
          `}
          onClick={onBalanceClick}
          type="button"
          aria-label={t("group_header_my_balance")}
        >
          <BalanceIcon className="w-5 h-5" />
          <span className="truncate">{balanceText}</span>
        </button>
      </div>
      <button
        className="ml-4 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
        onClick={onSettingsClick}
        aria-label={t("group_header_settings")}
        type="button"
      >
        <Settings className="w-6 h-6 text-[var(--tg-accent-color)]" />
      </button>
    </div>
  )
}

export default GroupHeader
