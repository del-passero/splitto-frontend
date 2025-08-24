// src/components/transactions/TransactionCard.tsx
import React, { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft } from "lucide-react";
import { useUserStore } from "../../store/userStore";

/** Пользователь */
type TGUser = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  name?: string | null;
};

/** Участник в списке может быть { user } или сразу TGUser */
export type GroupMemberLike = { user: TGUser } | TGUser;
type MembersMap = Record<number, GroupMemberLike> | Map<number, GroupMemberLike>;

type TFunc = (k: string, vars?: Record<string, any>) => string;

type Props = {
  tx: any; // TransactionOut | LocalTx
  /** карта участников группы: id -> {user}|user */
  membersById?: MembersMap;
  /** кол-во участников группы (для "ВСЕ (N)") */
  groupMembersCount?: number;
  t?: TFunc;
  className?: string;

  /** NEW: long-press колбэк (для ActionSheet) */
  onLongPress?: (tx: any, e?: React.SyntheticEvent) => void;
};

/* ---------- utils ---------- */
const s = (x: any) => (typeof x === "string" ? x : "");
const upper = (x: any) => s(x).toUpperCase();

const userFromLike = (v?: GroupMemberLike | null): TGUser | undefined =>
  !v ? undefined : (v as any).user ? ((v as any).user as TGUser) : (v as TGUser);

const makeName = (u?: TGUser): string => {
  if (!u) return "";
  if (u.name) return u.name;
  const fn = s(u.first_name).trim();
  const ln = s(u.last_name).trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(" ");
  if (u.username) return `@${u.username}`;
  return "";
};

const firstLetter = (v: string) =>
  (v || "").trim().charAt(0).toUpperCase() || "•";

function UserAvatar({
  user,
  size = 18,
  className = "",
  style,
}: {
  user?: TGUser;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const url = s(user?.photo_url || user?.avatar_url).trim();
  const name = makeName(user);
  return (
    <div
      className={
        "rounded-full bg-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden flex items-center justify-center " +
        className
      }
      style={{ width: size, height: size, ...style }}
      title={name || undefined}
      aria-label={name || undefined}
    >
      {url ? (
        <img
          src={url}
          alt={name || ""}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span className="text-[10px] opacity-80">{firstLetter(name)}</span>
      )}
    </div>
  );
}

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
      ? color
      : "var(--tg-link-color)";
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
      style={{ background: bg }}
    >
      <span style={{ fontSize: 16 }} aria-hidden>
        {icon || firstLetter(name || "")}
      </span>
    </div>
  );
}

const ZERO_CCY_DEC = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (code?: string) =>
  code && ZERO_CCY_DEC.has(code) ? 0 : 2;

