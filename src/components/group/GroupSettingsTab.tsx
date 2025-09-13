// src/components/group/GroupSettingsTab.tsx
import { useEffect, useRef, useState } from "react"
import { Save, Trash2, CircleDollarSign, CalendarDays, ChevronRight, X } from "lucide-react"
import CardSection from "../CardSection"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import CurrencyPickerModal from "../currency/CurrencyPickerModal"
import { getGroupDetails, patchGroupCurrency, patchGroupSchedule } from "../../api/groupsApi"

type Props = {
  isOwner: boolean
  onLeave: () => void     // перенесено в MembersTab, тут не используем
  onDelete: () => void
  onSaveAndExit: () => void
  canLeave?: boolean
}

/** Переключатель, как в CreateGroupModal */
function Switch({
  checked,
  onChange,
  ariaLabel,
}: { checked: boolean; onChange: (v: boolean) => void; ariaLabel: string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
      className={`relative inline-flex items-center w-12 h-7 rounded-full transition-colors
        ${checked ? "bg-[var(--tg-theme-button-color,#40A7E3)]" : "bg-[var(--tg-secondary-bg-color,#e6e6e6)]"}`}
    >
      <span className={`absolute h-6 w-6 rounded-full bg-white shadow transform transition-transform
        ${checked ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  )
}

/** Ряд секции (edge-to-edge), как в CreateGroupModal */
function Row({
  icon,
  label,
  value,
  right,
  onClick,
  isLast,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  right?: React.ReactNode
  onClick?: () => void
  isLast?: boolean
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center w-full py-4 bg-transparent focus:outline-none active:opacity-90"
        style={{ minHeight: 48 }}
      >
        <span className="ml-4 mr-3 flex items-center" style={{ width: 22 }}>
          {icon}
        </span>
        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[16px]">{label}</span>
        {right ? (
          <span className="mr-4">{right}</span>
        ) : (
          <>
            {value && <span className="text-[var(--tg-link-color)] text-[16px] mr-2">{value}</span>}
            {onClick && <ChevronRight className="text-[var(--tg-hint-color)] mr-4" size={20} />}
          </>
        )}
      </button>
      {!isLast && (
        <div className="absolute left-[50px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 pointer-events-none" />
      )}
    </div>
  )
}

function formatDateYmdToDmy(ymd: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd
  const [y, m, d] = ymd.split("-")
  return `${d}.${m}.${y}`
}

const GroupSettingsTab = ({
  isOwner,
  onLeave: _onLeave, // перенесено в MembersTab
  onDelete,
  onSaveAndExit,
  canLeave = true,
}: Props) => {
  const { t } = useTranslation()
  const { groupId } = useParams()
  const gid = Number(groupId)

  // локальное состояние для «валюта + поездка»
  const [currencyCode, setCurrencyCode] = useState<string>("USD")
  const [currencyModal, setCurrencyModal] = useState(false)

  const [endDate, setEndDate] = useState<string>("")             // YYYY-MM-DD или ""
  const [tripEnabled, setTripEnabled] = useState<boolean>(false)  // UX-вариант A
  const hiddenDateRef = useRef<HTMLInputElement | null>(null)
  const tripBlockRef = useRef<HTMLDivElement | null>(null)        // для скролла к полю
  const [tripDateError, setTripDateError] = useState(false)       // подсветка подписи красным

  const [loadingCurrency, setLoadingCurrency] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  // сохраняем исходные значения для "Отменить изменения"
  const initialCurrencyRef = useRef<string>("USD")
  const initialEndDateRef = useRef<string>("")
  const initialTripEnabledRef = useRef<boolean>(false)

  // первичная загрузка значений из БД
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!gid) return
      try {
        const g = await getGroupDetails(gid)
        if (cancelled || !g) return
        const cc = g.default_currency_code || "USD"
        const ymd = (g.end_date as string) || ""

        setCurrencyCode(cc)
        setEndDate(ymd)
        setTripEnabled(Boolean(ymd))

        initialCurrencyRef.current = cc
        initialEndDateRef.current = ymd
        initialTripEnabledRef.current = Boolean(ymd)
      } catch {
        // ignore
      }
    }
    load()
    return () => { cancelled = true }
  }, [gid])

  // Локально меняем значения, без немедленного PATCH
  function handlePickCurrencyLocal(code: string) {
    if (!code) return setCurrencyModal(false)
    setCurrencyCode(code)
    setCurrencyModal(false)
  }

  function handleToggleTrip(next: boolean) {
    setTripDateError(false)
    setTripEnabled(next)
    if (!next) setEndDate("")
  }

  function handleDateChangeLocal(v: string) {
    setEndDate(v)
    setTripDateError(false)
  }

  // Save & exit — отправляем только изменённые поля
  async function handleSaveClick() {
    if (tripEnabled && !endDate) {
      setTripDateError(true)
      const el = tripBlockRef.current
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }
    try {
      if (gid) {
        // валюта
        if (currencyCode !== initialCurrencyRef.current) {
          setLoadingCurrency(true)
          await patchGroupCurrency(gid, currencyCode)
          initialCurrencyRef.current = currencyCode
          setLoadingCurrency(false)
        }
        // график
        if (tripEnabled !== initialTripEnabledRef.current || endDate !== initialEndDateRef.current) {
          setLoadingSchedule(true)
          if (!tripEnabled) {
            await patchGroupSchedule(gid, { end_date: null, auto_archive: false })
            initialEndDateRef.current = ""
            initialTripEnabledRef.current = false
          } else {
            await patchGroupSchedule(gid, { end_date: endDate })
            initialEndDateRef.current = endDate
            initialTripEnabledRef.current = true
          }
          setLoadingSchedule(false)
        }
      }
    } catch {
      // ignore (можно добавить тост)
    } finally {
      onSaveAndExit()
    }
  }

  // Cancel & exit — возвращаем локальные значения и уходим
  function handleCancelClick() {
    setCurrencyCode(initialCurrencyRef.current)
    setEndDate(initialEndDateRef.current)
    setTripEnabled(initialTripEnabledRef.current)
    onSaveAndExit()
  }

  return (
    <CardSection className="flex flex-col gap-3 p-4 min-h-[280px]">
      {/* === Блок «Валюта + поездка» (edge-to-edge) === */}
      <div className="-mx-4">
        <CardSection className="py-0">
          <Row
            icon={<CircleDollarSign className="text-[var(--tg-link-color)]" size={22} />}
            label={t("currency.main_currency")}
            value={currencyCode || "USD"}
            onClick={() => !loadingCurrency && setCurrencyModal(true)}
          />
          <Row
            icon={<CalendarDays className="text-[var(--tg-link-color)]" size={22} />}
            label={t("group_form.is_trip")}
            right={
              <Switch
                checked={tripEnabled}
                onChange={handleToggleTrip}
                ariaLabel={t("group_form.is_trip")}
              />
            }
            onClick={() => handleToggleTrip(!tripEnabled)}
            isLast
          />

          {/* Видимое поле даты — только когда тумблер включён */}
          {tripEnabled && (
            <div ref={tripBlockRef} className="px-4 pt-2 pb-3">
              <button
                type="button"
                disabled={loadingSchedule}
                className={`w-full px-4 py-3 rounded-xl border text-left bg-[var(--tg-bg-color,#fff)]
                           border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)]
                           font-normal text-base focus:border-[var(--tg-accent-color)] focus:outline-none transition disabled:opacity-60`}
                onClick={() => {
                  const el = hiddenDateRef.current
                  // @ts-ignore
                  if (el && typeof el.showPicker === "function") el.showPicker()
                  else el?.click()
                }}
              >
                {endDate ? formatDateYmdToDmy(endDate) : t("group_form.trip_date_placeholder")}
              </button>

              {/* скрытый input (открываем нативный пикер) */}
              <input
                ref={hiddenDateRef}
                type="date"
                value={endDate}
                onChange={(e) => handleDateChangeLocal(e.target.value)}
                className="absolute opacity-0 pointer-events-none w-0 h-0"
                tabIndex={-1}
              />

              {/* подпись ВСЕГДА trip_date; красим в красный только при попытке Save без даты */}
              <div className={`text-[12px] mt-[4px] ${tripDateError ? "text-red-500" : "text-[var(--tg-hint-color)]"}`}>
                {t("group_form.trip_date")}
              </div>
            </div>
          )}
        </CardSection>
      </div>

      {/* === Кнопки управления (edge-to-edge, так же обёрнуты в CardSection) === */}
      <div className="-mx-4">
        <CardSection className="px-4 py-3">
          <div className="flex flex-col gap-2">
            {/* Сохранить и выйти — primary */}
            <button
              type="button"
              onClick={handleSaveClick}
              aria-label={t("group_settings_save_and_exit")}
              className="w-full h-12 rounded-xl font-semibold
                         text-white
                         bg-[var(--tg-accent-color,#40A7E3)]
                         hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                         active:scale-95 transition
                         shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                         border border-[var(--tg-hint-color)]/20
                         flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {t("group_settings_save_and_exit")}
            </button>

            {/* Отменить изменения — вторичная, закрывает страницу */}
            <button
              type="button"
              onClick={handleCancelClick}
              aria-label={t("group_settings_cancel_changes")}
              className="w-full h-12 rounded-xl font-semibold
                         text-black
                         bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                         hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                         active:scale-95 transition
                         border border-[var(--tg-hint-color)]/30
                         flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              {t("group_settings_cancel_changes")}
            </button>

            {/* Удалить группу — danger (только владелец) */}
            {isOwner && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={t("group_settings_delete_group")}
                className="w-full h-12 rounded-xl font-semibold
                           text-white
                           bg-red-500 hover:bg-red-500/90
                           active:scale-95 transition
                           border border-red-500/70
                           flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                {t("group_settings_delete_group")}
              </button>
            )}
          </div>
        </CardSection>
      </div>

      {/* Модалка выбора валюты */}
      <CurrencyPickerModal
        open={currencyModal}
        onClose={() => setCurrencyModal(false)}
        selectedCode={currencyCode || "USD"}
        onSelect={(c) => handlePickCurrencyLocal(c.code)}
        closeOnSelect={false}
      />
    </CardSection>
  )
}

export default GroupSettingsTab

