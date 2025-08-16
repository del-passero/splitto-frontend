// src/components/transactions/CreateTransactionModal.tsx
// Визуальная модалка создания транзакции в стиле CreateGroupModal:
// - Каждый блок завернут в CardSection
// - Меньшие отступы, плотная верстка
// - Тип "Расход/Перевод" — сегмент-кнопки высотой как у инпутов
// - Тип деления — выпадающий список
// - Порядок: Группа → Тип → Категория → Сумма → Деление → Кто платил → Дата → Комментарий
// - Текстовые лейблы не переносятся (whitespace-nowrap)

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { X, Layers, HandCoins, CalendarDays, CreditCard, MessageSquare } from "lucide-react"
import CardSection from "../CardSection"

export interface MinimalGroup {
  id: number
  name: string
  color?: string | null
  icon?: string | null
}
export type TxType = "expense" | "transfer"
export type SplitType = "equal" | "shares" | "custom"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  groups: MinimalGroup[]
  defaultGroupId?: number
}

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ")
}

export default function CreateTransactionModal({ open, onOpenChange, groups, defaultGroupId }: Props) {
  const { t } = useTranslation()

  // form state
  const [groupId, setGroupId] = useState<number | "">("")
  const [type, setType] = useState<TxType>("expense")
  const [categoryId, setCategoryId] = useState<number | "">("")
  const [amount, setAmount] = useState<string>("")
  const [splitType, setSplitType] = useState<SplitType>("equal")
  const [paidBy, setPaidBy] = useState<number | "">("")
  const [date, setDate] = useState<string>("")
  const [comment, setComment] = useState<string>("")

  const dateInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    // reset
    setGroupId(defaultGroupId ?? "")
    setType("expense")
    setCategoryId("")
    setAmount("")
    setSplitType("equal")
    setPaidBy("")
    setDate(new Date().toISOString().slice(0, 16)) // YYYY-MM-DDTHH:mm
    setComment("")
  }, [open, defaultGroupId])

  const selectedGroup = useMemo(() => groups.find(g => g.id === groupId), [groups, groupId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      <div className="w-full h-[100dvh] min-h-screen">
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto bg-[var(--tg-card-bg,#111)]">
          {/* close */}
          <button type="button" onClick={() => onOpenChange(false)} className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition" aria-label={t("close") as string}>
            <X className="w-6 h-6 text-[var(--tg-hint-color)]" />
          </button>

          {/* form */}
          <form className="p-3 pt-3 flex flex-col gap-2">
            <div className="text-lg font-bold text-[var(--tg-text-color)] mb-1 whitespace-nowrap">{t("tx_modal.title")}</div>

            {/* GROUP */}
            <CardSection className="py-0">
              <div className="flex items-center h-12 px-2">
                <span className="mr-3 whitespace-nowrap text-[16px] text-[var(--tg-text-color)]">{t("tx_modal.choose_group")}</span>
                <div className="ml-auto relative">
                  <select className="h-10 min-w-[200px] px-3 pr-8 rounded-xl border bg-[var(--tg-bg-color,#fff)] border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] focus:border-[var(--tg-accent-color)] focus:outline-none transition whitespace-nowrap"
                          value={groupId} onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">{t("tx_modal.group_placeholder")}</option>
                    {groups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--tg-hint-color)]">▾</span>
                </div>
              </div>
            </CardSection>

            {/* TYPE (expense/transfer) */}
            <CardSection className="py-0">
              <div className="flex items-center h-12 px-2 gap-2">
                <span className="mr-2 whitespace-nowrap text-[16px] text-[var(--tg-text-color)]">{t("tx_modal.type")}</span>
                <div className="ml-auto grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setType("expense")}
                          className={cx("h-10 px-4 rounded-xl text-[15px] transition whitespace-nowrap",
                                        type === "expense"
                                          ? "bg-[var(--tg-theme-button-color,#40A7E3)] text-white"
                                          : "bg-[var(--tg-bg-color,#fff)] text-[var(--tg-text-color)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10")}>
                    {t("tx_modal.expense")}
                  </button>
                  <button type="button" onClick={() => setType("transfer")}
                          className={cx("h-10 px-4 rounded-xl text-[15px] transition whitespace-nowrap",
                                        type === "transfer"
                                          ? "bg-[var(--tg-theme-button-color,#40A7E3)] text-white"
                                          : "bg-[var(--tg-bg-color,#fff)] text-[var(--tg-text-color)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10")}>
                    {t("tx_modal.transfer")}
                  </button>
                </div>
              </div>
            </CardSection>

            {/* CATEGORY (пока заглушка) */}
            <CardSection className="py-0">
              <div className="flex items-center h-12 px-2 gap-2">
                <Layers className="text-[var(--tg-link-color)]" size={20} />
                <span className="whitespace-nowrap text-[16px] text-[var(--tg-text-color)]">{t("tx_modal.category")}</span>
                <div className="ml-auto relative">
                  <select disabled className="h-10 min-w-[200px] px-3 pr-8 rounded-xl border bg-[var(--tg-bg-color,#f6f6f6)] border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-hint-color)] focus:outline-none transition whitespace-nowrap">
                    <option>—</option>
                  </select>
                </div>
              </div>
            </CardSection>

            {/* AMOUNT */}
            <CardSection className="py-0">
              <div className="flex items-center h-12 px-2 gap-2">
                <HandCoins className="text-[var(--tg-link-color)]" size={20} />
                <span className="whitespace-nowrap text-[16px] text-[var(--tg-text-color)]">{t("tx_modal.amount")}</span>
                <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(",", "."))}
                       className="ml-auto h-10 w-[200px] px-3 rounded-xl border bg-[var(--tg-bg-color,#fff)] border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] focus:border-[var(--tg-accent-color)] focus:outline-none transition" />
              </div>
            </CardSection>

            {/* SPLIT TYPE — select */}
            <CardSection className="py-0">
              <div className="flex items-center h-12 px-2 gap-2">
                <Layers className="text-[var(--tg-link-color)]" size={20} />
                <span className="whitespace-nowrap text-[16px] text-[var(--tg-text-color)]">{t("tx_modal.split")}</span>
                <div className="ml-auto relative">
                  <select className="h-10 min-w-[200px] px-3 pr-8 rounded-xl border bg-[var(--tg-bg-color,#fff)] border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] focus:border-[var(--tg-accent-color)] focus:outline-none transition whitespace-nowrap"
                          value={splitType} onChange={(e) => setSplitType(e.target.value as SplitType)}>
                    <option value="equal">{t("tx_modal.split_equal")}</option>
                    <option value="shares">{t("tx_modal.split_shares")}</option>
                    <option value="custom">{t("tx_modal.split_custom")}</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--tg-hint-color)]">▾</span>
                </div>
              </div>
            </CardSection>

            {/* PAID BY (заглушка, disabled) */}
            <CardSection className="py-0">
              <div className="flex items-center h-12 px-2 gap-2">
                <CreditCard className="text-[var(--tg-link-color)]" size={20} />
                <span className="whitespace-nowrap text-[16px] text-[var(--tg-text-color)]">{t("tx_modal.paid_by")}</span>
                <div className="ml-auto relative">
                  <select disabled className="h-10 min-w-[200px] px-3 pr-8 rounded-xl border bg-[var(--tg-bg-color,#f6f6f6)] border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-hint-color)] focus:outline-none transition whitespace-nowrap" value={paidBy} onChange={(e) => setPaidBy(Number(e.target.value))}>
                    <option value="">—</option>
                  </select>
                </div>
              </div>
            </CardSection>

            {/* DATE */}
            <CardSection className="py-0">
              <div className="flex items-center h-12 px-2 gap-2">
                <CalendarDays className="text-[var(--tg-link-color)]" size={20} />
                <span className="whitespace-nowrap text-[16px] text-[var(--tg-text-color)]">{t("tx_modal.date")}</span>
                <button type="button" onClick={() => { const el = dateInputRef.current as any; if (el?.showPicker) el.showPicker(); else el?.click?.() }} className="ml-auto h-10 min-w-[200px] px-3 rounded-xl border text-left bg-[var(--tg-bg-color,#fff)] border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] focus:border-[var(--tg-accent-color)] focus:outline-none transition whitespace-nowrap">
                  {date?.replace("T", " ") || "—"}
                </button>
                <input ref={dateInputRef} type="datetime-local" className="absolute opacity-0 pointer-events-none w-0 h-0" value={date} onChange={(e) => setDate(e.target.value)} tabIndex={-1} />
              </div>
            </CardSection>

            {/* COMMENT */}
            <CardSection className="py-0">
              <div className="px-2 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="text-[var(--tg-link-color)]" size={20} />
                  <span className="whitespace-nowrap text-[16px] text-[var(--tg-text-color)]">{t("tx_modal.comment")}</span>
                </div>
                <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-[var(--tg-bg-color,#fff)] border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] placeholder:text-[var(--tg-hint-color)] focus:border-[var(--tg-accent-color)] focus:outline-none transition resize-none" />
              </div>
            </CardSection>

            {/* buttons */}
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => onOpenChange(false)} style={{ color: "#000" }} className="w-1/2 py-3 rounded-xl font-bold text-base bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition">
                {t("cancel")}
              </button>
              <button type="button" onClick={() => { console.log("[CreateTransactionModal] draft", { group_id: groupId || null, type, category_id: categoryId || null, amount, split_type: splitType, paid_by: paidBy || null, date, comment, }) ; onOpenChange(false) }} className="w-1/2 py-3 rounded-xl font-bold text-base bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition">
                {t("tx_modal.create")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
