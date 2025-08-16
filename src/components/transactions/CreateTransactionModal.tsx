import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Layers, CalendarDays, ChevronRight, Users, ChevronDown, ChevronRight as Chevron, FileText } from "lucide-react";
import CardSection from "../CardSection";
import GroupPickerModal from "../group/GroupPickerModal";
import { useUserStore } from "../../store/userStore";
import { useGroupsStore } from "../../store/groupsStore";
import CategoryPickerModal from "../category/CategoryPickerModal";
import MemberPickerModal from "../group/MemberPickerModal";
import SplitPickerModal, { SplitResult } from "./SplitPickerModal";

export type TxType = "expense" | "transfer";

export interface MinimalGroup {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
  default_currency_code?: string | null;
  currency_code?: string | null;
  currency?: string | { code?: string; symbol?: string; decimals?: number } | null;
  currency_symbol?: string | null;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: MinimalGroup[];
  defaultGroupId?: number; // если передан (страница группы) — группу нельзя менять
};

function Row({ icon, label, value, onClick, right, isLast }: { icon: React.ReactNode; label: string; value?: string; onClick?: () => void; right?: React.ReactNode; isLast?: boolean }) {
  return (
    <div className="relative">
      <button type="button" onClick={onClick} className="flex items-center w-full py-2 bg-transparent focus:outline-none active:opacity-90" style={{ minHeight: 40 }}>
        <span className="ml-4 mr-3 flex items-center" style={{ width: 22 }}>{icon}</span>
        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[14px]">{label}</span>
        {right ? <span className="mr-3">{right}</span> : (<>{value && <span className="text-[var(--tg-link-color)] text-[14px] mr-1.5">{value}</span>}{onClick && <ChevronRight className="text-[var(--tg-hint-color)] mr-3" size={16} />}</>)}
      </button>
      {!isLast && <div className="absolute left-[50px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 pointer-events-none" />}
    </div>
  );
}

function SelectedGroupPill({ name, icon, color, onClick, locked }: { name: string; icon?: string | null; color?: string | null; onClick?: () => void; locked?: boolean; }) {
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
        <span className="mr-2 flex items-center justify-center rounded-full text-white" style={{ width: 22, height: 22, fontSize: 14, background: bg }}>
          <span aria-hidden>{icon || ch}</span>
        </span>
        {/* длинные названия НЕ переносятся — только truncate */}
        <span className="text-[14px] font-medium text-[var(--tg-text-color)] truncate">{name}</span>
      </span>
      {!locked && <Chevron size={16} className="text-[var(--tg-hint-color)] ml-2 shrink-0" />}
    </button>
  );
}

const SYMBOL_BY_CODE: Record<string, string> = { USD:"$", EUR:"€", RUB:"₽", GBP:"£", UAH:"₴", KZT:"₸", TRY:"₺", JPY:"¥", CNY:"¥", PLN:"zł", CZK:"Kč", INR:"₹", AED:"د.إ" };
const ZERO_DEC: Record<string, number> = { JPY: 0, KRW: 0, VND: 0 };

function pickGroupCurrency(g?: MinimalGroup): { code: string; symbol: string; decimals: number } {
  let raw: any = g?.default_currency_code ?? g?.currency_code ?? g?.currency ?? null;
  let code: string | null = null;
  let symbol: string | null = null;
  let decimals: number | null = null;

  if (raw && typeof raw === "object") {
    code = raw.code ?? null;
    symbol = raw.symbol ?? null;
    decimals = typeof raw.decimals === "number" ? raw.decimals : null;
  } else if (typeof raw === "string") {
    code = raw;
  }

  const finalCode = (code || "RUB").toUpperCase();
  const finalSymbol = symbol || SYMBOL_BY_CODE[finalCode] || (finalCode === "RUB" ? "₽" : finalCode);
  const finalDecimals = decimals ?? ZERO_DEC[finalCode] ?? 2;
  return { code: finalCode, symbol: finalSymbol, decimals: finalDecimals };
}

