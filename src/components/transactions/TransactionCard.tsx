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

/** 20 мая / May 20 — под аватаром. Ключи: date_card.pattern, date_card.months.* */
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

/** Долг зрителя по транзакции. Если viewerId не задан — считаем со стороны плательщика. */
function computeViewerDebt(
  tx: any,
  viewerId?: number
): { kind: "owe" | "lent"; amount: number } | null {
  if (!tx) return null;
  const total = Number(tx.amount ?? 0);
  if (!Number.isFinite(total)) return null;

  const payerId: number | undefined =
    tx.type === "expense"
      ? Number(tx.paid_by ?? tx.created_by ?? NaN)
      : Number(
          tx.transfer_from ??
            tx.from_user_id ??
            (Array.isArray(tx.transfer) ? tx.transfer[0] : NaN)
        );

  const me = viewerId ?? payerId;
  if (!me) return null;

  if (tx.type !== "expense") return null;

  // shares → считаем
  if (Array.isArray(tx.shares)) {
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
      const lent = Math.max(0, total - payerShare);
      return lent > 0 ? { kind: "lent", amount: lent } : null;
    }
    return myShare > 0 ? { kind: "owe", amount: myShare } : null;
  }

  // фолбэк: персональные поля
  const my = Number(tx.my_share ?? tx.my_amount ?? tx.my_part ?? tx.my_debt ?? NaN);
  if (Number.isFinite(my) && my > 0) {
    const iAmPayer = Number(me) === Number(payerId);
    if (iAmPayer) {
      const lent = Math.max(0, total - my);
      return lent > 0 ? { kind: "lent", amount: lent } : null;
    }
    return { kind: "owe", amount: my };
  }

  return null;
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
      style={{ width: size, height: size, background: "var(--tg-link-color)" }}
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

  // Тек. пользователь (если нет — фолбэк на плательщика для показа долга)
  const currentUserId =
    typeof currentUserIdProp === "number"
      ? currentUserIdProp
      : (() => {
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

  // participants
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
    (tx?.split_type === "equal" ||
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

  // расчёт долга (если currentUserId нет — считаем как плательщик)
  const viewerId = currentUserId ?? payerId;
  const viewerDebt = computeViewerDebt(tx, viewerId);

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

  const DebtRow =
    isExpense && viewerDebt ? (
      <div className="mt-1 text-[12px] text-[var(--tg-hint-color)]">
        {viewerDebt.kind === "owe"
          ? tKey(
              t,
              "group_participant_you_owe",
              `Вы должны: ${fmtNumberOnly(viewerDebt.amount, currency)}`,
              { sum: fmtNumberOnly(viewerDebt.amount, currency) }
            )
          : tKey(
              t,
              "group_participant_owes_you",
              `Вам должны: ${fmtNumberOnly(viewerDebt.amount, currency)}`,
              { sum: fmtNumberOnly(viewerDebt.amount, currency) }
            )}
      </div>
    ) : null;

  // Нижний ряд: аватары всех участников расхода (сначала плательщик, затем участники из shares).
  const AvatarsRow =
    isExpense ? (
      <div className="mt-2 pl-12">
        <div className="flex items-center gap-1">
          {/* плательщик первым */}
          <RoundAvatar src={payerAvatar} alt={payerName} size={20} />
          {/* участники (если shares пусто, но это «ВСЕ» — попробуем взять первых из membersById) */}
          {(() => {
            let list: GroupMemberLike[] = participantsUsers;

            if ((!list || list.length === 0) && looksLikeAll && membersById) {
              const values: GroupMemberLike[] =
                membersById instanceof Map
                  ? Array.from(membersById.values())
                  : Object.values(membersById as Record<number, GroupMemberLike>);
              list = values;
            }

            const uniq = new Map<number, GroupMemberLike>();
            for (const u of list || []) {
              if (!u) continue;
              const id = Number((u as any).id);
              if (!Number.isFinite(id)) continue;
              if (id === Number(payerId)) continue; // не дублируем плательщика
              if (!uniq.has(id)) uniq.set(id, u);
            }

            const arr = Array.from(uniq.values());
            const shown = arr.slice(0, 8);
            const rest = Math.max(0, arr.length - shown.length);

            return (
              <>
                {shown.map((u) => (
                  <RoundAvatar
                    key={(u as any).id}
                    src={avatarFromMember(u)}
                    alt={nameFromMember(u)}
                    size={20}
                  />
                ))}
                {rest > 0 && (
                  <div
                    className="w-5 h-5 rounded-full bg-[var(--tg-secondary-bg-color,#e6e6e6)] text-[10px] flex items-center justify-center"
                    title={`+${rest}`}
                  >
                    +{rest}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    ) : null;

  const Body = (
    <div className="flex items-start px-3 py-3 gap-3">
      {/* левая колонка: аватар категории/перевода + дата ПОД ним */}
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

      {/* контент */}
      <div className="min-w-0 flex-1">
        {TopRow}
        <div className="mt-1">{DetailsRow}</div>
        {DebtRow}
        {AvatarsRow}
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
