import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import CardSection from "../components/CardSection";
import CategoryPickerModal from "../components/category/CategoryPickerModal";
import MemberPickerModal from "../components/group/MemberPickerModal";
import SplitPickerModal, {
  SplitSelection,
  PerPerson,
  computePerPerson,
} from "../components/transactions/SplitPickerModal";

import { getGroupDetails } from "../api/groupsApi";
import { getGroupMembers } from "../api/groupMembersApi";
import { getTransaction, updateTransaction, removeTransaction } from "../api/transactionsApi";
import { useUserStore } from "../store/userStore";
import { getExpenseCategories } from "../api/expenseCategoriesApi";

import {
  X,
  Layers,
  CalendarDays,
  FileText,
  ArrowLeft,
} from "lucide-react";

/* ====================== ВАЛЮТА/ФОРМАТЫ ====================== */
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
    | { id: number; name?: string; color?: string | null; icon?: string | null }
    | null;
  paid_by?: number | null;
  shares?: TxShare[];

  // transfer-only (СОВПАДАЕТ С БЭКОМ)
  transfer_from?: number | null;
  transfer_to?: number[] | null;

  created_at?: string;

  // часто приходит с бэка
  split_type?: "equal" | "shares" | "custom";

  // фолбэки, если category не развёрнут
  category_id?: number;
  category_name?: string;
  category_icon?: string | null;
  category_color?: string | null;
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
  name?: string;
};

const SYMBOL_BY_CODE: Record<string, string> = {
  USD: "$", EUR: "€", RUB: "₽", GBP: "£", UAH: "₴", KZT: "₸", TRY: "₺",
  JPY: "¥", CNY: "¥", PLN: "zł", CZK: "Kč", INR: "₹", AED: "د.إ", KRW: "₩", VND: "₫",
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

function parseAmountInput(raw: string, decimalsLimit = 2): string {
  let s = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (decimalsLimit === 0) return s.replace(/\./g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    const head = s.slice(0, firstDot + 1);
    const tail = s.slice(firstDot + 1).replace(/\./g, "");
    s = head + tail;
  }
  if (s.includes(".")) {
    const [int, dec] = s.split(".");
    s = int + "." + dec.slice(0, decimalsLimit);
  }
  return s;
}
function toFixedSafe(s: string, decimals = 2): string {
  if (!s) return decimals ? "" : "0";
  const n = Number(s);
  if (!isFinite(n)) return decimals ? "" : "0";
  return n.toFixed(decimals);
}
function fmtMoney(n: number, decimals: number, symbol: string, locale: string) {
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
    h = h.split("").map((ch) => ch + ch).join("");
  }
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
  return { backgroundColor: asRgbaFallback(color, 0.1), borderRadius: 12 };
}

/* ====================== HELPERS ====================== */
const firstNameOnly = (s?: string) => {
  const tok = (s || "").trim().split(/\s+/).filter(Boolean);
  return tok[0] || "";
};
const nameFromMember = (m?: MemberMini) => {
  if (!m) return "";
  const composed = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim();
  return composed || m.username || m.name || `#${m.id}`;
};

/* ====== Геттеры полей категории — безопасные для любых типов ====== */
function catNameOf(x: any): string {
  const s = (x?.name ?? x?.title ?? x?.label ?? x?.key ?? x?.slug ?? "").toString().trim();
  return s;
}
function catIconOf(x: any): string | null {
  return (x?.icon ?? x?.emoji ?? null) ?? null;
}
function catColorOf(x: any): string | null {
  const raw =
    x?.color ??
    x?.bg_color ??
    x?.hex ??
    x?.background_color ??
    x?.color_hex ??
    null;
  const hex6 = to6Hex(raw) ?? raw ?? null;
  return hex6;
}

