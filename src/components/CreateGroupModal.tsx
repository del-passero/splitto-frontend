// src/components/CreateGroupModal.tsx

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
  open: boolean
  onClose: () => void
  onCreated?: (group: { id: number, name: string, description: string }) => void
  ownerId: number
}

const MODAL_BG = "bg-[var(--tg-bg-color,#fff)]"
const MODAL_CARD = "bg-[var(--tg-card-bg,#fff)]"

const CreateGroupModal = ({ open, onClose, onCreated, ownerId }: Props) => {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // --- ВСЕ useEffect/useState/хуки ВНЕ return! ---

  // — ESC key close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  // Сброс полей при открытии
  useEffect(() => {
    if (open) {
      setName("")
      setDesc("")
      setError(null)
      setLoading(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError(t("group_name_required"))
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"}/groups/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc.trim(), owner_id: ownerId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const group = await res.json()
      onCreated?.(group)
      setName("")
      setDesc("")
      onClose()
    } catch (e: any) {
      setError(t("error_create_group"))
    } finally {
      setLoading(false)
    }
  }

  // --- только теперь проверяем open ---
  if (!open) return null

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center ${MODAL_BG} bg-opacity-70 transition-all`}>
      <div className={`w-full max-w-sm rounded-2xl shadow-lg p-0 m-3 ${MODAL_CARD} relative animate-modal-pop`}>
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
          aria-label={t("close")}
          tabIndex={0}
        >
          <X className="w-6 h-6 text-[var(--tg-hint-color)]" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 pt-4 flex flex-col gap-4">
          <div className="text-lg font-bold text-[var(--tg-text-color)] mb-1">
            {t("create_group")}
          </div>
          {/* Имя */}
          <input
            type="text"
            className={`
              w-full px-4 py-3 rounded-xl border
              bg-[var(--tg-bg-color,#fff)]
              border-[var(--tg-secondary-bg-color,#e7e7e7)]
              text-[var(--tg-text-color)]
              placeholder:text-[var(--tg-hint-color)]
              font-medium text-base
              focus:border-[var(--tg-accent-color)] focus:outline-none
              transition
            `}
            maxLength={40}
            autoFocus
            placeholder={t("group_name_placeholder")}
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading}
          />
          {/* Описание */}
          <textarea
            className={`
              w-full px-4 py-3 rounded-xl border
              bg-[var(--tg-bg-color,#fff)]
              border-[var(--tg-secondary-bg-color,#e7e7e7)]
              text-[var(--tg-text-color)]
              placeholder:text-[var(--tg-hint-color)]
              font-normal text-base
              min-h-[64px] max-h-[160px] resize-none
              focus:border-[var(--tg-accent-color)] focus:outline-none
              transition
            `}
            maxLength={120}
            placeholder={t("group_description_placeholder")}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            disabled={loading}
          />
          {/* Ошибка */}
          {error && (
            <div className="text-red-500 text-sm font-medium mt-0">{error}</div>
          )}
          {/* Кнопка */}
          <button
            type="submit"
            className={`
              w-full mt-2 py-3 rounded-xl font-bold text-base transition
              bg-[var(--tg-accent-color)] text-white
              flex items-center justify-center gap-2
              active:scale-95
              disabled:opacity-60 disabled:pointer-events-none
            `}
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin w-5 h-5" />}
            {t("create_group")}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateGroupModal
