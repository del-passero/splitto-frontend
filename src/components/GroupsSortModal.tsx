// src/components/GroupsSortModal.tsx
// Стиль — как у GroupsFilterModal: нижний лист, z поверх FAB.

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export type SortBy = "last_activity" | "name" | "created_at" | "members_count"
export type SortDir = "asc" | "desc"

type Initial = {
  sortBy: SortBy
  sortDir: SortDir
}

type Props = {
  open: boolean
  initial: Initial
  onApply: (s: Initial) => void
  onClose: () => void
}

const ModalShell = ({ open, children }: { open: boolean; children: React.ReactNode }) => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-md sm:rounded-2xl sm:shadow-xl bg-[var(--tg-bg-color)] border border-[var(--tg-secondary-bg-color)]">
        {children}
      </div>
    </div>
  )
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tg-secondary-bg-color)] last:border-b-0">
    {children}
  </div>
)

const Radio = ({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: () => void
  ariaLabel?: string
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={(e) => {
      e.stopPropagation()
      onChange()
    }}
    className={`h-5 w-5 rounded-full border flex items-center justify-center ${
      checked ? "border-[var(--tg-link-color)]" : "border-[var(--tg-secondary-bg-color)]"
    }`}
  >
    {checked && <span className="h-2.5 w-2.5 rounded-full bg-[var(--tg-link-color)]" />}
  </button>
)

export default function GroupsSortModal({ open, initial, onApply, onClose }: Props) {
  const { t } = useTranslation()
  const [state, setState] = useState<Initial>(initial)

  useEffect(() => {
    if (open) setState(initial)
  }, [open, initial])

  return (
    <ModalShell open={open}>
      {/* Заголовок */}
      <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)]">
        <div className="text-base font-semibold text-[var(--tg-text-color)]">
          {t("groups_sort_title") || "Сортировка"}
        </div>
      </div>

      {/* Поля сортировки */}
      <Row>
        <div className="text-sm text-[var(--tg-text-color)]">{t("groups_sort_by") || "Поле сортировки"}</div>
        <div className="flex items-center gap-3">
          {/* last_activity */}
          <div className="flex items-center gap-2">
            <Radio
              checked={state.sortBy === "last_activity"}
              onChange={() => setState((s) => ({ ...s, sortBy: "last_activity" }))}
              ariaLabel="last_activity"
            />
            <span className="text-sm">{t("groups_sort_by_last_activity") || "Активность"}</span>
          </div>
          {/* name */}
          <div className="flex items-center gap-2">
            <Radio
              checked={state.sortBy === "name"}
              onChange={() => setState((s) => ({ ...s, sortBy: "name" }))}
              ariaLabel="name"
            />
            <span className="text-sm">{t("groups_sort_by_name") || "Имя"}</span>
          </div>
        </div>
      </Row>

      <Row>
        <div />
        <div className="flex items-center gap-3">
          {/* created_at */}
          <div className="flex items-center gap-2">
            <Radio
              checked={state.sortBy === "created_at"}
              onChange={() => setState((s) => ({ ...s, sortBy: "created_at" }))}
              ariaLabel="created_at"
            />
            <span className="text-sm">{t("groups_sort_by_created_at") || "Создание"}</span>
          </div>
          {/* members_count */}
          <div className="flex items-center gap-2">
            <Radio
              checked={state.sortBy === "members_count"}
              onChange={() => setState((s) => ({ ...s, sortBy: "members_count" }))}
              ariaLabel="members_count"
            />
            <span className="text-sm">{t("groups_sort_by_members_count") || "Участники"}</span>
          </div>
        </div>
      </Row>

      {/* Направление */}
      <Row>
        <div className="text-sm text-[var(--tg-text-color)]">{t("groups_sort_dir") || "Направление"}</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Radio
              checked={state.sortDir === "asc"}
              onChange={() => setState((s) => ({ ...s, sortDir: "asc" }))}
              ariaLabel="asc"
            />
            <span className="text-sm">{t("groups_sort_dir_asc") || "По возрастанию"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio
              checked={state.sortDir === "desc"}
              onChange={() => setState((s) => ({ ...s, sortDir: "desc" }))}
              ariaLabel="desc"
            />
            <span className="text-sm">{t("groups_sort_dir_desc") || "По убыванию"}</span>
          </div>
        </div>
      </Row>

      {/* Кнопки */}
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <button
          type="button"
          className="px-3 py-2 text-sm rounded-lg bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)]"
          onClick={onClose}
        >
          {t("close") || "Закрыть"}
        </button>
        <button
          type="button"
          className="px-3 py-2 text-sm rounded-lg bg-[var(--tg-link-color)] text-white"
          onClick={() => {
            onApply(state)
            onClose()
          }}
        >
          {t("apply") || "Применить"}
        </button>
      </div>
    </ModalShell>
  )
}
