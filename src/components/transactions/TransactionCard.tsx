// src/components/transactions/TransactionCard.tsx
import React, { useMemo } from "react";
import { ArrowRightLeft, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TransactionOut } from "../../types/transaction";
import type { GroupMember } from "../../types/group_member";

type Props = {
  tx: TransactionOut | any;
  /** Участники группы для маппинга user_id -> имя/аватар */
  members?: GroupMember[];
  className?: string;
};

type TGUser = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
};

const safeStr = (x: unknown) => (typeof x === "string" ? x : "");

const fullName = (u?: TGUser | null) => {
  if (!u) return "";
  const fn = safeStr(u.first_name).trim();
  const ln = safeStr(u.last_name).trim();
  const nm = [fn, ln].filter(Boolean).join(" ").trim();
  return nm || (u?.username ? `@${u.username}` : `id${u?.id}`);
};

function UserAvatar({ user, size = 18 }: { user?: TGUser | null; size?: number }) {
  const name = fullName(user);
  const ch = (name || "").charAt(0).toUpperCase() || "•";
  const url = safeStr(user?.photo_url).trim();
  return (
    <div
      className="rounded-full bg-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={name}
      title={name}
    >
      {url ? (
        <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span className="text-[10px] opacity-80">{ch}</span>
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
  icon?: string;
}) {
  const bg = typeof color === "string" && color.trim() ? color : "var(--tg-link-color)";
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

export default function TransactionCard({ tx, members, className }: Props) {
  const { t } = useTranslation();
  const tKey = (k: string, fb: string) => {
    const v = t(k);
    return v === k ? fb : v;
  };

  // map: user_id -> TGUser
  const userMap = useMemo(() => {
    const m = new Map<number, TGUser>();
    (members || []).forEach((gm) => {
      const u = gm?.user;
      if (u?.id != null) m.set(Number(u.id), u as TGUser);
    });
    return m;
  }, [members]);

  const isExpense = tx.type === "expense";

  // Заголовок
  let title = "";
  if (isExpense) {
    title = safeStr(tx.comment).trim() || safeStr(tx.category?.name).trim() || "—";
  } else {
    const fromU = userMap.get(Number(tx.transfer_from));
    const toIds: number[] = Array.isArray(tx.transfer_to)
      ? (tx.transfer_to as any[]).map(Number)
      : typeof tx.transfer_to === "number"
      ? [Number(tx.transfer_to)]
      : [];
    const toUsers = toIds.map((id) => userMap.get(id)).filter(Boolean) as TGUser[];
    const toTitle =
      toUsers.length === 0
        ? "—"
        : `${fullName(toUsers[0])}${toUsers.length > 1 ? ` +${toUsers.length - 1}` : ""}`;
    title = `From ${fullName(fromU)} → To ${toTitle}`;
  }

  // Дата
  const d = new Date(tx.date || tx.created_at || Date.now());
  const dateStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  // Сумма/валюта
  const amountNum = Number(tx.amount ?? 0);
  const amount = `${amountNum.toFixed(2)} ${safeStr(tx.currency).toUpperCase()}`;

  // Плательщик
  const payer: TGUser | undefined = isExpense ? userMap.get(Number(tx.paid_by)) : undefined;

  // Участники
  const participantUsers: TGUser[] = useMemo(() => {
    const uniq = new Map<number, TGUser>();
    if (Array.isArray(tx.shares) && tx.shares.length > 0) {
      tx.shares.forEach((s: any) => {
        const u = userMap.get(Number(s.user_id));
        if (u) uniq.set(Number(u.id), u);
      });
    } else if (isExpense && tx.split_type === "equal" && members?.length) {
      members.forEach((gm) => {
        const u = gm?.user;
        if (u?.id != null) uniq.set(Number(u.id), u as TGUser);
      });
    }
    return Array.from(uniq.values());
  }, [tx.shares, tx.split_type, isExpense, members, userMap]);

  const isAll =
    isExpense &&
    tx.split_type === "equal" &&
    (!tx.shares || tx.shares.length === 0) &&
    (members?.length ?? 0) > 0;

  const participantsTitle = isAll
    ? `${tKey("tx_modal.all", "ВСЕ")} (${members?.length ?? 0})`
    : participantUsers.length
    ? participantUsers.map(fullName).join(", ")
    : "—";

  const splitLabel =
    tx.split_type === "equal"
      ? tKey("tx_modal.split_equal", "Поровну")
      : tx.split_type === "shares"
      ? tKey("tx_modal.split_shares", "По долям")
      : tx.split_type === "custom"
      ? tKey("tx_modal.split_custom", "Вручную")
      : null;

  return (
    <div
      className={
        "relative px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] " +
        (className || "")
      }
    >
      {/* header */}
      <div className="flex items-center gap-3">
        {isExpense ? (
          <CategoryAvatar name={tx.category?.name} color={tx.category?.color} icon={tx.category?.icon} />
        ) : (
          <div className="w-10 h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center shrink-0">
            <ArrowRightLeft size={18} className="opacity-80" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">{title}</div>
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{dateStr}</div>
        </div>

        <div className="text-[14px] font-semibold shrink-0">{amount}</div>
      </div>

      {/* footer for expense */}
      {isExpense && (
        <div className="mt-2 pl-12 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0">
              {tKey("tx_modal.paid_by_label", "Заплатил")}:
            </span>

            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar user={payer} />
              <span className="text-[12px] text-[var(--tg-text-color)] truncate max-w-[40vw]">
                {fullName(payer) || "—"}
              </span>

              <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0">за</span>

              <div className="flex items-center gap-1 shrink-0">
                {participantUsers.slice(0, 3).map((u) => (
                  <UserAvatar key={u.id} user={u} />
                ))}
                {participantUsers.length > 3 && (
                  <span className="text-[11px] text-[var(--tg-hint-color)]">+{participantUsers.length - 3}</span>
                )}
              </div>

              <span className="text-[12px] text-[var(--tg-hint-color)] truncate max-w-[30vw]">
                {participantsTitle}
              </span>
            </div>
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
