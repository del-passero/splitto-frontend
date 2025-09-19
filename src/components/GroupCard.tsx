// src/components/GroupCard.tsx

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import GroupAvatar from "./GroupAvatar"
import Avatar from "./Avatar"
import type { Group, GroupPreview } from "../types/group"
import type { GroupMember } from "../types/group_member"
import { Archive, Trash2, Send, MoreVertical } from "lucide-react"

type DebtsPreview = {
  /** Я должен (по модулю): { "USD": 12.34, "RUB": 350 } */
  owe?: Record<string, number>
  /** Мне должны: { "USD": 9.99, "EUR": 15 } */
  owed?: Record<string, number>
}

type Props = {
  group: GroupPreview | Group
  onClick: () => void
  /** Клик по кнопке меню ⋮ (открыть BottomSheet/Popover с пунктами) */
  onMenuClick?: (groupId: number) => void
  /** Превью долгов для карточки */
  debts?: DebtsPreview
  className?: string
}

const AVATAR_SIZE = 72       // квадратный, на высоту карточки (минимум)
const PARTICIPANT_SIZE = 24
const MAX_ICONS_INLINE = 5   // правило показа участников (см. строка 1)

function formatLastActivity(t: (k: string, o?: any) => string, iso?: string | null): string {
  if (!iso) return t("last_activity_inactive") || "Неактивна"
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return `${t("last_activity_label")} ${t("last_activity_today")}`
    if (diffDays === 1) return `${t("last_activity_label")} ${t("last_activity_yesterday")}`
    return `${t("last_activity_label")} ${t("last_activity_days_ago", { count: diffDays })}`
  } catch {
    return t("last_activity_inactive") || "Неактивна"
  }
}

function MoneyList({
  entries,
  colorClass,
}: {
  entries: [string, number][]
  colorClass: string
}) {
  // Горизонтальная прокрутка, без переносов, разделитель "; "
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
      {entries.map(([ccy, amt]) => (
        <span key={ccy} className={`shrink-0 ${colorClass}`}>
          <span className="font-semibold">{amt}</span>&nbsp;{ccy}
        </span>
      ))}
    </div>
  )
}

