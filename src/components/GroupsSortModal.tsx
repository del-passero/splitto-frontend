// src/components/GroupsSortModal.tsx
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export type SortBy = "last_activity" | "name" | "created_at" | "members_count"
export type SortDir = "asc" | "desc"

type SortState = { sortBy: SortBy; sortDir: SortDir }

type Props = {
  open: boolean
  initial: SortState
  onApply: (s: SortState) => void
  onClose: () => void
}

const ModalShell = ({
  open,
  children,
}: {
  open: boolean
  children: React.ReactNode
}) => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40"
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
  <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)] last:border-b-0">
    {children}
  </div>
)

const Radio = ({
  name,
  value,
  checked,
  label,
  onChange,
}: {
  name: string
  value: string
  checked: boolean
  label: string
  onChange: (v: string) => void
}) => (
  <label className="flex items-center gap-3 py-2 cursor-pointer">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={(e) => onChange(e.target.value)}
      className="accent-[var(--tg-link-color)]"
    />
    <span className="text-sm text-[var(--tg-text-color)]">{label}</span>
  </label>
)

export default function GroupsSortModal({
  open,
  initial,
  onApply,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const [sortBy, setSortBy] = useState<SortBy>(initial.sortBy)
  const [sortDir, setSortDir] = useState<SortDir>(initial.sortDir)

  useEffect(() => {
    if (open) {
      setSortBy(initial.sortBy)
      setSortDir(initial.sortDir)
    }
  }, [open, initial])

  return (
    <ModalShell open={open}>
      <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)]">
        <div className="text-base font-semibold text-[var(--tg-text-color)]">
          {t("groups_sort_title")}
        </div>
      </div>

      <Row>
        <div className="text-xs font-medium text-[var(--tg-hint-color)] mb-2">
          {t("groups_sort_by")}
        </div>
        <div className="flex flex-col">
          <Radio
            name="sortBy"
            value="last_activity"
            checked={sortBy === "last_activity"}
            onChange={(v) => setSortBy(v as SortBy)}
            label={t("groups_sort_by_last_activity") || "Last activity"}
          />
          <Radio
            name="sortBy"
            value="name"
            checked={sortBy === "name"}
            onChange={(v) => setSortBy(v as SortBy)}
            label={t("groups_sort_by_name") || "Name"}
          />
          <Radio
            name="sortBy"
            value="created_at"
            checked={sortBy === "created_at"}
            onChange={(v) => setSortBy(v as SortBy)}
            label={t("groups_sort_by_created_at") || "Created at"}
          />
          <Radio
            name="sortBy"
            value="members_count"
            checked={sortBy === "members_count"}
            onChange={(v) => setSortBy(v as SortBy)}
            label={t("groups_sort_by_members_count") || "Members count"}
          />
        </div>
      </Row>

      <Row>
        <div className="text-xs font-medium text-[var(--tg-hint-color)] mb-2">
          {t("groups_sort_dir")}
        </div>
        <div className="flex flex-col">
          <Radio
            name="sortDir"
            value="asc"
            checked={sortDir === "asc"}
            onChange={(v) => setSortDir(v as SortDir)}
            label={t("groups_sort_dir_asc") || "Ascending"}
          />
          <Radio
            name="sortDir"
            value="desc"
            checked={sortDir === "desc"}
            onChange={(v) => setSortDir(v as SortDir)}
            label={t("groups_sort_dir_desc") || "Descending"}
          />
        </div>
      </Row>

      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <button
          type="button"
          className="px-3 py-2 text-sm rounded-lg bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)]"
          onClick={() => {
            setSortBy("last_activity")
            setSortDir("desc")
          }}
        >
          {t("reset_filters")}
        </button>
        <button
          type="button"
          className="px-3 py-2 text-sm rounded-lg bg-[var(--tg-link-color)] text-white"
          onClick={() => {
            onApply({ sortBy, sortDir })
            onClose()
          }}
        >
          {t("apply")}
        </button>
      </div>
    </ModalShell>
  )
}
