// src/components/transactions/TransactionCard.tsx
import React, { useRef } from "react";
import { ArrowRightLeft, UserX, FileText, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../../store/userStore";

/** Короткая инфа о пользователе в группе */
export type GroupMemberLike = {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  photo_url?: string;
};

type MembersMap = Record<number, GroupMemberLike> | Map<number, GroupMemberLike>;

/** Мап категорий по id — для безопасного резолва имени */
type CategoryLike = {
  id: number;
  name?: string | null;
  title?: string | null;
  label?: string | null;
  key?: string | null;
  slug?: string | null;
  code?: string | null;
  icon?: string | null;
  color?: string | null;
};
type CategoriesMap = Record<number, CategoryLike> | Map<number, CategoryLike>;

type Props = {
  tx: any; // TransactionOut | LocalTx
  membersById?: MembersMap;
  groupMembersCount?: number;
  t?: (k: string, vars?: Record<string, any>) => string | string[];
  onLongPress?: (tx: any) => void;

  /** Опционально: словарь категорий по id (если бек отдал только category_id) */
  categoriesById?: CategoriesMap;
};

/* ---------- utils ---------- */
const getFromMap = (m?: MembersMap, id?: number | null) => {
  if (!m || id == null) return undefined;
  if (m instanceof Map) return m.get(Number(id));
  return (m as Record<number, GroupMemberLike>)[Number(id)];
};

/** универсальный геттер из CategoriesMap */
const getCategoryFromMap = (m?: CategoriesMap, id?: number | null): CategoryLike | undefined => {
  if (!m || id == null) return undefined;
  if (m instanceof Map) return m.get(Number(id));
  return (m as Record<number, CategoryLike>)[Number(id)];
};

const firstName = (full?: string) => {
  const s = (full || "").trim();
  if (!s) return "";
  return s.split(/\s+/)[0] || s;
};

const ZERO_CCY_DEC = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (code?: string) => (code && ZERO_CCY_DEC.has(code) ? 0 : 2);

/** Формат: без копеек, если дробная часть нулевая; иначе ровно 2 (или по валюте) знака */
const fmtAmount = (n: number, code?: string) => {
  if (!isFinite(n)) n = 0;
  const decimals = decimalsByCode(code);
  const abs = Math.abs(n);
  const pow = Math.pow(10, decimals);
  const fracInt = decimals > 0 ? Math.round(abs * pow) % pow : 0;
  const showDecimals = decimals > 0 && fracInt !== 0;

  try {
    const nf = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: showDecimals ? decimals : 0,
      maximumFractionDigits: showDecimals ? decimals : 0,
    });
    return `${nf.format(abs)} ${code || ""}`.trim();
  } catch {
    return showDecimals
      ? `${abs.toFixed(decimals)} ${code || ""}`.trim()
      : `${Math.round(abs)} ${code || ""}`.trim();
  }
};

