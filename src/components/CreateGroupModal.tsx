// src/components/CreateGroupModal.tsx

import { useState, useEffect } from "react"
import { X, Loader2, CircleDollarSign, CalendarDays } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import CurrencyPickerModal, { CurrencyItem } from "./currency/CurrencyPickerModal"
import SettingItem from "./SettingItem"
import { createGroup, patchGroupCurrency, patchGroupSchedule } from "../api/groupsApi"

type Props = {
  open: boolean
  onClose: () => void
  onCreated?: (group: { id: number; name: string; description: string }) => void
  ownerId: number
}

const MODAL_BG = "bg-[var(--tg-bg-color,#000)]"
const MODAL_CARD = "bg-[var(--tg-card-bg,#1c1c1c)]"

const CreateGroupModal = ({ open, onClose, onCreated, ownerId }: Props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [currencyModal, setCurrencyModal] = useState(false)
  const [currency, setCurrency] = useState<CurrencyItem | null>(null)

  const [isTrip, setIsTrip] = useState(false)
  const [endDate, setEndDate] = useState<string>("") // YYYY-MM-DD

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setName("")
      setDesc("")
      setError(null)
      setLoading(false)
      setIsTrip(false)
      setEndDate("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError(t("errors.group_name_required"))
      return
    }
    if (isTrip && !endDate) {
      setError(t("errors.group_trip_date_required"))
      return
    }

    setLoading(true)
    try {
      const group = await createGroup({
        name: name.trim(),
        description: desc.trim(),
        owner_id: ownerId,
      })

      const promises: Promise<any>[] = []
      if (currency?.code) promises.push(patchGroupCurrency(group.id, currency.code))
      if (isTrip && endDate) promises.push(patchGroupSchedule(group.id, { end_date: endDate }))
      Promise.allSettled(promises).catch(() => {})

      onCreated?.(group)
      setName("")
      setDesc("")
      navigate(`/groups/${group.id}`)
      onClose()
    } catch {
      setError(t("errors.create_group_failed"))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center ${MODAL_BG} bg-opacity-70 transition-all`}>
      <div className={`w-full max-w-sm rounded-2xl shadow-lg p-0 m-3 ${MODAL_CARD} relative animate-modal-pop`}>
        {/* Close */}
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
            placeholder={t("group_form.name_placeholder")}
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
            placeholder={t("group_form.description_placeholder")}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={loading}
          />

          {/* Настройки — строки в стиле SettingItem */}
          <div className="rounded-xl overflow-hidden border border-[var(--tg-secondary-bg-color,#e7e7e7)]">
            {/* Валюта */}
            <SettingItem
              icon={<CircleDollarSign className="text-[var(--tg-hint-color)]" size={20} />}
              label={t("currency.main_currency")}
              value={currency?.code || t("currency.select_short")}
              onClick={() => setCurrencyModal(true)}
            />
            {/* Группа для путешествия? */}
            <SettingItem
              icon={<CalendarDays className="text-[var(--tg-hint-color)]" size={20} />}
              label={t("group_form.is_trip")}
              value={isTrip ? t("common.yes") : t("common.no")}
              onClick={() => setIsTrip((v) => !v)}
              isLast
            />
          </div>

          {/* Дата поездки — показываем только если выбрано «Да» */}
          {isTrip && (
            <div className="flex flex-col gap-2">
              <label className="text-[var(--tg-hint-color)] text-sm">
                {t("group_form.trip_date")}
              </label>
              <input
                type="date"
                className="
                  w-full px-4 py-3 rounded-xl border
                  bg-[var(--tg-bg-color,#fff)]
                  border-[var(--tg-secondary-bg-color,#e7e7e7)]
                  text-[var(--tg-text-color)]
                  placeholder:text-[var(--tg-hint-color)]
                  font-normal text-base
                  focus:border-[var(--tg-accent-color)] focus:outline-none
                  transition
                "
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {/* Ошибка */}
          {error && <div className="text-red-500 text-sm font-medium mt-0">{error}</div>}

          {/* Кнопки */}
          <div className="flex flex-row gap-2 mt-2 w-full">
            <button
              type="button"
              className="
                w-1/2 py-3 rounded-xl font-bold text-base
                bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                text-[var(--tg-accent-color)]
                border border-[var(--tg-hint-color)]/30
                hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10
                active:scale-95 transition
              "
              onClick={onClose}
              disabled={loading}
            >
              {t("cancel")}
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
