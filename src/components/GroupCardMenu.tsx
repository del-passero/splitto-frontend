// src/components/GroupCardMenu.tsx

import { useTranslation } from "react-i18next"
import { Archive, RotateCw, Trash2, EyeOff, Eye, Pencil } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void

  // факты о группе/правах
  isOwner: boolean
  isArchived: boolean
  isDeleted: boolean // soft
  isHiddenForMe?: boolean

  // колбэки-операции — РЕАЛЬНО ВЫПОЛНЯЮТ действия (дергают API) во внешнем коде
  onEdit?: () => Promise<void> | void

  onHide?: () => Promise<void> | void
  onUnhide?: () => Promise<void> | void

  onArchive?: () => Promise<void> | void
  onUnarchive?: () => Promise<void> | void

  onSoftDelete?: () => Promise<void> | void
  onHardDelete?: () => Promise<void> | void

  onRestore?: (opts?: { toActive?: boolean }) => Promise<void> | void
}

/** Простой BottomSheet без сторонних библиотек */
export default function GroupCardMenu({
  open,
  onClose,
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

  // матрица пунктов

  const showEdit = true // всем участникам доступно
  const showHide = !isOwner && !isDeleted // участник (не владелец), пока не удалена
  const showArchive = isOwner && !isDeleted && !isArchived
  const showUnarchive = isOwner && !isDeleted && isArchived
  const showSoftDelete = isOwner && !isDeleted // на активной/архивной
  const showRestore = isOwner && isDeleted // только из soft-delete
  const showHardDelete = isOwner && isDeleted // финальное удаление из soft

  // клики
  const click = async (fn?: () => Promise<void> | void) => {
    if (!fn) return
    await fn()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end justify-center"
      onClick={onClose}
    >
      {/* фон */}
      <div className="absolute inset-0 bg-black/30" />

      {/* лист */}
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
              onClick={() => click(onEdit)}
            >
              <Pencil size={18} />
              <span>{t("edit") || "Редактировать"}</span>
            </button>
          )}

          {showHide && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              onClick={() => click(isHiddenForMe ? onUnhide : onHide)}
            >
              {isHiddenForMe ? <Eye size={18} /> : <EyeOff size={18} />}
              <span>{isHiddenForMe ? (t("unhide") || "Показать") : (t("hide") || "Скрыть")}</span>
            </button>
          )}

          {showArchive && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              onClick={() => click(onArchive)}
            >
              <Archive size={18} />
              <span>{t("groups_sort_by_last_activity") ? t("group_status_archived") : "Архивировать"}</span>
            </button>
          )}

          {showUnarchive && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              onClick={() => click(onUnarchive)}
            >
              <RotateCw size={18} />
              <span>{t("groups_sort_by_last_activity") ? t("groups_sort_by_last_activity") && (t("group_status_archived") || "Разархивировать") : "Разархивировать"}</span>
            </button>
          )}

          {showSoftDelete && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl"
              onClick={() => click(onSoftDelete)}
            >
              <Trash2 size={18} />
              <span>{t("delete") || "Удалить"}</span>
            </button>
          )}

          {showRestore && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              onClick={() => click(() => onRestore?.({ toActive: false }))}
            >
              <RotateCw size={18} />
              <span>{t("restore") || "Восстановить"}</span>
            </button>
          )}

          {showHardDelete && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl"
              onClick={() => click(onHardDelete)}
            >
              <Trash2 size={18} />
              <span>{t("delete") || "Удалить"} (hard)</span>
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