const fmtAmount = (n: number, code?: string) => {
  if (!isFinite(n)) n = 0;
  const decimals = decimalsByCode(code);
  try {
    const nf = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${nf.format(n)} ${upper(code)}`.trim();
  } catch {
    return `${n.toFixed(decimals)} ${upper(code)}`.trim();
  }
};

const fmtNumberOnly = (n: number, code?: string) => {
  if (!isFinite(n)) n = 0;
  const decimals = decimalsByCode(code);
  try {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  } catch {
    return n.toFixed(decimals);
  }
};

const getFromMap = (m?: MembersMap, id?: number | null) => {
  if (!m || id == null) return undefined;
  if (m instanceof Map) return userFromLike(m.get(Number(id)));
  return userFromLike((m as Record<number, GroupMemberLike>)[Number(id)]);
};

const monthNameByT = (t?: TFunc, idx?: number): string => {
  const i = typeof idx === "number" ? idx : 0;
  try {
    const arr = (t?.("date_card.months", { returnObjects: true }) ??
      []) as unknown as string[];
    const v = Array.isArray(arr) ? arr[i] : undefined;
    return s(v) || new Date(2000, i, 1).toLocaleString(undefined, { month: "long" });
  } catch {
    return new Date(2000, i, 1).toLocaleString(undefined, { month: "long" });
  }
};

const formatDateCard = (t?: TFunc, d?: Date): string => {
  const date = d ?? new Date();
  const day = String(date.getDate());
  const month = monthNameByT(t, date.getMonth());
  try {
    const txt = t?.("date_card.pattern", { day, month });
    if (txt && txt !== "date_card.pattern") return txt;
  } catch {}
  // fallback: "20 May"
  return `${day} ${month}`;
};

/* ---------- main ---------- */
export default function TransactionCard({
  tx,
  membersById,
  groupMembersCount,
  t,
  className,
  onLongPress,
}: Props) {
  const isExpense = tx?.type === "expense";
  const hasId = Number.isFinite(Number(tx?.id));
  const txId = hasId ? Number(tx.id) : undefined;

  // Текущий юзер: store -> Telegram -> undefined
  const storeUserId = useUserStore((s: any) => s?.user?.id);
  const currentUserId: number | undefined = useMemo(() => {
    if (Number.isFinite(Number(storeUserId))) return Number(storeUserId);
    try {
      const tgId = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      if (Number.isFinite(Number(tgId))) return Number(tgId);
    } catch {}
    return undefined;
  }, [storeUserId]);

  // payer / transfer participants
  const paidById: number | undefined =
    tx?.paid_by ?? tx?.payer_id ?? tx?.payer ?? tx?.created_by ?? undefined;
  const payer = getFromMap(membersById, paidById);

  const fromId: number | undefined =
    tx?.transfer_from ?? tx?.from_user_id ?? tx?.from_id ?? undefined;
  const fromUser = getFromMap(membersById, fromId);

  const toListRaw =
    (Array.isArray(tx?.transfer_to) ? tx.transfer_to : undefined) ||
    (typeof tx?.to_user_id === "number" ? [tx.to_user_id] : undefined) ||
    (Array.isArray(tx?.to_user_ids) ? tx.to_user_ids : undefined) ||
    [];
  const toIds: number[] = toListRaw
    .map((x: any) => Number(x))
    .filter((n: number) => Number.isFinite(n));
  const toUsers: TGUser[] = toIds
    .map((id) => getFromMap(membersById, id))
    .filter(Boolean) as TGUser[];

  // участники расхода из shares
  const participantsFromShares: TGUser[] = Array.isArray(tx?.shares)
    ? (tx.shares as any[])
        .map((s) =>
          getFromMap(
            membersById,
            Number((s as any)?.user_id ?? (s as any)?.user?.id)
          )
        )
        .filter(Boolean) as TGUser[]
    : [];

  const looksLikeAll =
    isExpense &&
    (tx?.split_type === "equal" ||
      (!tx?.split_type && (!tx?.shares || tx?.shares?.length === 0)));

  // заголовок
  const title = useMemo(() => {
    if (isExpense) {
      const c = s(tx?.comment).trim();
      if (c) return c; // "название" = comment
      const cat = s(tx?.category?.name).trim();
      return cat || "";
    }
    const fromName = makeName(fromUser);
    const toName =
      toUsers.length > 1
        ? `${makeName(toUsers[0])} +${toUsers.length - 1}`
        : makeName(toUsers[0]);
    return `${fromName} → ${toName}`;
  }, [isExpense, tx, fromUser, toUsers]);

  // Дата под аватаркой
  const dateObj = new Date(tx?.date || tx?.created_at || Date.now());
  const dateStr = formatDateCard(t, dateObj);

  const amountNum = Number(tx?.amount ?? 0);
  const amountStr = fmtAmount(amountNum, tx?.currency);

  // --- ДОЛГ: только для расходов ---
  const debtLine: string | null = useMemo(() => {
    if (!isExpense) return null;
    if (!Array.isArray(tx?.shares) || typeof amountNum !== "number") return null;

    let myShare = 0;
    let payerShare = 0;

    for (const s of tx.shares as any[]) {
      const uid = Number((s as any)?.user_id);
      const val = Number((s as any)?.amount ?? 0);
      if (!Number.isFinite(val) || !Number.isFinite(uid)) continue;
      if (Number(currentUserId) === uid) myShare += val;
      if (Number(paidById) === uid) payerShare += val;
    }

    const iAmPayer = Number(paidById) === Number(currentUserId);
    const debt = iAmPayer
      ? Math.max(0, amountNum - payerShare) // вам должны
      : Math.max(0, myShare); // вы должны

    if (debt > 0) {
      const num = fmtNumberOnly(debt, tx?.currency); // БЕЗ валюты!
      if (iAmPayer) {
        // «Вам должны: 123»
        const txt =
          t?.("group_participant_owes_you", { sum: num }) ??
          `Вам должны: ${num}`;
        // Но в шаблоне у тебя валюта "₽" — уберём её из строки, оставим число
        return txt.replace(/(\s?[^\d\s.,]+)$/u, "").replace(/[^\d.,\s]+/g, "");
      } else {
        // «Вы должны: 123»
        const txt =
          t?.("group_participant_you_owe", { sum: num }) ??
          `Вы должны: ${num}`;
        return txt.replace(/(\s?[^\d\s.,]+)$/u, "").replace(/[^\d.,\s]+/g, "");
      }
    }
    // нет долга
    return t?.("group_participant_no_debt") || "Нет долга";
  }, [isExpense, tx?.shares, amountNum, tx?.currency, paidById, currentUserId, t]);

  // --- список участников для аватарок под строкой долга (без плательщика) ---
  const participantsNoPayer: TGUser[] = useMemo(() => {
    const excludeId = Number(paidById);
    const isAll = looksLikeAll && membersById;
    let src: TGUser[] = [];

    if (Array.isArray(participantsFromShares) && participantsFromShares.length) {
      src = participantsFromShares;
    } else if (isAll) {
      // если equal и shares пусто — считаем "все из группы"
      const arr: TGUser[] = [];
      if (membersById instanceof Map) {
        membersById.forEach((v) => {
          const u = userFromLike(v);
          if (u) arr.push(u);
        });
      } else if (membersById) {
        Object.values(membersById).forEach((v) => {
          const u = userFromLike(v);
          if (u) arr.push(u);
        });
      }
      src = arr;
    }

    // исключаем плательщика
    const filtered = src.filter((u) => Number(u?.id) !== excludeId);
    // уникализируем по id
    const uniqMap = new Map<number, TGUser>();
    for (const u of filtered) {
      const id = Number(u?.id);
      if (Number.isFinite(id) && !uniqMap.has(id)) uniqMap.set(id, u);
    }
    return Array.from(uniqMap.values());
  }, [participantsFromShares, looksLikeAll, membersById, paidById]);

  /* ---------- long-press ---------- */
  const pressTimer = useRef<number | null>(null);
  const longFiredRef = useRef(false);

  const startPress = (e: React.PointerEvent | React.MouseEvent) => {
    if (!onLongPress) return;
    longFiredRef.current = false;
    pressTimer.current = window.setTimeout(() => {
      longFiredRef.current = true;
      onLongPress(tx, e as any);
    }, 450);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  const handleClick = (e: React.MouseEvent) => {
    if (longFiredRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onLongPress) return;
    e.preventDefault();
    onLongPress(tx, e);
  };

  /* ---------- UI ---------- */
  const PaidByRow = isExpense ? (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="text-[var(--tg-hint-color)]">
        {t?.("tx_modal.paid_by_label") || "Заплатил"}:
      </span>
      <UserAvatar user={payer} />
      <span className="text-[var(--tg-text-color)] font-medium truncate">
        {makeName(payer)}
      </span>
    </div>
  ) : (
    <div className="flex items-center gap-2 text-[12px] text-[var(--tg-text-color)]">
      <UserAvatar user={fromUser} />
      <span className="font-medium truncate">{makeName(fromUser)}</span>
      <span className="opacity-60">→</span>
      <UserAvatar user={toUsers[0]} />
      <span className="font-medium truncate">{makeName(toUsers[0])}</span>
    </div>
  );

  // Перекрывающиеся аватарки участников (справа)
  const OverlappedParticipants = (
    <div className="flex items-center justify-end flex-nowrap relative" style={{ minHeight: 20 }}>
      {participantsNoPayer.slice(0, 12).map((u, idx) => (
        <UserAvatar
          key={u.id}
          user={u}
          size={18}
          className="border border-[var(--tg-card-bg)]"
          style={{ marginLeft: idx === 0 ? 0 : -10, zIndex: 100 - idx }}
        />
      ))}
      {participantsNoPayer.length > 12 && (
        <div
          className="rounded-full bg-[var(--tg-secondary-bg-color,#e7e7e7)] text-[10px] px-1 ml-1"
          style={{ marginLeft: -10 }}
        >
          +{participantsNoPayer.length - 12}
        </div>
      )}
    </div>
  );

  const Body = (
    <div
      className={
        "relative px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] " +
        (className || "")
      }
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      {/* Верхняя зона */}
      <div className="flex items-start gap-3">
        {/* Левая колонка: иконка + дата под ней */}
        <div className="flex flex-col items-center shrink-0">
          {isExpense ? (
            <CategoryAvatar
              name={tx?.category?.name}
              color={tx?.category?.color}
              icon={tx?.category?.icon}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center">
              <ArrowRightLeft size={18} className="opacity-80" />
            </div>
          )}
          <div className="mt-1 text-[11px] text-[var(--tg-hint-color)] text-center leading-none">
            {dateStr}
          </div>
        </div>

        {/* Центр + сумма справа */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">
              {title}
            </div>
            <div className="ml-auto text-[14px] font-semibold shrink-0">
              {fmtAmount(amountNum, tx?.currency)}
            </div>
          </div>

          {/* Строка "кто платил" / "перевод" */}
          <div className="mt-1">{PaidByRow}</div>

          {/* Строка долга + аватарки участников (на одной линии) — только для расходов */}
          {isExpense && (
            <div className="mt-1 flex items-center gap-2">
              <div className="text-[12px] text-[var(--tg-hint-color)] truncate">
                {debtLine}
              </div>
              <div className="ml-auto">{OverlappedParticipants}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Если есть id — заворачиваем в Link, иначе — просто статичная карточка
  return hasId ? (
    <Link
      to={`/transactions/${txId}`}
      className="block focus:outline-none focus:ring-2 focus:ring-[var(--tg-accent-color,#40A7E3)] rounded-xl"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
    >
      {Body}
    </Link>
  ) : (
    Body
  );
}
