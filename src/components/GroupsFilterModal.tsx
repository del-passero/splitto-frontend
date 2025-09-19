// src/components/GroupsFilterModal.tsx
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

/** Полная структура фильтров (как обсуждали) */
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

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)]">
    <div className="text-sm font-semibold text-[var(--tg-text-color)] mb-2">{title}</div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
)

/** Пилюля-кнопка для выбора */
const Chip = ({
  active,
  onClick,
  label,
  disabled,
  title,
}: {
  active: boolean
  onClick: () => void
  label: string
  disabled?: boolean
  title?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`
      px-3 py-1.5 rounded-full text-sm border transition
      ${active ? "bg-[var(--tg-link-color)] text-white border-[var(--tg-link-color)]" : "bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)] border-[var(--tg-secondary-bg-color)]"}
      ${disabled ? "opacity-60 cursor-not-allowed" : "hover:brightness-105 active:scale-[0.99]"}
    `}
  >
    {label}
  </button>
)

function only<K extends string>(keys: K[], pick: K) {
  const o = {} as Record<K, boolean>
  keys.forEach(k => (o[k] = k === pick))
  return o
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

  // Сброс ко «всем активным и видимым»
  const reset = () =>
    setState({
      status: { active: true, archived: false, deleted: false, all: false },
      hidden: { hidden: false, visible: true, all: false },
      activity: { recent: false, inactive: false, empty: false, all: true },
    })

  // === ВНИМАНИЕ: что реально уходит на сервер ===
  // includeArchived -> true, если выбран "архивные" или "все" (в статусе)
  // includeHidden   -> true, если выбраны "скрытые" или "все" (в скрытых)
  // Остальное (deleted, activity) — сейчас НЕ поддерживается беком этого эндпоинта.

  return (
    <ModalShell open={open}>
      {/* Заголовок */}
      <div className="px-4 py-3 border-b border-[var(--tg-secondary-bg-color)]">
        <div className="text-base font-semibold text-[var(--tg-text-color)]">
          {t("groups_filter_title")}
        </div>
      </div>

      {/* Статус */}
      <Section title={t("groups_filter_status") || "Статус"}>
        <Chip
          label={t("groups_filter_status_active") || "Активные"}
          active={state.status.active}
          onClick={() => setState(s => ({ ...s, status: only(["active","archived","deleted","all"] as const, "active") }))}
        />
        <Chip
          label={t("groups_filter_status_archived") || "Архивные"}
          active={state.status.archived}
          onClick={() => setState(s => ({ ...s, status: only(["active","archived","deleted","all"] as const, "archived") }))}
        />
        {/* Удалённые — показываем, но отключаем: бэкенд-эндпоинт не возвращает deleted */}
        <Chip
          label={t("groups_filter_status_deleted") || "Удалённые"}
          active={state.status.deleted}
          onClick={() => {}}
          disabled
          title="Недоступно: текущий список не отдаёт удалённые группы"
        />
        <Chip
          label={t("groups_filter_all") || "ВСЕ"}
          active={state.status.all}
          onClick={() => setState(s => ({ ...s, status: only(["active","archived","deleted","all"] as const, "all") }))}
        />
      </Section>

      {/* Скрытые мной */}
      <Section title={t("groups_filter_hidden") || "Скрытые мной"}>
        <Chip
          label={t("groups_filter_hidden_visible") || "Видимые"}
          active={state.hidden.visible}
          onClick={() => setState(s => ({ ...s, hidden: only(["hidden","visible","all"] as const, "visible") }))}
        />
        <Chip
          label={t("hide") || "Скрытые"}
          active={state.hidden.hidden}
          onClick={() => setState(s => ({ ...s, hidden: only(["hidden","visible","all"] as const, "hidden") }))}
        />
        <Chip
          label={t("groups_filter_all") || "ВСЕ"}
          active={state.hidden.all}
          onClick={() => setState(s => ({ ...s, hidden: only(["hidden","visible","all"] as const, "all") }))}
        />
      </Section>

      {/* Активность — пока только UI (не поддерживается сервером в этом списке) */}
      <Section title={t("groups_filter_activity") || "Активность"}>
        <Chip
          label={t("groups_filter_activity_recent") || "Недавняя"}
          active={state.activity.recent}
          onClick={() => {}}
          disabled
          title="Недоступно для серверной фильтрации в этом API"
        />
        <Chip
          label={t("groups_filter_activity_inactive") || "Неактивная"}
          active={state.activity.inactive}
          onClick={() => {}}
          disabled
          title="Недоступно для серверной фильтрации в этом API"
        />
        <Chip
          label={t("groups_filter_activity_empty") || "Без транзакций"}
          active={state.activity.empty}
          onClick={() => {}}
          disabled
          title="Недоступно для серверной фильтрации в этом API"
        />
        <Chip
          label={t("groups_filter_all") || "ВСЕ"}
          active={state.activity.all}
          onClick={() => setState(s => ({ ...s, activity: only(["recent","inactive","empty","all"] as const, "all") }))}
        />
      </Section>

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
