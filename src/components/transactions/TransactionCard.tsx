// src/components/transactions/TransactionCard.tsx
import React, { useMemo } from "react";
import { ArrowRightLeft, Layers } from "lucide-react";
import { Link } from "react-router-dom";

export type GroupMemberLike = {
  id: number;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
};
type MembersMap = Record<number, GroupMemberLike> | Map<number, GroupMemberLike>;
type TFunc = (k: string, vars?: Record<string, any>) => string;

type Props = {
  tx: any;
  membersById?: MembersMap;
  groupMembersCount?: number;
  t?: TFunc;
  currentUserId?: number;
  className?: string;
};

/* ---------- utils ---------- */
const s = (x: any) => (typeof x === "string" ? x : "");
const up = (x?: string | null) => (x ? String(x).toUpperCase() : "");
const isNum = (v: any) => Number.isFinite(Number(v));

const getFromMap = (m?: MembersMap, id?: number | null) => {
  if (!m || id == null) return undefined;
  const key = Number(id);
  return m instanceof Map
    ? (m as Map<number, GroupMemberLike>).get(key)
    : (m as Record<number, GroupMemberLike>)[key];
};

const makeName = (u?: GroupMemberLike | null): string => {
  if (!u) return "";
  if (s(u.name)) return s(u.name).trim();
  const fn = s(u.first_name).trim();
  const ln = s(u.last_name).trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(" ");
  if (s(u.username)) return `@${s(u.username)}`;
  return isNum((u as any).id) ? `#${(u as any).id}` : "";
};

const firstLetter = (v: string) => (v || "").trim().charAt(0).toUpperCase() || "•";

const ZERO_DEC = new Set(["JPY", "KRW", "VND"]);
const ccyDecimals = (code?: string | null) => (code && ZERO_DEC.has(code.toUpperCase()) ? 0 : 2);

const fmtAmount = (n: number, code?: string | null) => {
  const c = up(code);
  const dec = ccyDecimals(c);
  if (!Number.isFinite(n)) n = 0;
  try {
    const nf = new Intl.NumberFormat(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return `${nf.format(n)} ${c}`.trim();
  } catch {
    return `${n.toFixed(dec)} ${c}`.trim();
  }
};
const fmtNumberOnly = (n: number, code?: string | null) => {
  const dec = ccyDecimals(code || undefined);
  if (!Number.isFinite(n)) n = 0;
  try {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
  } catch {
    return n.toFixed(dec);
  }
};

const tKey = (t?: TFunc, key?: string, vars?: Record<string, any>) => {
  if (!t || !key) return undefined;
  try {
    const v = t(key as any, vars);
    return v && v !== key ? v : undefined;
  } catch {
    return undefined;
  }
};

/** Дата «20 мая» / «May 20» через keys: date_card.months.0..11 + date_card.pattern */
const MONTHS_FALLBACK = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const monthByIdx = (idx: number, t?: TFunc) =>
  tKey(t, `date_card.months.${idx}`) || MONTHS_FALLBACK[idx] || "";

const formatCardDate = (t?: TFunc, date?: string | number | Date) => {
  const d = new Date(date || Date.now());
  const day = d.getDate();
  const month = monthByIdx(d.getMonth(), t);
  return tKey(t, "date_card.pattern", { day, month }) || `${day} ${month}`;
};

/* ---------- UI bits ---------- */
function CategoryAvatar({
  name,
  color,
  icon,
}: {
  name?: string | null;
  color?: string | null;
  icon?: string | null;
}) {
  const bg = typeof color === "string" && color.trim() ? color : "var(--tg-link-color)";
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: bg }}>
      <span style={{ fontSize: 16 }} aria-hidden>
        {icon || firstLetter(s(name))}
      </span>
    </div>
  );
}

