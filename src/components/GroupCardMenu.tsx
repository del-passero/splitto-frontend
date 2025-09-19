// src/components/GroupCardMenu.tsx

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Archive, ArchiveRestore, Eye, EyeOff, Pencil, RotateCcw, Trash2 } from "lucide-react"

type GroupContext = {
  id: number
  name: string
  isOwner: boolean
  isArchived: boolean
  isDeleted: boolean // soft-deleted
  isHidden: boolean // персонально скрыта для текущего пользователя
  hasDebts?: boolean
  hasTransactions?: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  /** Координаты якоря — куда «приклеить» меню */
  anchor?: { x: number; y: number }
  /** Данные о группе и правах */
  context: GroupContext | null

  // Коллбэки действий
  onEdit: (id: number) => void
  onToggleHide: (id: number, hide: boolean) => void
  onToggleArchive: (id: number, toArchive: boolean) => void
  onDeleteSoft: (id: number) => void
  onDeleteHard: (id: number) => void
  onRestore: (id: number, toActive: boolean) => void
}

const Item = ({
  icon,
  label,
  onClick,
  danger = false,
  disabled = false,
  hint,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  hint?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-center gap-2 px-3 py-2 text-left
      ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--tg-secondary-bg-color)]"}
      ${danger ? "text-red-500" : "text-[var(--tg-text-color)]"}
    `}
    title={hint}
    role="menuitem"
  >
    <span className="shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
)

export default function GroupCardMenu({
  open,
  onClose,
  anchor,
  context,
  onEdit,
  onToggleHide,
  onToggleArchive,
  onDeleteSoft,
  onDeleteHard,
  onRestore,
}: Props) {
  const { t } = useTranslation()

  const style = useMemo<React.CSSProperties>(() => {
    if (!anchor) return { position: "fixed", right: 12, top: 12 }
    // Простейшее позиционирование без порталов/попперов
    return { position: "fixed", left: anchor.x, top: anchor.y + 8, transform: "translate(-100%, 0)" }
  }, [anchor])

  if (!open || !context) return null

  const {
    id,
    isOwner,
    isArchived,
    isDeleted,
    isHidden,
    hasDebts = false,
    hasTransactions = false,
  } = context

  const canArchiveToggle = isOwner && !isDeleted
  const canDelete = isOwner && !isDeleted
  const canRestore = isOwner && isDeleted
  const canHideToggle = !isOwner && !isDeleted // владелец скрывать/показывать не может

  const hardDeletePossible = canDelete && !hasTransactions
  const softDeletePossible = canDelete && !hasDebts && hasTransactions

  return (
    <>
      {/* затемнение для клика вне меню */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20"
        aria-hidden
      />
      <div
        className="z-50 min-w-[220px] rounded-xl border bg-[var(--tg-card-bg)] border-[var(--tg-secondary-bg-color)] shadow-lg overflow-hidden"
        style={style}
        role="menu"
      >
        {/* Редактировать — всем участникам (кроме soft-deleted) */}
        {!isDeleted && (
          <Item
            icon={<Pencil size={16} />}
            label={t("edit") || "Редактировать"}
            onClick={() => { onClose(); onEdit(id) }}
          />
        )}

        {/* Скрыть/Показать — участник (не владелец), не soft-deleted */}
        {canHideToggle && (
          <Item
            icon={isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
            label={
              isHidden
                ? (t("groups_filter_hidden_visible") || "Показать")
                : (t("groups_filter_hidden_hidden") || "Скрыть")
            }
            onClick={() => { onClose(); onToggleHide(id, !isHidden) }}
          />
        )}

        {/* Архивировать/Разархивировать — владелец, не soft-deleted */}
        {canArchiveToggle && (
          <Item
            icon={isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            label={isArchived ? (t("unarchive") as any) || "Разархивировать"
                              : (t("archive") as any) || "Архивировать"}
            onClick={() => { onClose(); onToggleArchive(id, !isArchived) }}
          />
        )}

        {!isDeleted && <div className="h-px my-1 bg-[var(--tg-secondary-bg-color)]" />}

        {/* Удаление (soft/hard) — владелец, не soft-deleted */}
        {!isDeleted && canDelete && (
          <Item
            icon={<Trash2 size={16} />}
            label={t("delete") || "Удалить"}
            danger
            disabled={!(hardDeletePossible || softDeletePossible)}
            hint={
              hardDeletePossible
                ? undefined
                : softDeletePossible
                  ? (t("errors.delete_forbidden") || "Безвозвратное удаление недоступно — есть транзакции. Будет выполнено обычное удаление.")
                  : hasDebts
                    ? (t("group_settings_cannot_leave_due_debt") || "Есть непогашенные долги")
                    : undefined
            }
            onClick={() => {
              onClose()
              if (!hasTransactions) {
                onDeleteHard(id)   // hard delete
              } else {
                onDeleteSoft(id)   // soft delete
              }
            }}
          />
        )}

        {/* Восстановить — владелец, если soft-deleted */}
        {isDeleted && canRestore && (
          <Item
            icon={<RotateCcw size={16} />}
            label={(t("restore") as any) || "Восстановить"}
            onClick={() => { onClose(); onRestore(id, false) /* -> архив */ }}
          />
        )}
      </div>
    </>
  )
}
