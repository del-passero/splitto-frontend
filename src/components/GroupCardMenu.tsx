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

  // ЕДИНСТВЕННОЕ «Удалить» — бэкенд сам решает soft/hard
  onSoftDelete?: () => Promise<void> | void

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
  onRestore,
}: Props) {
  const { t } = useTranslation()
  if (!open) return null

  // Видимость пунктов:
  // - Редактировать: только для активных
  // - Скрыть/Показать: для всех состояний (персональная настройка)
  // - Архивировать/Разархивировать: только для владельца, и ТОЛЬКО если группа не deleted
  // - Удалить: только для владельца и ТОЛЬКО если группа не archived и не deleted
  // - Восстановить: только для владельца и ТОЛЬКО если группа deleted
  const showEdit       = !isDeleted && !isArchived
  const showHide       = true
  const showArchive    = isOwner && !isDeleted && !isArchived
  const showUnarchive  = isOwner && !isDeleted && isArchived
  const showDelete     = isOwner && !isDeleted && !isArchived
  const showRestore    = isOwner && isDeleted

  const normalizeErrorMessage = (e: any): string => {
    const raw: string = e?.message || ""
    // Если сервер вернул текст про «непогашенные долги» — используем локализованный ключ
    if (/unsettled|cannot be (deleted|archived)|долг/i.test(raw)) {
      return (t("delete_forbidden_debts_note") as string) || raw
    }
    return raw || (t("error") as string)
  }

  const click = async (
    fn: (() => Promise<void> | void) | undefined,
    confirmKey?: string,
    errorTitle?: string
  ) => {
    try {
      if (confirmKey) {
        const ok = window.confirm(t(confirmKey) as string)
        if (!ok) return
      }
      await fn?.()
      onClose()
    } catch (e: any) {
      const msg = normalizeErrorMessage(e)
      window.alert(`${errorTitle || (t("error") as string)}: ${msg}`)
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
              title={t("archive") || "Архивировать"}
              onClick={() => click(onArchive, "group_modals.archive_confirm")}
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
              onClick={() => click(onUnarchive, "group_modals.unarchive_confirm")}
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
              onClick={() => click(onSoftDelete, "group_modals.delete_soft_confirm")}
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
              onClick={() => click(() => onRestore?.({ toActive: true }), "group_modals.restore_confirm")}
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
