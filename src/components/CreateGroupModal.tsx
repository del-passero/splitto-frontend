// src/components/CreateGroupModal.tsx

import { useEffect, useRef, useState } from "react"
import { X, Loader2, CircleDollarSign, CalendarDays } from "lucide-react"
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

const NAME_MAX = 40
const DESC_MAX = 120

// утилита форматирования YYYY-MM-DD -> DD.MM.YYYY
function formatDateDMY(d?: string) {
  if (!d) return ""
  const [y, m, day] = d.split("-")
  if (!y || !m || !day) return d
  return `${day}.${m}.${y}`
}

function Row({
  icon,
  label,
  value,
  right,
  onClick,
  showDivider = false,
}: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
  right?: React.ReactNode
  onClick?: () => void
  showDivider?: boolean
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition"
      >
        <div className="flex items-center min-w-0">
          <div className="flex items-center justify-center mr-3" style={{ width: 22, height: 22 }}>
            {icon}
          </div>
          <div className="flex flex-col text-left min-w-0">
            <div className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">{label}</div>
            {value ? <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{value}</div> : null}
          </div>
        </div>
        {right}
      </button>

      {showDivider && (
        <div className="absolute left-[50px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)]/15 pointer-events-none" />
      )}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel?: string
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          onChange(!checked)
        }
      }}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? "bg-[var(--tg-accent-color,#40A7E3)]" : "bg-[var(--tg-secondary-bg-color,#e7e7e7)]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </div>
  )
}

export default function CreateGroupModal({ open, onClose, onCreated, ownerId }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // валюта
  const [currencyModal, setCurrencyModal] = useState(false)
  const [currency, setCurrency] = useState<CurrencyItem | null>(null)

  // trip/date
  const [isTrip, setIsTrip] = useState(false)
  const [endDate, setEndDate] = useState<string>("")
  const hiddenDateRef = useRef<HTMLInputElement | null>(null)

  // — ESC close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  // reset
  useEffect(() => {
    if (open) {
      setName("")
      setDesc("")
      setError(null)
      setLoading(false)
      setIsTrip(false)
      setEndDate("")
      // валюту оставляем выбранной в рамках сессии, если уже выбирали
    }
  }, [open])

  async function patchGroupCurrency(groupId: number, code: string) {
    try {
      const url = `${API_URL}/groups/${groupId}/currency?code=${encodeURIComponent(code)}`
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "x-telegram-initdata": getTelegramInitData() },
      })
      if (!res.ok) {
        console.warn("patch currency failed", res.status)
      }
    } catch (e) {
      console.warn("patch currency error", e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const nm = name.trim()
    if (!nm) {
      setError(t("group_name_required") || "Введите название группы")
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
        body: JSON.stringify({ name: nm, description: desc.trim(), owner_id: ownerId }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || `HTTP ${res.status}`)
      }
      const group = await res.json()

      if (currency?.code) {
        patchGroupCurrency(group.id, currency.code).catch(() => {})
      }

      onCreated?.(group)
      // сразу открываем группу
      navigate(`/groups/${group.id}`)
      onClose()
    } catch {
      setError(t("error_create_group") || "Ошибка при создании группы")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const Buttons = (
    <div className="flex flex-row gap-2 mt-2 w-full">
      <button
        type="button"
        className="w-1/2 py-3 rounded-xl font-bold text-base bg-[var(--tg-secondary-bg-color,#e6e6e6)] text-[var(--tg-text-color)] border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition"
        onClick={onClose}
        disabled={loading}
      >
        {t("cancel") || "Отмена"}
      </button>
      <button
        type="submit"
        className="w-1/2 py-3 rounded-xl font-bold text-base bg-[var(--tg-accent-color,#40A7E3)] text-white flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 disabled:pointer-events-none transition"
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
          <div className="text-lg font-bold text-[var(--tg-text-color)] mb-1">{t("create_group")}</div>

          {/* Name */}
          <div className="space-y-[4px]">
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border bg-[var(--tg-bg-color,#fff)] border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] placeholder:text-[var(--tg-hint-color)] font-medium text-base focus:border-[var(--tg-accent-color)] focus:outline-none transition"
              maxLength={NAME_MAX}
              autoFocus
              placeholder={t("group_name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <div className="text-[12px] text-[var(--tg-hint-color)] mt-[4px]">
              {name.length === 0 ? "Enter a group name (up to 40 chars)" : `${NAME_MAX - name.length} characters left`}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-[4px]">
            <textarea
              className="w-full px-4 py-3 rounded-xl border bg-[var(--tg-bg-color,#fff)] border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] placeholder:text-[var(--tg-hint-color)] font-normal text-base min-h-[64px] max-h-[160px] resize-none focus:border-[var(--tg-accent-color)] focus:outline-none transition"
              maxLength={DESC_MAX}
              placeholder={t("group_description_placeholder")}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              disabled={loading}
            />
            <div className="text-[12px] text-[var(--tg-hint-color)] mt-[4px]">
              {desc.length === 0
                ? "Enter a group description (up to 120 chars)"
                : `${DESC_MAX - desc.length} characters left`}
            </div>
          </div>

          {/* Currency + Trip toggle (one divider between them) */}
          <div className="rounded-xl overflow-hidden border border-[var(--tg-secondary-bg-color,#e7e7e7)]">
            <Row
              icon={<CircleDollarSign className="text-[var(--tg-link-color)]" size={22} />}
              label={t("currency.main_currency") || "Основная валюта"}
              value={currency?.code || (t("currency.select_short") || "Выберите валюту")}
              onClick={() => setCurrencyModal(true)}
              showDivider
            />
            <Row
              icon={<CalendarDays className="text-[var(--tg-link-color)]" size={22} />}
              label={t("group_form.is_trip") || "Группа для путешествия?"}
              right={<Toggle checked={isTrip} onChange={setIsTrip} ariaLabel={t("group_form.is_trip")} />}
              onClick={() => setIsTrip((v) => !v)}
            />
          </div>

          {/* Date picker (only when isTrip) */}
          {isTrip && (
            <div className="px-0">
              <div className="px-4 pt-2">
                <button
                  type="button"
                  className="w-full px-4 py-3 rounded-xl border text-left bg-[var(--tg-bg-color,#fff)] border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] font-normal text-base focus:border-[var(--tg-accent-color)] focus:outline-none transition"
                  onClick={() => {
                    const el = hiddenDateRef.current
                    if (!el) return
                    // @ts-ignore
                    if (typeof el.showPicker === "function") {
                      // @ts-ignore
                      el.showPicker()
                    } else {
                      el.click()
                    }
                  }}
                >
                  {endDate ? formatDateDMY(endDate) : t("group_form.trip_date") || "Дата завершения поездки"}
                </button>
                <input
                  ref={hiddenDateRef}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                  tabIndex={-1}
                />
                <div className="text-[12px] text-[var(--tg-hint-color)] mt-[4px]">
                  {t("group_form.trip_date") || "Дата завершения поездки"}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div className="text-red-500 text-sm font-medium mt-0">{error}</div>}

          {/* Buttons */}
          {Buttons}
        </form>
      </div>

      {/* Currency modal */}
      <CurrencyPickerModal
        open={currencyModal}
        onClose={() => setCurrencyModal(false)}
        selectedCode={currency?.code}
        onSelect={(c: CurrencyItem) => setCurrency(c)}
      />
    </div>
  )
}
