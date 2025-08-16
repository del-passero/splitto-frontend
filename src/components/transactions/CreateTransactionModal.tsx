// src/components/transactions/CreateTransactionModal.tsx
// Модалка создания транзакции.
// Обновления:
// - Вариант 2 для выбранной группы: после выбора показываем ПИЛЮЛЮ (chip) с иконкой/названием, кликабельно для смены.
// - Гейтинг по группе: если группа не выбрана (и не передан defaultGroupId), показываем ТОЛЬКО выбор группы.
// - Сохранены UI-изменения из предыдущей итерации: разные поля для expense/transfer, маска суммы, превью, валюта в сумме,
//   валидация на лету, split-кнопка «Создать ▾» с «Создать и новую».

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X, Layers, CalendarDays, CreditCard, MessageSquare, ChevronRight,
  Shuffle, Users, ChevronDown, ChevronRight as Chevron
} from "lucide-react";
import CardSection from "../CardSection";
import GroupPickerModal from "../group/GroupPickerModal";
import { useUserStore } from "../../store/userStore";
import { useGroupsStore } from "../../store/groupsStore";
import CategoryPickerModal from "../category/CategoryPickerModal";

// ===== Types =====
export type TxType = "expense" | "transfer";

export interface MinimalGroup {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;

  // потенциальные поля валюты группы (для суммы, НЕ отображаем в пилюле)
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
  groups: MinimalGroup[];           // можно передавать пустой — модалка сама подгрузит
  defaultGroupId?: number;
};

// ===== UI helpers =====

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
        className="flex items-center w-full py-2.5 bg-transparent focus:outline-none active:opacity-90"
        style={{ minHeight: 44 }}
      >
        <span className="ml-4 mr-3 flex items-center" style={{ width: 22 }}>{icon}</span>
        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[15px]">{label}</span>
        {right ? (
          <span className="mr-3">{right}</span>
        ) : (
          <>
            {value && <span className="text-[var(--tg-link-color)] text-[15px] mr-1.5">{value}</span>}
            {onClick && <ChevronRight className="text-[var(--tg-hint-color)] mr-3" size={18} />}
          </>
        )}
      </button>
      {!isLast && <div className="absolute left-[50px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 pointer-events-none" />}
    </div>
  );
}

// Пилюля выбранной группы (вариант 2)
function SelectedGroupPill({
  name,
  icon,
  color,
  onClick,
}: {
  name: string;
  icon?: string | null;
  color?: string | null;
  onClick: () => void;
}) {
  // иконка по умолчанию — первая буква названия
  const fallback = (name || "").trim().charAt(0).toUpperCase() || "👥";
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-4 mt-1 mb-2 inline-flex items-center w-[calc(100%-2rem)] justify-between rounded-full border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition focus:outline-none"
      aria-label={name ? `Текущая группа: ${name}. Нажмите, чтобы сменить` : "Сменить группу"}
    >
      <span className="flex items-center min-w-0">
        <span
          className="mr-2 flex items-center justify-center rounded-full"
          style={{ width: 22, height: 22, fontSize: 14, border: `1px solid var(--tg-secondary-bg-color,#e7e7e7)` }}
        >
          <span aria-hidden>{icon || fallback}</span>
        </span>
        <span className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">{name}</span>
      </span>
      <Chevron size={18} className="text-[var(--tg-hint-color)] ml-2 shrink-0" />
    </button>
  );
}

// ===== Currency helpers (для поля суммы) =====
const SYMBOL_BY_CODE: Record<string, string> = {
  USD: "$", EUR: "€", RUB: "₽", GBP: "£", UAH: "₴", KZT: "₸",
  TRY: "₺", JPY: "¥", CNY: "¥", PLN: "zł", CZK: "Kč", INR: "₹", AED: "د.إ"
};
const DECIMALS_BY_CODE: Record<string, number> = { JPY: 0, KRW: 0, VND: 0 };

