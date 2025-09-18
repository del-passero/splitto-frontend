// src/components/GroupCard.tsx

import { useMemo } from "react"
import GroupAvatar from "./GroupAvatar"
import Avatar from "./Avatar"
import { useTranslation } from "react-i18next"
import type { Group, GroupPreview } from "../types/group"
import type { GroupMember } from "../types/group_member"
import { Archive, Trash2 } from "lucide-react"

type DebtsPreview = {
  owe?: Record<string, number>   // я должен (по модулю)
  owed?: Record<string, number>  // мне должны
}

type Props = {
  group: GroupPreview | Group
  onClick: () => void
  maxAvatars?: number
  className?: string
  debts?: DebtsPreview
}

const AVATAR_SIZE = 72
const PARTICIPANT_SIZE = 24
const MAX_DISPLAYED = 6

const HorizontalSums = ({ title, sums, emptyKey }: { title: string; sums?: Record<string, number>; emptyKey: string }) => {
  const { t } = useTranslation()
  const entries = Object.entries(sums || {})
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="text-[12px] text-[var(--tg-hint-color)] whitespace-nowrap">{title}</div>
      {entries.length === 0 ? (
        <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{t(emptyKey) || ""}</div>
      ) : (
        <div className="flex gap-2 overflow-x-auto no-scrollbar text-[12px]">
          {entries.map(([ccy, amt]) => (
            <div key={ccy} className="shrink-0">
              {/* Формат: USD 12.34 */}
              <span className="font-medium">{ccy}</span>&nbsp;{amt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const GroupCard = ({
  group,
  onClick,
  maxAvatars = MAX_DISPLAYED,
  className = "",
  debts,
}: Props) => {
  const { t } = useTranslation()

  // Универсально достаем участников (детали или превью)
  const members: GroupMember[] = useMemo(() => {
    if ("members" in group && Array.isArray((group as any).members) && (group as any).members.length > 0) {
      return (group as any).members
    }
    if ("preview_members" in group && Array.isArray((group as any).preview_members)) {
      return (group as any).preview_members
    }
    return []
  }, [group])

  // Владелец первым
  const sortedMembers = useMemo(() => {
    if (!members.length) return []
    return [
      ...members.filter((m) => m.user.id === (group as any).owner_id),
      ...members.filter((m) => m.user.id !== (group as any).owner_id),
    ]
  }, [members, (group as any).owner_id])

  const displayedMembers = sortedMembers.slice(0, maxAvatars)
  const hiddenCount = Math.max(0, sortedMembers.length - maxAvatars)

  const isArchived = (group as any).status === "archived"
  const isDeleted = !!(group as any).deleted_at

  // Последняя активность (короткий формат)
  const lastActivity = (group as any).last_activity_at
  let lastActivityLabel = ""
  if (lastActivity) {
    try {
      const d = new Date(lastActivity)
      const now = new Date()
      const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      if (days <= 0) lastActivityLabel = "Сегодня"
      else if (days === 1) lastActivityLabel = "Вчера"
      else lastActivityLabel = `${days} дн. назад`
    } catch {
      lastActivityLabel = ""
    }
  } else {
    lastActivityLabel = "Неактивна"
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-stretch gap-3 relative
        rounded-xl
        p-3
        border bg-[var(--tg-card-bg)]
        border-[var(--tg-hint-color)]
        shadow-[0_4px_18px_-10px_rgba(83,147,231,0.14)]
        hover:shadow-[0_10px_28px_-12px_rgba(83,147,231,0.20)]
        active:scale-[0.99]
        transition
        cursor-pointer
        overflow-hidden
        ${className}
      `}
      aria-label={(group as any).name}
    >
      {/* Квадратный аватар на всю высоту карточки */}
      <div className="flex-shrink-0 relative">
        <GroupAvatar
          name={(group as any).name}
          size={AVATAR_SIZE}
          className="relative"
        />
        {/* Угловые бейджи статуса */}
        {isArchived && (
          <div className="absolute right-[-6px] bottom-[-6px] bg-[var(--tg-card-bg)] rounded-full p-1 shadow">
            <Archive size={14} className="text-[var(--tg-hint-color)]" />
          </div>
        )}
        {isDeleted && (
          <div className="absolute left-[-6px] bottom-[-6px] bg-[var(--tg-card-bg)] rounded-full p-1 shadow">
            <Trash2 size={14} className="text-[var(--tg-hint-color)]" />
          </div>
        )}
      </div>

      {/* Контент: 3 строки */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        {/* 1 строка: Название (на всю ширину) */}
        <div className="flex items-center justify-between w-full">
          <div className="text-base font-semibold text-[var(--tg-text-color)] truncate">
            {(group as any).name}
          </div>
          {/* Зарезервировано под ⋮ (пока без логики, чтобы ничего не сломать) */}
          {/* <MoreVertical size={18} className="text-[var(--tg-hint-color)]" /> */}
        </div>

        {/* 2 строка: два столбца с горизонтальными скроллами сумм */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <HorizontalSums
            title={t("i_owe") || "Я должен"}
            sums={debts?.owe}
            emptyKey="group_balance_no_debts_left"
          />
          <HorizontalSums
            title={t("they_owe_me") || "Мне должны"}
            sums={debts?.owed}
            emptyKey="group_balance_no_debts_right"
          />
        </div>

        {/* 3 строка: участники (до 6) + последняя активность */}
        <div className="flex items-center justify-between mt-2 min-h-[24px]">
          <div className="flex items-center">
            {displayedMembers.map((member, idx) => (
              <div
                key={member.id}
                className="rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)]"
                style={{
                  borderColor: "var(--tg-card-bg)",
                  width: PARTICIPANT_SIZE,
                  height: PARTICIPANT_SIZE,
                  marginLeft: idx > 0 ? -8 : 0,
                  zIndex: maxAvatars - idx,
                }}
                title={
                  member.user.first_name
                    ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                    : member.user.username || ""
                }
              >
                <Avatar
                  name={
                    member.user.first_name
                      ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                      : member.user.username || ""
                  }
                  src={member.user.photo_url}
                  size={PARTICIPANT_SIZE}
                />
              </div>
            ))}

            {hiddenCount > 0 && (
              <span className="ml-2 text-[11px] text-[var(--tg-hint-color)]">
                {t("and_more_members", { count: hiddenCount }) || `и ещё ${hiddenCount}`}
              </span>
            )}
          </div>

          <div className="text-[11px] text-[var(--tg-hint-color)] ml-3 shrink-0">
            Последняя активность: {lastActivityLabel}
          </div>
        </div>
      </div>
    </button>
  )
}

export default GroupCard
