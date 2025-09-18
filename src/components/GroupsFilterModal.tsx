// src/components/GroupsFilterModal.tsx
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export type FiltersState = {
  includeArchived: boolean
  includeHidden: boolean
}

type Props = {
  open: boolean
  initial: FiltersState
  onApply: (f: FiltersState) => void
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
  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tg-secondary-bg-color)] last:border-b-0">
    {children}
  </div>
)

const Switch = ({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel?: string
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 rounded-full transition ${
      checked ? "bg-[var(--tg-link-color)]" : "bg-[var(--tg-secondary-bg-color)]"
    }`}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
        checked ? "right-0.5" : "left-0.5"
      }`}
    />
  </button>
)

export default function GroupsFilterModal({
  open,
  initial,
  onApply,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const [state, setState] = useState<FiltersState>(initial)

  useEffect(() => {
    if (open) setState(initial)
  }, [open, initial])

  return (
    <ModalShell open={open}>
      <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)]">
        <div className="text-base font-semibold text-[var(--tg-text-color)]">
          {t("groups_filter_title")}
        </div>
      </div>

      {/* Статус: просто переключатель "Архивные" включено/выключено */}
      <Row>
        <div className="text-sm text-[var(--tg-text-color)]">
          {t("groups_filter_status_archived")}
        </div>
        <Switch
          checked={state.includeArchived}
          onChange={(v) => setState((s) => ({ ...s, includeArchived: v }))}
          ariaLabel={t("groups_filter_status_archived") || "Archived"}
        />
      </Row>

      {/* Скрытые мной */}
      <Row>
        <div className="text-sm text-[var(--tg-text-color)]">
          {t("groups_filter_hidden")}
        </div>
        <Switch
          checked={state.includeHidden}
          onChange={(v) => setState((s) => ({ ...s, includeHidden: v }))}
          ariaLabel={t("groups_filter_hidden") || "Hidden by me"}
        />
      </Row>

      {/* Кнопки */}
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <button
          type="button"
          className="px-3 py-2 text-sm rounded-lg bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)]"
          onClick={() =>
            setState({
              includeArchived: false,
              includeHidden: false,
            })
          }
        >
          {t("reset_filters")}
        </button>
        <button
          type="button"
          className="px-3 py-2 text-sm rounded-lg bg-[var(--tg-link-color)] text-white"
          onClick={() => {
            onApply(state)
            onClose()
          }}
        >
          {t("apply")}
        </button>
      </div>
    </ModalShell>
  )
}