function RoundAvatar({ src, alt, size = 18 }: { src?: string | null; alt?: string; size?: number }) {
  const url = s(src).trim();
  return url ? (
    <img src={url} alt={alt || ""} className="rounded-full object-cover" style={{ width: size, height: size }} loading="lazy" />
  ) : (
    <span
      className="rounded-full inline-flex items-center justify-center bg-[var(--tg-secondary-bg-color,#e7e7e7)] text-[10px] opacity-80"
      style={{ width: size, height: size }}
    >
      {firstLetter(alt || "")}
    </span>
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
  const isExpense = s(tx?.type).toLowerCase() === "expense";
  const hasId = isNum(tx?.id);
  const txId = hasId ? Number(tx.id) : undefined;

  const currentUserId =
    typeof currentUserIdProp === "number"
      ? currentUserIdProp
      : (() => {
          try {
            const id = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
            return isNum(id) ? Number(id) : undefined;
          } catch {
            return undefined;
          }
        })();

  /* --- участники --- */
  const payerId: number | undefined =
    (isNum(tx?.paid_by) ? Number(tx.paid_by) : undefined) ??
    (isNum(tx?.created_by) ? Number(tx.created_by) : undefined) ??
    (isNum(tx?.payer_id) ? Number(tx.payer_id) : undefined) ??
    (isNum(tx?.from_user_id) ? Number(tx.from_user_id) : undefined) ??
    (isNum(tx?.transfer_from) ? Number(tx.transfer_from) : undefined);

  const payerFromMap = getFromMap(membersById, payerId);
  const payer: GroupMemberLike = {
    id: Number(payerId ?? tx?.paid_by?.id ?? tx?.payer?.id ?? 0),
    name: s(tx?.paid_by_name || tx?.from_name) || makeName(payerFromMap),
    first_name: payerFromMap?.first_name,
    last_name: payerFromMap?.last_name,
    username: payerFromMap?.username,
    avatar_url: s(tx?.paid_by_avatar || tx?.from_avatar || payerFromMap?.avatar_url),
    photo_url: s(payerFromMap?.photo_url),
  };

  let toId: number | undefined;
  const toRaw = Array.isArray(tx?.transfer_to) ? tx.transfer_to[0] : tx?.to_user_id ?? tx?.to;
  if (toRaw != null && isNum(toRaw)) toId = Number(toRaw);
  const toFromMap = getFromMap(membersById, toId);
  const to: GroupMemberLike | undefined = !isExpense
    ? {
        id: Number(toId ?? 0),
        name: s(tx?.to_name) || makeName(toFromMap),
        first_name: toFromMap?.first_name,
        last_name: toFromMap?.last_name,
        username: toFromMap?.username,
        avatar_url: s(tx?.to_avatar || toFromMap?.avatar_url),
        photo_url: s(toFromMap?.photo_url),
      }
    : undefined;

  // shares → участники и расчёт долгов
  const shares: Array<{ user_id: number; amount: number; name?: string; avatar_url?: string | null }> = Array.isArray(tx?.shares)
    ? (tx.shares as any[]).map((s: any) => ({
        user_id: Number(s?.user_id ?? s?.user?.id),
        amount: Number(s?.amount ?? 0),
        name: s(s?.name),
        avatar_url: s?.avatar_url ?? null,
      }))
    : [];

  const participantsUsers: GroupMemberLike[] = shares
    .map((sh) => {
      const m = getFromMap(membersById, sh.user_id);
      return (
        m || {
          id: sh.user_id,
          name: sh.name,
          avatar_url: sh.avatar_url || null,
        }
      );
    })
    .filter(Boolean) as GroupMemberLike[];

  const looksLikeAll =
    isExpense &&
    ((s(tx?.split_type) === "equal" && (!shares || !shares.length)) ||
      (!tx?.split_type && (!shares || shares.length === 0)));

  /* --- заголовок и дата --- */
  const title = useMemo(() => {
    if (isExpense) {
      const c = s(tx?.comment).trim();
      if (c) return c;
      const cat = s(tx?.category?.name).trim();
      return cat || "—";
    }
    const c = s(tx?.comment).trim();
    if (c) return c;
    return `${makeName(payer)} → ${makeName(to)}`.trim();
  }, [isExpense, tx, payer, to]);

  const dateStr = formatCardDate(t, tx?.date || tx?.created_at);

  /* --- суммы/валюта --- */
  const amountNum = Number(tx?.amount ?? 0);
  const amountStr = fmtAmount(amountNum, up(tx?.currency));

  /* --- сплит-бейдж --- */
  const splitLabel =
    s(tx?.split_type) === "equal"
      ? tKey(t, "tx_modal.split_equal")
      : s(tx?.split_type) === "shares"
      ? tKey(t, "tx_modal.split_shares")
      : s(tx?.split_type) === "custom"
      ? tKey(t, "tx_modal.split_custom")
      : null;

  const participantsTitle = looksLikeAll
    ? `${tKey(t, "tx_modal.all") || "ALL"}${groupMembersCount ? ` (${groupMembersCount})` : ""}`
    : participantsUsers.map(makeName).filter(Boolean).join(", ");

  /* --- расчёт долга (только если shares есть) --- */
  let statusText = "";
  if (isExpense && typeof currentUserId === "number" && shares.length) {
    let myShare = 0;
    let payerShare = 0;
    shares.forEach((s) => {
      const uid = Number(s.user_id);
      const val = Number(s.amount) || 0;
      if (uid === Number(currentUserId)) myShare += val;
      if (uid === Number(payerId)) payerShare += val;
    });
    const iAmPayer = Number(payerId) === Number(currentUserId);
    if (iAmPayer) {
      const lent = Math.max(0, amountNum - payerShare);
      statusText =
        lent > 0
          ? tKey(t, "group_participant_owes_you", { sum: fmtNumberOnly(lent, tx?.currency) }) ||
            `Вам должны: ${fmtNumberOnly(lent, tx?.currency)}`
          : tKey(t, "group_participant_no_debt") || "Нет долга";
    } else {
      statusText =
        myShare > 0
          ? tKey(t, "group_participant_you_owe", { sum: fmtNumberOnly(myShare, tx?.currency) }) ||
            `Вы должны: ${fmtNumberOnly(myShare, tx?.currency)}`
          : tKey(t, "group_participant_no_debt") || "Нет долга";
    }
  }

  /* ---------- UI ---------- */
  const Card = (
    <div
      className={
        "relative px-3 py-3 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] " +
        (className || "")
      }
    >
      <div className="flex items-start gap-3">
        {/* Левая колонка: аватар + дата под ним */}
        <div className="flex flex-col items-center w-10 shrink-0">
          {isExpense ? (
            <CategoryAvatar name={tx?.category?.name} color={tx?.category?.color} icon={tx?.category?.icon} />
          ) : (
            <div className="w-10 h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center">
              <ArrowRightLeft size={18} className="opacity-80" />
            </div>
          )}
          <div className="mt-1 text-[10px] text-[var(--tg-hint-color)] leading-none text-center max-w-[40px] truncate">
            {dateStr}
          </div>
        </div>

        {/* Правая часть */}
        <div className="min-w-0 flex-1">
          {/* Заголовок + сумма */}
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 text-[14px] font-semibold text-[var(--tg-text-color)] truncate">
              {title}
            </div>
            <div className="text-[14px] font-semibold shrink-0">{amountStr}</div>
          </div>

          {/* Инфо строка */}
          <div className="mt-1 flex items-center justify-between gap-2">
            {isExpense ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0">
                  {tKey(t, "tx_modal.paid_by_label") || "Paid by"}:
                </span>
                <div className="flex items-center gap-1 min-w-0">
                  <RoundAvatar src={payer.avatar_url || payer.photo_url} alt={makeName(payer)} />
                  <span className="text-[12px] text-[var(--tg-text-color)] truncate">{makeName(payer)}</span>
                </div>
                <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0 mx-1">—</span>
                {looksLikeAll ? (
                  <span className="text-[12px] text-[var(--tg-text-color)] whitespace-nowrap">{participantsTitle}</span>
                ) : (
                  <div className="flex items-center gap-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {participantsUsers.slice(0, 3).map((u) => (
                        <RoundAvatar key={u.id} src={u.avatar_url || u.photo_url} alt={makeName(u)} size={16} />
                      ))}
                    </div>
                    <span className="text-[12px] text-[var(--tg-text-color)] truncate">
                      {participantsTitle || tKey(t, "participants") || "Participants"}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[12px] text-[var(--tg-text-color)] min-w-0">
                <RoundAvatar src={payer.avatar_url || payer.photo_url} alt={makeName(payer)} />
                <span className="font-medium truncate">{makeName(payer)}</span>
                <span className="opacity-60">→</span>
                <RoundAvatar src={to?.avatar_url || to?.photo_url} alt={makeName(to)} />
                <span className="font-medium truncate">{makeName(to)}</span>
              </div>
            )}

            {isExpense && splitLabel && (
              <div className="ml-2 shrink-0 px-2 h-7 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] text-[12px] inline-flex items-center gap-1">
                <Layers size={14} className="opacity-80" />
                <span className="truncate">{splitLabel}</span>
              </div>
            )}
          </div>

          {/* Статус долга (только если смогли посчитать) */}
          {isExpense && statusText && (
            <div className="mt-1 text-[12px] text-[var(--tg-hint-color)]">{statusText}</div>
          )}
        </div>
      </div>
    </div>
  );

  return hasId ? (
    <Link to={`/transactions/${txId}`} className="block focus:outline-none focus:ring-2 focus:ring-[var(--tg-accent-color,#40A7E3)] rounded-xl">
      {Card}
    </Link>
  ) : (
    Card
  );
}
