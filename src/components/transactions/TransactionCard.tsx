// src/components/transactions/TransactionCard.tsx
import React, { useMemo } from "react";
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
  currentUserId?: number;
  className?: string;
};

/* ====================== helpers ====================== */

const getFromMap = (m?: MembersMap, id?: number | null) => {
  if (!m || id == null) return undefined;
  const key = Number(id);
  if (m instanceof Map) return m.get(key);
  return (m as Record<number, GroupMemberLike>)[key];
};
const trim = (s?: unknown) =>
  typeof s === "string" ? s.trim() : typeof s === "number" ? String(s) : "";
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

const ZERO = new Set(["JPY", "KRW", "VND"]);
const decimalsBy = (code?: string) =>
  code && ZERO.has(code.toUpperCase()) ? 0 : 2;

const roundByCcy = (n: number, code?: string) => {
  const d = decimalsBy(code);
  const k = Math.pow(10, d);
  return Math.round(n * k) / k;
};

const fmtAmount = (n: number, code?: string) => {
  if (!Number.isFinite(n)) n = 0;
  const c = (code || "").toUpperCase();
  const d = decimalsBy(c);
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
  const d = decimalsBy(code);
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
  key?: string,
  fb?: string,
  vars?: Record<string, any>
) => {
  if (!key) return fb || "";
  try {
    const v = t?.(key, vars);
    return v && v !== key ? v : fb || "";
  } catch {
    return fb || "";
  }
};

/** 20 мая / May 20 — под аватаром */
const formatDateHuman = (d: Date, t?: Props["t"]) => {
  const day = d.getDate();
  const monthIdx = d.getMonth(); // 0..11
  const month =
    tKey(t, `date_card.months.${monthIdx}`, undefined) ||
    d.toLocaleString(undefined, { month: "short" });
  const pattern = tKey(t, "date_card.pattern", "{{day}} {{month}}");
  return pattern
    .replace("{{day}}", String(day))
    .replace("{{month}}", String(month));
};

/** Подсчёт долга для viewerId */
function computeViewerDebtAmount(
  tx: any,
  viewerId?: number,
  groupMembersCount?: number,
  membersById?: MembersMap
): { type: "owe" | "lent" | "none"; amount: number } {
  if (!tx || tx.type !== "expense") return { type: "none", amount: 0 };

  const total = Number(tx.amount ?? 0);
  const currency = trim(tx.currency).toUpperCase();
  if (!Number.isFinite(total) || total <= 0) return { type: "none", amount: 0 };

  const payerId: number | undefined = Number(
    tx.paid_by ?? tx.created_by ?? NaN
  );
  const me = viewerId ?? payerId;
  if (!me || !Number.isFinite(payerId)) return { type: "none", amount: 0 };

  // 1) точный расчёт по shares
  if (Array.isArray(tx.shares) && tx.shares.length > 0) {
    let myShare = 0;
    let payerShare = 0;
    for (const s of tx.shares as any[]) {
      const uid = Number(s?.user_id);
      const val = Number(s?.amount ?? 0);
      if (!Number.isFinite(val)) continue;
      if (uid === Number(me)) myShare += val;
      if (uid === Number(payerId)) payerShare += val;
    }
    const iAmPayer = Number(me) === Number(payerId);
    if (iAmPayer) {
      const lent = roundByCcy(Math.max(0, total - payerShare), currency);
      return lent > 0 ? { type: "lent", amount: lent } : { type: "none", amount: 0 };
    } else {
      myShare = roundByCcy(myShare, currency);
      return myShare > 0 ? { type: "owe", amount: myShare } : { type: "none", amount: 0 };
    }
  }

  // 2) фоллбэк: split_type == equal (или shares пусты)
  const equal =
    String(tx.split_type || "").toLowerCase() === "equal" ||
    (!tx.split_type && (!tx.shares || tx.shares.length === 0));

  if (equal) {
    let n: number | undefined = undefined;

    if (Array.isArray(tx.shares) && tx.shares.length) {
      const uniq = new Set(
        (tx.shares as any[])
          .map((s: any) => Number(s?.user_id))
          .filter((x: number) => Number.isFinite(x))
      );
      n = uniq.size;
    }
    if (!n && Number.isFinite(Number(tx.participants_count))) n = Number(tx.participants_count);
    if (!n && membersById) {
      n =
        membersById instanceof Map
          ? membersById.size
          : Object.keys(membersById as Record<number, GroupMemberLike>).length;
    }
    if (!n && Number.isFinite(Number(groupMembersCount))) n = Number(groupMembersCount);

    if (!n || n <= 0) return { type: "none", amount: 0 };

    const iAmPayer = Number(me) === Number(payerId);
    if (iAmPayer) {
      const lent = roundByCcy(total * ((n - 1) / n), currency);
      return lent > 0 ? { type: "lent", amount: lent } : { type: "none", amount: 0 };
    } else {
      const owe = roundByCcy(total / n, currency);
      return owe > 0 ? { type: "owe", amount: owe } : { type: "none", amount: 0 };
    }
  }

  return { type: "none", amount: 0 };
}

