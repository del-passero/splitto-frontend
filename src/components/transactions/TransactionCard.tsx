// src/components/transactions/TransactionCard.tsx
import React, { useMemo } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Link } from "react-router-dom";

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
  currentUserId?: number;
  className?: string;
};

/* ---------- utils ---------- */

const getFromMap = (m?: MembersMap, id?: number | null) => {
  if (!m || id == null) return undefined;
  if (m instanceof Map) return m.get(Number(id));
  return (m as Record<number, GroupMemberLike>)[Number(id)];
};

const trim = (s?: string | null) => (typeof s === "string" ? s.trim() : "");
const firstName = (full?: string) => {
  const s = trim(full);
  if (!s) return "";
  return s.split(/\s+/)[0] || s;
};

const nameFromMember = (m?: GroupMemberLike) => {
  if (!m) return "";
  const composed = `${trim(m.first_name)} ${trim(m.last_name)}`.trim();
  return composed || m.name || (m.username ? `@${m.username}` : `#${m.id}`);
};

const avatarFromMember = (m?: GroupMemberLike) =>
  trim(m?.avatar_url || m?.photo_url) || undefined;

const ZERO_CCY_DEC = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (code?: string) => {
  const c = (code || "").toUpperCase();
  return c && ZERO_CCY_DEC.has(c) ? 0 : 2;
};

const fmtAmount = (n: number, code?: string) => {
  if (!Number.isFinite(n)) n = 0;
  const c = (code || "").toUpperCase();
  const d = decimalsByCode(c);
  try {
    const nf = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
    return `${nf.format(n)} ${c}`.trim();
  } catch {
    return `${n.toFixed(d)} ${c}`.trim();
  }
};

const fmtNumberOnly = (n: number, code?: string) => {
  if (!Number.isFinite(n)) n = 0;
  const d = decimalsByCode(code);
  try {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(n);
  } catch {
    return n.toFixed(d);
  }
};

const tKey = (
  t?: (k: string, vars?: Record<string, any>) => string,
  k?: string,
  fb?: string,
  vars?: Record<string, any>
) => {
  if (!k) return fb || "";
  try {
    const v = t?.(k, vars);
    return v && v !== k ? v : fb || "";
  } catch {
    return fb || "";
  }
};

/** 20 мая / May 20 — через ключи date_card.* */
const formatDateHuman = (d: Date, t?: Props["t"]) => {
  const day = d.getDate();
  const m = d.getMonth(); // 0..11
  const month =
    tKey(t, `date_card.months.${m}`, undefined) ||
    // фолбэк на локаль
    d.toLocaleString(undefined, { month: "short" });
  // pattern: ru -> "{{day}} {{month}}", en/es -> "{{month}} {{day}}"
  const pat = tKey(t, "date_card.pattern", "{{day}} {{month}}");
  return pat.replace("{{day}}", String(day)).replace("{{month}}", String(month));
};

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
  const bg =
    typeof color === "string" && color.trim()
      ? (color as string)
      : "var(--tg-link-color)";
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
      style={{ background: bg }}
    >
      <span style={{ fontSize: 16 }} aria-hidden>
        {icon || ch}
      </span>
    </div>
  );
}

function RoundAvatar({
  src,
  alt,
  size = 18,
}: {
  src?: string;
  alt?: string;
  size?: number;
}) {
  return src ? (
    <img
      src={src}
      alt={alt || ""}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  ) : (
    <span
      className="rounded-full inline-block"
      style={{
        width: size,
        height: size,
        background: "var(--tg-link-color)",
      }}
      aria-hidden
    />
  );
}

/* ---------- main ---------- */

