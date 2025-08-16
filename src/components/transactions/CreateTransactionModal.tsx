// src/components/transactions/CreateTransactionModal.tsx
// Визуальная модалка создания транзакции.
// Изменения:
// - Компактные отступы/высоты (меньше «воздуха»).
// - Фикс: крестик не перекрывает верхний элемент (контент с небольшим верхним отступом).
// - Пилюля группы: цветной аватар, длинные названия — truncate, на странице группы — заблокировано.
// - Чип "Paid by" делает выбор плательщика через MemberPickerModal.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X, Layers, CalendarDays, CreditCard, MessageSquare, ChevronRight,
  Users, ChevronDown, ChevronRight as Chevron, FileText, Shuffle
} from "lucide-react";
import CardSection from "../CardSection";
import GroupPickerModal from "../group/GroupPickerModal";
import { useUserStore } from "../../store/userStore";
import { useGroupsStore } from "../../store/groupsStore";
import CategoryPickerModal from "../category/CategoryPickerModal";
import MemberPickerModal from "../group/MemberPickerModal";

export type TxType = "expense" | "transfer";

export interface MinimalGroup {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
  currency_code?: string | null;
  currencyCode?: string | null;
  main_currency_code?: string | null;
  base_currency?: string | null;
  currency_symbol?: string | null;
  currency?: { code?: string; symbol?: string; decimals?: number } | null;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: MinimalGroup[];
  defaultGroupId?: number;
};

function Row({
  icon, label, value, onClick, right, isLast
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center w-full py-2 bg-transparent focus:outline-none active:opacity-90"
        style={{ minHeight: 40 }}
      >
        <span className="ml-4 mr-3 flex items-center" style={{ width: 22 }}>{icon}</span>
        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[14px]">{label}</span>
        {right ? (
          <span className="mr-3">{right}</span>
        ) : (
          <>
            {value && <span className="text-[var(--tg-link-color)] text-[14px] mr-1.5">{value}</span>}
            {onClick && <ChevronRight className="text-[var(--tg-hint-color)] mr-3" size={16} />}
          </>
        )}
      </button>
      {!isLast && <div className="absolute left-[50px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 pointer-events-none" />}
    </div>
  );
}

