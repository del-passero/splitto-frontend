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
  membersById?: MembersMap;
  groupMembersCount?: number;
  t?: (k: string, vars?: Record<string, any>) => string;
  onLongPress?: (tx: any) => void;
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

const formatCardDate = (d: Date, t?: Props["t"]) => {
  try {
    const months = (t && (t("date_card.months") as unknown as string[])) || null;
    const pattern = (t && t("date_card.pattern")) || "{{day}} {{month}}";
    if (Array.isArray(months) && months.length === 12) {
      const day = d.getDate().toString();
      const month = months[d.getMonth()];
      return pattern.replace("{{day}}", day).replace("{{month}}", month);
    }
  } catch {}
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
}: { name?: string; color?: string | null; icon?: string }) {
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

function TransferAvatar() {
  return (
    <div
      className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
      aria-hidden
    >
      <ArrowRightLeft size={18} className="opacity-80" />
    </div>
  );
}

function RoundAvatar({
  src,
  alt,
  size = 18,
  className = "",
}: { src?: string; alt?: string; size?: number; className?: string }) {
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
  t,
  onLongPress,
}: Props) {
  const isExpense = tx.type === "expense";
  const hasId = Number.isFinite(Number(tx?.id));
  const txId = hasId ? Number(tx.id) : undefined;

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

  // заголовок
  const title =
    isExpense
      ? (tx.comment && String(tx.comment).trim()) ||
        (tx.category?.name ? String(tx.category.name) : "—")
      : (tx.comment && String(tx.comment).trim()) || "";

  /* --- строка долга --- */
  let statusText = "";
  if (isExpense && typeof currentUserId === "number" && Array.isArray(tx.shares)) {
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
    statusText = (t && t("group_participant_no_debt")) || "Нет долга";
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
  const CardInner = (
    <div
      className={`relative px-3 py-1.5 rounded-xl border bg-[var(--tg-card-bg)] ${hasId ? "transition hover:bg-black/5 dark:hover:bg-white/5" : ""}`}
      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      onContextMenu={onContextMenu}
      role="button"
    >
      <div className="grid grid-cols-[40px,1fr,1fr,auto] grid-rows-[auto,auto,auto] gap-x-3 gap-y-1 items-start">
        {/* Row1 / Col1 — DATE */}
        <div className="col-start-1 row-start-1 text-center">
          <div className="text-[11px] text-[var(--tg-hint-color)] leading-none">{dateStr}</div>
        </div>

        {/* Row1 / Col2-3 — TITLE */}
        <div className="col-start-2 col-end-4 row-start-1 min-w-0">
          {title ? (
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">
              {title}
            </div>
          ) : null}
        </div>

        {/* Row1 / Col4 — AMOUNT (только для расхода) */}
        <div className="col-start-4 row-start-1">
          {isExpense && (
            <div className="text-[14px] font-semibold">{fmtAmount(amountNum, tx.currency)}</div>
          )}
        </div>

        {/* Row2-3 / Col1 — LEFT ICON spans 2 rows */}
        <div className="col-start-1 row-start-2 row-span-2">
          {isExpense ? (
            <CategoryAvatar
              name={tx.category?.name}
              color={tx.category?.color}
              icon={tx.category?.icon}
            />
          ) : (
            <TransferAvatar />
          )}
        </div>

        {/* Row2 / Col2-3 — EXPENSE: Paid by  | TRANSFER: A → B */}
        <div className="col-start-2 col-end-4 row-start-2 min-w-0">
          {isExpense ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0">
                {(t && t("tx_modal.paid_by_label")) || "Заплатил"}:
              </span>
              <RoundAvatar src={payerAvatar} alt={payerName} />
              <span className="text-[12px] text-[var(--tg-text-color)] font-medium truncate">
                {payerName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[12px] text-[var(--tg-text-color)]">
              <RoundAvatar src={payerAvatar} alt={payerName} />
              <span className="font-medium truncate">{payerName}</span>
              <span className="opacity-60">→</span>
              <RoundAvatar src={toAvatar} alt={toName} />
              <span className="font-medium truncate">{toName}</span>
            </div>
          )}
        </div>

        {/* Row2 / Col4 — EXPENSE: STACK | TRANSFER: пусто */}
        <div className="col-start-4 row-start-2 justify-self-end">
          {isExpense ? (
            <div className="shrink-0 flex items-center justify-end -space-x-2">
              {participantsExceptPayer.slice(0, 16).map((m, i) => {
                const url = (m as any).photo_url || (m as any).avatar_url;
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
          ) : null}
        </div>

        {/* Row3 / Col2-4 — STATUS / DEBT */}
        <div className="col-start-2 col-end-5 row-start-3 min-w-0">
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{statusText}</div>
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
      {CardInner}
    </Link>
  ) : (
    CardInner
  );
}