export default function TransactionCard({
  tx,
  membersById,
  groupMembersCount,
  t,
  currentUserId: currentUserIdProp,
  className,
}: Props) {
  const isExpense = tx?.type === "expense";
  const hasId = Number.isFinite(Number(tx?.id));
  const txId = hasId ? Number(tx.id) : undefined;

  // Тек. пользователь
  const currentUserId =
    typeof currentUserIdProp === "number"
      ? currentUserIdProp
      : (() => {
          try {
            const id = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user
              ?.id;
            return Number.isFinite(Number(id)) ? Number(id) : undefined;
          } catch {
            return undefined;
          }
        })();

  const amountNum = Number(tx?.amount ?? 0);
  const currency = (tx?.currency || "").toString().toUpperCase();

  const dateObj = useMemo(
    () => new Date(tx?.date || tx?.created_at || Date.now()),
    [tx?.date, tx?.created_at]
  );
  const dateStr = formatDateHuman(dateObj, t);

  /* --- resolve people --- */
  const payerId: number | undefined = isExpense
    ? Number(tx?.paid_by ?? tx?.created_by ?? NaN)
    : Number(
        tx?.transfer_from ??
          tx?.from_user_id ??
          (Array.isArray(tx?.transfer) ? tx.transfer[0] : NaN)
      );
  const payerMember = getFromMap(membersById, payerId);
  const payerName =
    firstName(tx?.paid_by_name || tx?.from_name) ||
    firstName(nameFromMember(payerMember)) ||
    (payerId != null ? `#${payerId}` : "");
  const payerAvatar =
    trim(tx?.paid_by_avatar || tx?.from_avatar) ||
    avatarFromMember(payerMember);

  // recipient (transfer only)
  let toId: number | undefined = undefined;
  if (!isExpense) {
    const raw = tx?.transfer_to ?? tx?.to_user_id ?? tx?.to;
    if (Array.isArray(raw) && raw.length > 0) toId = Number(raw[0]);
    else if (raw != null) toId = Number(raw);
  }
  const toMember = getFromMap(membersById, toId);
  const toName =
    firstName(tx?.to_name) ||
    firstName(nameFromMember(toMember)) ||
    (toId != null ? `#${toId}` : "");
  const toAvatar = trim(tx?.to_avatar) || avatarFromMember(toMember);

  // participants summary (expense only)
  let participantsText = "";
  if (isExpense) {
    const shareIds: number[] = Array.isArray(tx?.shares)
      ? (tx.shares as any[])
          .map((s: any) => Number(s?.user_id))
          .filter((n) => Number.isFinite(n))
      : [];
    const uniq = Array.from(new Set(shareIds));
    if (uniq.length) {
      if (groupMembersCount && uniq.length === Number(groupMembersCount)) {
        participantsText = tKey(t, "tx_modal.all", "ВСЕ");
      } else {
        participantsText = `${uniq.length}`;
      }
    } else if (tx?.split_type === "equal" && groupMembersCount) {
      participantsText = tKey(t, "tx_modal.all", "ВСЕ");
    }
  }

  /* --- заголовок: comment || category.name --- */
  const title = useMemo(() => {
    if (isExpense) {
      const c = trim(tx?.comment);
      if (c) return c;
      const cat = trim(tx?.category?.name);
      return cat || "—";
    }
    // Для перевода: в шапке только comment (если есть)
    const c = trim(tx?.comment);
    return c || "";
  }, [isExpense, tx?.comment, tx?.category?.name]);

  /* --- статус участия (ТОЛЬКО ДЛЯ РАСХОДОВ) --- */
  let statusText = "";
  if (isExpense && typeof currentUserId === "number" && Array.isArray(tx?.shares)) {
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
      // сколько ДОЛЖНЫ плательщику в рамках этой транзакции
      const lent = Math.max(0, amountNum - payerShare);
      if (lent > 0) {
        const sumStr = fmtNumberOnly(lent, currency);
        statusText =
          tKey(t, "group_participant_owes_you", `Вам должны: ${sumStr}`, {
            sum: sumStr,
          }) || `Вам должны: ${sumStr}`;
      } else {
        statusText = tKey(t, "group_participant_no_debt", "Нет долга");
      }
    } else {
      if (myShare > 0) {
        const sumStr = fmtNumberOnly(myShare, currency);
        statusText =
          tKey(
            t,
            "group_participant_you_owe",
            `Вы должны: ${sumStr}`,
            { sum: sumStr }
          ) || `Вы должны: ${sumStr}`;
      } else {
        statusText = tKey(t, "group_participant_no_debt", "Нет долга");
      }
    }
  }

  /* ---------- RENDER ---------- */

  const CardInner = (
    <div
      className={
        "relative px-3 py-2 rounded-xl border bg-[var(--tg-card-bg)] " +
        (hasId ? "transition hover:bg-black/5 dark:hover:bg-white/5 " : "") +
        (className || "")
      }
      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
    >
      {/* Верхняя строка: аватар + (title · amount) */}
      <div className="flex items-center gap-3">
        {isExpense ? (
          <CategoryAvatar
            name={tx?.category?.name}
            color={tx?.category?.color}
            icon={tx?.category?.icon}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
          >
            <ArrowRightLeft size={18} className="opacity-80" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate flex-1">
              {title}
            </div>
            <div className="text-[14px] font-semibold shrink-0">
              {fmtAmount(amountNum, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Дата — ПОД аватаркой (выравниваем по контенту) */}
      <div className="mt-1 ml-12 text-[12px] text-[var(--tg-hint-color)]">
        {dateStr}
      </div>

      {/* Вторая строка: детали */}
      <div className="mt-1 ml-12 min-w-0">
        {isExpense ? (
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="opacity-70 text-[var(--tg-hint-color)]">
              {tKey(t, "tx_modal.paid_by_label", "Заплатил")}
            </span>
            <RoundAvatar src={payerAvatar} alt={payerName} />
            <span className="text-[var(--tg-text-color)] font-medium truncate">
              {payerName}
            </span>
            {participantsText && (
              <>
                <span className="opacity-60 text-[var(--tg-hint-color)]">—</span>
                <span className="truncate text-[var(--tg-text-color)]">
                  {tKey(t, "tx_modal.participants", "Участники")}: {participantsText}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--tg-text-color)]">
            <RoundAvatar src={payerAvatar} alt={payerName} />
            <span className="font-medium truncate">{payerName}</span>
            <span className="opacity-60">→</span>
            <RoundAvatar src={toAvatar} alt={toName} />
            <span className="font-medium truncate">{toName}</span>
          </div>
        )}

        {/* Строка статуса долгов — ТОЛЬКО ДЛЯ РАСХОДОВ */}
        {isExpense && statusText && (
          <div className="mt-1 text-[12px] text-[var(--tg-hint-color)]">
            {statusText}
          </div>
        )}
      </div>
    </div>
  );

  return hasId ? (
    <Link
      to={`/transactions/${txId}`}
      className="block focus:outline-none focus:ring-2 focus:ring-[var(--tg-accent-color,#40A7E3)] rounded-xl"
    >
      {CardInner}
    </Link>
  ) : (
    CardInner
  );
}
