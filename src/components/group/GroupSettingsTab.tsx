// src/components/group/GroupSettingsTab.tsx
import { useEffect, useRef, useState } from "react"
import {
  Save,
  Trash2,
  CircleDollarSign,
  CalendarDays,
  ChevronRight,
  X,
  Archive,
  RotateCw,
  EyeOff,
  Eye,
  Shuffle,
} from "lucide-react"
import CardSection from "../CardSection"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import CurrencyPickerModal from "../currency/CurrencyPickerModal"
import {
  getGroupDetails,
  patchGroupCurrency,
  patchGroupSchedule,
  patchGroupSettleAlgorithm,
} from "../../api/groupsApi"
import type { SettleAlgorithm } from "../../types/group"

type Props = {
  isOwner: boolean
  onLeave: () => void     // перенесено в MembersTab, тут не используем
  onDelete: () => void
  onSaveAndExit: () => void
  canLeave?: boolean
  // ↓ добавлено: флаги и экшены для логики 1-в-1 с GroupCardMenu
  flags?: {
    isOwner: boolean
    isArchived: boolean
    isDeleted: boolean
    isHiddenForMe?: boolean
  }
  actions?: {
    onHide?: () => Promise<void> | void
    onUnhide?: () => Promise<void> | void
    onArchive?: () => Promise<void> | void
    onUnarchive?: () => Promise<void> | void
    onRestore?: (opts?: { toActive?: boolean }) => Promise<void> | void
  }
}

