// src/components/GroupsFilterModal.tsx
// Модалка фильтров: в каждом разделе чекбоксы, "ВСЕ" — радио-сброс (см. договорённости).

import { useState } from "react"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
  open: boolean
  onClose: () => void
  onApply: (filters: {
    status: { active: boolean; archived: boolean; deleted: boolean; all: boolean }
    hidden: { hidden: boolean; visible: boolean; all: boolean }
    activity: { recent: boolean; inactive: boolean; empty: boolean; all: boolean }
  }) => void
  initial?: {
    status?: { active: boolean; archived: boolean; deleted: boolean; all: boolean }
    hidden?: { hidden: boolean; visible: boolean; all: boolean }
    activity?: { recent: boolean; inactive: boolean; empty: boolean; all: boolean }
  }
}

export default function GroupsFilterModal({ open, onClose, onApply, initial }: Props) {
  const { t } = useTranslation()
  const [status, setStatus] = useState(initial?.status || { active: true, archived: false, deleted: false, all: false })
  const [hidden, setHidden] = useState(initial?.hidden || { hidden: false, visible: true, all: false })
  const [activity, setActivity] = useState(initial?.activity || { recent: false, inactive: false, empty: false, all: true })

  if (!open) return null

  const resetAll = () => {
    setStatus({ active: true, archived: false, deleted: false, all: false })
    setHidden({ hidden: false, visible: true, all: false })
    setActivity({ recent: false, inactive: false, empty: false, all: true })
  }

  const radioAll = (section: "status" | "hidden" | "activity") => {
    if (section === "status") setStatus({ active: false, archived: false, deleted: false, all: true })
    if (section === "hidden") setHidden({ hidden: false, visible: false, all: true })
    if (section === "activity") setActivity({ recent: false, inactive: false, empty: false, all: true })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-[var(--tg-card-bg)] rounded-t-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">{t("filter") || "Фильтр"}</div>
          <button className="p-2 rounded-xl hover:bg-black/5" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Статус */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Статус</div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={status.active && !status.all} onChange={e => setStatus(s => ({ ...s, active: e.target.checked, all: false }))} />
              <span>Активные</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={status.archived && !status.all} onChange={e => setStatus(s => ({ ...s, archived: e.target.checked, all: false }))} />
              <span>Архивные</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={status.deleted && !status.all} onChange={e => setStatus(s => ({ ...s, deleted: e.target.checked, all: false }))} />
              <span>Удалённые</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="status_all" checked={status.all} onChange={() => radioAll("status")} />
              <span>ВСЕ</span>
            </label>
          </div>
        </div>

        {/* Скрытие */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Скрытие</div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={hidden.visible && !hidden.all} onChange={e => setHidden(s => ({ ...s, visible: e.target.checked, all: false }))} />
              <span>Не скрытые</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={hidden.hidden && !hidden.all} onChange={e => setHidden(s => ({ ...s, hidden: e.target.checked, all: false }))} />
              <span>Скрытые мной</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="hidden_all" checked={hidden.all} onChange={() => radioAll("hidden")} />
              <span>ВСЕ</span>
            </label>
          </div>
        </div>

        {/* Активность */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Активность</div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={activity.recent && !activity.all} onChange={e => setActivity(s => ({ ...s, recent: e.target.checked, all: false }))} />
              <span>Недавно активные</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={activity.inactive && !activity.all} onChange={e => setActivity(s => ({ ...s, inactive: e.target.checked, all: false }))} />
              <span>Неактивные</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={activity.empty && !activity.all} onChange={e => setActivity(s => ({ ...s, empty: e.target.checked, all: false }))} />
              <span>Без транзакций</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="activity_all" checked={activity.all} onChange={() => radioAll("activity")} />
              <span>ВСЕ</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button className="px-4 py-2 rounded-xl bg-[var(--tg-secondary-bg-color)]" onClick={resetAll}>
            Очистить
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-[var(--tg-link-color)] text-white"
            onClick={() => { onApply({ status, hidden, activity }); onClose(); }}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  )
}
