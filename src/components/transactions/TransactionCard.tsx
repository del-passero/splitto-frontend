// src/components/transactions/TransactionCard.tsx
import React, { useRef } from "react";
import { ArrowRightLeft } from "lucide-react";
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

type Props = {
  tx: any; // TransactionOut | LocalTx
  /** Справочник участников группы по ID (для имён/аватаров) */
  membersById?: MembersMap;
  /** Сколько всего участников в группе (чтобы уметь писать «ВСЕ») */
  groupMembersCount?: number;
  /** i18n t() — используем только уже существующие ключи */
  t?: (k: string, vars?: Record<string, any>) => string;
  /** Кастомный long-press обработчик (для action-sheet) */
  onLongPress?: (tx: any) => void;
  /** Режим «как список участников» (плоские строки без рамки) */
  listMode?: boolean;
};

/* ---------- utils ---------- */
const getFromMap = (m?: MembersMap, id?: number | null) => {
  if (!m || id == null) return undefined;
  if (m instanceof Map) return m.get(Number(id));
  return (m as Record<number, GroupMemberLike>)[Number(id)];
};

const firstName = (full?: string) => {
  const s = (full || "").trim();
  if (!s) return "";
  return s.split(/\s+/)[0] || s;
};

const ZERO_CCY_DEC = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (code?: string) => (code && ZERO_CCY_DEC.has(code) ? 0 : 2);