function parseAmountInput(raw: string, decimals = 2): string {
  let s = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    const head = s.slice(0, firstDot + 1);
    const tail = s.slice(firstDot + 1).replace(/\./g, "");
    s = head + tail;
  }
  if (s.includes(".")) {
    const [int, dec] = s.split(".");
    s = int + "." + dec.slice(0, decimals);
  }
  return s;
}
function toFixedSafe(s: string, decimals: number): string {
  if (!s) return "";
  const n = Number(s);
  if (!isFinite(n)) return "";
  return n.toFixed(decimals);
}

function AvatarMini({ name, avatarUrl, bg }: { name: string; avatarUrl?: string | null; bg?: string }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="rounded-full object-cover" style={{ width: 18, height: 18 }} />;
  }
  return (
    <div className="rounded-full text-white flex items-center justify-center" style={{ width: 18, height: 18, background: bg || "#40A7E3", fontSize: 11 }}>
      {letter}
    </div>
  );
}

// детерминированный цвет для fallback-аватарки плательщика
const PALETTE = ["#40A7E3","#8E61FF","#FF6B6B","#FFB020","#2EC4B6","#7DCE82","#FF7AB6","#6C8AE4","#E67E22","#9B59B6"];
const colorBySeed = (s: string) => PALETTE[Math.abs([...s].reduce((a,c)=>a+c.charCodeAt(0),0)) % PALETTE.length];

