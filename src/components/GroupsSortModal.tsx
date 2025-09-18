// src/components/GroupsSortModal.tsx
// Модалка сортировки: критерий (radio) + глобальный переключатель направления.

import { useState } from "react"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"

type SortBy = "last_activity" | "name" | "created_at" | "members_count"
type SortDir = "asc" | "desc"

type Props = {
  open: boolean
  onClose: () => void
  onApply: (sort: { sortBy: SortBy; sortDir: SortDir }) => void
  initial?: { sortBy?: SortBy; sortDir?: SortDir }
}

export default function GroupsSortModal({ open, onClose, onApply, initial }: Props) {
  const { t } = useTranslation()
  const [sortBy, setSortBy] = useState<SortBy>(initial?.sortBy || "last_activity")
  const [sortDir, setSortDir] = useState<SortDir>(initial?.sortDir || "desc")

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-[var(--tg-card-bg)] rounded-t-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">{t("sort") || "Сортировка"}</div>
          <button className="p-2 rounded-xl hover:bg-black/5" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Критерий</div>
          <div className="grid grid-cols-1 gap-2">
            <label className="flex items-center gap-2">
              <input type="radio" name="sort_by" checked={sortBy === "last_activity"} onChange={() => setSortBy("last_activity")} />
              <span>По последней активности</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="sort_by" checked={sortBy === "name"} onChange={() => setSortBy("name")} />
              <span>По имени</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="sort_by" checked={sortBy === "created_at"} onChange={() => setSortBy("created_at")} />
              <span>По дате создания</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="sort_by" checked={sortBy === "members_count"} onChange={() => setSortBy("members_count")} />
              <span>По числу участников</span>
            </label>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Направление</div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="radio" name="sort_dir" checked={sortDir === "asc"} onChange={() => setSortDir("asc")} />
              <span>По возрастанию</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="sort_dir" checked={sortDir === "desc"} onChange={() => setSortDir("desc")} />
              <span>По убыванию</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end mt-4">
          <button
            className="px-4 py-2 rounded-xl bg-[var(--tg-link-color)] text-white"
            onClick={() => { onApply({ sortBy, sortDir }); onClose(); }}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  )
}