const formatCardDate = (d: Date, t?: Props["t"]) => {
  try {
    // i18next: получить массив через returnObjects
    const monthsRaw =
      t && (t("date_card.months", { returnObjects: true } as any) as unknown);
    const months = Array.isArray(monthsRaw) ? (monthsRaw as string[]) : null;

    let patternStr = "{{day}} {{month}}";
    try {
      const maybe = t && t("date_card.pattern");
      if (typeof maybe === "string" && maybe.trim() && maybe !== "date_card.pattern") {
        patternStr = maybe;
      }
    } catch { /* ignore */ }

    if (months && months.length === 12) {
      const day = d.getDate().toString();
      const month = months[d.getMonth()];
      return patternStr.replace("{{day}}", day).replace("{{month}}", month);
    }
  } catch { /* ignore */ }

  // Фолбэк: системная локаль, короткий месяц
  try {
    return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
};

/** Мягкая обрезка по графемам (учёт кириллицы/эмодзи) */
function truncateGraphemes(input: string, max = 12): string {
  const s = String(input || "");
  if (!s) return s;
  try {
    // @ts-ignore
    const seg = new (Intl as any).Segmenter(undefined, { granularity: "grapheme" });
    const iter = seg.segment(s)[Symbol.iterator]();
    let out = "", count = 0, cur = iter.next();
    while (!cur.done && count < max) {
      out += cur.value.segment;
      count++;
      cur = iter.next();
    }
    if (!cur.done) out += "…";
    return out;
  } catch {
    return s.length > max ? s.slice(0, max) + "…" : s;
  }
}

/** Middle-ellipsis обрезка для длинных имён (Alex…nder) */
function truncateMiddleGraphemes(input: string, max = 32): string {
  const s = String(input || "");
  if (!s) return s;
  try {
    // @ts-ignore
    const seg = new (Intl as any).Segmenter(undefined, { granularity: "grapheme" });
    const arr = [...seg.segment(s)].map(x => x.segment);
    if (arr.length <= max) return s;
    const head = Math.ceil((max - 1) * 0.6);
    const tail = (max - 1) - head;
    return arr.slice(0, head).join("") + "…" + arr.slice(-tail).join("");
  } catch {
    if (s.length <= max) return s;
    const head = Math.ceil((max - 1) * 0.6);
    const tail = (max - 1) - head;
    return s.slice(0, head) + "…" + s.slice(-tail);
  }
}

/** Подсчёт графем для адаптивной раскладки */
function countGraphemes(input?: string): number {
  const s = String(input || "");
  if (!s) return 0;
  try {
    // @ts-ignore
    const seg = new (Intl as any).Segmenter(undefined, { granularity: "grapheme" });
    let n = 0;
    for (const _ of seg.segment(s)) n++;
    return n || s.length;
  } catch {
    return s.length;
  }
}
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/** Нормализатор отображаемого имени (для расходов) */
function displayName(raw?: string, max = 12): string {
  const base = (raw || "").trim();
  if (!base) return "";
  return truncateGraphemes(base, max);
}

/** Резолвер имени/иконки/цвета категории: объект → словарь → плоские поля → "Категория #id" */
function resolveCategory(
  tx: any,
  categoriesById?: CategoriesMap,
  _t?: Props["t"]
): { id?: number; name: string; icon?: string | null; color?: string | null } {
  const catObj: CategoryLike | undefined = tx?.category || undefined;

  const catId: number | undefined = Number.isFinite(Number(tx?.category_id))
    ? Number(tx.category_id)
    : Number.isFinite(Number(catObj?.id))
      ? Number(catObj?.id)
      : undefined;

  const nameFromObj =
    (catObj?.name ?? catObj?.title ?? catObj?.label ?? "")?.toString().trim() || "";

  const fromMap = getCategoryFromMap(categoriesById, catId);
  const nameFromMap =
    (fromMap?.name ?? fromMap?.title ?? fromMap?.label ?? "")?.toString().trim() || "";

  const flatName =
    (tx?.category_name ?? tx?.categoryTitle ?? tx?.category_label ?? "")?.toString().trim() || "";

  let name = nameFromObj || nameFromMap || flatName;

  if (!name) name = catId != null ? `Категория #${catId}` : "Категория";

  return {
    id: catId,
    name,
    icon: (catObj?.icon ?? fromMap?.icon) || null,
    color: (catObj?.color ?? fromMap?.color) || null,
  };
}

/** Пытаемся понять: есть ли прикреплённый чек и PDF он или нет */
function pickReceipt(tx: any): { has: boolean; isPdf: boolean } {
  try {
    const url: string | undefined =
      (typeof tx?.receipt_url === "string" && tx.receipt_url) ||
      (typeof tx?.receipt?.url === "string" && tx.receipt.url) ||
      (typeof tx?.receiptUrl === "string" && tx.receiptUrl) ||
      undefined;

    const mime: string | undefined =
      (typeof tx?.receipt_mime === "string" && tx.receipt_mime) ||
      (typeof tx?.receipt?.mime === "string" && tx.receipt.mime) ||
      (typeof tx?.receipt?.mime_type === "string" && tx.receipt.mime_type) ||
      undefined;

    // attachments/files — ищем явный "receipt"
    const files = Array.isArray(tx?.files) ? tx.files
      : Array.isArray(tx?.attachments) ? tx.attachments
      : [];

    const fileCandidate = files.find((f: any) => {
      const kind = String(f?.kind || "").toLowerCase();
      const m = String(f?.mime || f?.mime_type || "").toLowerCase();
      const u = String(f?.url || f?.href || "");
      return (
        kind.includes("receipt") ||
        u.includes("/media/receipts/") ||
        m.startsWith("image/") ||
        m.includes("pdf")
      );
    });

    const anyUrl = url || String(fileCandidate?.url || fileCandidate?.href || "");
    const anyMime = (mime || fileCandidate?.mime || fileCandidate?.mime_type || "").toLowerCase();

    const has =
      Boolean(anyUrl) ||
      Boolean(anyMime) ||
      Boolean(tx?.receipt_attached) ||
      Boolean(fileCandidate);

    if (!has) return { has: false, isPdf: false };

    const isPdf =
      anyMime.includes("pdf") ||
      /\.pdf(?:$|\?)/i.test(anyUrl);

    return { has: true, isPdf };
  } catch {
    return { has: false, isPdf: false };
  }
}

/* ---------- UI bits ---------- */
function CategoryAvatar({
  name,
  color,
  icon,
}: {
  name?: string;
  color?: string | null;
  icon?: string | null;
}) {
  const bg = typeof color === "string" && color.trim() ? color : "var(--tg-link-color)";
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
      style={{ background: bg }}
      aria-hidden
    >
      <span style={{ fontSize: 16 }}>{icon || ch}</span>
    </div>
  );
}