const fmtAmount = (n: number, code?: string) => {
  if (!isFinite(n)) n = 0;
  try {
    const decimals = decimalsByCode(code);
    const nf = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${nf.format(n)} ${code || ""}`.trim();
  } catch {
    return `${n.toFixed(decimalsByCode(code))} ${code || ""}`.trim();
  }
};

const fmtNumberOnly = (n: number) => {
  if (!isFinite(n)) n = 0;
  try {
    const nf = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return nf.format(n);
  } catch {
    return n.toFixed(2);
  }
};

/* ---------- date via locales ---------- */
const formatCardDate = (d: Date, t?: Props["t"]) => {
  try {
    const months = (t && (t("date_card.months") as unknown as string[])) || null;
    const pattern = (t && t("date_card.pattern")) || "{{day}} {{month}}";
    if (Array.isArray(months) && months.length === 12) {
      const day = d.getDate().toString();
      const month = months[d.getMonth()];
      return pattern.replace("{{day}}", day).replace("{{month}}", month);
    }
  } catch { /* ignore */ }
  try {
    return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
};

/* ---------- UI bits ---------- */
function CategoryAvatar({
  name,
  color,
  icon,
  dateStr,
}: {
  name?: string;
  color?: string | null;
  icon?: string;
  dateStr: string;
}) {
  const bg = typeof color === "string" && color.trim() ? color : "var(--tg-link-color)";
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div className="w-10 shrink-0 flex flex-col items-center">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
        style={{ background: bg }}
      >
        <span style={{ fontSize: 16 }} aria-hidden>
          {icon || ch}
        </span>
      </div>
      {/* ДАТА ПОД АВАТАРОМ */}
      <div className="mt-0.5 text-[11px] text-[var(--tg-hint-color)] leading-none text-center">
        {dateStr}
      </div>
    </div>
  );
}

function TransferAvatar({ dateStr }: { dateStr: string }) {
  return (
    <div className="w-10 shrink-0 flex flex-col items-center">
      <div
        className="w-10 h-10 rounded-xl border flex items-center justify-center"
        style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
      >
        <ArrowRightLeft size={18} className="opacity-80" />
      </div>
      {/* ДАТА ПОД АВАТАРОМ */}
      <div className="mt-0.5 text-[11px] text-[var(--tg-hint-color)] leading-none text-center">
        {dateStr}
      </div>
    </div>
  );
}

function RoundAvatar({
  src,
  alt,
  size = 18,
  className = "",
}: {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}) {
  return src ? (
    <img
      src={src}
      alt={alt || ""}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  ) : (
    <span
      className={`rounded-full inline-block ${className}`}
      style={{ width: size, height: size, background: "var(--tg-link-color)" }}
      aria-hidden
    />
  );
}

/* ---------- main ---------- */
export default function TransactionCard({
  tx,
  membersById,
  groupMembersCount, // не используем здесь
  t,
  onLongPress,
  listMode = false,
}: Props) {
  const isExpense = tx.type === "expense";
  const hasId = Number.isFinite(Number(tx?.id));
  const txId = hasId ? Number(tx.id) : undefined;

  // Тек. пользователь
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
  const dateStr = formatCardDate(dateObj, t);

  /* --- resolve people --- */
  const payerId: number | undefined = isExpense
    ? Number(tx.paid_by ?? tx.created_by ?? NaN)
    : Number(tx.transfer_from ?? tx.from_user_id ?? NaN);

  const payerMember = getFromMap(membersById, payerId);
  const payerName =
    firstName(tx.paid_by_name || tx.from_name) ||
    firstName(payerMember?.name) ||
    firstName(`${payerMember?.first_name ?? ""} ${payerMember?.last_name ?? ""}`.trim()) ||
    payerMember?.username ||
    (payerId != null ? `#${payerId}` : "");

  const payerAvatar =
    tx.paid_by_avatar || tx.from_avatar || payerMember?.avatar_url || payerMember?.photo_url;

  // recipient (transfer only)
  let toId: number | undefined = undefined;
  if (!isExpense) {
    const raw = tx.transfer_to ?? tx.to_user_id ?? tx.to;
    if (Array.isArray(raw) && raw.length > 0) toId = Number(raw[0]);
    else if (raw != null) toId = Number(raw);
  }
  const toMember = getFromMap(membersById, toId);
  const toName =
    firstName(tx.to_name) ||
    firstName(toMember?.name) ||
    firstName(`${toMember?.first_name ?? ""} ${toMember?.last_name ?? ""}`.trim()) ||
    toMember?.username ||
    (toId != null ? `#${toId}` : "");
  const toAvatar = tx.to_avatar || toMember?.avatar_url || toMember?.photo_url;

  // participants (expense only)
  const participantsFromShares: GroupMemberLike[] = Array.isArray(tx?.shares)
    ? (tx.shares as any[])
        .map((s: any) => getFromMap(membersById, Number(s?.user_id ?? s?.user?.id)))
        .filter(Boolean) as GroupMemberLike[]
    : [];
  const participantsExceptPayer = participantsFromShares.filter((m) => Number(m.id) !== Number(payerId));

  /* --- заголовок --- (1-я строка: Comment | Amount) */
  const title =
    (tx.comment && String(tx.comment).trim()) ||
    (isExpense && tx.category?.name ? String(tx.category.name) : "") ||
    "";

  /* --- статус участия (без символа валюты), использовать и для переводов --- */
  let statusText = "";
  if (typeof currentUserId === "number") {
    if (isExpense && Array.isArray(tx.shares)) {
      let myShare = 0;
      let payerShare = 0;
      for (const s of tx.shares as any[]) {
        const uid = Number(s?.user_id);
        const val = Number(s?.amount ?? 0);
        if (!Number.isFinite(val)) continue;
        if (uid === Number(currentUserId)) myShare += val;
        if (uid === Number(payerId)) payerShare += val;
      }
      const iAmPayer = Number(payerId) === Number(currentUserId);
      if (iAmPayer) {
        const lent = Math.max(0, amountNum - payerShare);
        statusText =
          lent > 0
            ? ((t && t("group_participant_owes_you", { sum: fmtNumberOnly(lent) })) ||
               `Вам должны: ${fmtNumberOnly(lent)}`)
            : ((t && t("group_participant_no_debt")) || "Нет долга");
      } else {
        statusText =
          myShare > 0
            ? ((t && t("group_participant_you_owe", { sum: fmtNumberOnly(myShare) })) ||
               `Вы должны: ${fmtNumberOnly(myShare)}`)
            : ((t && t("group_participant_no_debt")) || "Нет долга");
      }
    } else {
      // Для переводов: показываем статусную строку (минимум — «Нет долга»)
      statusText = (t && t("group_participant_no_debt")) || "Нет долга";
    }
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

  const wrapper = listMode
    ? "px-3 py-3"
    : "px-3 py-2 rounded-xl border bg-[var(--tg-card-bg)]";

  const wrapperStyle = listMode ? {} : { borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" };

  const Inner = (
    <div
      className={`relative ${wrapper} ${hasId ? "transition hover:bg-black/5 dark:hover:bg-white/5" : ""}`}
      style={wrapperStyle}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      onContextMenu={onContextMenu}
      role="button"
    >
      {/* 1 СТРОКА: Коммент/Категория | Сумма */}
      <div className="flex items-start gap-3">
        {isExpense ? (
          <CategoryAvatar
            name={tx.category?.name}
            color={tx.category?.color}
            icon={tx.category?.icon}
            dateStr={dateStr}
          />
        ) : (
          <TransferAvatar dateStr={dateStr} />
        )}

        {/* центр: заголовок */}
        <div className="min-w-0 flex-1">
          {title ? (
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">
              {title}
            </div>
          ) : null}
        </div>

        {/* справа: сумма */}
        <div className="text-[14px] font-semibold shrink-0">
          {fmtAmount(amountNum, tx.currency)}
        </div>
      </div>

      {/* 2 СТРОКА: Paid by / A→B  |  (справа) участники */}
      <div className="mt-1 ml-12 flex items-center justify-between min-w-0">
        {isExpense ? (
          <div className="flex flex-wrap items-center gap-2 text-[12px] min-w-0">
            <span className="opacity-70 text-[var(--tg-hint-color)]">
              {(t && t("tx_modal.paid_by_label")) || "Заплатил"}
            </span>
            <RoundAvatar src={payerAvatar} alt={payerName} />
            <span className="text-[var(--tg-text-color)] font-medium truncate">
              {payerName}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--tg-text-color)] min-w-0">
            <RoundAvatar src={payerAvatar} alt={payerName} />
            <span className="font-medium truncate">{payerName}</span>
            <span className="opacity-60">→</span>
            <RoundAvatar src={toAvatar} alt={toName} />
            <span className="font-medium truncate">{toName}</span>
          </div>
        )}

        {/* справа: аватары участников (без плательщика) */}
        {isExpense ? (
          <div className="shrink-0 flex items-center justify-end -space-x-2">
            {participantsExceptPayer.slice(0, 16).map((m, i) => {
              const url = m.photo_url || m.avatar_url;
              return url ? (
                <img
                  key={m.id}
                  src={url}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border border-[var(--tg-card-bg)]"
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                  loading="lazy"
                />
              ) : (
                <span
                  key={m.id}
                  className="w-5 h-5 rounded-full bg-[var(--tg-link-color)] inline-block border border-[var(--tg-card-bg)]"
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                  aria-hidden
                />
              );
            })}
          </div>
        ) : (
          <div className="shrink-0" />
        )}
      </div>

      {/* 3 СТРОКА: слева — ДАТА уже под аватаром; справа — ИНФО О ДОЛГЕ */}
      <div className="mt-1 ml-12 flex items-center justify-end">
        <div className="text-[12px] text-[var(--tg-hint-color)] truncate">
          {statusText}
        </div>
      </div>
    </div>
  );

  return hasId ? (
    <Link
      to={`/transactions/${txId}`}
      className="block focus:outline-none focus:ring-2 focus:ring-[var(--tg-accent-color,#40A7E3)] rounded-xl"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onContextMenu={onContextMenu}
    >
      {Inner}
    </Link>
  ) : (
    Inner
  );
}
