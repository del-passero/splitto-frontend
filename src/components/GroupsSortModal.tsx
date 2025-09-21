// src/components/GroupsSortModal.tsx
// Стиль — как у GroupsFilterModal: нижний лист, z поверх FAB.
// Макет: по одному пункту в строке, шрифт text-sm для подписей.

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

const Row = ({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left flex items-center justify-between px-4 py-3 border-b border-[var(--tg-secondary-bg-color)] last:border-b-0 hover:bg-[var(--tg-secondary-bg-color)]/40"
  >
    {children}
  </button>
)

const Radio = ({
  checked,
  ariaLabel,
}: {
  checked: boolean
  ariaLabel?: string
}) => (
  <span
    aria-label={ariaLabel}
    className={`h-5 w-5 rounded-full border flex items-center justify-center ${
      checked ? "border-[var(--tg-link-color)]" : "border-[var(--tg-secondary-bg-color)]"
    }`}
  >
    {checked && <span className="h-2.5 w-2.5 rounded-full bg-[var(--tg-link-color)]" />}
  </span>
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

      {/* Поле сортировки — по одному пункту в строке */}
      <Row onClick={() => setState(s => ({ ...s, sortBy: "last_activity" }))}>
        <div className="text-sm text-[var(--tg-text-color)]">
          {t("groups_sort_by_last_activity") || "Последняя активность"}
        </div>
        <Radio
          checked={state.sortBy === "last_activity"}
          ariaLabel="last_activity"
        />
      </Row>

      <Row onClick={() => setState(s => ({ ...s, sortBy: "name" }))}>
        <div className="text-sm text-[var(--tg-text-color)]">
          {t("groups_sort_by_name") || "Название"}
        </div>
        <Radio checked={state.sortBy === "name"} ariaLabel="name" />
      </Row>

      <Row onClick={() => setState(s => ({ ...s, sortBy: "created_at" }))}>
        <div className="text-sm text-[var(--tg-text-color)]">
          {t("groups_sort_by_created_at") || "Дата создания"}
        </div>
        <Radio checked={state.sortBy === "created_at"} ariaLabel="created_at" />
      </Row>

      <Row onClick={() => setState(s => ({ ...s, sortBy: "members_count" }))}>
        <div className="text-sm text-[var(--tg-text-color)]">
          {t("groups_sort_by_members_count") || "Число участников"}
        </div>
        <Radio
          checked={state.sortBy === "members_count"}
          ariaLabel="members_count"
        />
      </Row>

      {/* Направление — также один пункт в строке */}
      <Row onClick={() => setState(s => ({ ...s, sortDir: "asc" }))}>
        <div className="text-sm text-[var(--tg-text-color)]">
          {t("groups_sort_dir_asc") || "По возрастанию"}
        </div>
        <Radio checked={state.sortDir === "asc"} ariaLabel="asc" />
      </Row>

      <Row onClick={() => setState(s => ({ ...s, sortDir: "desc" }))}>
        <div className="text-sm text-[var(--tg-text-color)]">
          {t("groups_sort_dir_desc") || "По убыванию"}
        </div>
        <Radio checked={state.sortDir === "desc"} ariaLabel="desc" />
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
