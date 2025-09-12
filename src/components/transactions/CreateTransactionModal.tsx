// src/components/transactions/CreateTransactionModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X, Layers, CalendarDays, ChevronRight,
  Users, ChevronDown, ChevronRight as Chevron, FileText, Receipt, Send
} from "lucide-react";
import CardSection from "../CardSection";
import GroupPickerModal from "../group/GroupPickerModal";
import { useUserStore } from "../../store/userStore";
import { useGroupsStore } from "../../store/groupsStore";
import CategoryPickerModal from "../category/CategoryPickerModal";
import MemberPickerModal from "../group/MemberPickerModal";
import SplitPickerModal, { SplitSelection, PerPerson, computePerPerson } from "./SplitPickerModal";
import CurrencyPickerModal, { type CurrencyItem } from "../currency/CurrencyPickerModal";
import type { TransactionOut } from "../../types/transaction";
import { createTransaction, updateTransaction } from "../../api/transactionsApi";
import { getGroupMembers } from "../../api/groupMembersApi";
import { getGroupDetails } from "../../api/groupsApi";

export type TxType = "expense" | "transfer";

export interface MinimalGroup {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
  default_currency_code?: string | null;
  currency_code?: string | null;
  currency?: string | null;
}

type MemberMini = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  name?: string;
};

