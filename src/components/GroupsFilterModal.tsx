// src/components/GroupsFilterModal.tsx
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export type FiltersState = {
  status: { active: boolean; archived: boolean; deleted: boolean }
  hidden: { visible: boolean; hidden: boolean }
  activity: { recent: boolean; inactive: boolean; empty: boolean }
}

type Props = {
  open: boolean
  initial: FiltersState
  onApply: (f: FiltersState) => void
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

const Row = ({ title, right }: { title: string; right: React.ReactNode }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tg-secondary-bg-color)] last:border-b-0">
    <div className="text-sm text-[var(--tg-text-color)]">{title}</div>
    {right}
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

export default function GroupsFilterModal({ open, initial, onApply, onClose }: Props) {
  const { t } = useTranslation()
  const [state, setState] = useState<FiltersState>(initial)

  useEffect(() => {
    if (open) setState(initial)
  }, [open, initial])

  const setStatus = (k: keyof FiltersState["status"], v: boolean) =>
    setState((s) => ({ ...s, status: { ...s.status, [k]: v } }))
  const setHidden = (k: keyof FiltersState["hidden"], v: boolean) =>
    setState((s) => ({ ...s, hidden: { ...s.hidden, [k]: v } }))
  const setActivity = (k: keyof FiltersState["activity"], v: boolean) =>
    setState((s) => ({ ...s, activity: { ...s.activity, [k]: v } }))

  const reset = () =>
    setState({
      status: { active: true, archived: false, deleted: false },
      hidden: { visible: true, hidden: false },
      activity: { recent: false, inactive: false, empty: false },
    })

  return (
    <ModalShell open={open}>
      <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)]">
        <div className="text-base font-semibold text-[var(--tg-text-color)]">{t("groups_filter_title")}</div>
      </div>

      {/* Статус */}
      <Row
        title={t("groups_filter_status_active") || "Активные"}
        right={<Switch checked={state.status.active} onChange={(v) => setStatus("active", v)} ariaLabel={t("groups_filter_status_active") || "Active"} />}
      />
      <Row
        title={t("groups_filter_status_archived") || "Архивные"}
        right={<Switch checked={state.status.archived} onChange={(v) => setStatus("archived", v)} ariaLabel={t("groups_filter_status_archived") || "Archived"} />}
      />
      <Row
        title={t("groups_filter_status_deleted") || "Удалённые"}
        right={<Switch checked={state.status.deleted} onChange={(v) => setStatus("deleted", v)} ariaLabel={t("groups_filter_status_deleted") || "Deleted"} />}
      />

      {/* Скрытые/Видимые */}
      <Row
        title={t("groups_filter_hidden_visible") || "Видимые"}
        right={<Switch checked={state.hidden.visible} onChange={(v) => setHidden("visible", v)} ariaLabel={t("groups_filter_hidden_visible") || "Visible"} />}
      />
      <Row
        title={t("hide") || "Скрытые"}
        right={<Switch checked={state.hidden.hidden} onChange={(v) => setHidden("hidden", v)} ariaLabel={t("hide") || "Hidden"} />}
      />

      {/* Активность */}
      <Row
        title={t("groups_filter_activity_recent") || "Недавняя активность"}
        right={<Switch checked={state.activity.recent} onChange={(v) => setActivity("recent", v)} ariaLabel={t("groups_filter_activity_recent") || "Recent"} />}
      />
      <Row
        title={t("groups_filter_activity_inactive") || "Неактивная"}
        right={<Switch checked={state.activity.inactive} onChange={(v) => setActivity("inactive", v)} ariaLabel={t("groups_filter_activity_inactive") || "Inactive"} />}
      />
      <Row
        title={t("groups_filter_activity_empty") || "Без транзакций"}
        right={<Switch checked={state.activity.empty} onChange={(v) => setActivity("empty", v)} ariaLabel={t("groups_filter_activity_empty") || "Empty"} />}
      />

      {/* Кнопки */}
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <button
          type="button"
          className="px-3 py-2 text-sm rounded-lg bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)]"
          onClick={reset}
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