/* ====================== UI bits ====================== */

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

function TransferAvatarBox() {
  return (
    <div className="w-10 h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center shrink-0">
      <ArrowRightLeft size={18} className="opacity-80" />
    </div>
  );
}

function RoundAvatar({
  src,
  alt,
  size = 18,
  className,
  style,
}: {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return src ? (
    <img
      src={src}
      alt={alt || ""}
      className={`rounded-full object-cover ${className || ""}`}
      style={{ width: size, height: size, ...(style || {}) }}
      loading="lazy"
    />
  ) : (
    <span
      className={`rounded-full inline-block ${className || ""}`}
      style={{ width: size, height: size, background: "var(--tg-link-color)", ...(style || {}) }}
      aria-hidden
    />
  );
}

/* ====================== main ====================== */

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

  // кто залогинен: store → проп → Telegram
  const storeUserId = useUserStore((s) => s.user?.id) as number | undefined;
  const currentUserId =
    (Number.isFinite(Number(storeUserId)) ? Number(storeUserId) : undefined) ??
    (Number.isFinite(Number(currentUserIdProp)) ? Number(currentUserIdProp) : undefined) ??
    (() => {
      try {
        const id = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        return Number.isFinite(Number(id)) ? Number(id) : undefined;
      } catch {
        return undefined;
      }
    })();

  const amountNum = Number(tx?.amount ?? 0);
  const currency = trim(tx?.currency).toUpperCase();

  const dateObj = useMemo(
    () => new Date(tx?.date || tx?.created_at || Date.now()),
    [tx?.date, tx?.created_at]
  );
  const dateStr = formatDateHuman(dateObj, t);

  // payer / recipient / names / avatars
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
    trim(tx?.paid_by_avatar || tx?.from_avatar) || avatarFromMember(payerMember);

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

  // participants из shares (для аватарок)
  const shareUserIds: number[] = Array.isArray(tx?.shares)
    ? (tx.shares as any[])
        .map((s: any) => Number(s?.user_id))
        .filter((n: number) => Number.isFinite(n))
    : [];

  const participantsUsers =
    shareUserIds
      .map((uid) => getFromMap(membersById, uid))
      .filter(Boolean) as GroupMemberLike[];

  const looksLikeAll =
    isExpense &&
    (String(tx?.split_type || "").toLowerCase() === "equal" ||
      (!tx?.split_type && (!tx?.shares || tx?.shares?.length === 0)));

  let participantsText = "";
  if (isExpense) {
    const uniq = Array.from(new Set(shareUserIds));
    if (uniq.length) {
      participantsText =
        groupMembersCount && uniq.length === Number(groupMembersCount)
          ? tKey(t, "tx_modal.all", "ВСЕ")
          : String(uniq.length);
    } else if (looksLikeAll && groupMembersCount) {
      participantsText = tKey(t, "tx_modal.all", "ВСЕ");
    }
  }

  // заголовок: comment || category.name
  const title = useMemo(() => {
    if (isExpense) {
      const c = trim(tx?.comment);
      if (c) return c;
      const cat = trim(tx?.category?.name);
      return cat || "—";
    }
    const c = trim(tx?.comment);
    return c || "";
  }, [isExpense, tx?.comment, tx?.category?.name]);

  // расчёт долга
  const viewerId = currentUserId ?? payerId;
  const debt = computeViewerDebtAmount(tx, viewerId, groupMembersCount, membersById);

  // локализация текстов долга (без валюты!)
  const lang = (() => {
    try {
      const l = (navigator?.language || "en").split("-")[0].toLowerCase();
      return l === "ru" || l === "es" ? l : "en";
    } catch {
      return "en";
    }
  })();
  const debtYouOweLabel = lang === "ru" ? "Вы должны: " : lang === "es" ? "Debes: " : "You owe: ";
  const debtOwesYouLabel = lang === "ru" ? "Вам должны: " : lang === "es" ? "Te deben: " : "They owe you: ";
  const debtNoDebtLabel = tKey(t, "group_participant_no_debt", lang === "ru" ? "Нет долга" : lang === "es" ? "Sin deuda" : "No debt");

  /* ====================== RENDER ====================== */

  const LeftCol = (
    <div className="flex flex-col items-center w-10">
      {isExpense ? (
        <CategoryAvatar
          name={tx?.category?.name}
          color={tx?.category?.color}
          icon={tx?.category?.icon}
        />
      ) : (
        <TransferAvatarBox />
      )}
      <div className="text-[10px] text-[var(--tg-hint-color)] mt-1 text-center leading-none">
        {dateStr}
      </div>
    </div>
  );

  const TopRow = (
    <div className="flex items-center gap-2 min-w-0">
      <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate flex-1">
        {title}
      </div>
      <div className="text-[14px] font-semibold shrink-0">
        {fmtAmount(amountNum, currency)}
      </div>
    </div>
  );

  const DetailsRow = isExpense ? (
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
  );

  // Аватарки участников (без плательщика) — в одну строку, с оверлапом вправо
  const AvatarsStack = useMemo(() => {
    if (!isExpense) return null;

    // базовый список
    let list: GroupMemberLike[] = participantsUsers;

    // equal без shares → берём всех из membersById
    if ((!list || list.length === 0) && looksLikeAll && membersById) {
      const values: GroupMemberLike[] =
        membersById instanceof Map
          ? Array.from(membersById.values())
          : Object.values(membersById as Record<number, GroupMemberLike>);
      list = values;
    }

    // исключаем плательщика и дубли
    const uniq = new Map<number, GroupMemberLike>();
    for (const u of list || []) {
      if (!u) continue;
      const id = Number((u as any).id);
      if (!Number.isFinite(id)) continue;
      if (id === Number(payerId)) continue; // не показываем плательщика
      if (!uniq.has(id)) uniq.set(id, u);
    }

    const arr = Array.from(uniq.values());
    if (!arr.length) return null;

    // динамический шаг оверлапа
    const n = arr.length;
    // чем больше элементов — тем сильнее оверлап (число отрицательное)
    const overlap = n <= 8 ? -6 : n <= 12 ? -10 : -14;

    return (
      <div className="flex items-center justify-end flex-nowrap whitespace-nowrap overflow-visible shrink-0">
        {arr.map((u, i) => (
          <RoundAvatar
            key={(u as any).id}
            src={avatarFromMember(u)}
            alt={nameFromMember(u)}
            size={20}
            className={i === 0 ? "" : "ml-[-6px]"} // базовый класс, реальный шаг зададим стилем
            style={{ marginLeft: i === 0 ? 0 : overlap }}
          />
        ))}
      </div>
    );
  }, [isExpense, participantsUsers, looksLikeAll, membersById, payerId]);

  // Строка «долг + аватарки» — одна линия
  const BottomRow =
    isExpense ? (
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="text-[12px] text-[var(--tg-hint-color)] truncate">
          {debt.type === "owe"
            ? `${debtYouOweLabel}${fmtNumberOnly(debt.amount, currency)}`
            : debt.type === "lent"
            ? `${debtOwesYouLabel}${fmtNumberOnly(debt.amount, currency)}`
            : debtNoDebtLabel}
        </div>
        {AvatarsStack}
      </div>
    ) : null;

  const Body = (
    <div className="flex items-start px-3 py-3 gap-3">
      {/* левая колонка: аватар категории/перевода + дата ПОД ним */}
      <div className="pt-[2px]">
        <div className="flex flex-col items-center w-10">
          {isExpense ? (
            <CategoryAvatar
              name={tx?.category?.name}
              color={tx?.category?.color}
              icon={tx?.category?.icon}
            />
          ) : (
            <TransferAvatarBox />
          )}
          <div className="text-[10px] text-[var(--tg-hint-color)] mt-1 text-center leading-none">
            {dateStr}
          </div>
        </div>
      </div>

      {/* контент */}
      <div className="min-w-0 flex-1">
        {TopRow}
        <div className="mt-1">{DetailsRow}</div>
        {BottomRow}
      </div>
    </div>
  );

  return hasId ? (
    <Link
      to={`/transactions/${txId}`}
      className={
        "block focus:outline-none focus:ring-2 focus:ring-[var(--tg-accent-color,#40A7E3)] rounded-xl " +
        (className || "")
      }
    >
      {Body}
    </Link>
  ) : (
    <div className={className || ""}>{Body}</div>
  );
}
