// frontend/src/pages/TransactionEditPage.tsx
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
import CurrencyPickerModal, { type CurrencyItem } from "../components/currency/CurrencyPickerModal";

import { getGroupDetails } from "../api/groupsApi";
import { getGroupMembers } from "../api/groupMembersApi";
import {
  getTransaction,
  updateTransaction,
  removeTransaction,
  uploadReceipt,
  setTransactionReceiptUrl,
  deleteTransactionReceipt, // явное удаление чека
} from "../api/transactionsApi";

import {
  X,
  Layers,
  CalendarDays,
  FileText,
  ArrowLeft,
  UserX,
  Paperclip,
  RefreshCcw,
  Trash2,
  Camera,
} from "lucide-react";

import { useReceiptStager } from "../hooks/useReceiptStager";
import ReceiptPreviewModal from "../components/transactions/ReceiptPreviewModal";

/* ====================== ВАЛЮТА/ФОРМАТЫ ====================== */
type TxType = "expense" | "transfer";
type TxShare = { user_id: number; amount: number | string };

type RelatedUser = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  name?: string | null;
};

type TxOut = {
  id: number;
  type: TxType;
  group_id: number;
  amount: number | string;
  currency?: string | null;
  currency_code?: string | null;
  date: string;
  comment?: string | null;

  category?:
    | { id: number; name?: string; color?: string | null; icon?: string | null }
    | null;
  paid_by?: number | null;
  shares?: TxShare[];

  transfer_from?: number | null;
  transfer_to?: number[] | null;

  created_at?: string;

  split_type?: "equal" | "shares" | "custom";

  related_users?: RelatedUser[];

  // возможные поля чека из бэка
  receipt_url?: string | null;
  receipt_preview_url?: string | null;
  receipt?: string | null;
  receipt_preview?: string | null;
  receipt_data?: any | null;
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

function parseAmountInput(raw: string, decimalsLimit = 2): string {
  let s = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (decimalsLimit === 0) return s.replace(/\./g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    const head = s.slice(0, firstDot + 1);
    const tail = s.slice(0 + firstDot + 1).replace(/\./g, "");
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
function fmtMoney(n: number, decimals: number, symbolOrCode: string, locale: string) {
  try {
    const nf = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${nf.format(n)} ${symbolOrCode}`;
  } catch {
    return `${n.toFixed(decimals)} ${symbolOrCode}`;
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
const composeName = (m?: { first_name?: string | null; last_name?: string | null; username?: string | null; name?: string | null; id?: number }) => {
  if (!m) return "";
  const composed = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim();
  return composed || (m.name ?? "") || (m.username ?? "") || (m.id ? `#${m.id}` : "");
};
const nameFromMember = (m?: MemberMini) => composeName(m);

/** Парсим ошибки API и возвращаем { code?, message? } */
function parseApiError(err: any): { code?: string; message?: string } {
  const tryExtract = (obj: any) => {
    const d = obj?.detail ?? obj;
    if (d && typeof d === "object") {
      if (typeof d.code === "string") return { code: d.code, message: d.message };
    }
    if (typeof d === "string") return { message: d };
    return {};
  };

  if (err?.response?.data) {
    const r = tryExtract(err.response.data);
    if (r.code || r.message) return r;
  }
  if (typeof err?.message === "string") {
    try { const j = JSON.parse(err.message); const r = tryExtract(j); if (r.code || r.message) return r; } catch {}
  }
  if (typeof err === "string") {
    try { const j = JSON.parse(err); const r = tryExtract(j); if (r.code || r.message) return r; } catch {}
  }
  if (err && typeof err === "object") {
    const r = tryExtract(err);
    if (r.code || r.message) return r;
  }
  return { message: err?.message || String(err ?? "") };
}

/** Собираем множество id участников транзакции */
function collectInvolvedIds(tx: TxOut | null | undefined): Set<number> {
  const ids = new Set<number>();
  if (!tx) return ids;
  if (tx.type === "expense") {
    if (Number.isFinite(Number(tx.paid_by))) ids.add(Number(tx.paid_by));
    (tx.shares || []).forEach(s => {
      const uid = Number((s as any).user_id);
      if (Number.isFinite(uid)) ids.add(uid);
    });
  } else {
    if (Number.isFinite(Number(tx.transfer_from))) ids.add(Number(tx.transfer_from));
    (tx.transfer_to || []).forEach(uid => {
      const n = Number(uid);
      if (Number.isFinite(n)) ids.add(n);
    });
  }
  return ids;
}

/** Есть ли среди участников те, кого нет в membersMap (т.е. неактивные в группе) */
function hasInactiveParticipants(tx: TxOut | null, membersMap: Map<number, MemberMini>): boolean {
  if (!tx) return false;
  const ids = collectInvolvedIds(tx);
  for (const id of ids) {
    if (!membersMap.has(id)) return true;
  }
  return false;
}

/** Мапа related_users по id → {name, avatar_url} */
function buildRelatedMap(tx?: TxOut | null): Map<number, { name: string; avatar_url?: string }> {
  const map = new Map<number, { name: string; avatar_url?: string }>();
  const arr = tx?.related_users || [];
  for (const u of arr) {
    const name = composeName(u) || (u.id ? `#${u.id}` : "");
    const avatar = (u.avatar_url || u.photo_url || undefined) || undefined;
    if (Number.isFinite(Number(u.id))) map.set(Number(u.id), { name, avatar_url: avatar });
  }
  return map;
}

/** Получить имя/аватар по user_id — сначала из участников группы, иначе из related_users */
function resolveUserFromMaps(
  userId?: number,
  membersMap?: Map<number, MemberMini>,
  relatedMap?: Map<number, { name: string; avatar_url?: string }>
): { name: string; avatar_url?: string; inactive: boolean } {
  if (!Number.isFinite(Number(userId))) return { name: "", avatar_url: undefined, inactive: false };
  const uid = Number(userId);
  const m = membersMap?.get(uid);
  if (m) {
    return { name: nameFromMember(m), avatar_url: m.photo_url || undefined, inactive: false };
  }
  const r = relatedMap?.get(uid);
  if (r) {
    return { name: r.name, avatar_url: r.avatar_url, inactive: true };
  }
  return { name: `#${uid}`, avatar_url: undefined, inactive: true };
}

/* ===== нормализация ответа аплоада (только image) ===== */
function normalizeUploadReceiptResponse(uploaded: any): { url: string | null; previewUrl: string | null } {
  if (!uploaded) return { url: null, previewUrl: null };
  const directString = typeof uploaded === "string" ? uploaded : null;
  const obj = typeof uploaded === "object" && uploaded ? uploaded : (directString ? { url: directString } : null);
  if (!obj) return { url: null, previewUrl: null };

  const candidates = [
    obj.url, obj.href, obj.file_url, obj.original_url, obj.receipt_url,
    obj.file?.url, obj.file?.href,
  ].filter((x) => typeof x === "string" && x.trim()) as string[];
  const url = candidates[0] || null;

  const previewCandidates = [
    obj.preview_url, obj.thumbnail, obj.thumb_url,
    obj.receipt?.preview_url, obj.receipt_data?.preview_url,
    obj.preview, obj.previews?.[0],
  ].filter((x) => typeof x === "string" && x.trim()) as string[];
  const previewUrl = previewCandidates[0] || null;

  return { url, previewUrl };
}

/* ====================== КОМПОНЕНТ ====================== */
export default function TransactionEditPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { txId } = useParams();
  const id = Number(txId);

  const locale = (i18n.language || "ru").split("-")[0];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tx, setTx] = useState<TxOut | null>(null);
  const [group, setGroup] = useState<MinimalGroup | null>(null);

  const [membersMap, setMembersMap] = useState<Map<number, MemberMini>>(
    () => new Map()
  );

  // Мапа related_users
  const relatedMap = useMemo(() => buildRelatedMap(tx), [tx?.related_users]);

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
  const [paidByInactive, setPaidByInactive] = useState<boolean>(false);

  const [splitData, setSplitData] = useState<SplitSelection | null>(null);

  const [toUser, setToUser] = useState<number | undefined>(undefined);
  const [toUserName, setToUserName] = useState<string>("");
  const [toUserAvatar, setToUserAvatar] = useState<string | undefined>(undefined);
  const [toUserInactive, setToUserInactive] = useState<boolean>(false);

  // модалки
  const [categoryModal, setCategoryModal] = useState(false);
  const [payerOpen, setPayerOpen] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [currencyModal, setCurrencyModal] = useState(false);

  const [saving, setSaving] = useState(false);

  // ---- unified center toast ----
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const showToast = (msg: string) => {
    setToast({ open: true, message: msg });
    window.setTimeout(() => setToast({ open: false, message: "" }), 2400);
  };

  // Блокирующий диалог про неактивных участников
  const [inactiveDialogOpen, setInactiveDialogOpen] = useState(false);

  // Валюта как состояние (редактируемая)
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  const currency = useMemo(() => {
    const code = currencyCode || null;
    const decimals = code ? (DECIMALS_BY_CODE[code] ?? 2) : 2;
    const symbol = code ? (SYMBOL_BY_CODE[code] ?? code) : "";
    return { code, symbol, decimals };
  }, [currencyCode]);

  const amountNumber = useMemo(() => {
    const n = Number(amount);
    return isFinite(n) ? n : 0;
  }, [amount]);

  const perPerson: PerPerson[] = useMemo(() => {
    if (!splitData || amountNumber <= 0) return [];
    return computePerPerson(splitData, amountNumber, currency.decimals);
  }, [splitData, amountNumber, currency.decimals]);

  /* ---------- ЧЕК: стейджер + предпросмотр ---------- */
  const receipt = useReceiptStager();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null); // фолбэк «задняя камера»
  const [previewOpen, setPreviewOpen] = useState(false);

  // алиас для «как в модалке создание»
  const pickGallery = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      receipt.setStagedFile(f);
      receipt.unmarkDeleted();
    }
    e.target.value = "";
  };
  const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      receipt.setStagedFile(f);
      receipt.unmarkDeleted();
    }
    e.target.value = "";
  };

  const onReplace = () => pickGallery();
  const onRemove = () => {
    if (receipt.serverUrl) {
      receipt.markDeleted();             // пометили к удалению (стейджер сам чистит локальное превью)
      receipt.setServerUrl(null);        // сразу прячем серверный превью/урл из UI
      receipt.setServerPreviewUrl(null);
    } else {
      // если был только локальный файл — просто очищаем
      receipt.clearAll();
    }
  };

  const hasReceiptNow = Boolean(receipt.displayUrl) && !receipt.removeMarked;

  const receiptHint = useMemo(() => {
    return hasReceiptNow
      ? (t("tx_modal.receipt_attached_image") as string)
      : (t("tx_modal.receipt_not_attached") as string);
  }, [hasReceiptNow, t]);

  // предпросмотр (только изображение)
  const previewModalUrl = useMemo(() => receipt.displayUrl ?? receipt.serverUrl ?? null, [receipt.displayUrl, receipt.serverUrl]);

  /* ---------- КАМЕРА: getUserMedia + фолбэк capture="environment" ---------- */
  const [camOpen, setCamOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);

  const startCamera = async () => {
    setCamError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        cameraInputRef.current?.click(); // фолбэк
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCamOpen(true);
    } catch {
      setCamError("Не удалось открыть камеру");
      cameraInputRef.current?.click(); // фолбэк
    }
  };

  useEffect(() => {
    if (!camOpen) return;
    const v = videoRef.current;
    if (v && streamRef.current) {
      (v as any).srcObject = streamRef.current;
      v.play?.().catch(() => {});
    }
    return () => {
      const s = streamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [camOpen]);

  const takePhoto = async () => {
    await startCamera();
  };

  const confirmShot = async () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (blob) {
      const file = new File([blob], `receipt_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      receipt.setStagedFile(file);
      receipt.unmarkDeleted();
    }
    setCamOpen(false);
  };

  const cancelShot = () => {
    setCamOpen(false);
  };

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

        let g: MinimalGroup | null = null;
        try {
          const gd = await getGroupDetails((data as any).group_id ?? data.group_id);
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
            id: (data as any).group_id ?? data.group_id,
            name: `#${(data as any).group_id ?? data.group_id}`,
            default_currency_code: (data as any).currency_code ?? (data as any).currency,
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

  /* ---------- 1.1) подставляем серверные ссылки чека, когда пришёл tx ---------- */
  useEffect(() => {
    if (!tx) return;
    const url =
      (tx as any).receipt_url ??
      (tx as any).receipt ??
      null;
    const preview =
      (tx as any).receipt_preview_url ??
      (tx as any).receipt_preview ??
      (tx as any)?.receipt_data?.preview_url ??
      null;

    receipt.setServerUrl(url);
    receipt.setServerPreviewUrl(preview);
    receipt.setData((tx as any)?.receipt_data ?? null);
    receipt.unmarkDeleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx?.id]);

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
    if (!tx) return;

    const hasTxCurrency = !!((tx as any).currency_code ?? (tx as any).currency);
    if (!hasTxCurrency && !group) return;

    try {
      setDate((tx.date || tx.created_at || new Date().toISOString()).slice(0, 10));
      setComment(tx.comment || "");

      const txCodeRaw = (tx.currency_code ?? tx.currency) || null;
      const txCode = typeof txCodeRaw === "string" && txCodeRaw.trim()
        ? txCodeRaw.trim().toUpperCase()
        : null;
      const fallback = resolveCurrencyCodeFromGroup(group) || null;
      const code = txCode || fallback || "USD";
      setCurrencyCode(code);

      const dec = DECIMALS_BY_CODE[code] ?? 2;
      setAmount(toFixedSafe(String(tx.amount ?? "0"), dec));

      if (tx.type === "expense") {
        const cat: any = (tx as any).category || {};
        const idCandidate = cat.id ?? (tx as any).category_id ?? undefined;
        const nameCandidate: string | null = cat.name ?? cat.title ?? cat.label ?? (tx as any).category_name ?? (tx as any).categoryTitle ?? (tx as any).category_label ?? null;
        const iconCandidate: string | null = cat.icon ?? (tx as any).category_icon ?? (tx as any).categoryEmoji ?? null;
        const rawColorCandidate = cat.color ?? cat.bg_color ?? cat.hex ?? cat.background_color ?? cat.color_hex ?? (tx as any).category_color ?? (tx as any).category_hex ?? (tx as any).category_bg ?? (tx as any).category_background ?? null;
        const hex6 = to6Hex(rawColorCandidate as any) ?? (rawColorCandidate as any) ?? null;

        setCategoryId(Number.isFinite(Number(idCandidate)) ? Number(idCandidate) : undefined);
        setCategoryName(nameCandidate || null);
        setCategoryIcon(iconCandidate);
        setCategoryColor(hex6);

        const payerId = Number(tx.paid_by ?? NaN);
        setPaidBy(Number.isFinite(payerId) ? payerId : undefined);

        const baseParts: Array<{ user_id: number; name: string; avatar_url?: string; amount: number; share?: number | null }> =
          Array.isArray(tx.shares)
            ? (tx.shares as any[]).map((s) => ({
                user_id: Number(s.user_id),
                name: "",
                avatar_url: undefined,
                amount: Number(s.amount) || 0,
                share: (() => {
                  const raw = (s as any).shares ?? (s as any).share;
                  const v = Number(raw);
                  return Number.isFinite(v) && v > 0 ? v : null;
                })(),
              }))
            : [];

        const initialSplitType: "equal" | "shares" | "custom" =
          (tx.split_type as any) || "custom";

        const deriveShares = (amounts: number[], decimals: number): number[] => {
          const scale = Math.pow(10, Math.max(0, decimals));
          const ints = amounts.map((v) => Math.round(Math.max(0, v) * scale));
          const positive = ints.filter((x) => x > 0);
          const gcd2 = (a: number, b: number): number => (b ? gcd2(b, a % b) : Math.abs(a));
          const g = positive.reduce((acc, v) => gcd2(acc, v), positive[0] || 0);
          if (!g) return amounts.map(() => 1);
          return ints.map((x) => (x > 0 ? x / g : 0));
        };

        if (initialSplitType === "shares") {
          const needDerive = baseParts.some((p) => !p.share || p.share <= 0);
          let sharesVector: number[] = [];
          if (needDerive) {
            sharesVector = deriveShares(
              baseParts.map((p) => p.amount),
              dec
            );
          }
          setSplitData({
            type: "shares",
            participants: baseParts.map((p, idx) => ({
              user_id: p.user_id,
              name: p.name,
              avatar_url: p.avatar_url,
              share: p.share && p.share > 0 ? p.share : (sharesVector[idx] || 1),
            })),
          } as any);
        } else if (initialSplitType === "equal") {
          setSplitData({
            type: "equal",
            participants: baseParts.map((p) => ({
              user_id: p.user_id,
              name: p.name,
              avatar_url: p.avatar_url,
            })),
          } as any);
        } else {
          setSplitData({
            type: "custom",
            participants: baseParts,
          } as any);
        }
      } else {
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

  /* ---------- 3.1) при смене валюты аккуратно нормализуем дробную часть ---------- */
  useEffect(() => {
    if (!currencyCode) return;
    if (!amount) return;
    const n = Number(amount);
    if (!isFinite(n)) return;
    const dec = DECIMALS_BY_CODE[currencyCode] ?? 2;
    setAmount(n.toFixed(dec));
  }, [currencyCode, amount]);

  /* ---------- 4) имена/аватарки после загрузки участников + related_users ---------- */
  useEffect(() => {
    if (!tx) return;

    if (paidBy != null) {
      const { name, avatar_url, inactive } = resolveUserFromMaps(paidBy, membersMap, relatedMap);
      if (!paidByName && name) setPaidByName(name);
      if (!paidByAvatar && avatar_url) setPaidByAvatar(avatar_url);
      setPaidByInactive(inactive);
    }

    if (tx.type === "transfer" && toUser != null) {
      const { name, avatar_url, inactive } = resolveUserFromMaps(toUser, membersMap, relatedMap);
      if (!toUserName && name) setToUserName(name);
      if (!toUserAvatar && avatar_url) setToUserAvatar(avatar_url);
      setToUserInactive(inactive);
    }

    if (tx.type === "expense" && splitData?.participants?.length) {
      const updated = splitData.participants.map((p: any) => {
        if (p.name && p.avatar_url) return p;
        const { name, avatar_url } = resolveUserFromMaps(p.user_id, membersMap, relatedMap);
        return {
          ...p,
          name: p.name || firstNameOnly(name),
          avatar_url: p.avatar_url || avatar_url,
        };
      });
      const needUpdate =
        JSON.stringify(updated) !== JSON.stringify(splitData.participants);
      if (needUpdate) setSplitData({ ...splitData, participants: updated });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersMap, relatedMap, tx?.type, paidBy, toUser, splitData, paidByName, toUserName, paidByAvatar, toUserAvatar]);

  /* ---------- HELPERS ---------- */
  const goBack = () => navigate(-1);

  const handleSelectCategory = (
    it: { id: number; name: string; color?: string | null; icon?: string | null } & Record<string, any>
  ) => {
    const raw =
      (it as any).color ?? (it as any).bg_color ?? (it as any).hex ?? (it as any).background_color ?? (it as any).color_hex;
    const hex6 = to6Hex(raw) ?? raw ?? null;
    setCategoryId(it.id);
    setCategoryName(it.name);
    setCategoryColor(hex6);
    setCategoryIcon((it as any).icon ?? null);
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

  // SAVE
  const doSave = async () => {
    if (!tx || !group?.id) return;

    if (hasInactiveParticipants(tx, membersMap)) {
      setInactiveDialogOpen(true);
      return;
    }

    try {
      setSaving(true);
      const gid = group.id;
      const amtStr = toFixedSafe(amount || "0", currency.decimals);

      if (!isFinite(Number(amtStr)) || Number(amtStr) <= 0) {
        showToast((t("errors.amount_positive") as string) || "Amount must be > 0");
        setSaving(false);
        return;
      }

      const curr = (currency.code || tx.currency_code || tx.currency || "").toUpperCase();

      if (tx.type === "expense") {
        const payerId = paidBy;
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
          currency_code: curr,
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
          currency_code: curr,
          date,
          comment: (comment || "").trim() || null,
          transfer_from: paidBy,
          transfer_to: [toUser],
        };
        await updateTransaction(tx.id, payload);
      }

      // ----- чек: если пользователь отметил удаление и НЕ выбрал новый файл — удаляем на бэке ----- //
      if (receipt.removeMarked && !receipt.stagedFile) {
        try {
          await deleteTransactionReceipt(tx.id);
        } catch {
          try { await setTransactionReceiptUrl(tx.id, ""); } catch {}
        } finally {
          receipt.setServerUrl(null);
          receipt.setServerPreviewUrl(null);
          receipt.unmarkDeleted();
        }
      }

      // ----- чек: если выбран локальный файл — грузим и сохраняем ссылку в транзакцию ----- //
      if (receipt.stagedFile) {
        try {
          const uploadedRaw: any = await uploadReceipt(receipt.stagedFile);
          const { url, previewUrl } = normalizeUploadReceiptResponse(uploadedRaw);
          if (url) {
            await setTransactionReceiptUrl(tx.id, url);
            receipt.setServerUrl(url);
            if (previewUrl) receipt.setServerPreviewUrl(previewUrl);
            receipt.clearAll();
            receipt.unmarkDeleted();
          }
        } catch {
          // не блокируем сохранение из-за фейла аплоада
        }
      }

      goBack();
    } catch (e) {
      const { code } = parseApiError(e);
      if (code === "tx_has_inactive_participants") {
        setInactiveDialogOpen(true);
      } else {
        setError(t("save_failed") || "Save failed");
        showToast((t("save_failed") as string) || "Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  // DELETE
  const doDelete = async () => {
    if (!tx) return;

    if (hasInactiveParticipants(tx, membersMap)) {
      setInactiveDialogOpen(true);
      return;
    }

    const yes = window.confirm(
      (t("tx_modal.delete_confirm") as string) ||
        "Удалить транзакцию? Это действие необратимо."
    );
    if (!yes) return;

    try {
      setSaving(true);
      await removeTransaction(tx.id);
      goBack();
    } catch (e: any) {
      const { code } = parseApiError(e);
      if (code === "tx_has_inactive_participants") {
        setInactiveDialogOpen(true);
      } else {
        setError(t("delete_failed") as string);
        showToast((t("delete_failed") as string) || "Delete failed");
      }
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
            style={{ color: "var(--tg-text-color)" }}
            className="px-3 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 w-full"
          >
            ← {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  // ПОЛНОЭКРАННАЯ МОДАЛКА: разделили фон и контент, чтобы убрать «двойной клик»
  return (
    <div className="fixed inset-0 z-[1000]">
      {/* фон-клик для закрытия */}
      <div
        className="absolute inset-0 bg-black/40"
        onMouseDown={goBack}
        onClick={goBack}
      />
      {/* контент — отдельным слоем; блокируем и mouseDown, и click от всплытия */}
      <div
        className="absolute inset-0 sm:inset-y-6 sm:inset-x-6 sm:rounded-2xl bg-[var(--tg-bg-color,#111)] shadow-2xl overflow-auto"
        onMouseDown={(e) => e.stopPropagation()}
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

        {/* Content */}
        <div className="p-3 flex flex-col gap-0.5 max-w-xl mx-auto">
          {/* Сумма + Чек (портретное превью) */}
          <div className="-mx-3">
            <CardSection className="py-0">
              <div className="px-3 pb-0">
                <div className="grid grid-cols-2 items-start gap-1 mt-0">
                  {/* левая половина: валюта + сумма */}
                  <div className="min-w-0 flex items-center gap-2">
                    {currency.code && (
                      <button
                        type="button"
                        onClick={() => setCurrencyModal(true)}
                        className="min-w-[52px] h-9 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center text-[12px] px-2"
                        title={currency.code || ""}
                      >
                        {currency.code}
                      </button>
                    )}
                    <input
                      inputMode="decimal"
                      placeholder={currency.decimals ? "0.00" : "0"}
                      value={amount}
                      onChange={(e) => setAmount(parseAmountInput(e.target.value, currency.decimals))}
                      onBlur={() => setAmount((prev) => toFixedSafe(prev, currency.decimals))}
                      className="w-full h-9 rounded-md bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] focus:border-[var(--tg-accent-color)] px-1 text-[17px]"
                    />
                  </div>

                  {/* правая половина: мини-виджет чека (ПОРТРЕТ, не квадрат) */}
                  <div className="min-w-0 flex items-start justify-end gap-2">
                    {/* превью-бокс (портрет 3:4) */}
                    <button
                      type="button"
                      className="relative shrink-0 -ml-1 w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden
                                 border border-[var(--tg-secondary-bg-color,#e7e7e7)]
                                 bg-[var(--tg-card-bg)] shadow-inner flex items-center justify-center"
                      onClick={() => (hasReceiptNow ? setPreviewOpen(true) : pickGallery())}
                      title={
                        hasReceiptNow
                          ? ((t("tx_modal.receipt_open_preview") as string) || "")
                          : ((t("tx_modal.receipt_attach") as string) || "")
                      }
                      aria-label={
                        hasReceiptNow
                          ? ((t("tx_modal.receipt_open_preview") as string) || "")
                          : ((t("tx_modal.receipt_attach") as string) || "")
                      }
                    >
                      {hasReceiptNow ? (
                        <img
                          src={receipt.displayUrl!}
                          alt={t("tx_modal.receipt_photo_alt") as string}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-[11px] leading-[1.05] text-[var(--tg-hint-color)] whitespace-pre-line text-center px-1 select-none">
                          {t("tx_modal.receipt_photo_label") as string}
                        </span>
                      )}
                    </button>

                    {/* кнопки справа от превью */}
                    {!hasReceiptNow ? (
                      <>
                        {/* Скрепка: файл (ТОЛЬКО image/*) */}
                        <button
                          type="button"
                          onClick={pickGallery}
                          className="px-2 h-9 rounded-md border border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-black/5 dark:hover:bg-white/5"
                          title={t("tx_modal.receipt_attach") as string}
                          aria-label={t("tx_modal.receipt_attach") as string}
                        >
                          <Paperclip size={16} />
                        </button>
                        {/* Камера: getUserMedia с фолбэком */}
                        <button
                          type="button"
                          onClick={takePhoto}
                          className="px-2 h-9 rounded-md border border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-black/5 dark:hover:bg-white/5"
                          title={(t("tx_modal.take_photo") as string) || "Сделать фото"}
                          aria-label={(t("tx_modal.take_photo") as string) || "Сделать фото"}
                        >
                          <Camera size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={onReplace}
                          className="px-2 h-9 rounded-md border border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-black/5 dark:hover:bg-white/5"
                          title={t("tx_modal.receipt_replace") as string}
                          aria-label={t("tx_modal.receipt_replace") as string}
                        >
                          <RefreshCcw size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={takePhoto}
                          className="px-2 h-9 rounded-md border border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-black/5 dark:hover:bg-white/5"
                          title={(t("tx_modal.take_photo") as string) || "Сделать фото"}
                          aria-label={(t("tx_modal.take_photo") as string) || "Сделать фото"}
                        >
                          <Camera size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={onRemove}
                          className="px-2 h-9 rounded-md border border-red-400/50 text-red-600 hover:bg-red-500/10"
                          title={t("tx_modal.receipt_remove") as string}
                          aria-label={t("tx_modal.receipt_remove") as string}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* подсказки под строкой: строго справа */}
                <div className="mt-1 text-right text-[12px] text-[var(--tg-hint-color)]">
                  {receiptHint}
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
                            <AvatarWithStatus
                              src={paidByAvatar}
                              size={16}
                              inactive={paidByInactive}
                              alt=""
                            />
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
                              setPaidByInactive(false);
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
                            <AvatarWithStatus
                              src={paidByAvatar}
                              alt=""
                              size={20}
                              inactive={paidByInactive}
                            />
                            <span className="truncate flex-1">
                              {t("tx_modal.paid_by_label")}:{" "}
                              {firstNameOnly(paidByName) || t("not_specified")}
                            </span>
                            <span className="shrink-0 opacity-80">
                              {fmtMoney(
                                amountNumber,
                                currency.decimals,
                                currency.code || "",
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
                              <AvatarWithStatus
                                src={(p as any).avatar_url || undefined}
                                alt=""
                                size={20}
                                inactive={!membersMap.has(Number(p.user_id))}
                              />
                              <span className="truncate flex-1">
                                {t("tx_modal.owes_label")}: {p.name}
                              </span>
                              <span className="shrink-0 opacity-80">
                                {fmtMoney(
                                  p.amount,
                                  currency.decimals,
                                  currency.code || "",
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
                      className="relative min-w-0 inline-flex items-center gap-2 pl-3 pr-7 py-1.5 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[13px] hover:bg-black/5 dark:hover:bg-white/10 transition max-w-full"
                    >
                      {paidBy ? (
                        <>
                          <span className="inline-flex items-center gap-1 min-w-0 truncate">
                            <AvatarWithStatus
                              src={paidByAvatar}
                              size={16}
                              inactive={paidByInactive}
                              alt=""
                            />
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
                              setPaidByInactive(false);
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
                            <AvatarWithStatus
                              src={toUserAvatar}
                              size={16}
                              inactive={toUserInactive}
                              alt=""
                            />
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
                              setToUserInactive(false);
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

              {/* Превью строки перевода + сумма с валютой */}
              {(paidBy || toUser) && amountNumber > 0 && (
                <div className="-mx-3">
                  <CardSection className="py-0">
                    <div className="px-3 pb-2 mt-1">
                      <div className="flex items-center gap-2 text-[13px]">
                        <span className="inline-flex items-center gap-1 min-w-0 truncate">
                          <AvatarWithStatus src={paidByAvatar} alt="" size={20} inactive={paidByInactive} />
                          <strong className="truncate">{paidBy ? (firstNameOnly(paidByName) || t("not_specified")) : (locale === "ru" ? "Отправитель" : locale === "es" ? "Remitente" : "From")}</strong>
                        </span>
                        <span className="opacity-60">→</span>
                        <span className="inline-flex items-center gap-1 min-w-0 truncate">
                          <AvatarWithStatus src={toUserAvatar} alt="" size={20} inactive={toUserInactive} />
                          <strong className="truncate">{toUser ? (firstNameOnly(toUserName) || t("not_specified")) : (locale === "ru" ? "Получатель" : locale === "es" ? "Receptor" : "To")}</strong>
                        </span>
                        <span className="ml-auto shrink-0 opacity-80">
                          {fmtMoney(
                            amountNumber,
                            currency.decimals,
                            currency.code || "",
                            locale
                          )}
                        </span>
                      </div>
                    </div>
                  </CardSection>
                </div>
              )}
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
                style={{ color: "var(--tg-text-color)" }}
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
            setPaidByInactive(false);
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
            setToUserInactive(false);
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
            let out: SplitSelection = sel;
            if (sel?.type === "equal") {
              const returned = sel.participants || [];
              if (returned.length <= 1) {
                const prev = splitData?.participants || [];
                let participants: any[] = [];
                if (prev.length > 0) {
                  participants = prev.map((p: any) => {
                    const m = membersMap.get(p.user_id);
                    const r = relatedMap.get(p.user_id);
                    return {
                      user_id: p.user_id,
                      name: p.name || firstNameOnly(nameFromMember(m) || r?.name || ""),
                      avatar_url: p.avatar_url || m?.photo_url || r?.avatar_url,
                    };
                  });
                } else if (membersMap.size > 0 || relatedMap.size > 0) {
                  const ids = new Set<number>();
                  for (const m of membersMap.values()) ids.add(m.id);
                  for (const uid of Array.from(collectInvolvedIds(tx))) ids.add(uid);
                  participants = Array.from(ids).map((uid) => {
                    const m = membersMap.get(uid);
                    const r = relatedMap.get(uid);
                    const name = m ? nameFromMember(m) : (r?.name || `#${uid}`);
                    const av = m?.photo_url || r?.avatar_url || undefined;
                    return {
                      user_id: uid,
                      name: firstNameOnly(name),
                      avatar_url: av,
                    };
                  });
                } else {
                  participants = returned;
                }
                out = { type: "equal", participants } as any;
              }
            }
            setSplitData(out);
            setSplitOpen(false);
          }}
        />

        {/* Выбор валюты */}
        <CurrencyPickerModal
          open={currencyModal && !!group?.id}
          onClose={() => setCurrencyModal(false)}
          selectedCode={(currency.code || (tx.currency_code ?? tx.currency) || "USD") as string}
          onSelect={(c: CurrencyItem) => {
            setCurrencyCode((c.code || "USD").toUpperCase());
            setCurrencyModal(false);
          }}
        />

        {/* === Блокирующая модалка про неактивных участников === */}
        {inactiveDialogOpen && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center" onClick={() => setInactiveDialogOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative w-full max-w-md mx-4 rounded-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-2xl p-4"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "var(--tg-text-color)" }}
            >
              <div className="text-[14px]">
                {t("cannot_edit_or_delete_inactive") as string}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInactiveDialogOpen(false)}
                  className="h-9 px-3 rounded-xl bg-[var(--tg-accent-color,#40A7E3)] text-white font-bold text-[14px]"
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === Центрированный тост === */}
        {toast.open && (
          <div className="fixed inset-0 z-[1300] pointer-events-none flex items-center justify-center">
            <div
              className="px-4 py-2.5 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] shadow-2xl text-[14px] font-medium"
              style={{ color: "var(--tg-text-color)" }}
            >
              {toast.message}
            </div>
          </div>
        )}

        {/* Preview modal for receipt (только картинка) */}
        <ReceiptPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          url={previewModalUrl ?? null}
        />

        {/* скрытый input для выбора файла чека (ТОЛЬКО изображение) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        {/* скрытый input для камеры: только фото, задняя камера (фолбэк) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onCameraChange}
        />

        {/* Оверлей камеры (getUserMedia) */}
        {camOpen && (
          <div className="fixed inset-0 z-[1400] bg-black/90 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2">
              <button
                type="button"
                onClick={cancelShot}
                className="px-3 py-1.5 rounded-md bg-white/10 text-white"
              >
                {t("cancel")}
              </button>
              <div className="text-white/80 text-sm">{camError || ""}</div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                style={{ maxWidth: "100vw", maxHeight: "80vh" }}
              />
            </div>
            <div className="p-3">
              <button
                type="button"
                onClick={confirmShot}
                className="w-full h-11 rounded-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition"
              >
                {(t("tx_modal.take_photo") as string) || "Сделать фото"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- локальный стиль (с защитой от повторной инъекции) --- */
const style =
  typeof document !== "undefined" && !document.getElementById("date-input-clean-style")
    ? document.createElement("style")
    : null;
if (style) {
  style.id = "date-input-clean-style";
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

/* ====================== Вспомогательные компоненты ====================== */
function AvatarWithStatus({
  src,
  size = 20,
  inactive,
  alt = "",
}: { src?: string; size?: number; inactive: boolean; alt?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`rounded-full object-cover ${inactive ? "grayscale opacity-70" : ""}`}
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className={`rounded-full inline-block ${inactive ? "grayscale opacity-70" : ""}`}
          style={{ width: size, height: size, background: "var(--tg-link-color)" }}
        />
      )}
      {inactive && (
        <UserX
          size={Math.max(12, Math.round(size * 0.7))}
          className="absolute"
          style={{ color: "#ef4444" }}
        />
      )}
    </span>
  );
}