/* ---------- helpers / small UI ---------- */
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
        className="flex items-center w-full py-1.5 bg-transparent focus:outline-none active:opacity-90"
        style={{ minHeight: 36 }}
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
  const bg = (typeof color === "string" && color.trim().length) ? (color as string) : "var(--tg-link-color)";
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      className={`mx-3 mt-1 mb-1 inline-flex items-center w-[calc(100%-1.5rem)] justify-between rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] px-3 py-1 transition focus:outline-none ${locked ? "cursor-default" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
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

const DECIMALS_BY_CODE: Record<string, number> = { JPY: 0, KRW: 0, VND: 0 };

const resolveCurrencyCodeFromGroup = (g?: MinimalGroup | null): string | null => {
  const raw =
    (g as any)?.default_currency_code ||
    (g as any)?.currency_code ||
    (g as any)?.currency ||
    null;
  return (typeof raw === "string" && raw.trim()) ? raw.trim().toUpperCase() : null;
};

function to6Hex(input?: unknown): string | null {
  if (!input || typeof input !== "string") return null;
  let h = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map(ch => ch + ch).join("");
  if (/^[0-9a-f]{6}$/i.test(h)) return `#${h}`;
  return null;
}
function hexWithAlpha(hex6: string, alpha: number) {
  const h = hex6.replace("#", "");
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return `#${h}${a}`;
}
function asRgbaFallback(color: string, alpha: number) {
  if (color.startsWith("rgb(") || color.startsWith("rgba(")) {
    const nums = color.replace(/[rgba()]/g, "").split(",").map(s => s.trim());
    const [r, g, b] = nums;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
function chipStyle(color?: string | null) {
  if (!color) return {};
  const hex6 = to6Hex(color);
  if (hex6) {
    return {
      backgroundColor: hexWithAlpha(hex6, 0.13),
      border: `1px solid ${hexWithAlpha(hex6, 0.33)}`,
    } as React.CSSProperties;
  }
  return { backgroundColor: asRgbaFallback(color, 0.13) } as React.CSSProperties;
}
function fillStyle(color?: string | null) {
  if (!color) return {};
  const hex6 = to6Hex(color);
  if (hex6) {
    return { backgroundColor: hexWithAlpha(hex6, 0.10), borderRadius: 12 } as React.CSSProperties;
  }
  return { backgroundColor: asRgbaFallback(color, 0.10), borderRadius: 12 } as React.CSSProperties;
}

const firstNameOnly = (s?: string) => {
  const tok = (s || "").trim().split(/\s+/).filter(Boolean);
  return tok[0] || "";
};
const nameFromMember = (m?: MemberMini) => {
  if (!m) return "";
  const composed = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim();
  return composed || m.username || m.name || `#${m.id}`;
};

export default function CreateTransactionModal({
  open,
  onOpenChange,
  groups: groupsProp,
  defaultGroupId,
  onCreated,
  initialTx,
  mode = "create",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: MinimalGroup[];
  defaultGroupId?: number;
  onCreated?: (tx: TransactionOut) => void;
  initialTx?: any;
  mode?: "create" | "edit";
}) {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { groups: groupsStoreItems, fetchGroups } = useGroupsStore();

  /* ===== GROUPS ===== */
  const [localGroups, setLocalGroups] = useState<MinimalGroup[]>([]);
  useEffect(() => {
    setLocalGroups(groupsProp && groupsProp.length ? groupsProp : (groupsStoreItems ?? []));
  }, [groupsProp, groupsStoreItems]);

  /* ===== FORM STATE (объявляем ДО эффектов) ===== */
  const [groupModal, setGroupModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(defaultGroupId);
  const [type, setType] = useState<TxType>("expense");

  const [categoryModal, setCategoryModal] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [categoryColor, setCategoryColor] = useState<string | null>(null);
  const [categoryIcon, setCategoryIcon] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>("");
  const [splitType, setSplitType] = useState<"equal" | "shares" | "custom">("equal");
  const [splitData, setSplitData] = useState<SplitSelection | null>(null);

  const [paidBy, setPaidBy] = useState<number | undefined>(undefined);
  const [paidByName, setPaidByName] = useState<string>("");
  const [paidByAvatar, setPaidByAvatar] = useState<string | undefined>(undefined);

  const [recipientOpen, setRecipientOpen] = useState(false);
  const [toUser, setToUser] = useState<number | undefined>(undefined);
  const [toUserName, setToUserName] = useState<string>("");
  const [toUserAvatar, setToUserAvatar] = useState<string | undefined>(undefined);

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState<string>("");

  const [payerOpen, setPayerOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);

  const [showErrors, setShowErrors] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [commentTouched, setCommentTouched] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  /* ===== AUTOLOAD GROUPS ===== */
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

  /* ===== MEMBERS (для автосплита и аватарок) ===== */
  const [membersMap, setMembersMap] = useState<Map<number, MemberMini>>(() => new Map());
  useEffect(() => {
    let abort = false;
    (async () => {
      if (!open || !selectedGroupId) return;
      const map = new Map<number, MemberMini>();
      let offset = 0;
      const limit = 100;
      let total = Infinity;
      try {
        while (!abort && offset < total) {
          const res = await getGroupMembers(selectedGroupId, offset, limit);
          total = res.total ?? 0;
          const items = res.items ?? [];
          for (const gm of items as any[]) {
            const u = gm?.user;
            if (!u?.id) continue;
            map.set(u.id, {
              id: u.id,
              first_name: u.first_name,
              last_name: u.last_name,
              username: u.username,
              photo_url: u.photo_url,
            });
          }
          offset += items.length;
          if (items.length === 0) break;
        }
      } catch { /* ignore */ }
      if (!abort) setMembersMap(map);
    })();
    return () => { abort = true; };
  }, [open, selectedGroupId]);

  /* ===== CURRENCY ===== */
  const [currencyModal, setCurrencyModal] = useState(false);
  const selectedGroup = useMemo(
    () => localGroups.find((g) => g.id === selectedGroupId) || null,
    [localGroups, selectedGroupId]
  );

  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  // Флаг-замок: если валюта установлена из транзакции (edit) или пользователем — не перезаписывать валютой группы
  const currencyLockedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (currencyLockedRef.current) return; // не трогаем валюту, если она уже «зафиксирована»
      const code = resolveCurrencyCodeFromGroup(selectedGroup);
      if (code) {
        if (!cancelled) setCurrencyCode(code);
        return;
      }
      if (selectedGroupId) {
        try {
          const gd = await getGroupDetails(selectedGroupId);
          const raw =
            (gd as any)?.default_currency_code ||
            (gd as any)?.currency_code ||
            (gd as any)?.currency || null;
          const detCode = typeof raw === "string" && raw.trim() ? raw.trim().toUpperCase() : null;
          if (!cancelled) setCurrencyCode(detCode || "USD");
        } catch {
          if (!cancelled) setCurrencyCode("USD");
        }
      } else {
        if (!cancelled) setCurrencyCode(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedGroup, selectedGroupId]);

  // При смене валюты — аккуратно нормализуем введённую сумму под новые decimals
  useEffect(() => {
    const dec = currencyCode ? (DECIMALS_BY_CODE[currencyCode] ?? 2) : 2;
    if (!amount) return;
    const n = Number(amount);
    if (!isFinite(n)) return;
    setAmount(n.toFixed(dec));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyCode]);

  const currency = useMemo(() => {
    const code = currencyCode || null;
    return {
      code,
      symbol: code || "",
      decimals: code ? (DECIMALS_BY_CODE[code] ?? 2) : 2,
    };
  }, [currencyCode]);

  const COMMENT_MAX = 32;
  const onCommentChange = (v: string) => setComment(v.length > COMMENT_MAX ? v.slice(0, COMMENT_MAX) : v);
  const commentLeft = Math.max(0, COMMENT_MAX - comment.length);

  const locale = useMemo(() => (i18n.language || "ru").split("-")[0], [i18n.language]);
  const amountNumber = useMemo(() => {
    const n = Number(amount);
    return isFinite(n) ? n : 0;
  }, [amount]);

  const fmtMoney = (n: number, decimals: number, code: string | null, loc: string) => {
    try {
      const nf = new Intl.NumberFormat(loc, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      return `${nf.format(n)} ${code ?? ""}`;
    } catch {
      return `${n.toFixed(decimals)} ${code ?? ""}`;
    }
  };

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

  /* ===== VALIDATION ===== */
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!selectedGroupId) errs.group = t("tx_modal.choose_group_first");
    if (!amount || amountNumber <= 0) {
      errs.amount =
        locale === "ru" ? "Введите сумму больше 0" :
        locale === "es" ? "Introduce un importe > 0" : "Enter amount > 0";
    }
    if (type === "expense" && !comment.trim()) {
      errs.comment =
        locale === "ru" ? "Заполните комментарий" :
        locale === "es" ? "Introduce un comentario" : "Enter a comment";
    }
    if (type === "expense" && !categoryId) {
      errs.category =
        locale === "ru" ? "Выберите категорию" :
        locale === "es" ? "Elige una categoría" : "Choose a category";
    }
    if (type === "expense" && splitData) {
      if (splitData.type === "equal" && splitData.participants.length === 0) {
        errs.split =
          locale === "ru" ? "Выберите участников" :
          locale === "es" ? "Selecciona participantes" : "Select participants";
      }
      if (splitData.type === "shares") {
        const totalShares = splitData.participants.reduce((s, p) => s + (p.share || 0), 0);
        if (totalShares <= 0) errs.split =
          locale === "ru" ? "Доли должны быть больше нуля" :
          locale === "es" ? "Las cuotas deben ser > 0" : "Shares must be > 0";
        if (splitData.participants.length === 0) errs.split =
          locale === "ru" ? "Выберите участников" :
          locale === "es" ? "Selecciona participantes" : "Select participants";
      }
      if (splitData.type === "custom" && customMismatch) {
        errs.split =
          locale === "ru" ? "Сумма по участникам должна равняться общей" :
          locale === "es" ? "La suma por participantes debe igualar el total" :
          "Participants total must equal overall";
      }
    }
    if (type === "transfer") {
      if (!paidBy) errs.transfer =
        locale === "ru" ? "Выберите отправителя" :
        locale === "es" ? "Elige remitente" : "Select sender";
      if (!toUser) errs.transfer =
        locale === "ru" ? "Выберите получателя" :
        locale === "es" ? "Elige receptor" : "Select recipient";
      if (paidBy && toUser && paidBy === toUser) {
        errs.transfer =
          locale === "ru" ? "Отправитель и получатель не могут совпадать" :
          locale === "es" ? "Remitente y receptor no pueden ser iguales" :
          "Sender and recipient must differ";
      }
    }
    return errs;
  }, [selectedGroupId, amount, amountNumber, comment, locale, type, categoryId, splitData, customMismatch, t, paidBy, toUser]);

  const handleAmountChange = (v: string) => {
    const decimals = currency.decimals;
    let s = v.replace(",", ".").replace(/[^\d.]/g, "");
    const firstDot = s.indexOf(".");
    if (firstDot !== -1) {
      const head = s.slice(0, firstDot + 1);
      const tail = s.slice(firstDot + 1).replace(/\./g, "");
      s = head + tail;
    }
    if (decimals === 0) s = s.replace(/\./g, "");
    else if (s.includes(".")) {
      const [int, dec] = s.split(".");
      s = int + "." + dec.slice(0, decimals);
    }
    setAmount(s);
  };
  const handleAmountBlur = () => {
    setAmountTouched(true);
    if (!amount) return;
    const n = Number(amount);
    if (!isFinite(n)) return;
    setAmount(n.toFixed(currency.decimals));
  };
  const handleCommentBlur = () => setCommentTouched(true);

  const handleSelectCategory = (it: { id: number; name: string; color?: string | null; icon?: string | null } & Record<string, any>) => {
    const raw = (it as any).color ?? (it as any).bg_color ?? (it as any).hex ?? (it as any).background_color ?? (it as any).color_hex;
    const hex6 = to6Hex(raw) ?? raw ?? null;
    setCategoryId(it.id);
    setCategoryName(it.name);
    setCategoryColor(hex6);
    setCategoryIcon((it as any).icon ?? null);
  };

  const resetForNew = () => {
    setType("expense");
    setCategoryId(undefined);
    setCategoryName(null);
    setCategoryColor(null);
    setCategoryIcon(null);
    setAmount("");
    setSplitType("equal");
    setSplitData(null);
    setPaidBy(undefined);
    setPaidByName("");
    setPaidByAvatar(undefined);
    setToUser(undefined);
    setToUserName("");
    setToUserAvatar(undefined);
    setDate(new Date().toISOString().slice(0, 10));
    setComment("");
    setShowErrors(false);
    setAmountTouched(false);
    setCommentTouched(false);
  };

  const ensureValidOrGuide = (): boolean => {
    setShowErrors(true);
    setAmountTouched(true);
    if (type === "expense") setCommentTouched(true);

    if (!selectedGroupId) {
      setGroupModal(true);
      return false;
    }
    if (!amount || Number(amount) <= 0) {
      amountInputRef.current?.focus();
      return false;
    }
    if (type === "expense") {
      if (!categoryId) { setCategoryModal(true); return false; }
      if (errors.split) { setSplitOpen(true); return false; }
      return true;
    }
    if (!paidBy) { setPayerOpen(true); return false; }
    if (!toUser) { setRecipientOpen(true); return false; }
    if (paidBy === toUser) return false;
    return true;
  };

  function buildShares(
    sel: SplitSelection | null | undefined,
    total: number,
    decimals: number
  ): Array<{ user_id: number; amount: string; shares?: number | null }> {
    if (!sel) return [];
    const toFixed = (x: number) => {
      const n = Number(x);
      return isFinite(n) ? n.toFixed(decimals) : (0).toFixed(decimals);
    };
    if (sel.type === "custom") {
      return sel.participants.map((p: any) => ({
        user_id: Number(p.user_id),
        amount: toFixed(Number(p.amount || 0)),
        shares: null,
      }));
    }
    const list = computePerPerson(sel, total, decimals);
    if (sel.type === "shares") {
      const sharesByUser = new Map<number, number>();
      for (const p of sel.participants as any[]) {
        sharesByUser.set(Number(p.user_id), Number((p as any).share || 0));
      }
      return list.map((p) => ({
        user_id: Number(p.user_id),
        amount: toFixed(p.amount || 0),
        shares: sharesByUser.get(Number(p.user_id)) || null,
      }));
    }
    // equal
    return list.map((p) => ({
      user_id: Number(p.user_id),
      amount: toFixed(p.amount || 0),
      shares: null,
    }));
  }

  const doSubmit = async (modeAfter: "close" | "again") => {
    if (saving) return;
    const ok = ensureValidOrGuide();
    if (!ok) return;

    try {
      setSaving(true);
      const gid = selectedGroupId as number;
      const amtStr = isFinite(Number(amount)) ? Number(amount).toFixed(currency.decimals) : "0";

      let saved: TransactionOut | undefined;

      if (type === "expense") {
        const payerId = paidBy ?? user?.id;
        if (!payerId) { setPayerOpen(true); setShowErrors(true); setSaving(false); return; }

        const payload: any = {
          type: "expense",
          group_id: gid,
          amount: amtStr,
          currency_code: currency.code || "USD",
          date,
          comment: comment.trim() || null,
          category_id: categoryId ?? null,
          paid_by: payerId,
          split_type: splitData?.type || "equal",
          shares: buildShares(splitData, Number(amtStr), currency.decimals),
        };

        if (mode === "edit" && initialTx?.id) saved = await updateTransaction(initialTx.id, payload);
        else saved = await createTransaction(payload);
      } else {
        const payload: any = {
          type: "transfer",
          group_id: gid,
          amount: amtStr,
          currency_code: currency.code || "USD",
          date,
          comment: comment.trim() || null,
          transfer_from: paidBy as number,
          transfer_to: [toUser as number],
        };

        if (mode === "edit" && initialTx?.id) saved = await updateTransaction(initialTx.id, payload);
        else saved = await createTransaction(payload);
      }

      if (!initialTx && saved && onCreated) onCreated(saved);
      if (modeAfter === "close") onOpenChange(false);
      else resetForNew();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[CreateTransactionModal] submit error", e);
    } finally {
      setSaving(false);
    }
  };

  /* ===== reset при закрытии ===== */
  useEffect(() => {
    if (open) return;
    setSelectedGroupId(defaultGroupId);
    setType("expense");
    setCategoryModal(false);
    setCategoryId(undefined);
    setCategoryName(null);
    setCategoryColor(null);
    setCategoryIcon(null);
    setAmount("");
    setSplitType("equal");
    setSplitData(null);
    setPaidBy(undefined);
    setPaidByName("");
    setPaidByAvatar(undefined);
    setToUser(undefined);
    setToUserName("");
    setToUserAvatar(undefined);
    setDate(new Date().toISOString().slice(0, 10));
    setComment("");
    setShowErrors(false);
    setAmountTouched(false);
    setCommentTouched(false);
    setMoreOpen(false);
    setPayerOpen(false);
    setRecipientOpen(false);
    setSplitOpen(false);
    setSaving(false);
    setCurrencyCode(null);
    currencyLockedRef.current = false; // сбрасываем замок
  }, [open, defaultGroupId]);

  /* ===== PREFILL из initialTx (одноразово при открытии) ===== */
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!open) { prefilledRef.current = false; return; }
    if (prefilledRef.current) return;
    if (!initialTx) return;

    // группа
    const gid = Number(initialTx.group_id ?? initialTx.groupId ?? defaultGroupId);
    if (gid) setSelectedGroupId(gid);

    // валюта из транзакции (фиксируем, чтобы не затиралось валютой группы)
    const rawCode = (initialTx.currency_code || initialTx.currency) as string | undefined;
    if (typeof rawCode === "string" && rawCode.trim()) {
      const codeUp = rawCode.trim().toUpperCase();
      setCurrencyCode(codeUp);
      currencyLockedRef.current = true;
    }

    // тип
    if (initialTx.type === "transfer" || initialTx.type === "expense") {
      setType(initialTx.type);
    }

    // сумма (учитываем, что с бэка приходит строка)
    if (initialTx.amount !== undefined && initialTx.amount !== null) {
      const parsed = typeof initialTx.amount === "number"
        ? initialTx.amount
        : parseFloat(String(initialTx.amount));
      if (isFinite(parsed)) {
        // форматируем под известные decimals (если валюту только что зафиксировали — используем их,
        // иначе fallback на текущие)
        const dec =
          (typeof rawCode === "string" && rawCode.trim())
            ? (DECIMALS_BY_CODE[rawCode.trim().toUpperCase()] ?? 2)
            : (currency.decimals ?? 2);
        setAmount(parsed.toFixed(dec));
      }
    }

    // перевод: берём нормальные поля с бэка, иначе фоллбэки
    if (initialTx.type === "transfer") {
      const pb = Number(
        initialTx.transfer_from ??
        initialTx.paidBy ??
        user?.id
      );
      const tu = Number(
        Array.isArray(initialTx.transfer_to) ? initialTx.transfer_to[0] : (initialTx.toUser ?? undefined)
      );
      if (isFinite(pb)) setPaidBy(pb);
      if (isFinite(tu)) setToUser(tu);

      // имена/аватар могут подтянуться позже отдельным эффектом (см. ниже)
      const pbName = membersMap.get(pb) ? nameFromMember(membersMap.get(pb)!) : "";
      const tuName = membersMap.get(tu) ? nameFromMember(membersMap.get(tu)!) : "";

      if (pbName) setPaidByName(pbName);
      if (tuName) setToUserName(tuName);

      const pbAv = membersMap.get(pb)?.photo_url;
      const tuAv = membersMap.get(tu)?.photo_url;
      if (pbAv) setPaidByAvatar(pbAv);
      if (tuAv) setToUserAvatar(tuAv);
    }

    if (typeof initialTx.comment === "string") setComment(initialTx.comment);

    prefilledRef.current = true;
  }, [open, initialTx, currency.decimals, user?.id, membersMap, defaultGroupId]);

  /* ===== ДОЗАПОЛНЕНИЕ ИМЁН/АВАТАРОК ПОСЛЕ ЗАГРУЗКИ membersMap ===== */
  useEffect(() => {
    if (!open) return;

    if (paidBy && !paidByName) {
      const m = membersMap.get(paidBy);
      if (m) {
        setPaidByName(nameFromMember(m));
        setPaidByAvatar(m.photo_url || undefined);
      }
    }
    if (toUser && !toUserName) {
      const m = membersMap.get(toUser);
      if (m) {
        setToUserName(nameFromMember(m));
        setToUserAvatar(m.photo_url || undefined);
      }
    }
  }, [open, membersMap, paidBy, toUser, paidByName, toUserName]);

  if (!open) return null;

  const mustPickGroupFirst = !selectedGroupId;
  const groupLocked = Boolean(defaultGroupId);

  const openPayerPicker = () => { setGroupModal(false); setRecipientOpen(false); setSplitOpen(false); setPayerOpen(true); };
  const openRecipientPicker = () => { setGroupModal(false); setPayerOpen(false); setSplitOpen(false); setRecipientOpen(true); };

  const paidByLabel = t("tx_modal.paid_by_label");
  const owesLabel = t("tx_modal.owes_label");
  const fromLabel = locale === "ru" ? "Отправитель" : locale === "es" ? "Remitente" : "From";
  const toLabel = locale === "ru" ? "Получатель" : locale === "es" ? "Receptor" : "To";

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      <div className="w-full h-[100dvh] min-h-screen mx-0 my-0">
        {/* добавил overflow-x-hidden чтобы не было артефактов прокрутки по X */}
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto overflow-x-hidden bg-[var(--tg-card-bg,#111)]">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-[var(--tg-card-bg)] border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
            <div className="text-[17px] font-bold text-[var(--tg-text-color)]">
              {mode === "edit" ? (t("edit") || "Редактировать") : t("tx_modal.title")}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg hover:bg-[var(--tg-accent-color)]/10 transition"
              aria-label={t("close")}
            >
              <X className="w-5 h-5 text-[var(--tg-hint-color)]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 flex flex-col gap-0.5">
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

            {/* Остальной UI */}
            {mustPickGroupFirst ? null : (
              <>
                {/* Тип */}
                <div className="-mx-3">
                  <CardSection className="py-0.5">
                    <div className="px-3 pb-0.5 flex justify-center">
                      <div className="inline-flex rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setType("expense")}
                          className={`px-3 h-9 text-[13px] flex items-center ${type === "expense" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}
                        >
                          <Receipt size={14} className="mr-1.5" />
                          {t("tx_modal.expense")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setType("transfer")}
                          className={`px-3 h-9 text-[13px] flex items-center ${type === "transfer" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}
                        >
                          {t("tx_modal.transfer")}
                          <Send size={14} className="ml-1.5" />
                        </button>
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* Сумма */}
                <div className="-mx-3">
                  <CardSection className="py-0">
                    <div className="px-3 pb-0">
                      <div className="flex items-center gap-2 mt-0.5">
                        {currency.code && (
                          <button
                            type="button"
                            onClick={() => setCurrencyModal(true)}
                            className="min-w-[52px] h-9 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center text-[12px] px-2"
                            title={currency.code}
                          >
                            {currency.code}
                          </button>
                        )}
                        <input
                          ref={amountInputRef}
                          inputMode="decimal"
                          placeholder={currency.decimals === 0 ? "0" : "0.00"}
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          onBlur={handleAmountBlur}
                          className="flex-1 h-9 rounded-md bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] focus:border-[var(--tg-accent-color)] px-1 text-[17px]"
                        />
                      </div>

                      {(showErrors || amountTouched) && errors.amount && (
                        <div className="pt-1 pb-1 text-[12px] text-red-500">
                          {errors.amount}
                        </div>
                      )}
                    </div>
                  </CardSection>
                </div>

                {/* EXPENSE */}
                {type === "expense" ? (
                  <>
                    {/* Категория + Комментарий */}
                    <div className="-mx-3">
                      <CardSection className="py-0">
                        <div
                          className="px-3 py-1 grid grid-cols-2 gap-2 items-center"
                          style={fillStyle(categoryColor)}
                        >
                          <button
                            type="button"
                            onClick={() => setCategoryModal(true)}
                            className="min-w-0 flex items-center gap-2 h-9 rounded-lg border px-2 overflow-hidden"
                            style={categoryColor ? chipStyle(categoryColor) : {}}
                          >
                            <span className="inline-flex w-6 h-6 items-center justify-center rounded-md border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] shrink-0">
                              <span style={{ fontSize: 14 }} aria-hidden>
                                {categoryIcon || <Layers size={14} />}
                              </span>
                            </span>
                            <span className="text-[13px] font-medium truncate">
                              {categoryName || t("tx_modal.category")}
                            </span>
                          </button>

                          <div className="min-w-0 flex items-center gap-2">
                            <FileText size={16} className="opacity-80 shrink-0" />
                            <input
                              value={comment}
                              onChange={(e) => onCommentChange(e.target.value)}
                              onBlur={handleCommentBlur}
                              placeholder={t("tx_modal.comment")}
                              className="flex-1 bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] focus:border-[var(--tg-accent-color)] py-1 text-[14px]"
                            />
                          </div>
                        </div>

                        <div className={`px-3 pb-0.5 -mt-0.5 text-[12px] ${commentLeft === 0 ? "text-red-500" : "text-[var(--tg-hint-color)]"}`}>
                          {(i18n.language || "en").startsWith("ru")
                            ? (comment.length === 0 ? `Введите комментарий (до ${COMMENT_MAX} символов)` : `Осталось ${commentLeft} символов`)
                            : (i18n.language || "en").startsWith("es")
                            ? (comment.length === 0 ? `Escribe un comentario (hasta ${COMMENT_MAX} caracteres)` : `Quedan ${commentLeft} caracteres`)
                            : (comment.length === 0 ? `Enter a comment (up to ${COMMENT_MAX} chars)` : `${commentLeft} characters left`)
                          }
                        </div>

                        {(showErrors && errors.category) && (
                          <div className="px-3 pb-0.5 -mt-0.5 text-[12px] text-red-500">{errors.category}</div>
                        )}
                        {(showErrors || commentTouched) && errors.comment && (
                          <div className="px-3 pb-1 -mt-0.5 text-[12px] text-red-500">
                            {errors.comment}
                          </div>
                        )}
                      </CardSection>
                    </div>

                    {/* Paid by / Split */}
                    <div className="-mx-3">
                      <CardSection className="py-0">
                        <div className="px-3 py-1 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={openPayerPicker}
                            className="relative min-w-0 inline-flex items-center gap-2 pl-3 pr-7 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition max-w-full"
                          >
                            {paidBy ? (
                              <>
                                <span className="inline-flex items-center gap-1 min-w-0 truncate">
                                  {paidByAvatar ? (
                                    <img src={paidByAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                                  ) : (
                                    <span className="w-4 h-4 rounded-full bg-[var(--tg-link-color)] inline-block" />
                                  )}
                                  <strong className="truncate">{firstNameOnly(paidByName) || t("not_specified")}</strong>
                                </span>
                                <span
                                  role="button"
                                  aria-label={t("clear") || "Очистить"}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black/10 dark:bg-white/10 hover:bg-black/20"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPaidBy(undefined); setPaidByName(""); setPaidByAvatar(undefined); }}
                                >
                                  <X size={12} />
                                </span>
                              </>
                            ) : (
                              <span className="opacity-70 truncate">{t("tx_modal.paid_by")}</span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => { setGroupModal(false); setPayerOpen(false); setRecipientOpen(false); setSplitOpen(true); }}
                            className="min-w-0 inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition"
                          >
                            <span className="truncate">{t("tx_modal.split")}</span>
                            <strong className="truncate">
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

                        {/* Превью долей */}
                        {!!perPerson.length && (
                          <div className="px-3 pb-1 mt-1">
                            <div className="flex flex-col gap-1">
                              {paidBy && (
                                <div className="flex items-center gap-2 text-[13px] font-medium">
                                  {paidByAvatar ? (
                                    <img src={paidByAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                  ) : (
                                    <span className="w-5 h-5 rounded-full bg-[var(--tg-link-color)] inline-block" />
                                  )}
                                  <span className="truncate flex-1">
                                    {paidByLabel}: {firstNameOnly(paidByName) || t("not_specified")}
                                  </span>
                                  <span className="shrink-0 opacity-80">
                                    {fmtMoney(amountNumber, currency.decimals, currency.code, locale)}
                                  </span>
                                </div>
                              )}

                              {perPerson
                                .filter((p) => !paidBy || p.user_id !== paidBy)
                                .map((p) => (
                                  <div key={p.user_id} className="flex items-center gap-2 text-[13px]">
                                    {p.avatar_url ? (
                                      <img src={p.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                      <span className="w-5 h-5 rounded-full bg-[var(--tg-link-color)] inline-block" />
                                    )}
                                    <span className="truncate flex-1">
                                      {owesLabel}: {p.name}
                                    </span>
                                    <span className="shrink-0 opacity-80">
                                      {fmtMoney(p.amount, currency.decimals, currency.code, locale)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                        {(showErrors && errors.split) && (
                          <div className="px-3 pb-1 -mt-0.5 text-[12px] text-red-500">{errors.split}</div>
                        )}
                        {customMismatch && (
                          <div className="px-3 pb-1 -mt-0.5 text-[12px] text-red-500">
                            {locale === "ru"
                              ? `Сумма по участникам ${fmtMoney(customMismatch.sumParts, currency.decimals, currency.code, locale)} не равна общей ${fmtMoney(customMismatch.total, currency.decimals, currency.code, locale)}`
                              : locale === "es"
                              ? `La suma de participantes ${fmtMoney(customMismatch.sumParts, currency.decimals, currency.code, locale)} no es igual al total ${fmtMoney(customMismatch.total, currency.decimals, currency.code, locale)}`
                              : `Participants total ${fmtMoney(customMismatch.sumParts, currency.decimals, currency.code, locale)} doesn't equal overall ${fmtMoney(customMismatch.total, currency.decimals, currency.code, locale)}`}
                          </div>
                        )}
                      </CardSection>
                    </div>
                  </>
                ) : null}

                {/* TRANSFER */}
                {type === "transfer" ? (
                  <>
                    <div className="-mx-3">
                      <CardSection className="py-0">
                        <div className="px-3 py-1 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={openPayerPicker}
                            className="relative min-w-0 inline-flex items-center gap-2 pl-3 pr-7 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition max-w-full"
                          >
                            {paidBy ? (
                              <>
                                <span className="inline-flex items-center gap-1 min-w-0 truncate">
                                  {paidByAvatar ? (
                                    <img src={paidByAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                                  ) : (
                                    <span className="w-4 h-4 rounded-full bg-[var(--tg-link-color)] inline-block" />
                                  )}
                                  <strong className="truncate">{firstNameOnly(paidByName) || t("not_specified")}</strong>
                                </span>
                                <span
                                  role="button"
                                  aria-label={t("clear") || "Очистить"}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black/10 dark:bg-white/10 hover:bg-black/20"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPaidBy(undefined); setPaidByName(""); setPaidByAvatar(undefined); }}
                                >
                                  <X size={12} />
                                </span>
                              </>
                            ) : (
                              <span className="opacity-70 truncate">{fromLabel}</span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={openRecipientPicker}
                            className="relative min-w-0 inline-flex items-center gap-2 pl-3 pr-7 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition max-w-full"
                          >
                            {toUser ? (
                              <>
                                <span className="inline-flex items-center gap-1 min-w-0 truncate">
                                  {toUserAvatar ? (
                                    <img src={toUserAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                                  ) : (
                                    <span className="w-4 h-4 rounded-full bg-[var(--tg-link-color)] inline-block" />
                                  )}
                                  <strong className="truncate">{firstNameOnly(toUserName) || t("not_specified")}</strong>
                                </span>
                                <span
                                  role="button"
                                  aria-label={t("clear") || "Очистить"}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black/10 dark:bg-white/10 hover:bg-black/20"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setToUser(undefined); setToUserName(""); setToUserAvatar(undefined); }}
                                >
                                  <X size={12} />
                                </span>
                              </>
                            ) : (
                              <span className="opacity-70 truncate">{toLabel}</span>
                            )}
                          </button>
                        </div>

                        {(paidBy || toUser) && amountNumber > 0 && (
                          <div className="px-3 pb-1 mt-1">
                            <div className="flex items-center gap-2 text-[13px]">
                              <span className="inline-flex items-center gap-1 min-w-0 truncate">
                                {paidByAvatar ? (
                                  <img src={paidByAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <span className="w-5 h-5 rounded-full bg-[var(--tg-link-color)] inline-block" />
                                )}
                                <strong className="truncate">{paidBy ? (firstNameOnly(paidByName) || t("not_specified")) : fromLabel}</strong>
                              </span>
                              <span className="opacity-60">→</span>
                              <span className="inline-flex items-center gap-1 min-w-0 truncate">
                                {toUserAvatar ? (
                                  <img src={toUserAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <span className="w-5 h-5 rounded-full bg-[var(--tg-link-color)] inline-block" />
                                )}
                                <strong className="truncate">{toUser ? (firstNameOnly(toUserName) || t("not_specified")) : toLabel}</strong>
                              </span>
                              <span className="ml-auto shrink-0 opacity-80">
                                {fmtMoney(amountNumber, currency.decimals, currency.code, locale)}
                              </span>
                            </div>
                          </div>
                        )}

                        {(showErrors && errors.transfer) && (
                          <div className="px-3 pb-1 -mt-0.5 text-[12px] text-red-500">{errors.transfer}</div>
                        )}
                      </CardSection>
                    </div>
                  </>
                ) : null}

                {/* Дата */}
                <div className="-mx-3">
                  <CardSection className="py-0">
                    <div className="px-3 py-1">
                      <label className="block text-[12px] font-medium opacity-80 mb-0.5">{t("tx_modal.date")}</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="date-input-clean appearance-none w-full h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 pr-8 text-[14px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                        />
                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
                      </div>
                    </div>
                  </CardSection>
                </div>

                {/* Кнопки */}
                <div className="flex flex-row gap-2 mt-0.5 w-full relative">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    style={{ color: "#000" }}
                    className="w-1/2 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition"
                    disabled={saving}
                  >
                    {t("cancel")}
                  </button>

                  <div className="w-1/2 relative">
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => void doSubmit("close")}
                        className="flex-1 h-10 rounded-l-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                        disabled={saving}
                      >
                        {saving ? t("saving") : (mode === "edit" ? t("save") : t("tx_modal.create"))}
                      </button>
                      {mode !== "edit" && (
                        <button
                          type="button"
                          onClick={() => setMoreOpen((v) => !v)}
                          className="px-3 h-10 rounded-r-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                          aria-label="More actions"
                          disabled={saving}
                        >
                          <ChevronDown size={16} />
                        </button>
                      )}
                    </div>

                    {moreOpen && !saving && mode !== "edit" && (
                      <div
                        className="absolute right-0 mt-1 w-[220px] rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] z-20"
                        onMouseLeave={() => setMoreOpen(false)}
                      >
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2.5 text-[14px] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
                          onClick={() => { setMoreOpen(false); void doSubmit("again"); }}
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
        onSelect={(it) => {
          // @ts-ignore
          const color = (it as any).color;
          // @ts-ignore
          const icon = (it as any).icon;
          const raw = color ?? (it as any).bg_color ?? (it as any).hex ?? (it as any).background_color ?? (it as any).color_hex;
          const hex6 = to6Hex(raw) ?? raw ?? null;
          setCategoryId((it as any).id);
          setCategoryName((it as any).name);
          setCategoryColor(hex6);
          setCategoryIcon(icon ?? null);
          setCategoryModal(false);
        }}
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
          // @ts-ignore
          setPaidByAvatar(u.avatar_url || (u as any)?.photo_url || undefined);
          // Автосплит equal со всеми участниками
          setSplitData((prev) => {
            const alreadySet = !!prev && prev.participants && prev.participants.length > 0;
            if (alreadySet) return prev;
            const participants = Array.from(membersMap.values()).map((m) => ({
              user_id: m.id,
              name: (nameFromMember(m).split(/\s+/)[0]) || "",
              avatar_url: m.photo_url || undefined,
            }));
            return { type: "equal", participants } as SplitSelection;
          });
        }}
        closeOnSelect
      />

      {/* Выбор получателя */}
      <MemberPickerModal
        open={recipientOpen && !!selectedGroupId}
        onClose={() => setRecipientOpen(false)}
        groupId={selectedGroupId || 0}
        selectedUserId={toUser}
        onSelect={(u) => {
          setToUser(u.id);
          setToUserName(u.name || "");
          // @ts-ignore
          setToUserAvatar(u.avatar_url || (u as any)?.photo_url || undefined);
        }}
        closeOnSelect
      />

      {/* Деление */}
      <SplitPickerModal
        open={splitOpen && !!selectedGroupId}
        onClose={() => setSplitOpen(false)}
        groupId={selectedGroupId || 0}
        amount={Number((isFinite(Number(amount)) ? Number(amount).toFixed(currency.decimals) : "0"))}
        currency={{ code: currency.code || "", symbol: currency.code || "", decimals: currency.decimals }}
        initial={splitData || { type: splitType, participants: [] as any[] }}
        paidById={paidBy}
        onSave={(sel) => { setSplitType(sel.type); setSplitData(sel); setSplitOpen(false); }}
      />

      {/* Выбор валюты */}
      <CurrencyPickerModal
        open={currencyModal && !!selectedGroupId}
        onClose={() => setCurrencyModal(false)}
        selectedCode={currency.code || "USD"}
        onSelect={(c: CurrencyItem) => {
          setCurrencyCode(c.code || "USD");
          currencyLockedRef.current = true; // пользователь явно выбрал валюту — фиксируем
          setCurrencyModal(false);
        }}
      />
    </div>
  );
}

/* --- локальный стиль, чтобы скрыть нативные стрелки/иконки у input[type="date"] на мобилках --- */
const style = typeof document !== "undefined" ? document.createElement("style") : null;
if (style) {
  style.innerHTML = `
  .date-input-clean {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: textfield;
    background-clip: padding-box;
  }
  /* скрыть webkit-индикатор календаря/стрелки */
  .date-input-clean::-webkit-calendar-picker-indicator,
  .date-input-clean::-webkit-clear-button,
  .date-input-clean::-webkit-inner-spin-button {
    display: none;
    -webkit-appearance: none;
  }
  /* для старых Edge/IE (не критично) */
  .date-input-clean::-ms-expand { display: none; }
  `;
  document.head.appendChild(style);
}
