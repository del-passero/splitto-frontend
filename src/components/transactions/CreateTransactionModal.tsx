import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X, CalendarDays, ChevronRight,
  Users, ChevronDown, ChevronRight as Chevron
} from "lucide-react";
import CardSection from "../CardSection";
import GroupPickerModal from "../group/GroupPickerModal";
import { useUserStore } from "../../store/userStore";
import { useGroupsStore } from "../../store/groupsStore";
import CategoryPickerModal from "../category/CategoryPickerModal";
import MemberPickerModal from "../group/MemberPickerModal";
import SplitPickerModal, { SplitSelection, PerPerson, computePerPerson } from "./SplitPickerModal";

export type TxType = "expense" | "transfer";

export interface MinimalGroup {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;

  // поля валюты — как в GroupHeader
  default_currency_code?: string | null;
  currency_code?: string | null;
  currency?: string | null;
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

// валюта: код -> символ/дробь
const SYMBOL_BY_CODE: Record<string, string> = { USD:"$", EUR:"€", RUB:"₽", GBP:"£", UAH:"₴", KZT:"₸", TRY:"₺", JPY:"¥", CNY:"¥", PLN:"zł", CZK:"Kč", INR:"₹", AED:"د.إ" };
const DECIMALS_BY_CODE: Record<string, number> = { JPY: 0, KRW: 0, VND: 0 };

// === РОВНО КАК В GroupHeader ===
function resolveCurrencyCodeFromGroup(g?: MinimalGroup | null): string | null {
  return (
    (g as any)?.default_currency_code ||
    (g as any)?.currency_code ||
    (g as any)?.currency ||
    null
  );
}
function makeCurrency(g?: MinimalGroup | null) {
  const raw = resolveCurrencyCodeFromGroup(g);
  const code = typeof raw === "string" ? raw.toUpperCase() : null;
  return {
    code: code || "",
    symbol: code ? (SYMBOL_BY_CODE[code] ?? (code === "RUB" ? "₽" : code)) : "",
    decimals: code ? (DECIMALS_BY_CODE[code] ?? 2) : 2,
  };
}

// Маска суммы
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
function toFixedSafe(s: string, decimals = 2): string {
  if (!s) return "";
  const n = Number(s);
  if (!isFinite(n)) return "";
  return n.toFixed(decimals);
}

function fmtMoney(n: number, decimals: number, symbol: string, locale: string) {
  try {
    const nf = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${nf.format(n)} ${symbol}`;
  } catch {
    return `${n.toFixed(decimals)} ${symbol}`;
  }
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
  const [categoryIcon, setCategoryIcon] = useState<string | null>(null);
  const [categoryColor, setCategoryColor] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>("");
  const [splitType, setSplitType] = useState<"equal" | "shares" | "custom">("equal");
  const [splitData, setSplitData] = useState<SplitSelection | null>(null);

  const [paidBy, setPaidBy] = useState<number | undefined>(undefined);
  const [paidByName, setPaidByName] = useState<string>("");
  const [paidByAvatar, setPaidByAvatar] = useState<string | undefined>(undefined);

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState<string>("");

  const [payerOpen, setPayerOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);

  // Валидация
  const [showErrors, setShowErrors] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [commentTouched, setCommentTouched] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // сброс при закрытии
  useEffect(() => {
    if (open) return;
    setSelectedGroupId(defaultGroupId);
    setType("expense");
    setCategoryModal(false);
    setCategoryId(undefined);
    setCategoryName(null);
    setCategoryIcon(null);
    setCategoryColor(null);
    setAmount("");
    setSplitType("equal");
    setSplitData(null);
    setPaidBy(undefined);
    setPaidByName("");
    setPaidByAvatar(undefined);
    setDate(new Date().toISOString().slice(0, 10));
    setComment("");
    setShowErrors(false);
    setAmountTouched(false);
    setCommentTouched(false);
    setMoreOpen(false);
    setPayerOpen(false);
    setSplitOpen(false);
  }, [open, defaultGroupId]);

  const selectedGroup = useMemo(
    () => localGroups.find((g) => g.id === selectedGroupId) || null,
    [localGroups, selectedGroupId]
  );

  const currency = useMemo(() => makeCurrency(selectedGroup), [selectedGroup]);

  const locale = useMemo(() => (i18n.language || "ru").split("-")[0], [i18n.language]);
  const amountNumber = useMemo(() => {
    const n = Number(amount);
    return isFinite(n) ? n : 0;
  }, [amount]);

  const formattedPreview = useMemo(() => {
    if (!amount || amountNumber <= 0) return "";
    return `≈ ${fmtMoney(amountNumber, currency.decimals, currency.symbol, locale)}`;
  }, [amount, amountNumber, currency, locale]);

  // ---- split preview (перерасчёт на лету) ----
  const perPerson: PerPerson[] = useMemo(() => {
    if (!splitData || amountNumber <= 0) return [];
    return computePerPerson(splitData, amountNumber, currency.decimals);
  }, [splitData, amountNumber, currency.decimals]);

  const customMismatch: null | { sumParts: number; total: number } = useMemo(() => {
    if (!splitData || splitData.type !== "custom") return null;
    const totalParts = perPerson.reduce((s, p) => s + p.amount, 0);
    const total = amountNumber;
    const eps = 1 / Math.pow(10, currency.decimals);
    return Math.abs(totalParts - total) > eps ? { sumParts: totalParts, total } : null;
  }, [splitData, perPerson, amountNumber, currency.decimals]);

  // Валидация
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!selectedGroupId) errs.group = t("tx_modal.choose_group_first");
    if (!amount || amountNumber <= 0) errs.amount = locale.startsWith("ru") ? "Введите сумму больше 0" : "Enter amount > 0";
    if (!comment.trim()) errs.comment = locale.startsWith("ru") ? "Заполните комментарий" : "Enter a comment";
    if (type === "expense" && !categoryId) errs.category = locale.startsWith("ru") ? "Выберите категорию" : "Choose a category";
    if (splitData) {
      if (splitData.type === "equal" && splitData.participants.length === 0) {
        errs.split = locale.startsWith("ru") ? "Выберите участников" : "Select participants";
      }
      if (splitData.type === "shares") {
        const totalShares = splitData.participants.reduce((s, p) => s + (p.share || 0), 0);
        if (totalShares <= 0) errs.split = locale.startsWith("ru") ? "Доли должны быть больше нуля" : "Shares must be > 0";
        if (splitData.participants.length === 0) errs.split = locale.startsWith("ru") ? "Выберите участников" : "Select participants";
      }
      if (splitData.type === "custom" && customMismatch) {
        errs.split = locale.startsWith("ru") ? "Сумма по участникам должна равняться общей" : "Participants total must equal overall";
      }
    }
    return errs;
  }, [selectedGroupId, amount, amountNumber, comment, locale, type, categoryId, splitData, customMismatch, t]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleAmountChange = (v: string) => setAmount(parseAmountInput(v));
  const handleAmountBlur = () => { setAmountTouched(true); setAmount((prev) => toFixedSafe(prev, currency.decimals)); };
  const handleCommentBlur = () => setCommentTouched(true);

  // теперь принимаем весь объект категории, чтобы забрать icon и цвет (родительский, если нужно)
  const handleSelectCategory = (it: { id: number; name: string; icon?: string | null; color?: string | null; parent_color?: string | null }) => {
    setCategoryId(it.id);
    setCategoryName(it.name);
    setCategoryIcon(it.icon ?? null);
    setCategoryColor((it.color as string | null) ?? (it.parent_color as string | null) ?? null);
  };

  const resetForNew = () => {
    setType("expense");
    setCategoryId(undefined);
    setCategoryName(null);
    setCategoryIcon(null);
    setCategoryColor(null);
    setAmount("");
    setSplitType("equal");
    setSplitData(null);
    setPaidBy(undefined);
    setPaidByName("");
    setPaidByAvatar(undefined);
    setDate(new Date().toISOString().slice(0, 10));
    setComment("");
    setShowErrors(false);
    setAmountTouched(false);
    setCommentTouched(false);
  };

  const doCreate = (mode: "close" | "again") => {
    setShowErrors(true);
    setAmountTouched(true);
    setCommentTouched(true);
    if (hasErrors) return;

    const payload = {
      group_id: selectedGroupId,
      type,
      amount: Number(toFixedSafe(amount, currency.decimals)),
      currency: currency.code, // код из группы как в header
      comment: comment.trim(),
      ...(type === "expense" ? { category_id: categoryId } : {}),
      paid_by: paidBy,
      split: splitData || { type: "equal", participants: [] as any[] },
      date,
    };
    // eslint-disable-next-line no-console
    console.log("[CreateTransactionModal] draft", payload);

    if (mode === "close") onOpenChange(false);
    else resetForNew();
  };

  if (!open) return null;

  const mustPickGroupFirst = !selectedGroupId;
  const groupLocked = Boolean(defaultGroupId);

  // утилита: только имя из полного
  const firstName = (s?: string) => {
    const tok = (s || "").trim().split(/\s+/).filter(Boolean);
    return tok[0] || "";
  };

  // стиль для бейджа категории
  const catBorder = categoryColor ? `${categoryColor}55` : "var(--tg-secondary-bg-color,#e7e7e7)";
  const catBgSoft = categoryColor ? `${categoryColor}22` : "transparent";

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      <div className="w-full h-[100dvh] min-h-screen mx-0 my-0">
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto bg-[var(--tg-card-bg,#111)]">
          {/* Close */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-1.5 right-1.5 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
            aria-label={t("close")}
          >
            <X className="w-5 h-5 text-[var(--tg-hint-color)]" />
          </button>

          {/* Content */}
          <div className="p-3 pt-12 flex flex-col gap-1">
            {/* Заголовок */}
            <div className="text-[17px] font-bold text-[var(--tg-text-color)] mb-1">{t("tx_modal.title")}</div>

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
                {/* Тип */}
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

                {/* Сумма */}
                <div className="-mx-3">
                  <CardSection className="py-0">
                    <div className="px-3 pb-0.5">
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="min-w-[52px] h-9 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center text-[12px] px-2"
                          title={currency.code}
                        >
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
                        {amountTouched && (showErrors || amountTouched) && errors.amount ? (
                          <span className="text-red-500">{errors.amount}</span>
                        ) : (
                          formattedPreview || <span className="opacity-40">≈ {fmtMoney(0, currency.decimals, currency.symbol, locale)}</span>
                        )}
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* --- Объединённый блок: Категория + Комментарий --- */}
                {type === "expense" ? (
                  <div className="-mx-3">
                    <CardSection className="py-1">
                      <div className="px-3 flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setCategoryModal(true)}
                          className="inline-flex items-center gap-2 px-2.5 h-9 rounded-lg border text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0"
                          style={{ borderColor: catBorder }}
                        >
                          <span
                            className="w-6 h-6 rounded-md flex items-center justify-center"
                            style={{
                              background: catBgSoft,
                              border: categoryColor ? `1px solid ${categoryColor}55` : "1px solid var(--tg-hint-color)",
                            }}
                          >
                            <span aria-hidden className="text-[14px]">{categoryIcon || "🏷️"}</span>
                          </span>
                          <span className="truncate max-w-[160px]">
                            {categoryName || t("tx_modal.category")}
                          </span>
                        </button>

                        <input
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          onBlur={handleCommentBlur}
                          placeholder={t("tx_modal.comment")}
                          className="flex-1 h-9 bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] focus:border-[var(--tg-accent-color)] text-[14px]"
                        />
                      </div>

                      {/* ошибки под объединённым блоком */}
                      {(showErrors || commentTouched) && !comment.trim() && (
                        <div className="px-3 pt-1 text-[12px] text-red-500">
                          {locale.startsWith("ru") ? "Заполните комментарий" : "Please enter a comment"}
                        </div>
                      )}
                      {showErrors && errors.category && (
                        <div className="px-3 pt-1 text-[12px] text-red-500">{errors.category}</div>
                      )}
                    </CardSection>
                  </div>
                ) : null}

                {/* Чипы Paid by / Split */}
                {type === "expense" ? (
                  <div className="-mx-3">
                    <CardSection className="py-0">
                      <div className="px-3 py-1.5 flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPayerOpen(true)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition max-w-full"
                        >
                          <span>{t("tx_modal.paid_by")}</span>
                          {paidBy ? (
                            <span className="inline-flex items-center gap-1 max-w-[160px] truncate">
                              {paidByAvatar ? (
                                <img src={paidByAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-[var(--tg-link-color)] inline-block" />
                              )}
                              <strong className="truncate">{firstName(paidByName) || t("not_specified")}</strong>
                            </span>
                          ) : (
                            <strong className="truncate">{t("not_specified")}</strong>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSplitOpen(true)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition"
                        >
                          <span>{t("tx_modal.split")}</span>
                          <strong>
                            {splitData?.type
                              ? splitData.type === "equal"
                                ? t("tx_modal.split_equal")
                                : splitData.type === "shares"
                                ? t("tx_modal.split_shares")
                                : t("tx_modal.split_custom")
                              : t("tx_modal.split_equal")}
                          </strong>
                        </button>
                      </div>

                      {/* Превью кому сколько */}
                      {!!perPerson.length && (
                        <div className="px-3 pb-2 -mt-1">
                          <div className="flex flex-col gap-1.5">
                            {perPerson.slice(0, 4).map((p) => (
                              <div key={p.user_id} className="flex items-center gap-2 text-[13px]">
                                {p.avatar_url ? (
                                  <img src={p.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <span className="w-5 h-5 rounded-full bg-[var(--tg-link-color)] inline-block" />
                                )}
                                <span className="truncate flex-1">{p.name}</span>
                                <span className="shrink-0 opacity-80">
                                  {fmtMoney(p.amount, currency.decimals, currency.symbol, locale)}
                                </span>
                              </div>
                            ))}
                            {perPerson.length > 4 && (
                              <div className="text-[12px] opacity-60">+{perPerson.length - 4}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Ошибка сплита, если есть */}
                      {(showErrors && errors.split) && (
                        <div className="px-3 pb-2 -mt-1 text-[12px] text-red-500">{errors.split}</div>
                      )}
                      {/* Предупреждение при кастомном расхождении (если сумма изменилась после выбора) */}
                      {customMismatch && (
                        <div className="px-3 pb-2 -mt-1 text-[12px] text-red-500">
                          {locale.startsWith("ru")
                            ? `Сумма по участникам ${fmtMoney(customMismatch.sumParts, currency.decimals, currency.symbol, locale)} не равна общей ${fmtMoney(customMismatch.total, currency.decimals, currency.symbol, locale)}`
                            : `Participants total ${fmtMoney(customMismatch.sumParts, currency.decimals, currency.symbol, locale)} doesn't equal overall ${fmtMoney(customMismatch.total, currency.decimals, currency.symbol, locale)}`
                          }
                        </div>
                      )}
                    </CardSection>
                  </div>
                ) : null}

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

      {/* Выбор группы */}
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
        onSelect={(it) => { handleSelectCategory(it); setCategoryModal(false); }}
        closeOnSelect
      />

      {/* Выбор плательщика */}
      <MemberPickerModal
        open={payerOpen && !!selectedGroupId}
        onClose={() => setPayerOpen(false)}
        groupId={selectedGroupId || 0}
        selectedUserId={paidBy}
        onSelect={(u) => {
          setPaidBy(u.id);
          setPaidByName(u.name || "");
          setPaidByAvatar(u.avatar_url || undefined);
        }}
        closeOnSelect
      />

      {/* Выбор деления */}
      <SplitPickerModal
        open={splitOpen && !!selectedGroupId}
        onClose={() => setSplitOpen(false)}
        groupId={selectedGroupId || 0}
        amount={Number(toFixedSafe(amount || "0", currency.decimals))}
        currency={{ code: currency.code, symbol: currency.symbol, decimals: currency.decimals }}
        initial={splitData || { type: splitType, participants: [] as any[] }}
        onSave={(sel) => { setSplitType(sel.type); setSplitData(sel); setSplitOpen(false); }}
      />
    </div>
  );
}
