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

  // колбэки-операции
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
  const showEdit = true // всем участникам доступно
  const showHide = !isOwner && !isDeleted // участник (не владелец)
  const showArchive = isOwner && !isDeleted && !isArchived
  const showUnarchive = isOwner && !isDeleted && isArchived
  const showSoftDelete = isOwner && !isDeleted // активная/архивная
  const showRestore = isOwner && isDeleted
  const showHardDelete = isOwner && isDeleted

  // helper: клик с confirm + ловим ошибки (и показываем их)
  const click = async (
    fn: (() => Promise<void> | void) | undefined,
    { confirmText, errorTitle }: { confirmText?: string; errorTitle?: string } = {}
  ) => {
    try {
      if (confirmText) {
        const ok = window.confirm(confirmText)
        if (!ok) return
      }
      await fn?.()
      onClose()
    } catch (e: any) {
      const msg = e?.message || "Action failed"
      window.alert(`${errorTitle || t("error") || "Ошибка"}: ${msg}`)
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
              title={isHiddenForMe ? (t("unhide") || "Показать") : (t("hide") || "Скрыть")}
              onClick={() =>
                click(isHiddenForMe ? onUnhide : onHide, {
                  confirmText: isHiddenForMe ? undefined : undefined, // без подтверждения
                })
              }
            >
              {isHiddenForMe ? <Eye size={18} /> : <EyeOff size={18} />}
              <span>{isHiddenForMe ? (t("unhide") || "Показать") : (t("hide") || "Скрыть")}</span>
            </button>
          )}

          {showArchive && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              title={t("group_status_archived") || "Архивировать"}
              onClick={() =>
                click(onArchive, {
                  confirmText: t("group_status_archived") || "Архивировать группу?",
                  errorTitle: t("error") || "Ошибка",
                })
              }
            >
              <Archive size={18} />
              <span>{t("group_status_archived") || "Архивировать"}</span>
            </button>
          )}

          {showUnarchive && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-[var(--tg-text-color)] hover:bg-[var(--tg-secondary-bg-color)] rounded-xl"
              title={t("groups_sort_dir_asc") ? "Разархивировать" : "Разархивировать"}
              onClick={() =>
                click(onUnarchive, {
                  confirmText: "Разархивировать группу?",
                  errorTitle: t("error") || "Ошибка",
                })
              }
            >
              <RotateCw size={18} />
              <span>Разархивировать</span>
            </button>
          )}

          {showSoftDelete && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl"
              title={(t("delete") || "Удалить") + " — если есть долги, операция невозможна"}
              onClick={() =>
                click(onSoftDelete, {
                  confirmText:
                    "Удалить группу? Если в группе есть долги — операция будет отклонена. Если транзакции есть, но долгов нет — будет мягкое удаление.",
                  errorTitle: t("error") || "Ошибка",
                })
              }
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
              onClick={() =>
                click(() => onRestore?.({ toActive: false }), {
                  confirmText: "Восстановить группу (переведём в архив)?",
                  errorTitle: t("error") || "Ошибка",
                })
              }
            >
              <RotateCw size={18} />
              <span>{t("restore") || "Восстановить"}</span>
            </button>
          )}

          {showHardDelete && (
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl"
              title="Жёсткое удаление — только если в группе нет транзакций"
              onClick={() =>
                click(onHardDelete, {
                  confirmText:
                    "Удаление без возможности восстановления. Продолжить? (Операция доступна только если в группе нет транзакций.)",
                  errorTitle: t("error") || "Ошибка",
                })
              }
            >
              <Trash2 size={18} />
              <span>{(t("delete") || "Удалить") + " (hard)"}</span>
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