function pickGroupCurrency(g?: MinimalGroup | any): { code: string; symbol: string; decimals: number } {
  const codeRaw =
    g?.currency?.code ??
    g?.currency_code ??
    g?.currencyCode ??
    g?.main_currency_code ??
    g?.base_currency ??
    null;

  const code = typeof codeRaw === "string" && codeRaw.trim().length ? codeRaw.toUpperCase() : "RUB";
  const symbol =
    g?.currency?.symbol ??
    g?.currency_symbol ??
    SYMBOL_BY_CODE[code] ??
    (code === "RUB" ? "₽" : code);

  const decimals =
    (typeof g?.currency?.decimals === "number" ? g.currency.decimals : undefined) ??
    DECIMALS_BY_CODE[code] ?? 2;

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

// ===== Component =====
export default function CreateTransactionModal({ open, onOpenChange, groups: groupsProp, defaultGroupId }: Props) {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { groups: groupsStoreItems, fetchGroups } = useGroupsStore();

  // локальные группы
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

  // Категория
  const [categoryModal, setCategoryModal] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  // Сумма
  const [amount, setAmount] = useState<string>("");
  const [split, setSplit] = useState<"equal" | "shares" | "custom">("equal");
  const [paidBy, setPaidBy] = useState<number | undefined>(undefined);

  // Перевод
  const [transferFrom, setTransferFrom] = useState<number | undefined>(undefined);
  const [transferTo, setTransferTo] = useState<number | undefined>(undefined);

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState<string>("");

  // Валидация
  const [showErrors, setShowErrors] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);

  // split-кнопка
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
    setTransferFrom(undefined);
    setTransferTo(undefined);
    setDate(new Date().toISOString().slice(0, 10));
    setComment("");
    setShowErrors(false);
    setAmountTouched(false);
    setMoreOpen(false);
  }, [open, defaultGroupId]);

  const selectedGroup = useMemo(
    () => localGroups.find((g) => g.id === selectedGroupId),
    [localGroups, selectedGroupId]
  );

  const currency = useMemo(() => pickGroupCurrency(
    selectedGroup ??
    (localGroups && localGroups.length ? localGroups[0] : undefined)
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

  // Валидация
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!selectedGroupId) {
      errs.group = t("tx_modal.choose_group_first");
    }
    if (!amount || amountNumber <= 0) {
      errs.amount = locale.startsWith("ru") ? "Введите сумму больше 0" : "Enter amount > 0";
    }
    if (type === "expense" && !categoryId) {
      errs.category = locale.startsWith("ru") ? "Выберите категорию" : "Choose a category";
    }
    if (type === "transfer") {
      if (!transferFrom) errs.transfer_from = locale.startsWith("ru") ? "Укажите отправителя" : "Select sender";
      if (!transferTo) errs.transfer_to = locale.startsWith("ru") ? "Укажите получателя" : "Select recipient";
    }
    return errs;
  }, [selectedGroupId, amount, amountNumber, categoryId, type, transferFrom, transferTo, t, locale]);

  const hasErrors = Object.keys(errors).length > 0;

  // Обработчики
  const handleAmountChange = (v: string) => setAmount(parseAmountInput(v));
  const handleAmountBlur = () => { setAmountTouched(true); setAmount((prev) => toFixed2Safe(prev)); };

  const handleOpenCategory = () => {
    if (!selectedGroupId) { setShowErrors(true); return; }
    setCategoryModal(true);
  };
  const handleSelectCategory = (it: { id: number; name: string }) => { setCategoryId(it.id); setCategoryName(it.name); };

  const resetForNew = () => {
    // оставляем выбранную группу
    setType("expense");
    setCategoryId(undefined);
    setCategoryName(null);
    setAmount("");
    setSplit("equal");
    setPaidBy(undefined);
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

  const mustPickGroupFirst = !selectedGroupId; // гейтинг: если группа не выбрана — показываем только выбор группы

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      <div className="w-full h-[100dvh] min-h-screen mx-0 my-0">
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto bg-[var(--tg-card-bg,#111)]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
            aria-label={t("close")}
          >
            <X className="w-6 h-6 text-[var(--tg-hint-color)]" />
          </button>

          <div className="p-4 pt-3 flex flex-col gap-1">
            <div className="text-[17px] font-bold text-[var(--tg-text-color)] mb-1">{t("tx_modal.title")}</div>

            {/* ==== Блок выбора группы ==== */}
            <div className="-mx-4">
              <CardSection className="py-0">
                {!selectedGroup ? (
                  // до выбора — как обычная строка
                  <>
                    <Row
                      icon={<Users className="text-[var(--tg-link-color)]" size={20} />}
                      label={t("tx_modal.choose_group")}
                      value={t("tx_modal.group_placeholder")}
                      onClick={() => setGroupModal(true)}
                      isLast
                    />
                    {(!selectedGroupId) && (
                      <div className="px-4 pb-2 -mt-1 text-[12px] text-[var(--tg-hint-color)]">
                        {t("tx_modal.choose_group_first")}
                      </div>
                    )}
                    {showErrors && errors.group && (
                      <div className="px-4 pb-2 -mt-1 text-[12px] text-red-500">{errors.group}</div>
                    )}
                  </>
                ) : (
                  // после выбора — пилюля (вариант 2)
                  <SelectedGroupPill
                    name={selectedGroup.name}
                    icon={selectedGroup.icon}
                    color={selectedGroup.color || undefined}
                    onClick={() => setGroupModal(true)}
                  />
                )}
              </CardSection>
            </div>

            {/* ==== Если группа ещё не выбрана — больше ничего не показываем ==== */}
            {mustPickGroupFirst ? null : (
              <>
                {/* Тип транзакции */}
                <div className="-mx-4">
                  <CardSection className="py-0">
                    <Row
                      icon={<Shuffle className="text-[var(--tg-link-color)]" size={20} />}
                      label={t("tx_modal.type")}
                      right={
                        <div className="inline-flex rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setType("expense")}
                            className={`px-3 h-9 text-[14px] ${type === "expense" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}
                          >
                            {t("tx_modal.expense")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setType("transfer")}
                            className={`px-3 h-9 text-[14px] ${type === "transfer" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}
                          >
                            {t("tx_modal.transfer")}
                          </button>
                        </div>
                      }
                      isLast
                    />
                  </CardSection>
                </div>

                {/* Сумма + валюта + превью */}
                <div className="-mx-4">
                  <CardSection className="py-0">
                    <div className="px-4 py-2.5">
                      <label className="block text-[13px] font-medium opacity-80 mb-1">
                        {t("tx_modal.amount")} <span className="opacity-60">({currency.code})</span>
                      </label>
                      <div className="relative">
                        <input
                          inputMode="decimal"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          onBlur={handleAmountBlur}
                          className="w-full rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 pr-16 py-2.5 text-[15px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] px-2 py-1 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] opacity-80">
                          {currency.symbol || currency.code}
                        </div>
                      </div>
                      <div className="mt-1 text-[12px] opacity-70">
                        {amountTouched && showErrors && errors.amount ? (
                          <span className="text-red-500">{errors.amount}</span>
                        ) : (
                          formattedPreview || <span className="opacity-40">≈ 0.00 {currency.symbol}</span>
                        )}
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* Блоки по типу */}
                {type === "expense" ? (
                  <>
                    {/* Категория */}
                    <div className="-mx-4">
                      <CardSection className="py-0">
                        <Row
                          icon={<Layers className="text-[var(--tg-link-color)]" size={20} />}
                          label={t("tx_modal.category")}
                          value={categoryName || "—"}
                          onClick={() => setCategoryModal(true)}
                          isLast
                        />
                        {showErrors && errors.category && (
                          <div className="px-4 pb-2 -mt-1 text-[12px] text-red-500">{errors.category}</div>
                        )}
                      </CardSection>
                    </div>

                    {/* Деление */}
                    <div className="-mx-4">
                      <CardSection className="py-0">
                        <div className="px-4 py-2.5">
                          <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.split")}</label>
                          <div className="flex gap-2">
                            {[
                              { key: "equal", label: t("tx_modal.split_equal") },
                              { key: "shares", label: t("tx_modal.split_shares") },
                              { key: "custom", label: t("tx_modal.split_custom") },
                            ].map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => setSplit(opt.key as any)}
                                className={`px-3 py-1.5 rounded-lg border text-[14px] ${split === opt.key
                                    ? "border-[var(--tg-accent-color)] bg-[var(--tg-accent-color,#40A7E3)]/10"
                                    : "border-[var(--tg-secondary-bg-color,#e7e7e7)]"
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardSection>
                    </div>

                    {/* Кто платил (плейсхолдер) */}
                    <div className="-mx-4">
                      <CardSection className="py-0">
                        <div className="px-4 py-2.5">
                          <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.paid_by")}</label>
                          <div className="relative">
                            <select
                              disabled
                              value={paidBy ?? ""}
                              onChange={(e) => setPaidBy(Number(e.target.value))}
                              className="w-full appearance-none rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2.5 pr-9 text-[15px] text-[color:var(--tg-hint-color)] focus:outline-none"
                            >
                              <option value="">{t("not_specified")}</option>
                            </select>
                            <CreditCard className="absolute right-8 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tg-hint-color)]">▾</span>
                          </div>
                        </div>
                      </CardSection>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Перевод: Отправитель */}
                    <div className="-mx-4">
                      <CardSection className="py-0">
                        <div className="px-4 py-2.5">
                          <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.transfer_from")}</label>
                          <div className="relative">
                            <select
                              disabled
                              value={transferFrom ?? ""}
                              onChange={(e) => setTransferFrom(Number(e.target.value))}
                              className="w-full appearance-none rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2.5 pr-9 text-[15px] text-[color:var(--tg-hint-color)] focus:outline-none"
                            >
                              <option value="">{t("not_specified")}</option>
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tg-hint-color)]">▾</span>
                          </div>
                          {showErrors && errors.transfer_from && (
                            <div className="mt-1 text-[12px] text-red-500">{errors.transfer_from}</div>
                          )}
                        </div>
                      </CardSection>
                    </div>

                    {/* Перевод: Получатели */}
                    <div className="-mx-4">
                      <CardSection className="py-0">
                        <div className="px-4 py-2.5">
                          <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.transfer_to")}</label>
                          <div className="relative">
                            <select
                              disabled
                              value={transferTo ?? ""}
                              onChange={(e) => setTransferTo(Number(e.target.value))}
                              className="w-full appearance-none rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2.5 pr-9 text-[15px] text-[color:var(--tg-hint-color)] focus:outline-none"
                            >
                              <option value="">{t("not_specified")}</option>
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tg-hint-color)]">▾</span>
                          </div>
                          {showErrors && errors.transfer_to && (
                            <div className="mt-1 text-[12px] text-red-500">{errors.transfer_to}</div>
                          )}
                        </div>
                      </CardSection>
                    </div>
                  </>
                )}

                {/* Дата */}
                <div className="-mx-4">
                  <CardSection className="py-0">
                    <div className="px-4 py-2.5">
                      <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.date")}</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2.5 text-[15px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                        />
                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* Комментарий */}
                <div className="-mx-4">
                  <CardSection className="py-0">
                    <div className="px-4 py-2.5">
                      <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.comment")}</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2.5 text-[15px] resize-y min-h-[72px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                        />
                        <MessageSquare className="absolute right-3 top-2 opacity-40" size={18} />
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* Кнопки */}
                <div className="flex flex-row gap-2 mt-1 w-full relative">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    style={{ color: "#000" }}
                    className="w-1/2 py-2.5 rounded-xl font-bold text-[15px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition"
                  >
                    {t("cancel")}
                  </button>

                  {/* split-кнопка: "Создать" + стрелка */}
                  <div className="w-1/2 relative">
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => doCreate("close")}
                        className="flex-1 py-2.5 rounded-l-xl font-bold text-[15px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                        disabled={hasErrors}
                      >
                        {t("tx_modal.create")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMoreOpen((v) => !v)}
                        className="px-3 py-2.5 rounded-r-xl font-bold text-[15px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                        aria-label="More actions"
                        disabled={hasErrors}
                      >
                        <ChevronDown size={18} />
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

      {/* Выбор группы */}
      <GroupPickerModal
        open={groupModal}
        onClose={() => setGroupModal(false)}
        selectedId={selectedGroupId}
        onSelect={(g) => { setSelectedGroupId(g.id); setGroupModal(false); }}
      />

      {/* Выбор категории (только для expense) */}
      <CategoryPickerModal
        open={categoryModal && !!selectedGroupId && type === "expense"}
        onClose={() => setCategoryModal(false)}
        groupId={selectedGroupId || 0}
        selectedId={categoryId}
        onSelect={(it) => { handleSelectCategory({ id: it.id, name: it.name }); setCategoryModal(false); }}
        closeOnSelect
      />
    </div>
  );
}