export default function GroupCard({
  group,
  onClick,
  onMenuClick,
  debts,
  className = "",
}: Props) {
  const { t } = useTranslation()

  // --- участники (детали или превью) ---
  const members: GroupMember[] = useMemo(() => {
    if ("members" in group && Array.isArray((group as any).members) && (group as any).members.length > 0) {
      return (group as any).members
    }
    if ("preview_members" in group && Array.isArray((group as any).preview_members)) {
      return (group as any).preview_members
    }
    return []
  }, [group])

  // владелец первым
  const sortedMembers = useMemo(() => {
    if (!members.length) return []
    const ownerId = (group as any).owner_id
    return [
      ...members.filter((m) => m.user.id === ownerId),
      ...members.filter((m) => m.user.id !== ownerId),
    ]
  }, [members, (group as any).owner_id])

  // логика отображения 5 / (4 + “+N”)
  const totalCount = (group as any).members_count ?? sortedMembers.length
  const showPlus = totalCount > MAX_ICONS_INLINE
  const maxVisible = showPlus ? 4 : Math.min(MAX_ICONS_INLINE, sortedMembers.length)
  const displayedMembers = sortedMembers.slice(0, maxVisible)
  const hiddenCount = Math.max(0, totalCount - 4)

  // статусы
  const isArchived = (group as any).status === "archived"
  const isDeleted = !!(group as any).deleted_at
  const isTelegramLinked = !!(group as any).is_telegram_linked

  // активность: одна строка
  const lastActivity = (group as any).last_activity_at
  const activityText = lastActivity
    ? formatLastActivity(t, lastActivity) // "Последняя активность Сегодня/Вчера/N дн. назад"
    : t("last_activity_inactive") || "Неактивна"

  // долги (строки 2 и 3): если пусто — показываем emptyKey вместо лейбла
  const oweEntries = Object.entries(debts?.owe || {})
  const owedEntries = Object.entries(debts?.owed || {})

  return (
    <div
      className={`
        w-full flex items-stretch relative gap-2
        rounded-lg p-1.5
        border bg-[var(--tg-card-bg)] border-[var(--tg-hint-color)]
        shadow-[0_4px_18px_-10px_rgba(83,147,231,0.14)]
        hover:shadow-[0_10px_28px_-12px_rgba(83,147,231,0.20)]
        transition
        ${className}
      `}
    >
      {/* Левая колонка — квадратный аватар */}
      <button
        type="button"
        onClick={onClick}
        className="flex-shrink-0 relative"
        aria-label={(group as any).name}
      >
        <GroupAvatar
          name={(group as any).name}
          size={AVATAR_SIZE}
          className="relative"
        />
      </button>

      {/* Правая колонка — 4 строки */}
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col justify-between flex-1 min-w-0 text-left"
        aria-label={(group as any).name}
      >
        {/* 1-я строка: название (2/3) + участники (1/3) */}
        <div className="w-full grid grid-cols-3 gap-2 items-center">
          <div className="col-span-2 min-w-0">
            <div className="text-[15px] font-semibold text-[var(--tg-text-color)] truncate">
              {(group as any).name}
            </div>
          </div>
          <div className="col-span-1 flex items-center justify-end">
            <div className="flex items-center">
              {displayedMembers.map((m, idx) => (
                <div
                  key={m.id}
                  className="rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)]"
                  style={{
                    borderColor: "var(--tg-card-bg)",
                    width: PARTICIPANT_SIZE,
                    height: PARTICIPANT_SIZE,
                    marginLeft: idx > 0 ? -8 : 0,
                    zIndex: maxVisible - idx,
                  }}
                  title={
                    m.user.first_name
                      ? `${m.user.first_name} ${m.user.last_name || ""}`.trim()
                      : m.user.username || ""
                  }
                >
                  <Avatar
                    name={
                      m.user.first_name
                        ? `${m.user.first_name} ${m.user.last_name || ""}`.trim()
                        : m.user.username || ""
                    }
                    src={m.user.photo_url}
                    size={PARTICIPANT_SIZE}
                  />
                </div>
              ))}

              {/* “+N” как аватар, если участников > 5 */}
              {showPlus && hiddenCount > 0 && (
                <div
                  className="ml-[-8px] rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)] text-[11px] text-[var(--tg-hint-color)]"
                  style={{
                    borderColor: "var(--tg-card-bg)",
                    width: PARTICIPANT_SIZE,
                    height: PARTICIPANT_SIZE,
                  }}
                  title={t("and_more_members", { count: hiddenCount }) || `+${hiddenCount}`}
                >
                  +{hiddenCount}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-я строка — “Я должен” */}
        <div className="w-full">
          {oweEntries.length === 0 ? (
            <div className="text-[12px] leading-[14px] text-[var(--tg-hint-color)]">
              {t("group_balance_no_debts_left")}
            </div>
          ) : (
            <div className="text-[12px] leading-[14px] text-[var(--tg-text-color)] min-w-0">
              <span>{t("i_owe")}: </span>
              <MoneyList entries={oweEntries} colorClass="text-red-500" />
            </div>
          )}
        </div>

        {/* 3-я строка — “Мне должны” */}
        <div className="w-full">
          {owedEntries.length === 0 ? (
            <div className="text-[12px] leading-[14px] text-[var(--tg-hint-color)]">
              {t("group_balance_no_debts_right")}
            </div>
          ) : (
            <div className="text-[12px] leading-[14px] text-[var(--tg-text-color)] min-w-0">
              <span>{t("they_owe_me")}: </span>
              <MoneyList entries={owedEntries} colorClass="text-green-600" />
            </div>
          )}
        </div>

        {/* 4-я строка — Активность (2/3) + Статусы (1/3) */}
        <div className="w-full grid grid-cols-3 gap-2 items-center">
          {/* слева — одна строка активности */}
          <div className="col-span-2 min-w-0">
            <div className="text-[11px] leading-[14px] text-[var(--tg-hint-color)] truncate">
              {activityText}
            </div>
          </div>

          {/* справа — до двух иконок статусов (удалено/архив + telegram) */}
          <div className="col-span-1 flex items-center justify-end gap-2">
            {/* Удалено и Архив — взаимоисключающие */}
            {isDeleted ? (
              <div className="flex items-center gap-1 text-[var(--tg-hint-color)]" title={t("group_status_deleted") || "Удалена"}>
                <Trash2 size={16} />
              </div>
            ) : isArchived ? (
              <div className="flex items-center gap-1 text-[var(--tg-hint-color)]" title={t("group_status_archived") || "Архив"}>
                <Archive size={16} />
              </div>
            ) : null}

            {/* Telegram линк */}
            {isTelegramLinked && (
              <div className="flex items-center gap-1 text-[var(--tg-hint-color)]" title={t("group_linked_telegram") || "Связана с Telegram"}>
                <Send size={16} />
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Правая вертикальная колонка — кнопка “⋮” на всю высоту карточки */}
      <div className="flex flex-col items-center justify-center">
        <button
          type="button"
          aria-label={t("actions") || "Действия"}
          onClick={() => onMenuClick?.((group as any).id)}
          className="
            h-full px-2
            text-[var(--tg-hint-color)]
            hover:text-[var(--tg-text-color)]
            active:scale-[0.98]
          "
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  )
}
