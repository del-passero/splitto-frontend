// src/components/CreateGroupModal.tsx

import { useState, useEffect } from "react"
import { X, Loader2, CircleDollarSign } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import CurrencyPickerModal, { CurrencyItem } from "./currency/CurrencyPickerModal"

type Props = {
  open: boolean
  onClose: () => void
  onCreated?: (group: { id: number; name: string; description: string }) => void
  ownerId: number
}

// Telegram-стили
const MODAL_BG = "bg-[var(--tg-bg-color,#fff)]"
const MODAL_CARD = "bg-[var(--tg-card-bg,#fff)]"
const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

const CreateGroupModal = ({ open, onClose, onCreated, ownerId }: Props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // валюта
  const [currencyModal, setCurrencyModal] = useState(false)
  const [currency, setCurrency] = useState<CurrencyItem | null>(null)

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
      // валюту не сбрасываем — пусть запоминается в рамках сессии создания
    }
  }, [open])

  async function patchGroupCurrency(groupId: number, code: string) {
    const url = `${API_URL}/groups/${groupId}/currency?code=${encodeURIComponent(code)}`
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "x-telegram-initdata": getTelegramInitData() },
    })
    if (!res.ok) {
      // не блокируем создание из-за валюты — просто лог
      try {
        const txt = await res.text()
        console.warn("patch currency failed:", res.status, txt)
      } catch {
        console.warn("patch currency failed:", res.status)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError(t("group_name_required") || "Укажите название группы")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/groups/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-initdata": getTelegramInitData(),
        },
        body: JSON.stringify({ name: name.trim(), description: desc.trim(), owner_id: ownerId }),
      })
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
      const group = await res.json()

      // если выбрана валюта — выставим её сразу после создания (не блокируя UX)
      if (currency?.code) {
        // делаем best-effort; навигацию не задерживаем
        patchGroupCurrency(group.id, currency.code).catch(() => {})
      }

      onCreated?.(group)
      setName("")
      setDesc("")
      // сразу открываем группу
      navigate(`/groups/${group.id}`)
      onClose()
    } catch (e: any) {
      setError(t("error_create_group") || "Не удалось создать группу")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const CurrencyRow = (
    <button
      type="button"
      onClick={() => setCurrencyModal(true)}
      className="
        w-full flex items-center justify-between
        px-4 py-3 rounded-xl border
        bg-[var(--tg-bg-color,#fff)]
        border-[var(--tg-secondary-bg-color,#e7e7e7)]
        hover:bg-black/5 dark:hover:bg-white/5 transition
        text-left
      "
      aria-label={t("currency.select_title") || "Выбор валюты"}
    >
      <div className="flex items-center min-w-0">
        <div
          className="flex items-center justify-center mr-3 rounded-full"
          style={{ width: 36, height: 36, background: "transparent" }}
        >
          <CircleDollarSign className="w-5 h-5 text-[var(--tg-hint-color)]" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">
            {t("currency.main_currency") || "Основная валюта"}
          </div>
          <div className="text-[12px] text-[var(--tg-hint-color)]">
            {currency?.code || t("currency.select_short") || "Выберите валюту"}
          </div>
        </div>
      </div>
      {/* псевдо-радио */}
      <div
        className={`
          relative flex items-center justify-center
          w-6 h-6 rounded-full border
          ${currency ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"}
        `}
      >
        {currency && <div className="w-3 h-3 rounded-full" style={{ background: "var(--tg-link-color)" }} />}
      </div>
    </button>
  )

  // нижние кнопки
  const Buttons = (
    <div className="flex flex-row gap-2 mt-2 w-full">
      <button
        type="button"
        className="
          w-1/2 py-3 rounded-xl font-bold text-base
          bg-[var(--tg-secondary-bg-color,#e6e6e6)] text-[var(--tg-text-color)]
          border border-[var(--tg-hint-color)]/30
          hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10
          active:scale-95 transition
        "
        onClick={onClose}
        disabled={loading}
      >
        {t("cancel") || "Отмена"}
      </button>
      <button
        type="submit"
        className="
          w-1/2 py-3 rounded-xl font-bold text-base
          bg-[var(--tg-accent-color,#40A7E3)] text-white
          flex items-center justify-center gap-2
          active:scale-95
          disabled:opacity-60 disabled:pointer-events-none
          transition
        "
        disabled={loading}
      >
        {loading && <Loader2 className="animate-spin w-5 h-5" />}
        {t("create_group")}
      </button>
    </div>
  )

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center ${MODAL_BG} bg-opacity-70 transition-all`}>
      <div className={`w-full max-w-sm rounded-2xl shadow-lg p-0 m-3 ${MODAL_CARD} relative animate-modal-pop`}>
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
          aria-label={t("close") || "Закрыть"}
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
            className="
              w-full px-4 py-3 rounded-xl border
              bg-[var(--tg-bg-color,#fff)]
              border-[var(--tg-secondary-bg-color,#e7e7e7)]
              text-[var(--tg-text-color)]
              placeholder:text-[var(--tg-hint-color)]
              font-medium text-base
              focus:border-[var(--tg-accent-color)] focus:outline-none
              transition
            "
            maxLength={40}
            autoFocus
            placeholder={t("group_name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />

          {/* Описание */}
          <textarea
            className="
              w-full px-4 py-3 rounded-xl border
              bg-[var(--tg-bg-color,#fff)]
              border-[var(--tg-secondary-bg-color,#e7e7e7)]
              text-[var(--tg-text-color)]
              placeholder:text-[var(--tg-hint-color)]
              font-normal text-base
              min-h-[64px] max-h-[160px] resize-none
              focus:border-[var(--tg-accent-color)] focus:outline-none
              transition
            "
            maxLength={120}
            placeholder={t("group_description_placeholder")}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={loading}
          />

          {/* Основная валюта (как в Wallet) */}
          {CurrencyRow}

          {/* Ошибка */}
          {error && <div className="text-red-500 text-sm font-medium mt-0">{error}</div>}

          {/* Кнопки */}
          {Buttons}
        </form>
      </div>

      {/* модалка выбора валюты */}
      <CurrencyPickerModal
        open={currencyModal}
        onClose={() => setCurrencyModal(false)}
        selectedCode={currency?.code}
        onSelect={(c: CurrencyItem) => setCurrency(c)}
      />
    </div>
  )
}

export default CreateGroupModal
