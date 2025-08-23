// src/pages/TransactionEditPage.tsx
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Общие секции / модалки — те же, что в создании
import CardSection from "../components/CardSection";
import CategoryPickerModal from "../components/category/CategoryPickerModal";
import MemberPickerModal from "../components/group/MemberPickerModal";
import SplitPickerModal, {
  SplitSelection,
  PerPerson,
  computePerPerson,
} from "../components/transactions/SplitPickerModal";

// API и сторы
import { getGroupDetails } from "../api/groupsApi";
import { getGroupMembers } from "../api/groupMembersApi";
import { useUserStore } from "../store/userStore";

// Иконки
import {
  X,
  Layers,
  CalendarDays,
  ChevronDown,
  ChevronRight as Chevron,
  FileText,
  Receipt,
  Send,
  ArrowLeft,
} from "lucide-react";

/* ====================== СЕРВИС ====================== */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://splitto-backend-prod-ugraf.amvera.io/api";

function getTelegramInitData(): string {
  // @ts-ignore
  return (window?.Telegram?.WebApp?.initData as string) || "";
}

async function fetchJson<T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    "x-telegram-initdata": getTelegramInitData(),
  };
  const res = await fetch(input, { ...init, headers });
  if (!res.ok) throw new Error(await res.text());
  // некоторые DELETE могут вернуть 204
  try {
    return await res.json();
  } catch {
    return undefined as unknown as T;
  }
}

/* ====================== ТИПЫ (минимум) ====================== */

type TxType = "expense" | "transfer";
type TxShare = { user_id: number; amount: number | string };

type TxOut = {
  id: number;
  type: TxType;
  group_id: number;
  amount: number | string;
  currency: string;
  date: string;
  comment?: string | null;

  // expense-only
  category?:
    | { id: number; name: string; color?: string | null; icon?: string | null }
    | null;
  paid_by?: number | null;
  shares?: TxShare[];

  // transfer-only
  from_user_id?: number | null;
  to_user_id?: number | null;
  from_name?: string | null;
  to_name?: string | null;
  from_avatar?: string | null;
  to_avatar?: string | null;

  // доп. поля от бэка
  created_at?: string;

  // возможные продублированные поля
  paid_by_name?: string | null;
  paid_by_avatar?: string | null;
};

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
  name?: string; // если где-то уже собрано
};

/* ====================== ВАЛЮТА/ФОРМАТЫ ====================== */

const SYMBOL_BY_CODE: Record<string, string> = {
  USD: "$",
  EUR: "€",
  RUB: "₽",
  GBP: "£",
  UAH: "₴",
  KZT: "₸",
  TRY: "₺",
  JPY: "¥",
  CNY: "¥",
  PLN: "zł",
  CZK: "Kč",
  INR: "₹",
  AED: "د.إ",
};
const DECIMALS_BY_CODE: Record<string, number> = { JPY: 0, KRW: 0, VND: 0 };

function resolveCurrencyCodeFromGroup(g?: MinimalGroup | null): string | null {
  const raw =
    (g as any)?.default_currency_code ||
    (g as any)?.currency_code ||
    (g as any)?.currency ||
    null;
  return typeof raw === "string" && raw.trim()
    ? raw.trim().toUpperCase()
    : null;
}
function makeCurrency(g?: MinimalGroup | null, fallbackCode?: string | null) {
  const code =
    resolveCurrencyCodeFromGroup(g) ||
    (fallbackCode ? fallbackCode.toUpperCase() : null);
  return {
    code,
    symbol: code ? SYMBOL_BY_CODE[code] ?? code : "",
    decimals: code ? DECIMALS_BY_CODE[code] ?? 2 : 2,
  };
}