/* ====================== КОМПОНЕНТ ====================== */
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

  const [membersMap, setMembersMap] = useState<Map<number, MemberMini>>(
    () => new Map()
  );

  // Форма
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState<string>("");

  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [categoryColor, setCategoryColor] = useState<string | null>(null);
  const [categoryIcon, setCategoryIcon] = useState<string | null>(null);

  const [paidBy, setPaidBy] = useState<number | undefined>(undefined);
  const [paidByName, setPaidByName] = useState<string>("");
  const [paidByAvatar, setPaidByAvatar] = useState<string | undefined>(undefined);

  const [splitData, setSplitData] = useState<SplitSelection | null>(null);

  const [toUser, setToUser] = useState<number | undefined>(undefined);
  const [toUserName, setToUserName] = useState<string>("");
  const [toUserAvatar, setToUserAvatar] = useState<string | undefined>(undefined);

  // модалки
  const [categoryModal, setCategoryModal] = useState(false);
  const [payerOpen, setPayerOpen] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const currency = useMemo(() => makeCurrency(group, tx?.currency || null), [group, tx?.currency]);
  const amountNumber = useMemo(() => {
    const n = Number(amount);
    return isFinite(n) ? n : 0;
  }, [amount]);

  const perPerson: PerPerson[] = useMemo(() => {
    if (!splitData || amountNumber <= 0) return [];
    return computePerPerson(splitData, amountNumber, currency.decimals);
  }, [splitData, amountNumber, currency.decimals]);

  /* ---------- кеш категорий (id -> {name, icon, color}) ---------- */
  const categoryCacheRef = useRef<Map<number, { name: string; icon?: string | null; color?: string | null }>>(
    new Map()
  );

  /* ---------- 1) загрузка транзакции + группы ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getTransaction(id);
        if (!alive) return;
        setTx(data as unknown as TxOut);

        // группа — для валюты/участников
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
          g = {
            id: data.group_id,
            name: `#${data.group_id}`,
            default_currency_code: (data as any).currency,
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
    return () => { alive = false; };
  }, [id]);

  /* ---------- 2) участники группы ---------- */
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
        // ignore
      }
      if (!abort) setMembersMap(map);
    })();
    return () => { abort = true; };
  }, [group?.id]);

  /* ---------- 3) префилл полей (однократно) ---------- */
  const didPrefillRef = useRef(false);
  useEffect(() => {
    if (didPrefillRef.current) return;
    if (!tx || !group) return;
    try {
      setDate((tx.date || tx.created_at || new Date().toISOString()).slice(0, 10));
      setComment(tx.comment || "");

      const dec = makeCurrency(group, tx.currency).decimals;
      setAmount(toFixedSafe(String(tx.amount ?? "0"), dec));

      if (tx.type === "expense") {
        // Категория (надёжный префилл + фолбэки)
        const catId =
          tx.category?.id ??
          tx.category_id ??
          (tx as any).categoryId ??
          undefined;
        const catName =
          tx.category?.name ??
          tx.category_name ??
          (tx as any).categoryName ??
          null;
        const catIcon =
          (tx.category as any)?.icon ??
          tx.category_icon ??
          (tx as any).categoryIcon ??
          null;
        const rawColor =
          (tx.category as any)?.color ??
          (tx.category as any)?.bg_color ??
          (tx.category as any)?.hex ??
          (tx.category as any)?.background_color ??
          (tx.category as any)?.color_hex ??
          tx.category_color ??
          (tx as any).categoryColor ??
          null;
        const hex6 = to6Hex(rawColor) ?? rawColor ?? null;
        setCategoryId(catId);
        setCategoryName(catName);
        setCategoryColor(hex6);
        setCategoryIcon(catIcon);

        // Плательщик
        const payerId = Number(tx.paid_by ?? NaN);
        setPaidBy(Number.isFinite(payerId) ? payerId : undefined);

        // Разделение — переносим ТИП из бэка, без принудительного custom
        const baseParts: any[] = Array.isArray(tx.shares)
          ? tx.shares.map((s) => ({
              user_id: Number(s.user_id),
              name: "",
              avatar_url: undefined,
              amount: Number(s.amount) || 0,
            }))
          : [];
        const initialSplitType: "equal" | "shares" | "custom" =
          (tx.split_type as any) || "custom";

        if (initialSplitType === "equal") {
          setSplitData({
            type: "equal",
            participants: baseParts.map((p) => ({
              user_id: p.user_id,
              name: p.name,
              avatar_url: p.avatar_url,
            })),
          } as any);
        } else if (initialSplitType === "shares") {
          // стартуем только с участников транзакции (НЕ со всех членов группы)
          setSplitData({
            type: "shares",
            participants: baseParts.map((p) => ({
              user_id: p.user_id,
              name: p.name,
              avatar_url: p.avatar_url,
              share: 1, // пометка «участвовал»
            })),
          } as any);
        } else {
          setSplitData({
            type: "custom",
            participants: baseParts,
          } as any);
        }
      } else {
        // === TRANSFER ===
        const fromId = Number(tx.transfer_from ?? NaN);
        const toArr = tx.transfer_to as number[] | null | undefined;
        const toId = Number(toArr && toArr.length ? toArr[0] : NaN);

        setPaidBy(Number.isFinite(fromId) ? fromId : undefined);
        setToUser(Number.isFinite(toId) ? toId : undefined);

        setPaidByName("");
        setToUserName("");
        setPaidByAvatar(undefined);
        setToUserAvatar(undefined);
      }

      didPrefillRef.current = true;
    } catch { /* ignore */ }
  }, [tx, group]);

  /* ---------- 3.1) ГЛУБОКИЙ lazy-резолв категории по id + кэш ---------- */
  useEffect(() => {
    let abort = false;

    const setFromCache = (id: number) => {
      const cached = categoryCacheRef.current.get(id);
      if (cached) {
        setCategoryName((prev) => prev || cached.name || null);
        setCategoryIcon((prev) => prev ?? cached.icon ?? null);
        setCategoryColor((prev) => prev ?? cached.color ?? null);
        return true;
      }
      return false;
    };

    // BFS по дереву категорий (до 5 уровней)
    const findCategoryDeep = async (wantedId: number) => {
      // сначала накачаем верхний уровень
      let offset = 0;
      const limit = 100;
      let total = Infinity;
      const roots: any[] = [];

      try {
        while (!abort && offset < total) {
          const res = await getExpenseCategories({ offset, limit });
          total = res.total ?? 0;
          const items = res.items ?? [];
          for (const c of items as any[]) {
            categoryCacheRef.current.set(c.id, {
              name: catNameOf(c),
              icon: catIconOf(c),
              color: catColorOf(c),
            });
            if (c.id === wantedId) return c;
          }
          roots.push(...items);
          offset += items.length;
          if (items.length === 0) break;
        }
      } catch { /* ignore */ }

      // очередь на обход вниз
      const queue: number[] = roots.map((r: any) => r.id);
      const visited = new Set<number>(queue);

      let depth = 0;
      while (!abort && queue.length && depth < 5) {
        const breadth = queue.length;
        for (let i = 0; i < breadth; i++) {
          const parentId = queue.shift()!;
          try {
            let chOffset = 0;
            let chTotal = Infinity;
            while (!abort && chOffset < chTotal) {
              const res = await getExpenseCategories({ parentId, offset: chOffset, limit: 100 });
              chTotal = res.total ?? 0;
              const items = res.items ?? [];
              for (const c of items as any[]) {
                categoryCacheRef.current.set(c.id, {
                  name: catNameOf(c),
                  icon: catIconOf(c),
                  color: catColorOf(c),
                });
                if (c.id === wantedId) return c;
                if (!visited.has(c.id)) {
                  visited.add(c.id);
                  queue.push(c.id);
                }
              }
              chOffset += items.length;
              if (items.length === 0) break;
            }
          } catch { /* ignore */ }
        }
        depth++;
      }

      return null;
    };

    (async () => {
      if (tx?.type !== "expense") return;
      if (!categoryId) return;

      // если уже всё есть — выходим
      const hasName = !!(categoryName && categoryName.trim());
      const haveVisual = categoryIcon != null || categoryColor != null;
      if (hasName && haveVisual) return;

      // из кеша
      if (setFromCache(categoryId)) return;

      // ищем по дереву
      const found: any = await findCategoryDeep(categoryId);
      if (abort) return;
      if (found) {
        const name = catNameOf(found);
        const icon = catIconOf(found);
        const color = catColorOf(found);
        categoryCacheRef.current.set(found.id, { name, icon, color });

        setCategoryName((prev) => prev || (name || null));
        setCategoryIcon((prev) => prev ?? icon);
        setCategoryColor((prev) => prev ?? color);
      }
    })();

    return () => { abort = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx?.type, categoryId, categoryName, categoryIcon, categoryColor]);

  /* ---------- 4) имена/аватарки после загрузки участников ---------- */
  useEffect(() => {
    if (!tx) return;

    if (paidBy) {
      const m = membersMap.get(paidBy);
      if (m) {
        if (!paidByName) setPaidByName(nameFromMember(m));
        if (!paidByAvatar && m.photo_url) setPaidByAvatar(m.photo_url);
      }
    }

    if (tx.type === "transfer" && toUser) {
      const m = membersMap.get(toUser);
      if (m) {
        if (!toUserName) setToUserName(nameFromMember(m));
        if (!toUserAvatar && m.photo_url) setToUserAvatar(m.photo_url);
      }
    }

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
      const needUpdate =
        JSON.stringify(updated) !== JSON.stringify(splitData.participants);
      if (needUpdate) setSplitData({ ...splitData, participants: updated });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersMap]);

  /* ---------- HELPERS ---------- */
  const goBack = () => navigate(-1);

  const handleSelectCategory = (
    it: Record<string, any>
  ) => {
    // безопасные геттеры — не зависим от конкретных полей типа
    const id = Number(it.id);
    const name = catNameOf(it);
    const icon = catIconOf(it);
    const color = catColorOf(it);

    setCategoryId(Number.isFinite(id) ? id : undefined);
    setCategoryName(name || null);
    setCategoryColor(color);
    setCategoryIcon(icon);

    if (Number.isFinite(id)) {
      categoryCacheRef.current.set(id, { name, icon, color });
    }
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
        const v = Number((p as any).share || 0);
        if (v > 0) sharesByUser.set(Number(p.user_id), v);
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

  // локальная валидация split перед сохранением (как в create-модалке)
  const validateSplitBeforeSave = (amtStr: string): boolean => {
    if (!splitData) return true;
    const total = Number(amtStr);
    if (!isFinite(total) || total <= 0) return false;

    if (splitData.type === "equal") {
      return (splitData.participants?.length || 0) > 0;
    }
    if (splitData.type === "shares") {
      const list = splitData.participants || [];
      if (list.length === 0) return false;
      const sumShares = list.reduce((s: number, p: any) => s + (Number(p.share || 0)), 0);
      return sumShares > 0;
    }
    if (splitData.type === "custom") {
      const sum = (splitData.participants || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const eps = 1 / Math.pow(10, currency.decimals);
      return Math.abs(sum - total) <= eps;
    }
    return true;
  };

  // нормализация результата SplitPickerModal (фикс «равно/доли»)
  const normalizeSplitSelection = (sel: SplitSelection): SplitSelection => {
    const prevIds = new Set((splitData?.participants || []).map((p: any) => Number(p.user_id)));
    const enrich = (u: number) => {
      const m = membersMap.get(u);
      return {
        user_id: u,
        name: firstNameOnly(nameFromMember(m)),
        avatar_url: m?.photo_url,
      };
    };

    if (sel.type === "equal") {
      const returned = sel.participants || [];
      // если модалка отдала только плательщика — восстановим исходный состав
      if (returned.length <= 1 && prevIds.size > 0) {
        const participants = Array.from(prevIds).map(enrich);
        return { type: "equal", participants };
      }
      return sel;
    }

    if (sel.type === "shares") {
      let returned = sel.participants || [];
      // оставляем только тех, кто уже был участником ранее ИЛИ у кого share > 0
      returned = returned.filter((p: any) => prevIds.has(Number(p.user_id)) || Number(p.share || 0) > 0);
      if (returned.length === 0 && prevIds.size > 0) {
        returned = Array.from(prevIds).map((u) => ({ ...enrich(u), share: 1 }));
      }
      return { type: "shares", participants: returned as any };
    }

    return sel; // custom — без изменений
  };

  // SAVE (PUT /transactions/{id})
  const doSave = async () => {
    if (!tx || !group?.id) return;

    try {
      setSaving(true);
      const gid = group.id;
      const amtStr = toFixedSafe(amount || "0", currency.decimals); // строка для стабильности округления
      const curr = currency.code || tx.currency || "";

      if (tx.type === "expense") {
        const payerId = paidBy ?? user?.id;
        if (!payerId) {
          setPayerOpen(true);
          setSaving(false);
          return;
        }

        if (!validateSplitBeforeSave(amtStr)) {
          setSplitOpen(true);
          setSaving(false);
          return;
        }

        const payload: any = {
          type: "expense",
          group_id: gid,
          amount: amtStr,
          currency: curr,
          date,
          comment: (comment || "").trim() || null,
          paid_by: payerId,
          category_id: categoryId ?? null,
          split_type: splitData?.type || tx.split_type || "equal",
          shares: buildShares(splitData, Number(amtStr), currency.decimals),
        };
        await updateTransaction(tx.id, payload);
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
          amount: amtStr,
          currency: curr,
          date,
          comment: (comment || "").trim() || null,
          transfer_from: paidBy,
          transfer_to: [toUser],
        };
        await updateTransaction(tx.id, payload);
      }

      goBack();
    } catch (e) {
      console.error("[TransactionEditPage] save error", e);
      setError(t("save_failed") || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // DELETE
  const doDelete = async () => {
    if (!tx) return;
    const yes = window.confirm(
      (t("tx_modal.delete_confirm") as string) ||
        "Удалить транзакцию? Это действие необратимо."
    );
    if (!yes) return;

    try {
      setSaving(true);
      await removeTransaction(tx.id);
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
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
        <div className="rounded-2xl bg-[var(--tg-card-bg)] px-4 py-6 text-[var(--tg-hint-color)] shadow-xl">
          {t("loading")}
        </div>
      </div>
    );
  }
  if (error || !tx) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40" onClick={goBack}>
        <div className="w-full max-w-md rounded-2xl bg-[var(--tg-card-bg)] p-4 shadow-xl" onClick={(e)=>e.stopPropagation()}>
          <div className="text-red-500 mb-3">{error || "Transaction not found"}</div>
          <button
            type="button"
            onClick={goBack}
            style={{ color: "#000" }}
            className="px-3 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 w-full"
          >
            ← {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  // ПОЛНОЭКРАННАЯ МОДАЛКА ПОВЕРХ ВСЕГО
  return (
    <div className="fixed inset-0 z-[1000] bg-black/40" onClick={goBack}>
      <div
        className="absolute inset-0 sm:inset-y-6 sm:inset-x-6 sm:rounded-2xl bg-[var(--tg-bg-color,#111)] shadow-2xl overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
            {t("edit") || "Edit"}
          </div>
          <div className="w-7" />
        </div>

        {/* Content — как в CreateTransactionModal */}
        <div className="p-3 flex flex-col gap-0.5 max-w-xl mx-auto">
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
                    placeholder={currency.decimals ? "0.00" : "0"}
                    value={amount}
                    onChange={(e) => setAmount(parseAmountInput(e.target.value, currency.decimals))}
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
          {tx.type === "expense" ? (
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
                              {p.avatar_url ? (
                                <img
                                  src={p.avatar_url}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-[var(--tg-link-color)] inline-block" />
                              )}
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
          {tx.type === "transfer" ? (
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
                          {locale === "ru" ? "Отправитель" : locale === "es" ? "Remitente" : "From"}
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
                        <span className="opacity-70 truncate">
                          {locale === "ru" ? "Получатель" : locale === "es" ? "Receptor" : "To"}
                        </span>
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
                    className="date-input-clean appearance-none w-full h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 pr-8 text-[14px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                  />
                  <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
                </div>
              </div>
            </CardSection>
          </div>

          {/* КНОПКИ */}
          <div className="flex flex-col sm:flex-row gap-2 mt-0.5 w-full">
            <button
              type="button"
              onClick={doDelete}
              className="w-full sm:w-1/3 h-10 rounded-xl font-bold text-[14px] border border-red-500/40 text-red-600 hover:bg-red-500/10 active:scale-95 transition disabled:opacity-60"
              disabled={saving}
            >
              {t("delete")}
            </button>

            <div className="flex gap-2 w-full sm:w-2/3">
              <button
                type="button"
                onClick={goBack}
                style={{ color: "#000" }}
                className="flex-1 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition disabled:opacity-60"
                disabled={saving}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => void doSave()}
                className="flex-1 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                disabled={saving}
              >
                {saving ? t("saving") : t("save")}
              </button>
            </div>
          </div>
        </div>

        {/* Модалки выбора */}
        <CategoryPickerModal
          open={tx.type === "expense" && categoryModal}
          onClose={() => setCategoryModal(false)}
          groupId={group?.id || 0}
          selectedId={categoryId}
          onSelect={(it) => {
            handleSelectCategory(it as any);
            setCategoryModal(false);
          }}
          closeOnSelect
        />

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

        <SplitPickerModal
          open={splitOpen && !!group?.id && tx.type === "expense"}
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
            const normalized = normalizeSplitSelection(sel);
            setSplitData(normalized);
            setSplitOpen(false);
          }}
        />
      </div>
    </div>
  );
}

/* --- локальный стиль для скрытия нативных стрелок/индикаторов у input[type="date"] --- */
const style = typeof document !== "undefined" ? document.createElement("style") : null;
if (style) {
  style.innerHTML = `
  .date-input-clean {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: textfield;
    background-clip: padding-box;
  }
  .date-input-clean::-webkit-calendar-picker-indicator,
  .date-input-clean::-webkit-clear-button,
  .date-input-clean::-webkit-inner-spin-button {
    display: none;
    -webkit-appearance: none;
  }
  .date-input-clean::-ms-expand { display: none; }
  `;
  document.head.appendChild(style);
}