function SelectedGroupPill({
  name, icon, color, onClick, locked,
}: {
  name: string;
  icon?: string | null;
  color?: string | null;
  onClick?: () => void;
  locked?: boolean;
}) {
  const ch = (name || "").trim().charAt(0).toUpperCase() || "👥";
  const bg = color && /^#([0-9a-f]{3}){1,2}$/i.test(color) ? color : "var(--tg-link-color)";
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      className={`mx-3 mt-1 mb-1 inline-flex items-center w-[calc(100%-1.5rem)] justify-between rounded-full border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] px-3 py-1.5 transition focus:outline-none ${locked ? "cursor-default" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
      aria-label={locked ? `Группа: ${name}` : `Текущая группа: ${name}. Нажмите, чтобы сменить`}
    >
      <span className="flex items-center min-w-0">
        <span
          className="mr-2 flex items-center justify-center rounded-full text-white"
          style={{ width: 22, height: 22, fontSize: 14, background: bg }}
        >
          <span aria-hidden>{icon || ch}</span>
        </span>
        <span className="text-[14px] font-medium text-[var(--tg-text-color)] truncate">{name}</span>
      </span>
      {!locked && <Chevron size={16} className="text-[var(--tg-hint-color)] ml-2 shrink-0" />}
    </button>
  );
}

const SYMBOL_BY_CODE: Record<string, string> = { USD:"$", EUR:"€", RUB:"₽", GBP:"£", UAH:"₴", KZT:"₸", TRY:"₺", JPY:"¥", CNY:"¥", PLN:"zł", CZK:"Kč", INR:"₹", AED:"د.إ" };
const DECIMALS_BY_CODE: Record<string, number> = { JPY: 0, KRW: 0, VND: 0 };

function pickGroupCurrency(g?: MinimalGroup | any): { code: string; symbol: string; decimals: number } {
  const codeRaw = g?.currency?.code ?? g?.currency_code ?? g?.currencyCode ?? g?.main_currency_code ?? g?.base_currency ?? null;
  const code = typeof codeRaw === "string" && codeRaw.trim().length ? codeRaw.toUpperCase() : "RUB";
  const symbol = g?.currency?.symbol ?? g?.currency_symbol ?? SYMBOL_BY_CODE[code] ?? (code === "RUB" ? "₽" : code);
  const decimals = (typeof g?.currency?.decimals === "number" ? g.currency.decimals : undefined) ?? DECIMALS_BY_CODE[code] ?? 2;
  return { code, symbol, decimals };
}

function parseAmountInput(raw: string): string {
  let s = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    const head = s.slice(0, firstDot + 1);
    const tail = s.slice(firstDot + 1).replace(/\./g, "");
    s = head + tail;
  }
  if (s.includes(".")) {
    const [int, dec] = s.split(".");
    s = int + "." + dec.slice(0, 2);
  }
  return s;
}
function toFixed2Safe(s: string): string {
  if (!s) return "";
  const n = Number(s);
  if (!isFinite(n)) return "";
  return n.toFixed(2);
}

export default function CreateTransactionModal({ open, onOpenChange, groups: groupsProp, defaultGroupId }: Props) {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { groups: groupsStoreItems, fetchGroups } = useGroupsStore();

  const [localGroups, setLocalGroups] = useState<MinimalGroup[]>([]);
  useEffect(() => {
    setLocalGroups(groupsProp && groupsProp.length ? groupsProp : (groupsStoreItems ?? []));
  }, [groupsProp, groupsStoreItems]);

  // автоподгрузка групп
  const didLoadRef = useRef(false);
  useEffect(() => {
    if (!open) return;
    if (didLoadRef.current) return;
    const need = !(groupsProp && groupsProp.length) && !(groupsStoreItems && groupsStoreItems.length);
    if (need && user?.id) {
      didLoadRef.current = true;
      fetchGroups(user.id).catch(() => {}).finally(() => {});
    }
  }, [open, groupsProp, groupsStoreItems, user, fetchGroups]);

  // форма
  const [groupModal, setGroupModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(defaultGroupId);
  const [type, setType] = useState<TxType>("expense");

  const [categoryModal, setCategoryModal] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>("");
  const [split, setSplit] = useState<"equal" | "shares" | "custom">("equal");

  const [paidBy, setPaidBy] = useState<number | undefined>(undefined);
  const [paidByName, setPaidByName] = useState<string>("");

  const [transferFrom, setTransferFrom] = useState<number | undefined>(undefined);
  const [transferTo, setTransferTo] = useState<number | undefined>(undefined);

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState<string>("");

  const [payerOpen, setPayerOpen] = useState(false);

  // Валидация
  const [showErrors, setShowErrors] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // сброс при закрытии
  useEffect(() => {
    if (open) return;
    setSelectedGroupId(defaultGroupId);
    setType("expense");
    setCategoryModal(false);
    setCategoryId(undefined);
    setCategoryName(null);
    setAmount("");
    setSplit("equal");
    setPaidBy(undefined);
    setPaidByName("");
    setTransferFrom(undefined);
    setTransferTo(undefined);
    setDate(new Date().toISOString().slice(0, 10));
    setComment("");
    setShowErrors(false);
    setAmountTouched(false);
    setMoreOpen(false);
    setPayerOpen(false);
  }, [open, defaultGroupId]);

  const selectedGroup = useMemo(
    () => localGroups.find((g) => g.id === selectedGroupId),
    [localGroups, selectedGroupId]
  );

  const currency = useMemo(() => pickGroupCurrency(
    selectedGroup ?? (localGroups && localGroups.length ? localGroups[0] : undefined)
  ), [selectedGroup, localGroups]);

  const locale = useMemo(() => (i18n.language || "ru").split("-")[0], [i18n.language]);
  const amountNumber = useMemo(() => {
    const n = Number(amount);
    return isFinite(n) ? n : 0;
  }, [amount]);
  const formattedPreview = useMemo(() => {
    if (!amount || amountNumber <= 0) return "";
    try {
      const nf = new Intl.NumberFormat(locale, {
        minimumFractionDigits: currency.decimals,
        maximumFractionDigits: currency.decimals,
      });
      return `≈ ${nf.format(amountNumber)} ${currency.symbol}`;
    } catch {
      return `≈ ${amountNumber.toFixed(currency.decimals)} ${currency.symbol}`;
    }
  }, [amount, amountNumber, currency, locale]);

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!selectedGroupId) errs.group = t("tx_modal.choose_group_first");
    if (!amount || amountNumber <= 0) errs.amount = locale.startsWith("ru") ? "Введите сумму больше 0" : "Enter amount > 0";
    if (type === "expense" && !categoryId) errs.category = locale.startsWith("ru") ? "Выберите категорию" : "Choose a category";
    if (type === "transfer") {
      if (!transferFrom) errs.transfer_from = locale.startsWith("ru") ? "Укажите отправителя" : "Select sender";
      if (!transferTo) errs.transfer_to = locale.startsWith("ru") ? "Укажите получателя" : "Select recipient";
    }
    return errs;
  }, [selectedGroupId, amount, amountNumber, categoryId, type, transferFrom, transferTo, t, locale]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleAmountChange = (v: string) => setAmount(parseAmountInput(v));
  const handleAmountBlur = () => { setAmountTouched(true); setAmount((prev) => toFixed2Safe(prev)); };

  const handleSelectCategory = (it: { id: number; name: string }) => { setCategoryId(it.id); setCategoryName(it.name); };

  const resetForNew = () => {
    setType("expense");
    setCategoryId(undefined);
    setCategoryName(null);
    setAmount("");
    setSplit("equal");
    setPaidBy(undefined);
    setPaidByName("");
    setTransferFrom(undefined);
    setTransferTo(undefined);
    setDate(new Date().toISOString().slice(0, 10));
    setComment("");
    setShowErrors(false);
    setAmountTouched(false);
  };

  const doCreate = (mode: "close" | "again") => {
    setShowErrors(true);
    if (hasErrors) return;
    const payload =
      type === "expense"
        ? {
            group_id: selectedGroupId,
            type,
            category_id: categoryId,
            category: categoryName,
            amount: Number(amount),
            currency: currency.code,
            split,
            paid_by: paidBy,
            date,
            comment,
          }
        : {
            group_id: selectedGroupId,
            type,
            amount: Number(amount),
            currency: currency.code,
            transfer_from: transferFrom,
            transfer_to: transferTo,
            date,
            comment,
          };
    // eslint-disable-next-line no-console
    console.log("[CreateTransactionModal] draft", payload);
    if (mode === "close") onOpenChange(false);
    else resetForNew();
  };

  if (!open) return null;

  const mustPickGroupFirst = !selectedGroupId;
  const groupLocked = Boolean(defaultGroupId);

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      <div className="w-full h-[100dvh] min-h-screen mx-0 my-0">
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto bg-[var(--tg-card-bg,#111)]">
          {/* Кнопка закрытия (меньше и плотнее к краю) */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-1.5 right-1.5 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
            aria-label={t("close")}
          >
            <X className="w-5 h-5 text-[var(--tg-hint-color)]" />
          </button>

          {/* Контент — добавлен небольшой верхний отступ, чтобы крестик не перекрывал верхний блок */}
          <div className="p-3 pt-12 flex flex-col gap-1">
            {/* Заголовок убран по требованию */}

            {/* Группа */}
            <div className="-mx-3">
              <CardSection className="py-0">
                {!selectedGroup ? (
                  <>
                    <Row
                      icon={<Users className="text-[var(--tg-link-color)]" size={18} />}
                      label={t("tx_modal.choose_group")}
                      value={t("tx_modal.group_placeholder")}
                      onClick={() => setGroupModal(true)}
                      isLast
                    />
                    {(!selectedGroupId) && (
                      <div className="px-4 pb-1 -mt-0.5 text-[12px] text-[var(--tg-hint-color)]">
                        {t("tx_modal.choose_group_first")}
                      </div>
                    )}
                  </>
                ) : (
                  <SelectedGroupPill
                    name={selectedGroup.name}
                    icon={selectedGroup.icon}
                    color={selectedGroup.color || undefined}
                    onClick={() => setGroupModal(true)}
                    locked={groupLocked}
                  />
                )}
              </CardSection>
            </div>

            {/* Если группа не выбрана — остальное прячем */}
            {mustPickGroupFirst ? null : (
              <>
                {/* Тип (компактный сегмент-контрол) */}
                <div className="-mx-3">
                  <CardSection className="py-0.5">
                    <div className="px-3 pb-1">
                      <div className="inline-flex rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setType("expense")}
                          className={`px-3 h-9 text-[13px] ${type === "expense" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}
                        >
                          {t("tx_modal.expense")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setType("transfer")}
                          className={`px-3 h-9 text-[13px] ${type === "transfer" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}
                        >
                          {t("tx_modal.transfer")}
                        </button>
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* Описание */}
                <div className="-mx-3">
                  <CardSection className="py-0">
                    <div className="px-3 pt-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center">
                          <FileText size={16} className="opacity-80" />
                        </div>
                        <input
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder={t("tx_modal.comment")}
                          className="flex-1 bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] focus:border-[var(--tg-accent-color)] py-1.5 text-[14px]"
                        />
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* Сумма */}
                <div className="-mx-3">
                  <CardSection className="py-0">
                    <div className="px-3 pb-0.5">
                      <div className="flex items-center gap-2 mt-1">
                        <div className="min-w-[52px] h-9 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center text-[12px] px-2" title={currency.code}>
                          {currency.code}
                        </div>
                        <input
                          inputMode="decimal"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          onBlur={handleAmountBlur}
                          className="flex-1 h-9 rounded-md bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] focus:border-[var(--tg-accent-color)] px-1 text-[17px]"
                        />
                      </div>
                      <div className="mt-0.5 text-[12px] opacity-70">
                        {amountTouched && showErrors && errors.amount ? (
                          <span className="text-red-500">{errors.amount}</span>
                        ) : (
                          formattedPreview || <span className="opacity-40">≈ 0.00 {currency.symbol}</span>
                        )}
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* expense-специфика */}
                {type === "expense" ? (
                  <>
                    {/* Категория */}
                    <div className="-mx-3">
                      <CardSection className="py-0">
                        <Row
                          icon={<Layers className="text-[var(--tg-link-color)]" size={18} />}
                          label={t("tx_modal.category")}
                          value={categoryName || "—"}
                          onClick={() => setCategoryModal(true)}
                          isLast
                        />
                        {showErrors && errors.category && (
                          <div className="px-4 pb-1 -mt-0.5 text-[12px] text-red-500">{errors.category}</div>
                        )}
                      </CardSection>
                    </div>

                    {/* Чипы Paid by / Split */}
                    <div className="-mx-3">
                      <CardSection className="py-0">
                        <div className="px-3 py-1.5 flex gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setPayerOpen(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition"
                          >
                            <span>{t("tx_modal.paid_by")}</span>
                            <strong className="truncate max-w-[160px]">
                              {paidBy ? (paidByName || t("not_specified")) : t("not_specified")}
                            </strong>
                          </button>

                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px]">
                            <span>{t("tx_modal.split")}</span>
                            <strong>
                              {split === "equal"
                                ? t("tx_modal.split_equal")
                                : split === "shares"
                                ? t("tx_modal.split_shares")
                                : t("tx_modal.split_custom")}
                            </strong>
                          </div>
                        </div>
                      </CardSection>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Перевод: пока плейсхолдеры */}
                    <div className="-mx-3">
                      <CardSection className="py-0">
                        <div className="px-3 py-1.5">
                          <label className="block text-[12px] font-medium opacity-80 mb-0.5">{t("tx_modal.transfer_from")}</label>
                          <div className="relative">
                            <select
                              disabled
                              value={transferFrom ?? ""}
                              onChange={(e) => setTransferFrom(Number(e.target.value))}
                              className="w-full h-9 appearance-none rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 pr-8 text-[14px] text-[color:var(--tg-hint-color)] focus:outline-none"
                            >
                              <option value="">{t("not_specified")}</option>
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tg-hint-color)]">▾</span>
                          </div>
                        </div>
                      </CardSection>
                    </div>

                    <div className="-mx-3">
                      <CardSection className="py-0">
                        <div className="px-3 py-1.5">
                          <label className="block text-[12px] font-medium opacity-80 mb-0.5">{t("tx_modal.transfer_to")}</label>
                          <div className="relative">
                            <select
                              disabled
                              value={transferTo ?? ""}
                              onChange={(e) => setTransferTo(Number(e.target.value))}
                              className="w-full h-9 appearance-none rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 pr-8 text-[14px] text-[color:var(--tg-hint-color)] focus:outline-none"
                            >
                              <option value="">{t("not_specified")}</option>
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tg-hint-color)]">▾</span>
                          </div>
                        </div>
                      </CardSection>
                    </div>
                  </>
                )}

                {/* Дата */}
                <div className="-mx-3">
                  <CardSection className="py-0">
                    <div className="px-3 py-1.5">
                      <label className="block text-[12px] font-medium opacity-80 mb-0.5">{t("tx_modal.date")}</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 text-[14px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                        />
                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* Кнопки */}
                <div className="flex flex-row gap-2 mt-2 w-full relative">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    style={{ color: "#000" }}
                    className="w-1/2 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition"
                  >
                    {t("cancel")}
                  </button>

                  <div className="w-1/2 relative">
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => doCreate("close")}
                        className="flex-1 h-10 rounded-l-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                        disabled={hasErrors}
                      >
                        {t("tx_modal.create")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMoreOpen((v) => !v)}
                        className="px-3 h-10 rounded-r-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                        aria-label="More actions"
                        disabled={hasErrors}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    {moreOpen && !hasErrors && (
                      <div
                        className="absolute right-0 mt-1 w-[220px] rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] z-10"
                        onMouseLeave={() => setMoreOpen(false)}
                      >
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2.5 text-[14px] hover:bg-black/5 dark:hover:bg:white/5 rounded-xl"
                          onClick={() => { setMoreOpen(false); doCreate("again"); }}
                        >
                          {locale.startsWith("ru") ? "Создать и новую" : "Create and add another"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Выбор группы (заблокирован если есть defaultGroupId) */}
      <GroupPickerModal
        open={groupModal && !groupLocked}
        onClose={() => setGroupModal(false)}
        selectedId={selectedGroupId}
        onSelect={(g) => { setSelectedGroupId(g.id); setGroupModal(false); }}
      />

      {/* Выбор категории */}
      <CategoryPickerModal
        open={!!selectedGroupId && type === "expense" && categoryModal}
        onClose={() => setCategoryModal(false)}
        groupId={selectedGroupId || 0}
        selectedId={categoryId}
        onSelect={(it) => { handleSelectCategory({ id: it.id, name: it.name }); setCategoryModal(false); }}
        closeOnSelect
      />

      {/* Выбор плательщика */}
      <MemberPickerModal
        open={payerOpen && !!selectedGroupId}
        onClose={() => setPayerOpen(false)}
        groupId={selectedGroupId || 0}
        selectedUserId={paidBy}
        onSelect={(u) => { setPaidBy(u.id); setPaidByName(u.name); }}
        closeOnSelect
      />
    </div>
  );
}