export default function CreateTransactionModal({ open, onOpenChange, groups: groupsProp, defaultGroupId }: Props) {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { groups: groupsStoreItems, fetchGroups } = useGroupsStore();

  const [localGroups, setLocalGroups] = useState<MinimalGroup[]>([]);
  useEffect(() => { setLocalGroups(groupsProp && groupsProp.length ? groupsProp : (groupsStoreItems ?? [])); }, [groupsProp, groupsStoreItems]);

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

  const [groupModal, setGroupModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(defaultGroupId);

  const [type, setType] = useState<TxType>("expense");
  const [categoryModal, setCategoryModal] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>("");
  const [split, setSplit] = useState<SplitResult | null>(null);

  const [paidByModal, setPaidByModal] = useState(false);
  const [paidBy, setPaidBy] = useState<number | undefined>(undefined);
  const [paidByName, setPaidByName] = useState<string>("");
  const [paidByAvatar, setPaidByAvatar] = useState<string | undefined>(undefined);

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState<string>("");

  const [moreOpen, setMoreOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);

  const [touched, setTouched] = useState<{ amount?: boolean; comment?: boolean }>({});

  useEffect(() => {
    if (open) return;
    setSelectedGroupId(defaultGroupId);
    setType("expense");
    setCategoryModal(false);
    setCategoryId(undefined);
    setCategoryName(null);
    setAmount("");
    setSplit(null);
    setPaidByModal(false);
    setPaidBy(undefined);
    setPaidByName("");
    setPaidByAvatar(undefined);
    setDate(new Date().toISOString().slice(0, 10));
    setComment("");
    setMoreOpen(false);
    setTouched({});
  }, [open, defaultGroupId]);

  const selectedGroup = useMemo(() => localGroups.find((g) => g.id === selectedGroupId), [localGroups, selectedGroupId]);
  const currency = useMemo(() => pickGroupCurrency(selectedGroup), [selectedGroup]);

  const locale = useMemo(() => (i18n.language || "ru").split("-")[0], [i18n.language]);
  const amountNumber = useMemo(() => { const n = Number(amount); return isFinite(n) ? n : 0; }, [amount]);
  const nf = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals }), [locale, currency.decimals]);
  const preview = useMemo(() => amount ? `≈ ${nf.format(amountNumber)} ${currency.symbol}` : "", [amount, amountNumber, nf, currency.symbol]);

  // ошибки/валидация
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!selectedGroupId) errs.group = t("tx_modal.choose_group_first");
    if (!amount || amountNumber <= 0) errs.amount = t("tx_modal.amount_required");
    if (!comment.trim()) errs.comment = t("tx_modal.comment_required");
    if (type === "expense" && !categoryId) errs.category = t("tx_modal.category_required");

    if (type === "expense") {
      if (!split) errs.split = t("tx_modal.split_no_participants");
      else if (split.type === "equal" && split.participants.length === 0) errs.split = t("tx_modal.split_no_participants");
      else if (split.type === "shares" && split.participants.reduce((s, p: any) => s + (p.share || 0), 0) <= 0) errs.split = t("tx_modal.split_no_shares");
      else if (split.type === "custom") {
        const sum = split.participants.reduce((s, p: any) => s + (Number(p.amount) || 0), 0);
        if (Number(sum.toFixed(currency.decimals)) !== Number(amountNumber.toFixed(currency.decimals))) {
          errs.split = t("tx_modal.split_custom_mismatch");
        }
      }
    }
    return errs;
  }, [selectedGroupId, amount, amountNumber, comment, type, categoryId, split, t, currency.decimals]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleAmountChange = (v: string) => setAmount(parseAmountInput(v, currency.decimals));
  const handleAmountBlur = () => setAmount((prev) => toFixedSafe(prev, currency.decimals));

  const short = (s: string) => (s || "").split(/\s+/)[0];

  if (!open) return null;
  const mustPickGroupFirst = !selectedGroupId;
  const groupLocked = typeof defaultGroupId === "number" && defaultGroupId > 0;

  const splitPreview = useMemo(() => {
    if (!split || amountNumber <= 0) return "";
    if (split.type === "equal") {
      const n = split.participants.length || 1;
      const per = amountNumber / n;
      return `${nf.format(per)} ${currency.symbol}`;
    }
    if (split.type === "shares") {
      const totalShares = split.participants.reduce((s, p: any) => s + (p.share || 0), 0) || 1;
      const perShare = amountNumber / totalShares;
      return `${t("tx_modal.per_share")} ≈ ${nf.format(perShare)} ${currency.symbol}`;
    }
    const sum = split.participants.reduce((s, p: any) => s + (Number(p.amount) || 0), 0);
    const ok = Number(sum.toFixed(currency.decimals)) === Number(amountNumber.toFixed(currency.decimals));
    return ok ? t("tx_modal.custom_amounts_set") : t("tx_modal.totals_mismatch");
  }, [split, amountNumber, nf, currency.symbol, currency.decimals, t]);

  // цвет для фоллбэк-аватарки плательщика (по имени/ID)
  const payerColor = paidBy ? colorBySeed(`${paidBy}-${paidByName}`) : "#9aa3ab";

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      <div className="w-full h-[100dvh] min-h-screen mx-0 my-0">
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto bg-[var(--tg-card-bg,#111)]">
          {/* close — не залезает на верхний элемент */}
          <button type="button" onClick={() => onOpenChange(false)} className="absolute top-1.5 right-1.5 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition" aria-label={t("close")}><X className="w-5 h-5 text-[var(--tg-hint-color)]" /></button>

          <div className="p-3 pt-12 flex flex-col gap-1">
            {/* Заголовок */}
            <div className="text-[17px] font-bold text-[var(--tg-text-color)] mb-1">{t("tx_modal.title")}</div>

            {/* Группа */}
            <div className="-mx-3">
              <CardSection className="py-0">
                {!selectedGroup ? (
                  <>
                    <Row icon={<Users className="text-[var(--tg-link-color)]" size={18} />} label={t("tx_modal.choose_group")} value={t("tx_modal.group_placeholder")} onClick={() => setGroupModal(true)} isLast />
                    {(!selectedGroupId) && (<div className="px-4 pb-1 -mt-0.5 text-[12px] text-[var(--tg-hint-color)]">{t("tx_modal.choose_group_first")}</div>)}
                  </>
                ) : (
                  <SelectedGroupPill name={selectedGroup.name} icon={selectedGroup.icon} color={selectedGroup.color || undefined} onClick={() => setGroupModal(true)} locked={groupLocked} />
                )}
              </CardSection>
            </div>

            {/* остальные поля прячем пока не выбрана группа */}
            {!mustPickGroupFirst && (
              <>
                {/* Тип */}
                <div className="-mx-3">
                  <CardSection className="py-0.5">
                    <div className="px-3 pb-1">
                      <div className="inline-flex rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden">
                        <button type="button" onClick={() => setType("expense")} className={`px-3 h-9 text-[13px] ${type === "expense" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}>{t("tx_modal.expense")}</button>
                        <button type="button" onClick={() => setType("transfer")} className={`px-3 h-9 text-[13px] ${type === "transfer" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}>{t("tx_modal.transfer")}</button>
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* Комментарий (обязательное) */}
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
                          onBlur={() => setTouched((s) => ({ ...s, comment: true }))}
                          placeholder={t("tx_modal.comment")}
                          className="flex-1 bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] focus:border-[var(--tg-accent-color)] py-1.5 text-[14px]"
                        />
                      </div>
                      {(touched.comment && errors.comment) && <div className="mt-1 text-xs text-red-500">{errors.comment}</div>}
                    </div>
                  </CardSection>
                </div>

                {/* Сумма */}
                <div className="-mx-3">
                  <CardSection className="py-0">
                    <div className="px-3 pb-0.5">
                      <div className="flex items-center gap-2 mt-1">
                        <div className="min-w-[52px] h-9 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center text-[12px] px-2" title={currency.code}>{currency.code}</div>
                        <input
                          inputMode="decimal"
                          placeholder={Number(0).toFixed(currency.decimals)}
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          onBlur={() => { setTouched((s) => ({ ...s, amount: true })); handleAmountBlur(); }}
                          className="flex-1 h-9 rounded-md bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] focus:border-[var(--tg-accent-color)] px-1 text-[17px]"
                        />
                      </div>
                      <div className="mt-0.5 text-[12px]">
                        {(touched.amount && errors.amount) ? <span className="text-red-500">{errors.amount}</span> : <span className="opacity-70">{preview || <span className="opacity-40">≈ 0.00 {currency.symbol}</span>}</span>}
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* expense-specific */}
                {type === "expense" && (
                  <>
                    {/* Категория */}
                    <div className="-mx-3">
                      <CardSection className="py-0">
                        <Row icon={<Layers className="text-[var(--tg-link-color)]" size={18} />} label={t("tx_modal.category")} value={categoryName || "—"} onClick={() => setCategoryModal(true)} isLast />
                        {errors.category && <div className="px-4 pb-1 -mt-0.5 text-[12px] text-red-500">{errors.category}</div>}
                      </CardSection>
                    </div>

                    {/* Paid by & Split */}
                    <div className="-mx-3">
                      <CardSection className="py-0">
                        <div className="px-3 py-1.5 flex gap-2 flex-wrap">
                          <button type="button" onClick={() => setPaidByModal(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition">
                            <span>{t("tx_modal.paid_by")}</span>
                            {paidBy ? (
                              <span className="inline-flex items-center gap-1 max-w-[160px] truncate">
                                <AvatarMini name={paidByName} avatarUrl={paidByAvatar} bg={payerColor} />
                                {/* только имя, без фамилии; truncate, чтобы не ломать Split */}
                                <strong className="truncate">{short(paidByName)}</strong>
                              </span>
                            ) : (
                              <strong>{t("not_specified")}</strong>
                            )}
                          </button>

                          <button type="button" onClick={() => setSplitOpen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition">
                            <span>{t("tx_modal.split")}</span>
                            <strong>
                              {!split ? t("tx_modal.split_equal") : split.type === "equal" ? t("tx_modal.split_equal") : split.type === "shares" ? t("tx_modal.split_shares") : t("tx_modal.split_custom")}
                            </strong>
                          </button>
                        </div>

                        {/* Превью сплита */}
                        <div className="px-3 -mt-1 pb-2">
                          {split ? (
                            <div className={`flex items-center gap-2 text-xs ${errors.split ? "text-red-500" : "opacity-80"}`}>
                              <div className="flex -space-x-1">
                                {split.participants.slice(0, 4).map((p) => (
                                  <div key={p.user_id} className="ring-1 ring-black/10 rounded-full overflow-hidden" style={{ width: 18, height: 18 }}>
                                    <AvatarMini name={p.name} avatarUrl={(p as any).avatar_url} bg={colorBySeed(`${p.user_id}-${p.name}`)} />
                                  </div>
                                ))}
                                {split.participants.length > 4 && (
                                  <div className="rounded-full bg-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)] flex items-center justify-center text-[10px]" style={{ width: 18, height: 18 }}>
                                    +{split.participants.length - 4}
                                  </div>
                                )}
                              </div>
                              <span>
                                {split.type === "equal" && `${t("tx_modal.each")} ${splitPreview}`}
                                {split.type === "shares" && splitPreview}
                                {split.type === "custom" && splitPreview}
                              </span>
                            </div>
                          ) : (
                            errors.split ? <div className="text-xs text-red-500">{errors.split}</div> : null
                          )}
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
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 text-[14px] focus:outline-none focus:border-[var(--tg-accent-color)]" />
                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* Кнопки */}
                <div className="flex flex-row gap-2 mt-2 w-full relative">
                  <button type="button" onClick={() => onOpenChange(false)} style={{ color: "#000" }} className="w-1/2 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition">{t("cancel")}</button>
                  <div className="w-1/2 relative">
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => {
                          if (hasErrors) { setTouched({ amount: true, comment: true }); return; }
                          const payload: any = {
                            group_id: selectedGroupId,
                            type,
                            amount: Number(amount), // при интеграции API можно отправлять Decimal-строкой
                            currency: currency.code,
                            comment,
                            date,
                          };
                          if (type === "expense") {
                            payload.category_id = categoryId;
                            payload.paid_by = paidBy;
                            payload.split = split;
                          }
                          console.log("[CreateTransactionModal] draft", payload);
                          onOpenChange(false);
                        }}
                        className="flex-1 h-10 rounded-l-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                        disabled={hasErrors}
                      >
                        {t("tx_modal.create")}
                      </button>
                      <button type="button" onClick={() => setMoreOpen((v) => !v)} className="px-3 h-10 rounded-r-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60" aria-label="More actions" disabled={hasErrors}><ChevronDown size={16} /></button>
                    </div>
                    {moreOpen && !hasErrors && (
                      <div className="absolute right-0 mt-1 w-[220px] rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] z-10" onMouseLeave={() => setMoreOpen(false)}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2.5 text-[14px] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
                          onClick={() => {
                            if (hasErrors) { setTouched({ amount: true, comment: true }); return; }
                            const payload: any = {
                              group_id: selectedGroupId,
                              type,
                              amount: Number(amount),
                              currency: currency.code,
                              comment,
                              date,
                            };
                            if (type === "expense") {
                              payload.category_id = categoryId;
                              payload.paid_by = paidBy;
                              payload.split = split;
                            }
                            console.log("[CreateTransactionModal] draft", payload, "(again)");
                            // очищаем, но оставляем группу
                            setType("expense");
                            setCategoryId(undefined);
                            setCategoryName(null);
                            setAmount("");
                            setSplit(null);
                            setPaidBy(undefined);
                            setPaidByName("");
                            setPaidByAvatar(undefined);
                            setComment("");
                            setTouched({});
                            setMoreOpen(false);
                          }}
                        >
                          {t("tx_modal.create_and_new")}
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

      {/* Модалки */}
      <GroupPickerModal open={groupModal && !groupLocked} onClose={() => setGroupModal(false)} selectedId={selectedGroupId} onSelect={(g) => { setSelectedGroupId(g.id); setGroupModal(false); }} />
      <CategoryPickerModal open={!!selectedGroupId && type === "expense" && categoryModal} onClose={() => setCategoryModal(false)} groupId={selectedGroupId || 0} selectedId={categoryId} onSelect={(it) => { setCategoryId(it.id); setCategoryName(it.name); setCategoryModal(false); }} closeOnSelect />
      <MemberPickerModal open={paidByModal && !!selectedGroupId} onClose={() => setPaidByModal(false)} groupId={selectedGroupId || 0} selectedUserId={paidBy} onSelect={(u) => { setPaidBy(u.id); setPaidByName(u.name); setPaidByAvatar(u.avatar_url || undefined); }} closeOnSelect />
      <SplitPickerModal
        open={splitOpen && !!selectedGroupId}
        onClose={() => setSplitOpen(false)}
        groupId={selectedGroupId || 0}
        amount={amountNumber}
        currency={currency}
        initial={split || undefined}
        onSave={(res) => { setSplit(res); setSplitOpen(false); }}
      />
    </div>
  );
}
