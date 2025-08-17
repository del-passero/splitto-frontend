import React, { useMemo } from "react";
import { ArrowRightLeft, Layers } from "lucide-react";

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
type GroupMemberLike = { user: TGUser } | TGUser;

type TFunc = (k: string, vars?: Record<string, any>) => string;

type Props = {
  tx: any; // TransactionOut | LocalTx
  /** карта участников группы: id -> {user}|user */
  membersById?: Record<number, GroupMemberLike> | Map<number, GroupMemberLike>;
  /** кол-во участников группы (для "ВСЕ (N)") */
  groupMembersCount?: number;
  t?: TFunc;
  className?: string;
};

// --- utils
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

const firstLetter = (v: string) => (v || "").trim().charAt(0).toUpperCase() || "•";

function UserAvatar({ user, size = 18 }: { user?: TGUser; size?: number }) {
  const url = s(user?.photo_url || user?.avatar_url).trim();
  const name = makeName(user);
  return (
    <div
      className="rounded-full bg-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size }}
      title={name || undefined}
      aria-label={name || undefined}
    >
      {url ? (
        <img src={url} alt={name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
  const bg = typeof color === "string" && color.trim() ? color : "var(--tg-link-color)";
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: bg }}>
      <span style={{ fontSize: 16 }} aria-hidden>
        {icon || firstLetter(name || "")}
      </span>
    </div>
  );
}

export default function TransactionCard({
  tx,
  membersById,
  groupMembersCount,
  t,
  className,
}: Props) {
  const tKey = (k: string, fb: string) => {
    try {
      const v = t?.(k);
      return v && v !== k ? v : fb;
    } catch {
      return fb;
    }
  };

  const getById = (id?: number | null): TGUser | undefined => {
    if (id == null || !membersById) return undefined;
    const key = Number(id);
    const raw =
      membersById instanceof Map
        ? (membersById as Map<number, GroupMemberLike>).get(key)
        : (membersById as Record<number, GroupMemberLike>)[key];
    const u = userFromLike(raw);
    if (!u) {
      // eslint-disable-next-line no-console
      console.warn("[TransactionCard] Member not found in membersById by id=", key, tx);
    }
    return u;
  };

  const isExpense = tx?.type === "expense";

  // payer / transfer participants
  const paidById: number | undefined = tx?.paid_by ?? tx?.payer_id ?? tx?.payer ?? undefined;
  const payer = getById(paidById);

  const fromId: number | undefined = tx?.transfer_from ?? tx?.from_user_id ?? tx?.from_id ?? undefined;
  const fromUser = getById(fromId);

  const toListRaw =
    (Array.isArray(tx?.transfer_to) ? tx.transfer_to : undefined) ||
    (typeof tx?.to_user_id === "number" ? [tx.to_user_id] : undefined) ||
    (Array.isArray(tx?.to_user_ids) ? tx.to_user_ids : undefined) ||
    [];
  const toIds: number[] = toListRaw.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n));
  const toUsers: TGUser[] = toIds.map((id) => getById(id)).filter(Boolean) as TGUser[];

  // участники расхода из shares
  const participantsFromShares: TGUser[] = Array.isArray(tx?.shares)
    ? (tx.shares as any[])
        .map((s) => getById(Number(s?.user_id ?? s?.user?.id)))
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
      toUsers.length > 1 ? `${makeName(toUsers[0])} +${toUsers.length - 1}` : makeName(toUsers[0]);
    return `${fromName} → ${toName}`;
  }, [isExpense, tx, fromUser, toUsers]);

  const date = new Date(tx?.date || tx?.created_at || Date.now());
  const dateStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const amountNum = Number(tx?.amount ?? 0);
  const amountStr = `${isFinite(amountNum) ? amountNum.toFixed(2) : "0.00"} ${upper(tx?.currency)}`;

  const splitLabel =
    tx?.split_type === "equal"
      ? tKey("tx_modal.split_equal", "Поровну")
      : tx?.split_type === "shares"
      ? tKey("tx_modal.split_shares", "По долям")
      : tx?.split_type === "custom"
      ? tKey("tx_modal.split_custom", "Вручную")
      : null;

  const participantsTitle = looksLikeAll
    ? `${tKey("tx_modal.all", "ВСЕ")}${groupMembersCount ? ` (${groupMembersCount})` : ""}`
    : participantsFromShares.map(makeName).filter(Boolean).join(", ");

  const paidByLabel = tKey("tx_modal.paid_by_label", "Заплатил");

  return (
    <div
      className={
        "relative px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] " +
        (className || "")
      }
    >
      {/* Верхняя строка */}
      <div className="flex items-center gap-3">
        {isExpense ? (
          <CategoryAvatar
            name={tx?.category?.name}
            color={tx?.category?.color}
            icon={tx?.category?.icon}
          />
        ) : (
          <div className="w-10 h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center shrink-0">
            <ArrowRightLeft size={18} className="opacity-80" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">
            {title}
          </div>
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{dateStr}</div>
        </div>

        <div className="text-[14px] font-semibold shrink-0">{amountStr}</div>
      </div>

      {/* Нижняя строка (только для расходов) */}
      {isExpense && (
        <div className="mt-2 pl-12 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0">{paidByLabel}:</span>

            {/* Плательщик по ID */}
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar user={payer} />
              <span className="text-[12px] text-[var(--tg-text-color)] truncate">
                {makeName(payer)}
              </span>
            </div>

            <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0 mx-1">за</span>

            {/* Участники */}
            {looksLikeAll ? (
              <span className="text-[12px] text-[var(--tg-text-color)] whitespace-nowrap">
                {participantsTitle}
              </span>
            ) : (
              <div className="flex items-center gap-1 min-w-0">
                <div className="flex items-center gap-1">
                  {participantsFromShares.slice(0, 3).map((u) => (
                    <UserAvatar key={u.id} user={u} />
                  ))}
                </div>
                <span className="text-[12px] text-[var(--tg-text-color)] truncate max-w-[60vw]">
                  {participantsTitle}
                </span>
              </div>
            )}
          </div>

          {splitLabel && (
            <div className="ml-2 shrink-0 px-2 h-7 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] text-[12px] flex items-center gap-2">
              <Layers size={14} className="opacity-80" />
              <span>{splitLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