/** Прямоугольный аватар для перевода: 40×20, мягкое скругление */
function TransferAvatar() {
  return (
    <div
      className="w-10 h-5 rounded-md border flex items-center justify-center shrink-0"
      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
      aria-hidden
    >
      <ArrowRightLeft size={16} className="opacity-80" />
    </div>
  );
}

function RoundAvatar({
  src,
  alt,
  size = 18,
  className = "",
  inactive = false, // ДОБАВЛЕНО: вышел/удалён из группы
}: {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
  inactive?: boolean;
}) {
  const dim = { width: size, height: size };
  return (
    <span className={`relative inline-flex ${className}`} style={dim} aria-label={alt || ""}>
      {src ? (
        <img
          src={src}
          alt={alt || ""}
          className={`rounded-full object-cover ${inactive ? "grayscale" : ""}`}
          style={{ ...dim, opacity: inactive ? 0.7 : 1 }}
          loading="lazy"
        />
      ) : (
        <span
          className={`rounded-full inline-block ${inactive ? "grayscale" : ""}`}
          style={{ ...dim, background: "var(--tg-link-color)", opacity: inactive ? 0.7 : 1 }}
          aria-hidden
        />
      )}
      {inactive && (
        <span className="absolute -right-0.5 -bottom-0.5 rounded-full bg-[var(--tg-card-bg)] p-[1px]">
          <UserX className="w-3 h-3 text-red-500" />
        </span>
      )}
    </span>
  );
}