/** Переключатель, как в CreateGroupModal — добавили disabled и возможность отключить анимации на первый рендер */
function Switch({
  checked,
  onChange,
  ariaLabel,
  disabled = false,
  animated = true,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel: string
  disabled?: boolean
  animated?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      className={`relative inline-flex items-center w-12 h-7 rounded-full ${
        animated ? "transition-colors" : ""
      } ${checked ? "bg-[var(--tg-theme-button-color,#40A7E3)]" : "bg-[var(--tg-secondary-bg-color,#e6e6e6)]"} disabled:opacity-60 disabled:pointer-events-none`}
    >
      <span
        className={`absolute h-6 w-6 rounded-full bg-white shadow transform ${
          animated ? "transition-transform" : ""
        } ${checked ? "translate-x-5" : "translate-x-1"}`}
      />
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

// ==== Хелперы для логики «как в GroupCardMenu» ====

const detectDebtMessage = (raw: string) =>
  /unsettled|cannot\s+be\s+(deleted|archived)|долг|долги|задолж/i.test(raw || "")

const normalizeErrorMessage = (raw: string, t: (k: string) => string, kind: "archive" | "delete" | "generic"): string => {
  if (detectDebtMessage(raw)) {
    if (kind === "archive") return (t("archive_forbidden_debts_note") as string) || raw
    if (kind === "delete") return (t("delete_forbidden_debts_note") as string) || raw
  }
  return raw || (t("error") as string)
}

async function smartClick(
  fn: (() => Promise<void> | void) | undefined,
  t: (k: string) => string,
  opts?: { confirmKey?: string; errorTitle?: string; kind?: "archive" | "delete" | "generic" }
) {
  try {
    if (opts?.confirmKey) {
      const ok = window.confirm(t(opts.confirmKey) as string)
      if (!ok) return
    }
    await fn?.()
  } catch (e: any) {
    const raw = e?.message || ""
    const msg = normalizeErrorMessage(raw, t, opts?.kind ?? "generic")
    window.alert(`${opts?.errorTitle || (t("error") as string)}: ${msg}`)
  }
}

const GroupSettingsTab = ({
  isOwner,
  onLeave: _onLeave, // перенесено в MembersTab
  onDelete,
  onSaveAndExit,
  canLeave = true,
  flags,
  actions,
}: Props) => {
  const { t } = useTranslation()
  const { groupId } = useParams()
  const gid = Number(groupId)

  // Флаг «первичная гидрация значений из БД»
  const [hydrating, setHydrating] = useState(true)

  // локальное состояние для «валюта + алгоритм + поездка»
  const [currencyCode, setCurrencyCode] = useState<string>("USD")
  const [currencyModal, setCurrencyModal] = useState(false)

  const [minTransfers, setMinTransfers] = useState<boolean>(true) // true=greedy, false=pairs

  const [endDate, setEndDate] = useState<string>("") // YYYY-MM-DD или ""
  const [tripEnabled, setTripEnabled] = useState<boolean>(false) // UX-вариант A
  const hiddenDateRef = useRef<HTMLInputElement | null>(null)
  const tripBlockRef = useRef<HTMLDivElement | null>(null) // для скролла к полю
  const [tripDateError, setTripDateError] = useState(false) // подсветка подписи красным

  const [loadingCurrency, setLoadingCurrency] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [loadingAlgo, setLoadingAlgo] = useState(false)

  // сохраняем исходные значения для "Отменить изменения"
  const initialCurrencyRef = useRef<string>("USD")
  const initialEndDateRef = useRef<string>("")
  const initialTripEnabledRef = useRef<boolean>(false)
  const initialAlgoRef = useRef<SettleAlgorithm>("greedy")

  // первичная загрузка значений из БД
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!gid) {
        setHydrating(false)
        return
      }
      try {
        const g = await getGroupDetails(gid)
        if (cancelled || !g) return
        const cc = g.default_currency_code || "USD"
        const ymd = (g.end_date as string) || ""
        const algo = (g.settle_algorithm as SettleAlgorithm) || "greedy"

        setCurrencyCode(cc)
        setEndDate(ymd)
        setTripEnabled(Boolean(ymd))
        setMinTransfers(algo === "greedy")

        initialCurrencyRef.current = cc
        initialEndDateRef.current = ymd
        initialTripEnabledRef.current = Boolean(ymd)
        initialAlgoRef.current = algo
      } catch {
        // ignore
      } finally {
        if (!cancelled) setHydrating(false) // ← выключаем анимации только после первичной установки стейтов
      }
    }
    load()
    return () => {
      cancelled = true
    }
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
        // алгоритм — отдельным PATCH
        const desiredAlgo: SettleAlgorithm = minTransfers ? "greedy" : "pairs"
        if (desiredAlgo !== initialAlgoRef.current) {
          setLoadingAlgo(true)
          await patchGroupSettleAlgorithm(gid, desiredAlgo)
          initialAlgoRef.current = desiredAlgo
          setLoadingAlgo(false)
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
    setMinTransfers(initialAlgoRef.current === "greedy")
    onSaveAndExit()
  }

  // флаги для действий
  const isArchived = !!flags?.isArchived
  const isDeleted = !!flags?.isDeleted
  const hidden = !!flags?.isHiddenForMe
  const owner = !!flags?.isOwner

  // видимость экшенов — ровно как в GroupCardMenu
  const showHide = true
  const showArchive = owner && !isDeleted && !isArchived
  const showUnarchive = owner && !isDeleted && isArchived
  const showRestore = owner && isDeleted

  const saving = hydrating || loadingAlgo || loadingCurrency || loadingSchedule

  return (
    <CardSection className="flex flex-col gap-3 p-4 min-h-[280px]">
      {/* === Блок «Валюта + алгоритм + поездка» (edge-to-edge) === */}
      <div className="-mx-4">
        <CardSection className="py-0">
          <Row
            icon={<CircleDollarSign className="text-[var(--tg-link-color)]" size={22} />}
            label={t("currency.main_currency")}
            value={currencyCode || "USD"}
            onClick={() => !loadingCurrency && !hydrating && setCurrencyModal(true)}
          />
          <Row
            icon={<Shuffle className="text-[var(--tg-link-color)]" size={20} />}
            label={t("settle.minimum_transfers") || "Минимум переводов"}
            right={
              <Switch
                checked={minTransfers}
                onChange={(v) => setMinTransfers(v)}
                ariaLabel={t("settle.minimum_transfers") || "Минимум переводов"}
                disabled={saving}
                animated={!hydrating}
              />
            }
          />
          <Row
            icon={<CalendarDays className="text-[var(--tg-link-color)]" size={22} />}
            label={t("group_form.is_trip")}
            right={
              <Switch
                checked={tripEnabled}
                onChange={handleToggleTrip}
                ariaLabel={t("group_form.is_trip")}
                disabled={saving}
                animated={!hydrating}
              />
            }
            onClick={() => !saving && handleToggleTrip(!tripEnabled)}
            isLast
          />

          {/* Видимое поле даты — только когда тумблер включён */}
          {tripEnabled && (
            <div ref={tripBlockRef} className="px-4 pt-2 pb-3">
              <button
                type="button"
                disabled={saving}
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

      {/* === Действия с группой (логика 1-в-1 с GroupCardMenu) === */}
      <div className="-mx-4">
        <CardSection className="px-4 py-3">
          <div className="flex flex-col gap-2">
            {/* Скрыть / Показать */}
            {showHide && (
              <button
                type="button"
                aria-label={hidden ? (t("unhide") as string) : (t("hide") as string)}
                onClick={() =>
                  smartClick(hidden ? actions?.onUnhide : actions?.onHide, (t as unknown) as any, {
                    errorTitle: t("error") as string,
                    kind: "generic",
                  })
                }
                className="w-full rounded-lg font-semibold
                           text-black
                           bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                           hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                           active:scale-95 transition
                           border border-[var(--tg-hint-color)]/30
                           flex items-center justify-center gap-2
                           py-2"
              >
                {hidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                {hidden ? (t("unhide") || "Показать") : (t("hide") || "Скрыть")}
              </button>
            )}

            {/* Архивировать */}
            {showArchive && (
              <button
                type="button"
                aria-label={t("archive")}
                onClick={() =>
                  smartClick(actions?.onArchive, (t as unknown) as any, {
                    confirmKey: "group_modals.archive_confirm",
                    errorTitle: t("error") as string,
                    kind: "archive",
                  })
                }
                className="w-full rounded-lg font-semibold
                           text-black
                           bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                           hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                           active:scale-95 transition
                           border border-[var(--tg-hint-color)]/30
                           flex items-center justify-center gap-2
                           py-2"
              >
                <Archive className="w-5 h-5" />
                {t("archive") || "Архивировать"}
              </button>
            )}

            {/* Разархивировать */}
            {showUnarchive && (
              <button
                type="button"
                aria-label={t("unarchive")}
                onClick={() =>
                  smartClick(actions?.onUnarchive, (t as unknown) as any, {
                    confirmKey: "group_modals.unarchive_confirm",
                    errorTitle: t("error") as string,
                    kind: "generic",
                  })
                }
                className="w-full rounded-lg font-semibold
                           text-black
                           bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                           hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                           active:scale-95 transition
                           border border-[var(--tg-hint-color)]/30
                           flex items-center justify-center gap-2
                           py-2"
              >
                <RotateCw className="w-5 h-5" />
                {t("unarchive") || "Разархивировать"}
              </button>
            )}

            {/* Восстановить (после удаления) */}
            {showRestore && (
              <button
                type="button"
                aria-label={t("restore")}
                onClick={() =>
                  smartClick(() => actions?.onRestore?.({ toActive: true }), (t as unknown) as any, {
                    confirmKey: "group_modals.restore_confirm",
                    errorTitle: t("error") as string,
                    kind: "generic",
                  })
                }
                className="w-full rounded-lg font-semibold
                           text-black
                           bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                           hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                           active:scale-95 transition
                           border border-[var(--tg-hint-color)]/30
                           flex items-center justify-center gap-2
                           py-2"
              >
                <RotateCw className="w-5 h-5" />
                {t("restore") || "Восстановить"}
              </button>
            )}
          </div>
        </CardSection>
      </div>

      {/* === Кнопки управления === */}
      <div className="-mx-4">
        <CardSection className="px-4 py-3">
          <div className="flex flex-col gap-2">
            {/* Сохранить и выйти */}
            <button
              type="button"
              onClick={handleSaveClick}
              aria-label={t("group_settings_save_and_exit")}
              className="w-full rounded-lg font-semibold
                         text-white
                         bg-[var(--tg-accent-color,#40A7E3)]
                         hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                         active:scale-95 transition
                         shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                         border border-[var(--tg-hint-color)]/20
                         flex items-center justify-center gap-2
                         py-2"
            >
              <Save className="w-5 h-5" />
              {t("group_settings_save_and_exit")}
            </button>

            {/* Отменить изменения */}
            <button
              type="button"
              onClick={handleCancelClick}
              aria-label={t("group_settings_cancel_changes")}
              className="w-full rounded-lg font-semibold
                         text-black
                         bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                         hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                         active:scale-95 transition
                         border border-[var(--tg-hint-color)]/30
                         flex items-center justify-center gap-2
                         py-2"
            >
              <X className="w-5 h-5" />
              {t("group_settings_cancel_changes")}
            </button>

            {/* Удалить группу */}
            {isOwner && (
              <button
                type="button"
                onClick={() =>
                  smartClick(onDelete, (t as unknown) as any, {
                    confirmKey: "group_modals.delete_soft_confirm",
                    errorTitle: t("error") as string,
                    kind: "delete",
                  })
                }
                aria-label={t("group_settings_delete_group")}
                className="w-full rounded-lg font-semibold
                           text-white
                           bg-red-500 hover:bg-red-500/90
                           active:scale-95 transition
                           border border-red-500/70
                           flex items-center justify-center gap-2
                           py-2"
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