// Маска/формат суммы
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
function fmtMoney(
  n: number,
  decimals: number,
  symbol: string,
  locale: string
) {
  try {
    const nf = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${nf.format(n)} ${symbol}`;
  } catch {
    return `${n.toFixed(decimals)} ${symbol}`;
  }
}

/* ====================== ЦВЕТА КАТЕГОРИИ ====================== */

function to6Hex(input?: unknown): string | null {
  if (!input || typeof input !== "string") return null;
  let h = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) {
    h = h
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  if (/^[0-9a-f]{6}$/i.test(h)) return `#${h}`;
  return null;
}
function hexWithAlpha(hex6: string, alpha: number) {
  const h = hex6.replace("#", "");
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
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
function chipStyle(color?: string | null): CSSProperties {
  if (!color) return {};
  const hex6 = to6Hex(color);
  if (hex6) {
    return {
      backgroundColor: hexWithAlpha(hex6, 0.13),
      border: `1px solid ${hexWithAlpha(hex6, 0.33)}`,
    };
  }
  return { backgroundColor: asRgbaFallback(color, 0.13) };
}
function fillStyle(color?: string | null): CSSProperties {
  if (!color) return {};
  const hex6 = to6Hex(color);
  if (hex6) {
    return {
      backgroundColor: hexWithAlpha(hex6, 0.1),
      borderRadius: 12,
    };
  }
  return {
    backgroundColor: asRgbaFallback(color, 0.1),
    borderRadius: 12,
  };
}

/* ====================== UI helpers ====================== */

function Row({
  icon,
  label,
  value,
  onClick,
  right,
  isLast,
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
        <span className="ml-4 mr-3 flex items-center" style={{ width: 22 }}>
          {icon}
        </span>
        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[14px]">
          {label}
        </span>
        {right ? (
          <span className="mr-3">{right}</span>
        ) : (
          <>
            {value && (
              <span className="text-[var(--tg-link-color)] text-[14px] mr-1.5">
                {value}
              </span>
            )}
            {onClick && (
              <Chevron className="text-[var(--tg-hint-color)] mr-3" size={16} />
            )}
          </>
        )}
      </button>
      {!isLast && (
        <div className="absolute left-[50px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 pointer-events-none" />
      )}
    </div>
  );
}

function SelectedGroupPill({
  name,
  icon,
  color,
  onClick,
  locked,
}: {
  name: string;
  icon?: string | null;
  color?: string | null;
  onClick?: () => void;
  locked?: boolean;
}) {
  const ch = (name || "").trim().charAt(0).toUpperCase() || "👥";
  const bg =
    typeof color === "string" && color.trim().length
      ? (color as string)
      : "var(--tg-link-color)";
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      className={`mx-3 mt-1 mb-1 inline-flex items-center w-[calc(100%-1.5rem)] justify-between rounded-full border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] px-3 py-1 transition focus:outline-none ${
        locked ? "cursor-default" : "hover:bg-black/5 dark:hover:bg-white/5"
      }`}
      aria-label={locked ? `Группа: ${name}` : `Текущая группа: ${name}. Нажмите, чтобы сменить`}
    >
      <span className="flex items-center min-w-0">
        <span
          className="mr-2 flex items-center justify-center rounded-full text-white"
          style={{ width: 22, height: 22, fontSize: 14, background: bg }}
        >
          <span aria-hidden>{icon || ch}</span>
        </span>
        <span className="text-[14px] font-medium text-[var(--tg-text-color)] truncate">
          {name}
        </span>
      </span>
      {!locked && (
        <Chevron
          size={16}
          className="text-[var(--tg-hint-color)] ml-2 shrink-0"
        />
      )}
    </button>
  );
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

/* ====================== СТРАНИЦА ====================== */

export default function TransactionEditPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { txId } = useParams();
  const id = Number(txId);

  const user = useUserStore((s) => s.user);
  const locale = (i18n.language || "ru").split("-")[0];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tx, setTx] = useState<TxOut | null>(null);
  const [group, setGroup] = useState<MinimalGroup | null>(null);

  // Справочник участников группы (для имён/аватаров)
  const [membersMap, setMembersMap] = useState<Map<number, MemberMini>>(
    () => new Map()
  );

  // Форма (как в модалке)
  const [type, setType] = useState<TxType>("expense"); // визуальный стейт; фактически заблокирован
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [comment, setComment] = useState<string>("");

  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [categoryColor, setCategoryColor] = useState<string | null>(null);
  const [categoryIcon, setCategoryIcon] = useState<string | null>(null);

  const [paidBy, setPaidBy] = useState<number | undefined>(undefined);
  const [paidByName, setPaidByName] = useState<string>("");
  const [paidByAvatar, setPaidByAvatar] = useState<string | undefined>(
    undefined
  );

  const [splitData, setSplitData] = useState<SplitSelection | null>(null);

  const [toUser, setToUser] = useState<number | undefined>(undefined);
  const [toUserName, setToUserName] = useState<string>("");
  const [toUserAvatar, setToUserAvatar] = useState<string | undefined>(
    undefined
  );

  // модалки
  const [groupModal, setGroupModal] = useState(false); // locked
  const [categoryModal, setCategoryModal] = useState(false);
  const [payerOpen, setPayerOpen] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Валюта
  const currency = useMemo(
    () => makeCurrency(group, tx?.currency || null),
    [group, tx?.currency]
  );
  const amountNumber = useMemo(() => {
    const n = Number(amount);
    return isFinite(n) ? n : 0;
  }, [amount]);

  // Превью сплита
  const perPerson: PerPerson[] = useMemo(() => {
    if (!splitData || amountNumber <= 0) return [];
    return computePerPerson(splitData, amountNumber, currency.decimals);
  }, [splitData, amountNumber, currency.decimals]);

  const lockedType: TxType | null = tx?.type ?? null;

  /* ---------- 1) Загрузка самой транзакции ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data: TxOut = await fetchJson(`${API_URL}/transactions/${id}`);
        if (!alive) return;

        setTx(data);
        setType(data.type); // только для отображения

        // Группа
        let g: MinimalGroup | null = null;
        try {
          const gd = await getGroupDetails(data.group_id);
          g = {
            id: gd.id,
            name: gd.name,
            // @ts-ignore
            icon: (gd as any).icon,
            // @ts-ignore
            color: (gd as any).color,
            // @ts-ignore
            default_currency_code: (gd as any).default_currency_code,
            // @ts-ignore
            currency_code: (gd as any).currency_code,
            // @ts-ignore
            currency: (gd as any).currency,
          };
        } catch {
          // fallback: хотя бы валюта из транзакции
          g = {
            id: data.group_id,
            name: `#${data.group_id}`,
            default_currency_code: data.currency,
          } as any;
        }
        if (!alive) return;
        setGroup(g);
      } catch (e: any) {
        setError(e?.message || "Failed to load transaction");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  /* ---------- 2) Подгрузка участников группы (для имён/аватаров) ---------- */
  useEffect(() => {
    let abort = false;
    (async () => {
      if (!group?.id) return;
      const map = new Map<number, MemberMini>();
      let offset = 0;
      const limit = 100;
      let total = Infinity;

      try {
        while (!abort && offset < total) {
          const res = await getGroupMembers(group.id, offset, limit);
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
      } catch {
        // ignore, карта может остаться пустой — тогда берём из tx.*_name
      }
      if (!abort) setMembersMap(map);
    })();
    return () => {
      abort = true;
    };
  }, [group?.id]);

  /* ---------- 3) Одноразовый префилл на основе tx/group (НЕ ждём membersMap) ---------- */
  const didPrefillRef = useRef(false);
  useEffect(() => {
    if (didPrefillRef.current) return;
    if (!tx || !group) return;

    try {
      // базовые поля
      setDate((tx.date || tx.created_at || new Date().toISOString()).slice(0, 10));
      setComment(tx.comment || "");

      // Сумма — сразу в формат валюты группы/tx
      const dec = makeCurrency(group, tx.currency).decimals;
      setAmount(toFixedSafe(String(tx.amount ?? "0"), dec));

      if (tx.type === "expense") {
        // Категория
        if (tx.category) {
          const rawColor =
            (tx.category as any).color ??
            (tx.category as any).bg_color ??
            (tx.category as any).hex ??
            (tx.category as any).background_color ??
            (tx.category as any).color_hex ??
            null;
          const hex6 = to6Hex(rawColor) ?? rawColor ?? null;

          setCategoryId(tx.category.id);
          setCategoryName(tx.category.name || null);
          setCategoryColor(hex6);
          setCategoryIcon((tx.category as any).icon ?? null);
        } else {
          setCategoryId(undefined);
          setCategoryName(null);
          setCategoryColor(null);
          setCategoryIcon(null);
        }

        // Плательщик
        const payerId = Number(tx.paid_by ?? NaN);
        setPaidBy(Number.isFinite(payerId) ? payerId : undefined);

        setPaidByName(tx.paid_by_name || ""); // имена уточним после загрузки membersMap
        setPaidByAvatar(tx.paid_by_avatar || undefined);

        // Shares -> Split.custom (имена/аватарки дольём после загрузки membersMap)
        const parts: any[] = Array.isArray(tx.shares)
          ? tx.shares.map((s) => ({
              user_id: Number(s.user_id),
              name: "",            // дополним позже
              avatar_url: undefined, // дополним позже
              amount: Number(s.amount) || 0,
            }))
          : [];

        setSplitData({ type: "custom", participants: parts } as any);
      } else {
        // Перевод
        const fromId = Number(tx.from_user_id ?? NaN);
        const toId = Number(tx.to_user_id ?? NaN);

        setPaidBy(Number.isFinite(fromId) ? fromId : undefined);
        setToUser(Number.isFinite(toId) ? toId : undefined);

        setPaidByName(tx.from_name || "");
        setToUserName(tx.to_name || "");
        setPaidByAvatar(tx.from_avatar || undefined);
        setToUserAvatar(tx.to_avatar || undefined);
      }

      didPrefillRef.current = true;
    } catch {
      // ignore
    }
    // важно: не зависим от membersMap, чтобы не «захлопнуть» префилл раньше времени
  }, [tx, group]);

  /* ---------- 4) Доливка имён/аватарок, когда подъехал membersMap ---------- */
  useEffect(() => {
    if (!tx) return;

    // Плательщик / отправитель
    if (paidBy) {
      const m = membersMap.get(paidBy);
      if (m) {
        if (!paidByName) setPaidByName(nameFromMember(m));
        if (!paidByAvatar && m.photo_url) setPaidByAvatar(m.photo_url);
      }
    }

    // Получатель (перевод)
    if (tx.type === "transfer" && toUser) {
      const m = membersMap.get(toUser);
      if (m) {
        if (!toUserName) setToUserName(nameFromMember(m));
        if (!toUserAvatar && m.photo_url) setToUserAvatar(m.photo_url);
      }
    }

    // Участники сплита
    if (tx.type === "expense" && splitData?.participants?.length) {
      const updated = splitData.participants.map((p: any) => {
        if (p.name && p.avatar_url) return p;
        const m = membersMap.get(p.user_id);
        if (!m) return p;
        return {
          ...p,
          name: p.name || firstNameOnly(nameFromMember(m)),
          avatar_url: p.avatar_url || m.photo_url,
        };
      });

      // обновим только если что-то реально добавили
      const needUpdate =
        JSON.stringify(updated) !== JSON.stringify(splitData.participants);
      if (needUpdate) setSplitData({ ...splitData, participants: updated });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersMap]);

  /* ---------- ВСПОМОГАТЕЛЬНОЕ ---------- */

  const handleSelectCategory = (
    it: { id: number; name: string; color?: string | null; icon?: string | null } & Record<string, any>
  ) => {
    const raw =
      (it as any).color ??
      (it as any).bg_color ??
      (it as any).hex ??
      (it as any).background_color ??
      (it as any).color_hex;
    const hex6 = to6Hex(raw) ?? raw ?? null;
    setCategoryId(it.id);
    setCategoryName(it.name);
    setCategoryColor(hex6);
    setCategoryIcon((it as any).icon ?? null);
  };

  function buildShares(sel: SplitSelection | null | undefined, total: number, decimals: number): Array<{ user_id: number; amount: number }> {
    if (!sel) return [];
    if (sel.type === "custom") {
      return sel.participants.map((p: any) => ({
        user_id: Number(p.user_id),
        amount: Number(toFixedSafe(String(p.amount || 0), decimals)),
      }));
    }
    // для equal/shares рассчитаем суммы через computePerPerson
    const list = computePerPerson(sel, total, decimals);
    return list.map((p) => ({
      user_id: Number(p.user_id),
      amount: Number(toFixedSafe(String(p.amount || 0), decimals)),
    }));
  }

  const goBack = () => navigate(-1);

  // Сохранение (PUT)
  const doSave = async () => {
    if (!tx || !group?.id) return;

    try {
      setSaving(true);
      const gid = group.id;
      const amt = Number(toFixedSafe(amount || "0", currency.decimals));
      const curr = currency.code || tx.currency || "";

      if (tx.type === "expense") {
        const payerId = paidBy ?? user?.id;
        if (!payerId) {
          setPayerOpen(true);
          setSaving(false);
          return;
        }

        const payload: any = {
          type: "expense",
          group_id: gid,
          amount: amt,
          currency: curr,
          date,
          comment: (comment || "").trim() || null,
          paid_by: payerId,
          category_id: categoryId ?? null,
          shares: buildShares(splitData, amt, currency.decimals),
        };

        await fetchJson(`${API_URL}/transactions/${tx.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        if (!paidBy || !toUser || paidBy === toUser) {
          if (!paidBy) setPayerOpen(true);
          else if (!toUser) setRecipientOpen(true);
          setSaving(false);
          return;
        }
        const payload: any = {
          type: "transfer",
          group_id: gid,
          amount: amt,
          currency: curr,
          date,
          comment: (comment || "").trim() || null,
          from_user_id: paidBy,
          to_user_id: toUser,
          from_name: paidByName || null,
          to_name: toUserName || null,
          from_avatar: paidByAvatar || null,
          to_avatar: toUserAvatar || null,
        };
        await fetchJson(`${API_URL}/transactions/${tx.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      goBack();
    } catch (e) {
      console.error("[TransactionEditPage] save error", e);
      setError(t("save_failed") || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Удаление
  const doDelete = async () => {
    if (!tx) return;
    const yes =
      window.confirm(
        (t("tx_modal.delete_confirm") as string) ||
          "Удалить транзакцию? Это действие необратимо."
      );
    if (!yes) return;

    try {
      setSaving(true);
      await fetchJson(`${API_URL}/transactions/${tx.id}`, {
        method: "DELETE",
      });
      goBack();
    } catch (e) {
      console.error("[TransactionEditPage] delete error", e);
      setError(t("delete_failed") || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  /* ====================== РЕНДЕР ====================== */

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-[var(--tg-hint-color)]">
        {t("loading")}
      </div>
    );
  }
  if (error || !tx) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 mb-3">{error || "Transaction not found"}</div>
        <button
          type="button"
          onClick={goBack}
          className="px-3 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white"
        >
          ← {t("close")}
        </button>
      </div>
    );
  }

  const localeLabelFrom =
    locale === "ru" ? "Отправитель" : locale === "es" ? "Remitente" : "From";
  const localeLabelTo =
    locale === "ru" ? "Получатель" : locale === "es" ? "Receptor" : "To";

  return (
    <div className="min-h-screen bg-[var(--tg-bg-color,#111)]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-[var(--tg-card-bg)] border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
        <button
          type="button"
          onClick={goBack}
          className="p-1.5 rounded-lg hover:bg-[var(--tg-accent-color)]/10 transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--tg-hint-color)]" />
        </button>
        <div className="text-[17px] font-bold text-[var(--tg-text-color)]">
          {lockedType === "expense" ? t("tx_modal.expense") : t("tx_modal.transfer")}
        </div>
        <div className="w-7" />
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1 max-w-xl mx-auto">
        {/* Группа (locked) */}
        <div className="-mx-3">
          <CardSection className="py-0">
            {group ? (
              <SelectedGroupPill
                name={group.name}
                icon={group.icon}
                color={group.color || undefined}
                onClick={() => setGroupModal(true)}
                locked
              />
            ) : null}
          </CardSection>
        </div>

        {/* Тип — ЗАБЛОКИРОВАН (только отображение) */}
        <div className="-mx-3">
          <CardSection className="py-0.5">
            <div className="px-3 pb-0.5 flex justify-center">
              <div
                className="inline-flex rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden pointer-events-none opacity-70"
                title={t("tx_modal.type_locked") || "Тип транзакции изменить нельзя"}
              >
                <button
                  type="button"
                  className={`px-3 h-9 text-[13px] flex items-center ${
                    lockedType === "expense"
                      ? "bg-[var(--tg-accent-color,#40A7E3)] text-white"
                      : "text-[var(--tg-text-color)] bg-transparent"
                  }`}
                >
                  <Receipt size={14} className="mr-1.5" />
                  {t("tx_modal.expense")}
                </button>
                <button
                  type="button"
                  className={`px-3 h-9 text-[13px] flex items-center ${
                    lockedType === "transfer"
                      ? "bg-[var(--tg-accent-color,#40A7E3)] text-white"
                      : "text-[var(--tg-text-color)] bg-transparent"
                  }`}
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
                  <div
                    className="min-w-[52px] h-9 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center text-[12px] px-2"
                    title={currency.code}
                  >
                    {currency.code}
                  </div>
                )}
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(parseAmountInput(e.target.value))}
                  onBlur={() =>
                    setAmount((prev) => toFixedSafe(prev, currency.decimals))
                  }
                  className="flex-1 h-9 rounded-md bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] focus:border-[var(--tg-accent-color)] px-1 text-[17px]"
                />
              </div>
            </div>
          </CardSection>
        </div>

        {/* EXPENSE */}
        {lockedType === "expense" ? (
          <>
            {/* Категория + Комментарий */}
            <div className="-mx-3">
              <CardSection className="py-0">
                <div
                  className="px-3 py-1 grid grid-cols-2 gap-2 items-center"
                  style={fillStyle(categoryColor)}
                >
                  {/* Категория */}
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

                  {/* Комментарий */}
                  <div className="min-w-0 flex items-center gap-2">
                    <FileText size={16} className="opacity-80 shrink-0" />
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t("tx_modal.comment")}
                      className="flex-1 bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] focus:border-[var(--tg-accent-color)] py-1 text-[14px]"
                    />
                  </div>
                </div>
              </CardSection>
            </div>

            {/* Paid by / Split */}
            <div className="-mx-3">
              <CardSection className="py-0">
                <div className="px-3 py-1 grid grid-cols-2 gap-2">
                  {/* Paid by */}
                  <button
                    type="button"
                    onClick={() => {
                      setPayerOpen(true);
                      setRecipientOpen(false);
                      setSplitOpen(false);
                    }}
                    className="relative min-w-0 inline-flex items-center gap-2 pl-3 pr-7 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition max-w-full"
                  >
                    {paidBy ? (
                      <>
                        <span className="inline-flex items-center gap-1 min-w-0 truncate">
                          {paidByAvatar ? (
                            <img
                              src={paidByAvatar}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-[var(--tg-link-color)] inline-block" />
                          )}
                          <strong className="truncate">
                            {firstNameOnly(paidByName) || t("not_specified")}
                          </strong>
                        </span>
                        <span
                          role="button"
                          aria-label={t("clear") || "Очистить"}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black/10 dark:bg-white/10 hover:bg-black/20"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPaidBy(undefined);
                            setPaidByName("");
                            setPaidByAvatar(undefined);
                          }}
                        >
                          <X size={12} />
                        </span>
                      </>
                    ) : (
                      <span className="opacity-70 truncate">
                        {t("tx_modal.paid_by")}
                      </span>
                    )}
                  </button>

                  {/* Split */}
                  <button
                    type="button"
                    onClick={() => {
                      setPayerOpen(false);
                      setRecipientOpen(false);
                      setSplitOpen(true);
                    }}
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
                            <img
                              src={paidByAvatar}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-[var(--tg-link-color)] inline-block" />
                          )}
                          <span className="truncate flex-1">
                            {t("tx_modal.paid_by_label")}:{" "}
                            {firstNameOnly(paidByName) || t("not_specified")}
                          </span>
                          <span className="shrink-0 opacity-80">
                            {fmtMoney(
                              amountNumber,
                              currency.decimals,
                              currency.symbol,
                              locale
                            )}
                          </span>
                        </div>
                      )}

                      {perPerson
                        .filter((p) => !paidBy || p.user_id !== paidBy)
                        .map((p) => (
                          <div
                            key={p.user_id}
                            className="flex items-center gap-2 text-[13px]"
                          >
                            <span className="w-5 h-5 rounded-full bg-[var(--tg-link-color)] inline-block" />
                            <span className="truncate flex-1">
                              {t("tx_modal.owes_label")}: {p.name}
                            </span>
                            <span className="shrink-0 opacity-80">
                              {fmtMoney(
                                p.amount,
                                currency.decimals,
                                currency.symbol,
                                locale
                              )}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardSection>
            </div>
          </>
        ) : null}

        {/* TRANSFER */}
        {lockedType === "transfer" ? (
          <>
            <div className="-mx-3">
              <CardSection className="py-0">
                <div className="px-3 py-1 grid grid-cols-2 gap-2">
                  {/* From */}
                  <button
                    type="button"
                    onClick={() => {
                      setPayerOpen(true);
                      setRecipientOpen(false);
                      setSplitOpen(false);
                    }}
                    className="relative min-w-0 inline-flex items-center gap-2 pl-3 pr-7 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition max-w-full"
                  >
                    {paidBy ? (
                      <>
                        <span className="inline-flex items-center gap-1 min-w-0 truncate">
                          {paidByAvatar ? (
                            <img
                              src={paidByAvatar}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-[var(--tg-link-color)] inline-block" />
                          )}
                          <strong className="truncate">
                            {firstNameOnly(paidByName) || t("not_specified")}
                          </strong>
                        </span>
                        <span
                          role="button"
                          aria-label={t("clear") || "Очистить"}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black/10 dark:bg-white/10 hover:bg-black/20"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPaidBy(undefined);
                            setPaidByName("");
                            setPaidByAvatar(undefined);
                          }}
                        >
                          <X size={12} />
                        </span>
                      </>
                    ) : (
                      <span className="opacity-70 truncate">
                        {localeLabelFrom}
                      </span>
                    )}
                  </button>

                  {/* To */}
                  <button
                    type="button"
                    onClick={() => {
                      setPayerOpen(false);
                      setRecipientOpen(true);
                      setSplitOpen(false);
                    }}
                    className="relative min-w-0 inline-flex items-center gap-2 pl-3 pr-7 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition max-w-full"
                  >
                    {toUser ? (
                      <>
                        <span className="inline-flex items-center gap-1 min-w-0 truncate">
                          {toUserAvatar ? (
                            <img
                              src={toUserAvatar}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-[var(--tg-link-color)] inline-block" />
                          )}
                          <strong className="truncate">
                            {firstNameOnly(toUserName) || t("not_specified")}
                          </strong>
                        </span>
                        <span
                          role="button"
                          aria-label={t("clear") || "Очистить"}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black/10 dark:bg-white/10 hover:bg-black/20"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setToUser(undefined);
                            setToUserName("");
                            setToUserAvatar(undefined);
                          }}
                        >
                          <X size={12} />
                        </span>
                      </>
                    ) : (
                      <span className="opacity-70 truncate">{localeLabelTo}</span>
                    )}
                  </button>
                </div>
              </CardSection>
            </div>
          </>
        ) : null}

        {/* Дата */}
        <div className="-mx-3">
          <CardSection className="py-0">
            <div className="px-3 py-1">
              <label className="block text-[12px] font-medium opacity-80 mb-0.5">
                {t("tx_modal.date")}
              </label>
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
        <div className="flex flex-row gap-2 mt-1 w-full relative">
          <button
            type="button"
            onClick={goBack}
            style={{ color: "#000" }}
            className="w-1/2 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition"
            disabled={saving}
          >
            {t("close")}
          </button>

          <div className="w-1/2 relative">
            <div className="flex">
              <button
                type="button"
                onClick={() => void doSave()}
                className="flex-1 h-10 rounded-l-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                disabled={saving}
              >
                {saving ? t("saving") : t("save")}
              </button>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className="px-3 h-10 rounded-r-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                aria-label="More actions"
                disabled={saving}
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {moreOpen && !saving && (
              <div
                className="absolute right-0 mt-1 w-[220px] rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] z-10"
                onMouseLeave={() => setMoreOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    void doDelete();
                  }}
                  className="w-full text-left px-3 py-2.5 text-[13px] hover:bg-black/5 dark:hover:bg-white/5 rounded-t-xl"
                >
                  {t("delete") || "Удалить"}
                </button>

                <div className="px-3 py-2.5 text-[13px] text-[var(--tg-hint-color)] border-t border-[var(--tg-secondary-bg-color,#e7e7e7)] rounded-b-xl">
                  {t("more_actions") || "Доп. действия"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category picker */}
      <CategoryPickerModal
        open={lockedType === "expense" && categoryModal}
        onClose={() => setCategoryModal(false)}
        groupId={group?.id || 0}
        selectedId={categoryId}
        onSelect={(it) => {
          handleSelectCategory({
            id: it.id,
            name: it.name,
            color: (it as any).color,
            icon: (it as any).icon,
          } as any);
          setCategoryModal(false);
        }}
        closeOnSelect
      />

      {/* Payer picker */}
      <MemberPickerModal
        open={payerOpen && !!group?.id}
        onClose={() => setPayerOpen(false)}
        groupId={group?.id || 0}
        selectedUserId={paidBy}
        onSelect={(u) => {
          setPaidBy(u.id);
          setPaidByName(u.name || "");
          // @ts-ignore
          setPaidByAvatar(u.avatar_url || (u as any)?.photo_url || undefined);
        }}
        closeOnSelect
      />

      {/* Recipient picker (transfer) */}
      <MemberPickerModal
        open={recipientOpen && !!group?.id}
        onClose={() => setRecipientOpen(false)}
        groupId={group?.id || 0}
        selectedUserId={toUser}
        onSelect={(u) => {
          setToUser(u.id);
          setToUserName(u.name || "");
          // @ts-ignore
          setToUserAvatar(u.avatar_url || (u as any)?.photo_url || undefined);
        }}
        closeOnSelect
      />

      {/* Split picker (expense) */}
      <SplitPickerModal
        open={splitOpen && !!group?.id && lockedType === "expense"}
        onClose={() => setSplitOpen(false)}
        groupId={group?.id || 0}
        amount={Number(toFixedSafe(amount || "0", currency.decimals))}
        currency={{
          code: currency.code || "",
          symbol: currency.symbol,
          decimals: currency.decimals,
        }}
        initial={splitData || { type: "equal", participants: [] as any[] }}
        paidById={paidBy}
        onSave={(sel) => {
          setSplitData(sel);
          setSplitOpen(false);
        }}
      />
    </div>
  );
}
