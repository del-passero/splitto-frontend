// src/components/GroupsFilterModal.tsx
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export type FiltersState = {
  status: { active: boolean; archived: boolean; deleted: boolean; all: boolean }
  hidden: { hidden: boolean; visible: boolean; all: boolean }
  activity: { recent: boolean; inactive: boolean; empty: boolean; all: boolean }
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
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40" role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md sm:rounded-2xl sm:shadow-xl bg-[var(--tg-bg-color)] border border-[var(--tg-secondary-bg-color)]">
        {children}
      </div>
    </div>
  )
}
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)]">
    <div className="text-sm font-semibold text-[var(--tg-text-color)] mb-2">{title}</div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
)
const Chip = ({ active, onClick, label, title }: { active: boolean; onClick: () => void; label: string; title?: string }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`
      px-3 py-1.5 rounded-full text-sm border transition
      ${active ? "bg-[var(--tg-link-color)] text-white border-[var(--tg-link-color)]" : "bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)] border-[var(--tg-secondary-bg-color)]"}
      hover:brightness-105 active:scale-[0.99]
    `}
  >
    {label}
  </button>
)

export default function GroupsFilterModal({ open, initial, onApply, onClose }: Props) {
  const { t } = useTranslation()
  const [state, setState] = useState<FiltersState>(initial)

  useEffect(() => {
    if (open) setState(initial)
  }, [open, initial])

  const normalized: FiltersState = useMemo(() => {
    const s = state
    const statusAll = s.status.active && s.status.archived && s.status.deleted
    const hiddenAll = s.hidden.hidden && s.hidden.visible
    const activityAll = s.activity.recent && s.activity.inactive && s.activity.empty
    return {
      status: { ...s.status, all: statusAll },
      hidden: { ...s.hidden, all: hiddenAll },
      activity: { ...s.activity, all: activityAll },
    }
  }, [state])

  const toggle = <K extends keyof FiltersState, F extends keyof FiltersState[K]>(block: K, flag: F) => {
    setState((prev) => {
      const next = { ...prev, [block]: { ...(prev[block] as any) } } as FiltersState
      ;(next[block] as any)[flag] = !(prev[block] as any)[flag]
      ;(next[block] as any).all = false
      return next
    })
  }
  const selectAll = <K extends keyof FiltersState>(block: K, value: boolean) => {
    setState((prev) => {
      const flags = Object.keys(prev[block]) as (keyof FiltersState[K])[]
      const next = { ...prev, [block]: { ...(prev[block] as any) } } as FiltersState
      flags.forEach((f) => {
        ;(next[block] as any)[f] = value
      })
      return next
    })
  }
  const reset = () =>
    setState({
      status: { active: true, archived: false, deleted: false, all: false },
      hidden: { hidden: false, visible: true, all: false },
      activity: { recent: false, inactive: false, empty: false, all: true },
    })

  return (
    <ModalShell open={open}>
      <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)]">
        <div className="text-base font-semibold text-[var(--tg-text-color)]">{t("groups_filter_title")}</div>
      </div>

      <Section title={t("groups_filter_status") || "Статус"}>
        <Chip label={t("groups_filter_status_active") || "Активные"} active={normalized.status.active} onClick={() => toggle("status", "active")} />
        <Chip label={t("groups_filter_status_archived") || "Архивные"} active={normalized.status.archived} onClick={() => toggle("status", "archived")} />
        <Chip label={t("groups_filter_status_deleted") || "Удалённые"} active={normalized.status.deleted} onClick={() => toggle("status", "deleted")} title="Пункт интерфейса; сервер удалённые не отдаёт" />
        <Chip label={t("groups_filter_all") || "ВСЕ"} active={normalized.status.all} onClick={() => selectAll("status", !normalized.status.all)} />
      </Section>

      <Section title={t("groups_filter_hidden") || "Скрытые мной"}>
        <Chip label={t("groups_filter_hidden_visible") || "Видимые"} active={normalized.hidden.visible} onClick={() => toggle("hidden", "visible")} />
        <Chip label={t("hide") || "Скрытые"} active={normalized.hidden.hidden} onClick={() => toggle("hidden", "hidden")} />
        <Chip label={t("groups_filter_all") || "ВСЕ"} active={normalized.hidden.all} onClick={() => selectAll("hidden", !normalized.hidden.all)} />
      </Section>

      <Section title={t("groups_filter_activity") || "Активность"}>
        <Chip label={t("groups_filter_activity_recent") || "Недавняя"} active={normalized.activity.recent} onClick={() => toggle("activity", "recent")} />
        <Chip label={t("groups_filter_activity_inactive") || "Неактивная"} active={normalized.activity.inactive} onClick={() => toggle("activity", "inactive")} />
        <Chip label={t("groups_filter_activity_empty") || "Без транзакций"} active={normalized.activity.empty} onClick={() => toggle("activity", "empty")} />
        <Chip label={t("groups_filter_all") || "ВСЕ"} active={normalized.activity.all} onClick={() => selectAll("activity", !normalized.activity.all)} />
      </Section>

      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <button type="button" className="px-3 py-2 text-sm rounded-lg bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)]" onClick={reset}>
          {t("reset_filters")}
        </button>
        <button
          type="button"
          className="px-3 py-2 text-sm rounded-lg bg-[var(--tg-link-color)] text-white"
          onClick={() => {
            onApply(normalized)
            onClose()
          }}
        >
          {t("apply")}
        </button>
      </div>
    </ModalShell>
  )
}
