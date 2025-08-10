// src/components/group/GroupSettingsTab.tsx

import { useEffect, useRef, useState } from "react"
import { Save, LogOut, Trash2, CircleDollarSign, CalendarDays, ChevronRight } from "lucide-react"
import CardSection from "../CardSection"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import CurrencyPickerModal from "../currency/CurrencyPickerModal"
import { getGroupDetails, patchGroupCurrency, patchGroupSchedule } from "../../api/groupsApi"

type Props = {
  isOwner: boolean
  onLeave: () => void
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
        {/* слева выравниваем по инпутам (контейнер CardSection даёт p-4) */}
        <span className="ml-4 mr-3 flex items-center" style={{ width: 22 }}>
          {icon}
        </span>

        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[16px]">{label}</span>

        {/* правая часть — к правому краю CardSection (p-4) */}
        {right ? (
          <span className="mr-4">{right}</span>
        ) : (
          <>
            {value && <span className="text-[var(--tg-link-color)] text-[16px] mr-2">{value}</span>}
            {onClick && <ChevronRight className="text-[var(--tg-hint-color)] mr-4" size={20} />}
          </>
        )}
      </button>

      {/* Divider как в CurrencyPickerModal: НЕ под иконкой */}
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
  onLeave,
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

  const [endDate, setEndDate] = useState<string>("")       // YYYY-MM-DD или ""
  const [tripEnabled, setTripEnabled] = useState<boolean>(false) // локальный флаг тумблера (A-вариант UX)
  const hiddenDateRef = useRef<HTMLInputElement | null>(null)

  const [loadingCurrency, setLoadingCurrency] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  // первичная загрузка значений из БД
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!gid) return
      try {
        const g = await getGroupDetails(gid)
        if (cancelled || !g) return
        setCurrencyCode(g.default_currency_code || "USD")
        const ymd = (g.end_date as string) || ""
        setEndDate(ymd)
        setTripEnabled(Boolean(ymd))
      } catch {
        // ignore
      }
    }
    load()
    return () => { cancelled = true }
  }, [gid])

  async function handlePickCurrency(code: string) {
    if (!gid || !code || code === currencyCode) return setCurrencyModal(false)
    try {
      setLoadingCurrency(true)
      await patchGroupCurrency(gid, code)
      setCurrencyCode(code)
    } catch {
      // можно добавить toast
    } finally {
      setLoadingCurrency(false)
      setCurrencyModal(false)
    }
  }

  // Вариант A:
  // - Включение тумблера только раскрывает поле даты (без автопоказа пикера), на сервер ничего не шлём.
  // - Выключение тумблера — очищаем дату на бэке.
  async function handleToggleTrip(next: boolean) {
    if (!gid) return
    setTripEnabled(next)

    if (!next) {
      // выключаем: очищаем дату + сбрасываем автоархив
      try {
        setLoadingSchedule(true)
        await patchGroupSchedule(gid, { end_date: null, auto_archive: false })
        setEndDate("")
      } catch {
        // ignore
      } finally {
        setLoadingSchedule(false)
      }
    }
    // если next === true — просто показали поле даты; патчим только при выборе даты
  }

  async function handleDateChange(v: string) {
    if (!gid) return
    setEndDate(v)
    try {
      setLoadingSchedule(true)
      await patchGroupSchedule(gid, { end_date: v })
      // tripEnabled уже true — ничего не меняем дополнительно
    } catch {
      // ignore
    } finally {
      setLoadingSchedule(false)
    }
  }

  const leaveHint = t("group_settings_cannot_leave_due_debt")
  const needDateHint = tripEnabled && !endDate

  return (
    <CardSection className="flex flex-col gap-3 p-4 min-h-[280px]">
      {/* Блок «Валюта + поездка» в том же стиле, что и в CreateGroupModal */}
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

          {/* Видимое поле даты — показываем только когда тумблер включён */}
          {tripEnabled && (
            <div className="px-4 pt-2 pb-3">
              <button
                type="button"
                disabled={loadingSchedule}
                className={`w-full px-4 py-3 rounded-xl border text-left bg-[var(--tg-bg-color,#fff)]
                           border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)]
                           font-normal text-base focus:border-[var(--tg-accent-color)] focus:outline-none transition disabled:opacity-60
                           ${needDateHint ? "ring-2 ring-[var(--tg-accent-color,#40A7E3)]/30" : ""}`}
                onClick={() => {
                  const el = hiddenDateRef.current
                  // @ts-ignore
                  if (el && typeof el.showPicker === "function") el.showPicker()
                  else el?.click()
                }}
              >
                {endDate ? formatDateYmdToDmy(endDate) : t("group_form.trip_date_placeholder")}
              </button>

              {/* скрытый input, появляется только вместе с полем (здесь автопоказ не нужен) */}
              <input
                ref={hiddenDateRef}
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="absolute opacity-0 pointer-events-none w-0 h-0"
                tabIndex={-1}
              />

              <div className={`text-[12px] mt-[4px] ${needDateHint ? "text-[var(--tg-accent-color,#40A7E3)]" : "text-[var(--tg-hint-color)]"}`}>
                {needDateHint ? (t("errors.group_trip_date_required") || "Укажите дату поездки") : t("group_form.trip_date")}
              </div>
            </div>
          )}
        </CardSection>
      </div>

      {/* Сохранить и выйти — primary */}
      <button
        type="button"
        onClick={onSaveAndExit}
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

      {/* Покинуть группу — ВСЕГДА чёрный текст */}
      <button
        type="button"
        onClick={onLeave}
        aria-label={t("group_settings_leave_group")}
        className="w-full h-12 rounded-xl font-semibold
                   text-black
                   bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                   hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                   active:scale-95 transition
                   border border-[var(--tg-hint-color)]/30
                   flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        {t("group_settings_leave_group")}
      </button>

      {!canLeave && (
        <div className="px-1 -mt-2 text-[var(--tg-hint-color)] text-xs text-center leading-snug">
          {t("group_settings_cannot_leave_due_debt")}
        </div>
      )}

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

      {/* Модалка выбора валюты */}
      <CurrencyPickerModal
        open={currencyModal}
        onClose={() => setCurrencyModal(false)}
        selectedCode={currencyCode || "USD"}
        onSelect={(c) => handlePickCurrency(c.code)}
        closeOnSelect={false}
      />
    </CardSection>
  )
}

export default GroupSettingsTab
