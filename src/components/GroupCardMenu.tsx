// src/components/GroupCardMenu.tsx

import { useTranslation } from "react-i18next"
import { Archive, RotateCw, Trash2, EyeOff, Eye, Pencil } from "lucide-react"
import { getDeletePreview } from "../api/groupsApi"

type Props = {
  open: boolean
  onClose: () => void

  // идентификатор для предпросмотра удаления
  groupId: number

  // факты о группе/правах
  isOwner: boolean
  isArchived: boolean
  isDeleted: boolean // soft
  isHiddenForMe?: boolean

  // колбэки-операции (реальные вызовы API приходят сверху)
  onEdit?: () => Promise<void> | void

  onHide?: () => Promise<void> | void
  onUnhide?: () => Promise<void> | void

  onArchive?: () => Promise<void> | void
  onUnarchive?: () => Promise<void> | void

  onSoftDelete?: () => Promise<void> | void
  onHardDelete?: () => Promise<void> | void

  onRestore?: (opts?: { toActive?: boolean }) => Promise<void> | void
}

export default function GroupCardMenu({
  open,
  onClose,
  groupId,
  isOwner,
  isArchived,
  isDeleted,
  isHiddenForMe,
  onEdit,
  onHide,
  onUnhide,
  onArchive,
  onUnarchive,
  onSoftDelete,
  onHardDelete,
  onRestore,
}: Props) {
  const { t } = useTranslation()
  if (!open) return null

  // матрица показа
  // Редактирование — только активные (не архив и не удалена)
  const showEdit       = !isDeleted && !isArchived
  // Скрыть/Показать — доступно в любых состояниях; сохраним прежнюю логику (для владельца можно отключать при желании)
  const showHide       = true
  // Архивировать/Разархивировать — показываем и для deleted-групп (по уточнению)
  const showArchive    = isOwner && !isArchived
  const showUnarchive  = isOwner && isArchived
  // Удалить — один пункт; если уже soft-deleted, пункт не показываем
  const showDelete     = isOwner && !isDeleted
  // Восстановить — только для soft-deleted
  const showRestore    = isOwner && isDeleted

  // --- спец-обработчики под ТЗ (модалки через i18n) ---

  const handleArchive = async () => {
    const confirmText = t("group_modals.archive_confirm") as string
    if (!window.confirm(confirmText)) return
    try {
      await onArchive?.()
      onClose()
    } catch (_e) {
      // По ТЗ: в случае долгов показать отдельную модалку
      window.alert(t("group_modals.archive_forbidden_debts") as string)
    }
  }

  const handleUnarchive = async () => {
    const confirmText = t("group_modals.unarchive_confirm") as string
    if (!window.confirm(confirmText)) return
    try {
      await onUnarchive?.()
      onClose()
    } catch (e: any) {
      const msg = e?.message || (t("error") as string)
      window.alert(msg)
    }
  }

  const handleDelete = async () => {
    try {
      const preview = await getDeletePreview(groupId)
      if (preview.mode === "forbidden") {
        window.alert(t("group_modals.delete_forbidden_debts") as string)
        return
      }
      if (preview.mode === "soft") {
        const ok = window.confirm(t("group_modals.delete_soft_confirm") as string)
        if (!ok) return
        await onSoftDelete?.()
        onClose()
        return
      }
      if (preview.mode === "hard") {
        const ok = window.confirm(t("group_modals.delete_hard_confirm") as string)
        if (!ok) return
        await onHardDelete?.()
        onClose()
        return
      }
      // disabled/прочее — ничего не делаем
    } catch (e: any) {
      const msg = e?.message || (t("delete_failed") as string)
      window.alert(`${t("error")}: ${msg}`)
    }
  }

  const handleRestore = async () => {
    const ok = window.confirm(t("group_modals.restore_confirm") as string)
    if (!ok) return
    try {
      await onRestore?.({ toActive: true })
      onClose()
    } catch (e: any) {
      const msg = e?.message || (t("error") as string)
      window.alert(msg)
    }
  }

  const clickPlain = async (fn?: () => Promise<void> | void) => {
    try {
      await fn?.()
      onClose()
    } catch (e: any) {
      const msg = e?.message || (t("error") as string)
      window.alert(msg)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end justify-center"
      onClick={onClose}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* sheet */}
      <div
        className="relative w-full max-w-md rounded-t-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color)] p-1 pb-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-[var(--tg-secondary-bg-color)]" />

        <div className="flex flex-col py-1">
          {showEdit && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              title={t("edit") || "Редактировать"}
              onClick={() => clickPlain(onEdit)}
            >
              <Pencil size={18} />
              <span>{t("edit") || "Редактировать"}</span>
            </button>
          )}

          {showHide && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              title={isHiddenForMe ? (t("unhide") || "Показать") : (t("hide") || "Скрыть")}
              onClick={() => clickPlain(isHiddenForMe ? onUnhide : onHide)}
            >
              {isHiddenForMe ? <Eye size={18} /> : <EyeOff size={18} />}
              <span>{isHiddenForMe ? (t("unhide") || "Показать") : (t("hide") || "Скрыть")}</span>
            </button>
          )}

          {showArchive && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              title={t("archive") || "Архивировать"}
              onClick={handleArchive}
            >
              <Archive size={18} />
              <span>{t("archive") || "Архивировать"}</span>
            </button>
          )}

          {showUnarchive && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              title={t("unarchive") || "Разархивировать"}
              onClick={handleUnarchive}
            >
              <RotateCw size={18} />
              <span>{t("unarchive") || "Разархивировать"}</span>
            </button>
          )}

          {showDelete && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl"
              title={t("delete") || "Удалить"}
              onClick={handleDelete}
            >
              <Trash2 size={18} />
              <span>{t("delete") || "Удалить"}</span>
            </button>
          )}

          {showRestore && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              title={t("restore") || "Восстановить"}
              onClick={handleRestore}
            >
              <RotateCw size={18} />
              <span>{t("restore") || "Восстановить"}</span>
            </button>
          )}
        </div>

        <div className="px-4 pt-2">
          <button
            type="button"
            className="w-full h-10 rounded-xl bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)] hover:bg-[var(--tg-link-color)] hover:text-white transition"
            onClick={onClose}
          >
            {t("close") || "Закрыть"}
          </button>
        </div>
      </div>
    </div>
  )
}
