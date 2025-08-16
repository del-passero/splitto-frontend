// src/components/transactions/CreateTransactionModal.tsx
// Модалка создания транзакции в ВАШЕМ визуальном стиле (как CreateGroupModal):
// • Никаких анимаций и лишних зависимостей
// • Полная поддержка Telegram-темы (переменные --tg-*)
// • Сначала выбираем группу — потом появляются остальные поля
// • Пока НИЧЕГО не сохраняет — только визуал и закрытие по кнопке

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  X,
  HandCoins,
  CalendarDays,
  MessageSquare,
  Layers,
  CreditCard,
  Users,
} from "lucide-react"
import CardSection from "../CardSection"

type MinimalGroup = {
  id: number
  name: string
  color?: string | null
  icon?: string | null
}

type TxType = "expense" | "transfer"
type SplitType = "equal" | "shares" | "custom"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  groups: MinimalGroup[]
  defaultGroupId?: number
}

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

/** Горизонтальный Row как в CreateGroupModal: без внешних отступов, с edge-to-edge divider */
function Row({
  icon,
  label,
  value,
  right,
  onClick,
  isLast,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  right?: React.ReactNode
  onClick?: () => void
  isLast?: boolean
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cx(
          "flex items-center w-full py-4 bg-transparent focus:outline-none active:opacity-90",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        style={{ minHeight: 48 }}
      >
        {/* слева выравниваем по инпутам (контейнер формы даёт p-4) */}
        <span className="ml-4 mr-3 flex items-center" style={{ width: 22 }}>
          {icon}
        </span>

        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[16px]">
          {label}
        </span>

        {right ? (
          <span className="mr-4">{right}</span>
        ) : (
          <>
            {value && (
              <span className="text-[var(--tg-link-color)] text-[16px] mr-4">
                {value}
              </span>
            )}
          </>
        )}
      </button>

      {!isLast && (
        <div className="absolute left-[50px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 pointer-events-none" />
      )}
    </div>
  )
}

const CreateTransactionModal = ({
  open,
  onOpenChange,
  groups,
  defaultGroupId,
}: Props) => {
  const { t } = useTranslation()

  // --- Состояния формы ---
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">(
    defaultGroupId ?? ""
  )
  const [type, setType] = useState<TxType>("expense")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<string>("")
  const [comment, setComment] = useState("")
  const [splitType, setSplitType] = useState<SplitType>("equal")

  // placeholder’ы для будущих полей
  const [paidBy] = useState<number | "">("")
  const [transferFrom] = useState<number | "">("")
  const [transferTo] = useState<readonly number[] | null>(null)

  const hiddenDateRef = useRef<HTMLInputElement | null>(null)

  // --- Жизненный цикл модалки ---
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open) {
      setSelectedGroupId(defaultGroupId ?? "")
      setType("expense")
      setAmount("")
      setDate(new Date().toISOString().slice(0, 10)) // YYYY-MM-DD
      setComment("")
      setSplitType("equal")
    }
  }, [open, defaultGroupId])

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === Number(selectedGroupId)),
    [groups, selectedGroupId]
  )

  // --- Рендер ---
  if (!open) return null

  const disabledPrimary = !selectedGroup || !amount || Number(amount) <= 0

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      {/* full-screen контейнер с максимально стабильной высотой */}
      <div className="w-full h-[100dvh] min-h-screen mx-0 my-0">
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto bg-[var(--tg-card-bg,#111)]">
          {/* Close */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
            aria-label={t("close")}
            tabIndex={0}
          >
            <X className="w-6 h-6 text-[var(--tg-hint-color)]" />
          </button>

          {/* Форма */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (disabledPrimary) return
              // Пока просто закрываем и логируем черновик
              // eslint-disable-next-line no-console
              console.log("[CreateTransactionModal] draft", {
                group_id: selectedGroup?.id,
                type,
                amount,
                date,
                comment,
                split_type: type === "expense" ? splitType : undefined,
              })
              onOpenChange(false)
            }}
            className="p-4 pt-4 flex flex-col gap-3"
          >
            <div className="text-lg font-bold text-[var(--tg-text-color)] mb-1">
              {t("tx_modal.title")}
            </div>

            {/* ГРУППА */}
            <div className="space-y-[4px]">
              <label className="block text-[14px] text-[var(--tg-hint-color)]">
                {t("tx_modal.choose_group")}
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border bg-[var(--tg-bg-color,#fff)]
                           border-[var(--tg-secondary-bg-color,#e7e7e7)]
                           text-[var(--tg-text-color)]
                           font-medium text-base focus:border-[var(--tg-accent-color)] focus:outline-none transition"
                value={selectedGroupId}
                onChange={(e) => {
                  const v = e.target.value
                  setSelectedGroupId(v === "" ? "" : Number(v))
                }}
              >
                <option value="">{t("tx_modal.group_placeholder")}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Остальные поля появляются ТОЛЬКО после выбора группы */}
            {selectedGroup && (
              <>
                {/* TYPE */}
                <CardSection className="py-2 -mx-4">
                  <Row
                    icon={
                      <HandCoins
                        className="text-[var(--tg-link-color)]"
                        size={22}
                      />
                    }
                    label={t("tx_modal.type")}
                    isLast
                    right={
                      <div className="flex gap-2 mr-2">
                        <button
                          type="button"
                          onClick={() => setType("expense")}
                          className={cx(
                            "px-3 py-2 rounded-lg text-sm font-semibold border transition",
                            type === "expense"
                              ? "bg-[var(--tg-accent-color,#40A7E3)] text-white border-transparent"
                              : "bg-transparent text-[var(--tg-text-color)] border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-[var(--tg-accent-color)]/10"
                          )}
                        >
                          {t("tx_modal.expense")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setType("transfer")}
                          className={cx(
                            "px-3 py-2 rounded-lg text-sm font-semibold border transition",
                            type === "transfer"
                              ? "bg-[var(--tg-accent-color,#40A7E3)] text-white border-transparent"
                              : "bg-transparent text-[var(--tg-text-color)] border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-[var(--tg-accent-color)]/10"
                          )}
                        >
                          {t("tx_modal.transfer")}
                        </button>
                      </div>
                    }
                  />
                </CardSection>

                {/* AMOUNT + DATE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-[4px]">
                    <label className="block text-[14px] text-[var(--tg-hint-color)]">
                      {t("tx_modal.amount")}
                    </label>
                    <div className="relative">
                      <input
                        inputMode="decimal"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) =>
                          setAmount(e.target.value.replace(",", "."))
                        }
                        className="w-full px-4 py-3 rounded-xl border bg-[var(--tg-bg-color,#fff)]
                                   border-[var(--tg-secondary-bg-color,#e7e7e7)]
                                   text-[var(--tg-text-color)]
                                   font-medium text-base focus:border-[var(--tg-accent-color)] focus:outline-none transition"
                      />
                      <HandCoins
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50"
                        size={18}
                      />
                    </div>
                  </div>

                  <div className="space-y-[4px]">
                    <label className="block text-[14px] text-[var(--tg-hint-color)]">
                      {t("tx_modal.date")}
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full px-4 py-3 rounded-xl border text-left bg-[var(--tg-bg-color,#fff)]
                                   border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)]
                                   font-normal text-base focus:border-[var(--tg-accent-color)] focus:outline-none transition"
                        onClick={() => {
                          const el = hiddenDateRef.current
                          if (!el) return
                          // @ts-ignore
                          if (typeof el.showPicker === "function") el.showPicker()
                          else el.click()
                        }}
                      >
                        {date || "YYYY-MM-DD"}
                      </button>
                      <input
                        ref={hiddenDateRef}
                        type="date"
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        tabIndex={-1}
                      />
                      <CalendarDays
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50"
                        size={18}
                      />
                    </div>
                  </div>
                </div>

                {/* COMMENT */}
                <div className="grid gap-[4px]">
                  <label className="block text-[14px] text-[var(--tg-hint-color)]">
                    {t("tx_modal.comment")}
                  </label>
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border bg-[var(--tg-bg-color,#fff)]
                                 border-[var(--tg-secondary-bg-color,#e7e7e7)]
                                 text-[var(--tg-text-color)]
                                 font-normal text-base min-h-[64px] max-h-[160px] resize-none
                                 focus:border-[var(--tg-accent-color)] focus:outline-none transition"
                    />
                    <MessageSquare className="absolute right-3 top-3 opacity-50" size={18} />
                  </div>
                </div>

                {/* Блоки по типу транзакции */}
                {type === "expense" ? (
                  <>
                    {/* Деление */}
                    <CardSection className="py-2 -mx-4">
                      <Row
                        icon={<Layers className="text-[var(--tg-link-color)]" size={22} />}
                        label={t("tx_modal.split")}
                        isLast
                        right={
                          <div className="flex gap-2 mr-2">
                            {(["equal", "shares", "custom"] as SplitType[]).map((k) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => setSplitType(k)}
                                className={cx(
                                  "px-3 py-2 rounded-lg text-sm font-semibold border transition",
                                  splitType === k
                                    ? "bg-[var(--tg-accent-color,#40A7E3)] text-white border-transparent"
                                    : "bg-transparent text-[var(--tg-text-color)] border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-[var(--tg-accent-color)]/10"
                                )}
                              >
                                {t(
                                  k === "equal"
                                    ? "tx_modal.split_equal"
                                    : k === "shares"
                                    ? "tx_modal.split_shares"
                                    : "tx_modal.split_custom"
                                )}
                              </button>
                            ))}
                          </div>
                        }
                      />
                    </CardSection>

                    {/* Категория + Кто платил (плейсхолдеры, пока disabled) */}
                    <div className="-mx-4">
                      <CardSection className="py-0">
                        <Row
                          icon={<Layers className="text-[var(--tg-link-color)]" size={22} />}
                          label={t("tx_modal.category")}
                          value="—"
                          disabled
                        />
                        <Row
                          icon={<CreditCard className="text-[var(--tg-link-color)]" size={22} />}
                          label={t("tx_modal.paid_by")}
                          right={
                            <select
                              disabled
                              className="px-3 py-2 mr-2 rounded-lg border text-[14px]
                                         bg-[var(--tg-bg-color,#fff)]
                                         border-[var(--tg-secondary-bg-color,#e7e7e7)]
                                         text-[var(--tg-text-color)]"
                              value={paidBy}
                              onChange={() => {}}
                            >
                              <option value="">{/* пусто */}—</option>
                            </select>
                          }
                          isLast
                        />
                      </CardSection>
                    </div>
                  </>
                ) : (
                  // type === "transfer"
                  <div className="-mx-4">
                    <CardSection className="py-0">
                      <Row
                        icon={<CreditCard className="text-[var(--tg-link-color)]" size={22} />}
                        label={t("tx_modal.transfer_from")}
                        right={
                          <select
                            disabled
                            className="px-3 py-2 mr-2 rounded-lg border text-[14px]
                                       bg-[var(--tg-bg-color,#fff)]
                                       border-[var(--tg-secondary-bg-color,#e7e7e7)]
                                       text-[var(--tg-text-color)]"
                            value={transferFrom}
                            onChange={() => {}}
                          >
                            <option value="">—</option>
                          </select>
                        }
                      />
                      <Row
                        icon={<Users className="text-[var(--tg-link-color)]" size={22} />}
                        label={t("tx_modal.transfer_to")}
                        value={transferTo ? String(transferTo.length) : "—"}
                        disabled
                        isLast
                      />
                    </CardSection>
                  </div>
                )}

                {/* Кнопки */}
                <div className="flex flex-row gap-2 mt-1 w-full">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    style={{ color: "#000" }}
                    className="w-1/2 py-3 rounded-xl font-bold text-base
                               bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                               border border-[var(--tg-hint-color)]/30
                               hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={disabledPrimary}
                    className="w-1/2 py-3 rounded-xl font-bold text-base
                               bg-[var(--tg-accent-color,#40A7E3)] text-white
                               flex items-center justify-center gap-2 active:scale-95
                               disabled:opacity-60 disabled:pointer-events-none transition"
                  >
                    {t("tx_modal.create")}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateTransactionModal
