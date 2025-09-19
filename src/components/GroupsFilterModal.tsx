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

const DEFAULTS: FiltersState = {
  status: { active: true, archived: false, deleted: false, all: false },
  hidden: { hidden: false, visible: true, all: false },
  activity: { recent: false, inactive: false, empty: false, all: true },
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
      onClick={(e) => {
        // клик по оверлею — закрыть
        if (e.target === e.currentTarget) {
          // noop: родитель сам решает когда закрывать
        }
      }}
    >
      <div className="w-full sm:max-w-md sm:rounded-2xl sm:shadow-xl bg-[var(--tg-bg-color)] border border-[var(--tg-secondary-bg-color)]">
        {children}
      </div>
    </div>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)] last:border-b-0">
    <div className="text-sm font-medium text-[var(--tg-hint-color)] mb-2">{title}</div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
)

function Pill({
  active,
  onClick,
  label,
  ariaLabel,
}: {
  active: boolean
  onClick: () => void
  label: string
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel || label}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition border
        ${active
          ? "bg-[var(--tg-link-color)] text-white border-[var(--tg-link-color)]"
          : "bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)] border-[var(--tg-secondary-bg-color)] hover:bg-[var(--tg-secondary-bg-color)]/70"
        }`}
    >
      {label}
    </button>
  )
}

/** Внутренняя утилита: следим, чтобы в секции всегда было хоть что-то.
 * Если снято всё — включаем all=true */
function normalizeSection<T extends Record<string, boolean>>(sec: T, keysExceptAll: (keyof T)[], allKey: keyof T): T {
  const anySpecific = keysExceptAll.some((k) => !!sec[k])
  if (!anySpecific && !sec[allKey]) {
    // ничего не выбрано — включаем ВСЕ
    return { ...sec, [allKey]: true }
  }
  return sec
}

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

  // helpers обновления секций
  const setStatus = (patch: Partial<FiltersState["status"]>) =>
    setState((s) => {
      let next = { ...s, status: { ...s.status, ...patch } }
      // логика ALL: если включаем all — остальное снимаем
      if (patch.all === true) {
        next.status = { active: false, archived: false, deleted: false, all: true }
      } else if ("active" in patch || "archived" in patch || "deleted" in patch) {
        // как только включили любую конкретную — снимаем ALL
        if (patch.active || patch.archived || patch.deleted) {
          next.status.all = false
        }
        // защита от «снято всё»: авто-включить ALL
        next.status = normalizeSection(next.status, ["active", "archived", "deleted"], "all")
      }
      return next
    })

  const setHidden = (patch: Partial<FiltersState["hidden"]>) =>
    setState((s) => {
      let next = { ...s, hidden: { ...s.hidden, ...patch } }
      if (patch.all === true) {
        next.hidden = { hidden: false, visible: false, all: true }
      } else if ("hidden" in patch || "visible" in patch) {
        if (patch.hidden || patch.visible) {
          next.hidden.all = false
        }
        next.hidden = normalizeSection(next.hidden, ["hidden", "visible"], "all")
      }
      return next
    })

  const setActivity = (patch: Partial<FiltersState["activity"]>) =>
    setState((s) => {
      let next = { ...s, activity: { ...s.activity, ...patch } }
      if (patch.all === true) {
        next.activity = { recent: false, inactive: false, empty: false, all: true }
      } else if ("recent" in patch || "inactive" in patch || "empty" in patch) {
        if (patch.recent || patch.inactive || patch.empty) {
          next.activity.all = false
        }
        next.activity = normalizeSection(next.activity, ["recent", "inactive", "empty"], "all")
      }
      return next
    })

  const handleReset = () => setState(DEFAULTS)

  const title = useMemo(() => t("groups_filter_title") || "Фильтр групп", [t])

  return (
    <ModalShell open={open}>
      {/* header */}
      <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)]">
        <div className="text-base font-semibold text-[var(--tg-text-color)]">
          {title}
        </div>
      </div>

      {/* Status */}
      <Section title={t("groups_filter_status") || "Статус"}>
        <Pill
          active={state.status.all}
          onClick={() => setStatus({ all: true })}
          label={t("groups_filter_all") || "ВСЕ"}
        />
        <Pill
          active={state.status.active}
          onClick={() => setStatus({ active: !state.status.active })}
          label={t("groups_filter_status_active") || "Активные"}
        />
        <Pill
          active={state.status.archived}
          onClick={() => setStatus({ archived: !state.status.archived })}
          label={t("groups_filter_status_archived") || "Архивные"}
        />
        <Pill
          active={state.status.deleted}
          onClick={() => setStatus({ deleted: !state.status.deleted })}
          label={t("groups_filter_status_deleted") || "Удалённые"}
        />
      </Section>

      {/* Hidden by me */}
      <Section title={t("groups_filter_hidden") || "Скрытые мной"}>
        <Pill
          active={state.hidden.all}
          onClick={() => setHidden({ all: true })}
          label={t("groups_filter_all") || "ВСЕ"}
        />
        <Pill
          active={state.hidden.visible}
          onClick={() => setHidden({ visible: !state.hidden.visible })}
          label={t("groups_filter_hidden_visible") || "Видимые"}
        />
        <Pill
          active={state.hidden.hidden}
          onClick={() => setHidden({ hidden: !state.hidden.hidden })}
          label={t("groups_filter_hidden_hidden") || "Скрытые"}
        />
      </Section>

      {/* Activity */}
      <Section title={t("groups_filter_activity") || "Активность"}>
        <Pill
          active={state.activity.all}
          onClick={() => setActivity({ all: true })}
          label={t("groups_filter_all") || "ВСЕ"}
        />
        <Pill
          active={state.activity.recent}
          onClick={() => setActivity({ recent: !state.activity.recent })}
          label={t("groups_filter_activity_recent") || "Недавняя"}
        />
        <Pill
          active={state.activity.inactive}
          onClick={() => setActivity({ inactive: !state.activity.inactive })}
          label={t("groups_filter_activity_inactive") || "Неактивная"}
        />
        <Pill
          active={state.activity.empty}
          onClick={() => setActivity({ empty: !state.activity.empty })}
          label={t("groups_filter_activity_empty") || "Без транзакций"}
        />
      </Section>

      {/* footer buttons */}
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <button
          type="button"
          className="px-3 py-2 text-sm rounded-lg bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)]"
          onClick={handleReset}
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