/* ---------- main ---------- */
export default function TransactionCard({
  tx,
  membersById,
  t,
  onLongPress,
  categoriesById, // опционально
}: Props) {
  const isExpense = tx.type === "expense";
  const hasId = Number.isFinite(Number(tx?.id));
  const txId = hasId ? Number(tx.id) : undefined;

  // Мап из related_users для фолбэков (вышедшие)
  const related: any[] = Array.isArray(tx?.related_users) ? tx.related_users : [];
  const relatedById = new Map<number, any>(related.map((u: any) => [Number(u?.id), u]));

  // Сет вышедших: те, кого нет в membersById, но кто есть среди related_users
  const inactiveIds = new Set<number>(
    related
      .map((u: any) => Number(u?.id))
      .filter((id) => Number.isFinite(id) && !getFromMap(membersById, id))
  );

  const isInactive = (uid?: number | null) => {
    if (!Number.isFinite(Number(uid))) return false;
    return inactiveIds.has(Number(uid));
  };

  const storeUserId = useUserStore((s: any) => s.user?.id) as number | undefined;
  const currentUserId =
    typeof storeUserId === "number"
      ? storeUserId
      : (() => {
          try {
            const id = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
            return Number.isFinite(Number(id)) ? Number(id) : undefined;
          } catch {
            return undefined;
          }
        })();

  const amountNum = Number(tx.amount ?? 0);
  const dateObj = new Date(tx.date || tx.created_at || Date.now());

  // расходим дату: год — отдельной строкой, ниже компактный день+месяц
  const yearStr = String(dateObj.getFullYear());
  const dayMonthStr = formatCardDate(dateObj, t);

  /* --- resolve people --- */
  const payerId: number | undefined = isExpense
    ? Number(tx.paid_by ?? tx.created_by ?? NaN)
    : Number(tx.transfer_from ?? tx.from_user_id ?? NaN);

  const payerMember = getFromMap(membersById, payerId);
  const payerRelated = Number.isFinite(Number(payerId)) ? relatedById.get(Number(payerId)) : undefined;

  const payerNameFull =
    firstName(tx.paid_by_name || tx.from_name) ||
    firstName(payerMember?.name) ||
    firstName(`${payerMember?.first_name ?? ""} ${payerMember?.last_name ?? ""}`.trim()) ||
    payerMember?.username ||
    firstName(
      `${payerRelated?.first_name ?? ""} ${payerRelated?.last_name ?? ""}`.trim() ||
      payerRelated?.name ||
      payerRelated?.username ||
      ""
    ) ||
    (payerId != null ? `#${payerId}` : "");
  const payerNameDisplayExpense = truncateGraphemes(payerNameFull, 14);
  const payerNameDisplayTransfer = truncateMiddleGraphemes(payerNameFull, 32);

  const payerAvatar =
    tx.paid_by_avatar ||
    tx.from_avatar ||
    payerMember?.avatar_url ||
    payerMember?.photo_url ||
    payerRelated?.avatar_url ||
    payerRelated?.photo_url;

  // recipient (transfer only)
  let toId: number | undefined = undefined;
  if (!isExpense) {
    const raw = tx.transfer_to ?? tx.to_user_id ?? tx.to;
    if (Array.isArray(raw) && raw.length > 0) toId = Number(raw[0]);
    else if (raw != null) toId = Number(raw);
  }
  const toMember = getFromMap(membersById, toId);
  const toRelated = Number.isFinite(Number(toId)) ? relatedById.get(Number(toId)) : undefined;
  const toNameFull =
    firstName(tx.to_name) ||
    firstName(toMember?.name) ||
    firstName(`${toMember?.first_name ?? ""} ${toMember?.last_name ?? ""}`.trim()) ||
    toMember?.username ||
    firstName(
      `${toRelated?.first_name ?? ""} ${toRelated?.last_name ?? ""}`.trim() ||
      toRelated?.name ||
      toRelated?.username ||
      ""
    ) ||
    (toId != null ? `#${toId}` : "");
  const toNameDisplayTransfer = truncateMiddleGraphemes(toNameFull, 32);
  const toAvatar =
    tx.to_avatar ||
    toMember?.avatar_url ||
    toMember?.photo_url ||
    toRelated?.avatar_url ||
    toRelated?.photo_url;

  // participants (expense only) — учитываем вышедших через related_users
  const participantsFromShares: GroupMemberLike[] = Array.isArray(tx?.shares)
    ? (tx.shares as any[]).map((s: any) => {
        const uid = Number(s?.user_id ?? s?.user?.id);
        const m = getFromMap(membersById, uid);
        if (m) return m;
        const r = relatedById.get(uid);
        if (!r) return undefined;
        const name =
          r.name ||
          `${(r.first_name || "").trim()} ${(r.last_name || "").trim()}`.trim() ||
          r.username ||
          `#${uid}`;
        return {
          id: uid,
          name,
          first_name: r.first_name,
          last_name: r.last_name,
          username: r.username,
          avatar_url: r.avatar_url || r.photo_url,
          photo_url: r.photo_url || r.avatar_url,
        } as GroupMemberLike;
      }).filter(Boolean) as GroupMemberLike[]
    : [];
  const participantsExceptPayer = participantsFromShares.filter((m) => Number(m.id) !== Number(payerId));

  // ---------- CATEGORY ----------
  const resolvedCategory = resolveCategory(tx, categoriesById, t);
  const categoryName = resolvedCategory.name;

  // ---------- TITLE ----------
  const rawComment = String(tx.comment ?? "").trim();
  const isCommentEmpty = rawComment === "" || rawComment === "-" || rawComment === "—";

  const title = isExpense
    ? (isCommentEmpty ? categoryName : rawComment) || categoryName || ""
    : rawComment || (t && (t("tx_modal.transfer") as string)) || "Transfer";

  /* --- строка долга (Row3/Col2-4) --- */
  let statusText = "";
  if (isExpense && typeof currentUserId === "number" && Array.isArray(tx.shares)) {
    let myShare = 0;
    let payerShare = 0;
    let iParticipate = Number(payerId) === Number(currentUserId); // плательщик — всегда участник
    for (const s of (tx.shares as any[])) {
      const uid = Number(s?.user_id);
      const val = Number(s?.amount ?? 0);
      if (!Number.isFinite(val)) continue;
      if (uid === Number(currentUserId)) {
        myShare += val;
        iParticipate = true; // есть запись о моём участии
      }
      if (uid === Number(payerId)) payerShare += val;
    }

    // если я не участвовал — отдельный статус
    if (!iParticipate) {
      statusText =
        (t && (t("tx_card.not_participant_expense") as string)) ||
        "Вы не участник этой траты";
    } else {
      const iAmPayer = Number(payerId) === Number(currentUserId);
      if (iAmPayer) {
        const lent = Math.max(0, amountNum - payerShare);
        statusText =
          lent > 0
            ? ((t && (t("group_participant_owes_you", { sum: fmtAmount(lent, tx.currency_code) }) as string)) ||
              `Вам должны: ${fmtAmount(lent, tx.currency_code)}`)
            : ((t && (t("group_participant_no_debt") as string)) || "Нет долга");
      } else {
        statusText =
          myShare > 0
            ? ((t && (t("group_participant_you_owe", { sum: fmtAmount(myShare, tx.currency_code) }) as string)) ||
              `Вы должны: ${fmtAmount(myShare, tx.currency_code)}`)
            : ((t && (t("group_participant_no_debt") as string)) || "Нет долга");
      }
    }
  } else if (!isExpense) {
    // Для переводов статус долга не отображаем (см. требования)
    statusText = "";
  } else {
    statusText = (t && (t("group_participant_no_debt") as string)) || "Нет долга";
  }

  /* ---------- long press handling ---------- */
  const longPressTimer = useRef<number | null>(null);
  const didLongPress = useRef(false);
  const onPointerDown = () => {
    didLongPress.current = false;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      didLongPress.current = true;
      onLongPress?.(tx);
    }, 420);
  };
  const cancelPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  const onPointerUp = () => cancelPress();
  const onPointerLeave = () => cancelPress();
  const onClick = (e: React.MouseEvent) => {
    if (didLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onContextMenu = (e: React.MouseEvent) => e.preventDefault();

  /* ---------- layout (GRID 4 колонки) ---------- */
  const gridRowsClass = isExpense ? "grid-rows-[auto,auto,auto]" : "grid-rows-[auto,auto]";

  // компактные вертикальные отступы; для переводов ещё компактнее
  const cardPaddingY = isExpense ? "pt-[6px] pb-[2px]" : "pt-[4px] pb-[1px]";

  const { has: hasReceipt, isPdf: isReceiptPdf } = pickReceipt(tx);

  const CardInner = (
    <div
      className={`relative ${cardPaddingY} px-1 ${hasId ? "transition hover:bg-[color:var(--tg-secondary-bg-color,#8a8a8f)]/10" : ""}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      onContextMenu={onContextMenu}
      role="button"
      style={{ color: "var(--tg-text-color)" }}
    >
      <div className={`grid grid-cols-[40px,1fr,1fr,max-content] ${gridRowsClass} gap-x-3 gap-y-0 items-start`}>
        {/* Row1 / Col1 — YEAR */}
        <div className="col-start-1 row-start-1 self-center text-center">
          <div className="text-[11px] text-[var(--tg-hint-color)] leading-none">{yearStr}</div>
        </div>

        {/* Row1 / Col2-3 — TITLE */}
        <div className="col-start-2 col-end-4 row-start-1 min-w-0">
          {title ? (
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate" title={title}>
              {title}
            </div>
          ) : null}
        </div>

        {/* Row1 / Col4 — AMOUNT (+ receipt icon) */}
        <div className="col-start-4 row-start-1 justify-self-end">
          <div className="inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--tg-text-color)] whitespace-nowrap text-right">
            {hasReceipt ? (
              <span
                className="inline-flex items-center"
                title={
                  (t && (t(isReceiptPdf ? "receipt.attached_pdf" : "receipt.attached") as string)) ||
                  (isReceiptPdf ? "Прикреплён чек (PDF)" : "Прикреплён чек")
                }
              >
                {isReceiptPdf ? (
                  <FileText
                    className="opacity-80 shrink-0"
                    size={16}
                    aria-label={(t && (t("receipt.attached_pdf") as string)) || "Прикреплён чек (PDF)"}
                  />
                ) : (
                  <ReceiptText
                    className="opacity-80 shrink-0"
                    size={16}
                    aria-label={(t && (t("receipt.attached") as string)) || "Прикреплён чек"}
                  />
                )}
              </span>
            ) : null}
            <span>{fmtAmount(amountNum, tx.currency_code)}</span>
          </div>
        </div>

        {/* Row2-3 / Col1 — ИКОНКА + ДЕНЬ-МЕСЯЦ */}
        <div className={`col-start-1 row-start-2 ${isExpense ? "row-span-2" : "row-span-1"} -mt-1`}>
          <div className="flex flex-col items-center">
            {isExpense ? (
              <CategoryAvatar
                name={categoryName}
                color={resolvedCategory.color}
                icon={resolvedCategory.icon}
              />
            ) : (
              <TransferAvatar />
            )}
            <div className="mt-0.5 text-[10px] leading-none text-[var(--tg-hint-color)] whitespace-nowrap">
              {dayMonthStr}
            </div>
          </div>
        </div>

        {/* Row2 — PAID BY / A→B */}
        <div className={`col-start-2 ${isExpense ? "col-end-4" : "col-end-5"} row-start-2 min-w-0 self-center`}>
          {isExpense ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0">
                {(t && (t("tx_modal.paid_by_label") as string)) || "Заплатил"}:
              </span>
              <RoundAvatar src={payerAvatar} alt={payerNameFull} inactive={isInactive(payerId)} />
              <span
                className="text-[12px] text-[var(--tg-text-color)] font-medium truncate"
                title={payerNameFull}
              >
                {truncateGraphemes(payerNameFull, 14)}
              </span>
            </div>
          ) : (
            // трансфер: прижимаем влево и распределяем ширину имён поровну
            <div className="min-w-0 flex items-center gap-2 text-[12px] text-[var(--tg-text-color)]">
              <div className="min-w-0 flex items-center gap-2 flex-[1_1_0%]">
                <RoundAvatar src={payerAvatar} alt={payerNameFull} size={18} inactive={isInactive(payerId)} />
                <span className="font-medium truncate" title={payerNameFull}>
                  {payerNameDisplayTransfer}
                </span>
              </div>
              <div className="shrink-0 opacity-60 px-1">→</div>
              <div className="min-w-0 flex items-center gap-2 flex-[1_1_0%]">
                <RoundAvatar src={toAvatar} alt={toNameFull} size={18} inactive={isInactive(toId)} />
                <span className="font-medium truncate" title={toNameFull}>
                  {toNameDisplayTransfer}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Row2 / Col4 — "& " + STACK (только для расходов) */}
        <div className="col-start-4 row-start-2 justify-self-end self-center">
          {isExpense && participantsExceptPayer.length > 0 ? (
            <div className="flex items-center">
              <span className="mr-1 select-none text-[12px] text-[var(--tg-text-color)] font-medium">
                &nbsp;&amp;&nbsp;
              </span>
              <div className="shrink-0 flex items-center justify-end -space-x-2">
                {participantsExceptPayer.slice(0, 16).map((m, i) => {
                  const url = (m as any).photo_url || (m as any).avatar_url;
                  const inactive = isInactive(m.id);
                  return (
                    <span
                      key={m.id}
                      className="relative inline-flex border border-[var(--tg-card-bg)] rounded-full"
                      style={{ marginLeft: i === 0 ? 0 : -8 }}
                    >
                      {url ? (
                        <img
                          src={url}
                          alt=""
                          className={`w-5 h-5 rounded-full object-cover ${inactive ? "grayscale" : ""}`}
                          style={{ opacity: inactive ? 0.7 : 1 }}
                          loading="lazy"
                        />
                      ) : (
                        <span
                          className={`w-5 h-5 rounded-full inline-block bg-[var(--tg-link-color)] ${inactive ? "grayscale" : ""}`}
                          style={{ opacity: inactive ? 0.7 : 1 }}
                          aria-hidden
                        />
                      )}
                      {inactive && (
                        <span className="absolute -right-0.5 -bottom-0.5 rounded-full bg-[var(--tg-card-bg)] p-[1px]">
                          <UserX className="w-2.5 h-2.5 text-red-500" />
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Row3 / Col2-4 — STATUS / DEBT (только для расходов) */}
        {isExpense && (
          <div className="col-start-2 col-end-5 row-start-3 min-w-0">
            <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{statusText}</div>
          </div>
        )}
      </div>
    </div>
  );

  return hasId ? (
    <Link
      to={`/transactions/${txId}`}
      className="block focus:outline-none focus:ring-2 focus:ring-[var(--tg-accent-color,#40A7E3)] rounded-none"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onContextMenu={onContextMenu}
      style={{ color: "inherit" }} /* ссылка наследует цвет */
    >
      {CardInner}
    </Link>
  ) : (
    CardInner
  );
}
