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
const MAX_DISPLAYED = 5 // (п.4) показываем 5 + при необходимости "+N" отдельным кружком

const SumsRow = ({
  labelKey,
  sums,
  emptyKey,
  red = false,
}: {
  labelKey: string
  sums?: Record<string, number>
  emptyKey: string
  red?: boolean
}) => {
  const { t } = useTranslation()
  const entries = Object.entries(sums || {})
  // (п.2) две строки, суммы ПОД фразой; суммы: сначала число, потом валюта; красный текст
  return (
    <div className="min-w-0">
      <div className="text-[12px] leading-[14px] text-[var(--tg-hint-color)] whitespace-nowrap">
        {t(labelKey) || ""}
      </div>
      <div className={`text-[12px] leading-[14px] ${red ? "text-red-500" : "text-[var(--tg-text-color)]"} truncate`}>
        {entries.length === 0
          ? (t(emptyKey) || "")
          : (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {entries.map(([ccy, amt]) => (
                <div key={ccy} className="shrink-0">
                  {/* сначала сумма, потом валюта */}
                  <span className="font-semibold">{amt}</span>&nbsp;{ccy}
                </div>
              ))}
            </div>
          )}
      </div>
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

  const members: GroupMember[] = useMemo(() => {
    if ("members" in group && Array.isArray((group as any).members) && (group as any).members.length > 0) {
      return (group as any).members
    }
    if ("preview_members" in group && Array.isArray((group as any).preview_members)) {
      return (group as any).preview_members
    }
    return []
  }, [group])

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

  // Последняя активность (п.3) — две строки: label + value, минимальные отступы
  const lastActivity = (group as any).last_activity_at
  const toRel = (iso?: string | null): string => {
    if (!iso) return t("last_activity_inactive") || "Неактивна"
    try {
      const d = new Date(iso)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 0) return t("last_activity_today") || "Сегодня"
      if (diffDays === 1) return t("last_activity_yesterday") || "Вчера"
      return (t("last_activity_days_ago", { count: diffDays }) || `${diffDays} дн. назад`)
    } catch {
      return t("last_activity_inactive") || "Неактивна"
    }
  }
  const lastActivityLabel = toRel(lastActivity)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-stretch gap-2 relative
        rounded-lg       /* (п.5) скругление меньше */
        p-1.5            /* (п.5) отступы в 2 раза меньше, было p-3 */
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
      {/* Квадратный аватар */}
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
        {/* 1 строка: Название */}
        <div className="flex items-center justify-between w-full">
          <div className="text-base font-semibold text-[var(--tg-text-color)] truncate">
            {(group as any).name}
          </div>
        </div>

        {/* 2 строка: две колонки с суммами под подписями (п.2) */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <SumsRow
            labelKey="i_owe"
            sums={debts?.owe}
            emptyKey="group_balance_no_debts_left"
            red
          />
          <SumsRow
            labelKey="they_owe_me"
            sums={debts?.owed}
            emptyKey="group_balance_no_debts_right"
            red
          />
        </div>

        {/* 3 строка: участники (5) + последняя активность (две строки, п.3) */}
        <div className="flex items-center justify-between mt-1 min-h-[24px]">
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

            {/* (п.4) +N как «аватар» */}
            {hiddenCount > 0 && (
              <div
                className="ml-[-8px] rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)] text-[11px] text-[var(--tg-hint-color)]"
                style={{
                  borderColor: "var(--tg-card-bg)",
                  width: PARTICIPANT_SIZE,
                  height: PARTICIPANT_SIZE,
                }}
                title={(t("and_more_members", { count: hiddenCount }) || `+${hiddenCount}`) as string}
              >
                +{hiddenCount}
              </div>
            )}
          </div>

          {/* Последняя активность — две строки, минимальные отступы (п.3) */}
          <div className="text-right leading-[14px]">
            <div className="text-[11px] text-[var(--tg-hint-color)]">
              {t("last_activity_label") || "Последняя активность"}
            </div>
            <div className="text-[11px] text-[var(--tg-hint-color)]">
              {lastActivityLabel}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

export default GroupCard
