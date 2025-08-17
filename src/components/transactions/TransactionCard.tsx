// src/components/transactions/TransactionCard.tsx
import { ArrowRightLeft, Layers, User, Users } from "lucide-react";
import { useMemo } from "react";

type TGUser = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
};

type GroupMember = { user: TGUser };
type MembersMap = Record<number, GroupMember | undefined>;

type Props = {
  tx: any; // TransactionOut | LocalTx
  membersById?: MembersMap;
  groupMembersCount?: number;
  t?: (k: string, vars?: Record<string, any>) => string;
};

function displayName(u?: TGUser | null): string {
  if (!u) return "";
  const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return name || u.username || String(u.id);
}

function Avatar({ user, size = 22 }: { user?: TGUser; size?: number }) {
  const name = displayName(user);
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "•";
  const bg = "var(--tg-secondary-bg-color,#e7e7e7)";
  const color = "var(--tg-text-color)";
  const url = user?.photo_url?.trim();

  return (
    <div
      className="rounded-full overflow-hidden border border-[var(--tg-secondary-bg-color,#d7d7d7)] bg-[var(--tg-card-bg)] shrink-0"
      style={{ width: size, height: size }}
      title={name}
      aria-label={name}
    >
      {url ? (
        <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div
          className="w-full h-full grid place-items-center"
          style={{ background: bg, color, fontSize: Math.max(10, Math.floor(size * 0.46)) }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

function AvatarStack({ users, max = 5, size = 20 }: { users: TGUser[]; max?: number; size?: number }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((u, i) => (
          <div key={u.id ?? i} className="relative z-0">
            <Avatar user={u} size={size} />
          </div>
        ))}
      </div>
      {rest > 0 && (
        <div className="ml-1 text-[11px] text-[var(--tg-hint-color)]">+{rest}</div>
      )}
    </div>
  );
}

function CategoryAvatar({ name, color, icon }: { name?: string; color?: string | null; icon?: string }) {
  const bg = typeof color === "string" && color.trim() ? color : "var(--tg-link-color)";
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: bg }}>
      <span style={{ fontSize: 16 }} aria-hidden>{icon || ch}</span>
    </div>
  );
}

export default function TransactionCard({ tx, membersById = {}, groupMembersCount, t }: Props) {
  const _t = (k: string, vars?: any) => (typeof t === "function" ? t(k, vars) : k);

  const isExpense = tx.type === "expense";

  // ===== Пользователи (по id -> данные) =====
  const payerUser =
    (typeof tx.paid_by === "number" && membersById[tx.paid_by]?.user) || null;

  const senderUser =
    (typeof tx.transfer_from === "number" && membersById[tx.transfer_from]?.user) || null;

  const recipientsUsers =
    (Array.isArray(tx.transfer_to) ? tx.transfer_to : tx.transfer_to ? [tx.transfer_to] : [])
      .map((id: any) => (typeof id === "number" ? membersById[id]?.user : null))
      .filter(Boolean) as TGUser[];

  // ===== Заголовок =====
  // Расход: по ТЗ вместо "Expense" — комментарий.
  // Перевод: "From КТО → To КТО"
  const expenseTitle = (tx.comment || "").toString().trim() || tx.category?.name || "—";
  const transferTitle = `${displayName(senderUser) || tx.from_name || "From"} → ${
    recipientsUsers.length
      ? recipientsUsers.map(displayName).join(", ")
      : (Array.isArray(tx.to_name) && tx.to_name.length ? tx.to_name.join(", ") : (tx.to_name || "To"))
  }`;
  const title = isExpense ? expenseTitle : transferTitle;

  // ===== Дата =====
  const dateRaw = tx.date || tx.created_at || Date.now();
  const dateLocal = new Date(dateRaw);
  const dateLabel = `${dateLocal.toLocaleDateString()} ${dateLocal.toLocaleTimeString().slice(0,5)}`;

  // ===== Сумма/валюта =====
  const amountNum = Number(tx.amount ?? 0);
  const currency = tx.currency || "";
  const amount = `${amountNum.toFixed(2)} ${currency}`;

  // ===== Участники расхода =====
  const shareUserIds: number[] = Array.isArray(tx.shares)
    ? Array.from(new Set(tx.shares.map((s: any) => Number(s.user_id)).filter((x: any) => Number.isFinite(x))))
    : [];

  const participantsExpense: TGUser[] = useMemo(() => {
    if (shareUserIds.length) {
      return shareUserIds
        .map((uid) => membersById[uid]?.user)
        .filter(Boolean) as TGUser[];
    }
    if (tx.split_type === "equal" && typeof groupMembersCount === "number") {
      return Object.values(membersById).map((gm) => gm?.user).filter(Boolean) as TGUser[];
    }
    return [];
  }, [shareUserIds.join(","), tx.split_type, membersById, groupMembersCount]);

  const isAll = isExpense && tx.split_type === "equal" && groupMembersCount && groupMembersCount > 0;

  // Подпись «за кого» (для расходов)
  const participantsLabel = isAll
    ? `${_t("tx_modal.all")} (${groupMembersCount})`
    : participantsExpense.length
      ? `${participantsExpense.slice(0, 3).map(displayName).join(", ")}${
          participantsExpense.length > 3 ? `, +${participantsExpense.length - 3}` : ""
        } (${participantsExpense.length})`
      : "—";

  return (
    <div className="relative px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)]">
      {/* Верхняя строка */}
      <div className="flex items-center gap-3">
        {isExpense ? (
          <CategoryAvatar name={tx.category?.name} color={tx.category?.color} icon={tx.category?.icon} />
        ) : (
          <div className="w-10 h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] grid place-items-center shrink-0">
            <ArrowRightLeft size={18} className="opacity-80" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">{title}</div>
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{dateLabel}</div>
        </div>

        <div className="text-[14px] font-semibold shrink-0">{amount}</div>
      </div>

      {/* Нижняя зона: по ТЗ */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {isExpense ? (
          // "Заплатил {payer} за {участники}"
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--tg-secondary-bg-color,#f2f2f2)]">
            <span className="opacity-80"><User size={14} /></span>
            <span className="text-[11px] opacity-70">{_t("tx_modal.paid_by_label")}:</span>
            <span className="inline-flex items-center gap-1">
              <Avatar user={payerUser ?? undefined} />
              <span className="text-[11px] font-medium text-[var(--tg-text-color)]">
                {displayName(payerUser) || tx.paid_by_name || String(tx.paid_by ?? "—")}
              </span>
            </span>
            <span className="text-[11px] opacity-70">&nbsp;за&nbsp;</span>
            {isAll ? (
              <>
                <AvatarStack
                  users={Object.values(membersById).map((m) => m?.user).filter(Boolean) as TGUser[]}
                  size={18}
                />
                <span className="text-[11px] font-medium text-[var(--tg-text-color)]">{participantsLabel}</span>
              </>
            ) : participantsExpense.length ? (
              <>
                <AvatarStack users={participantsExpense} size={18} />
                <span className="text-[11px] font-medium text-[var(--tg-text-color)]">{participantsLabel}</span>
              </>
            ) : (
              <span className="text-[11px] font-medium text-[var(--tg-text-color)]">—</span>
            )}
          </div>
        ) : (
          // Для переводов заголовок уже "From КТО → To КТО".
          // Дополнительно компактно покажем участников (отправитель + получатели), чтобы были аватарки.
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--tg-secondary-bg-color,#f2f2f2)]">
            <span className="opacity-80"><Users size={14} /></span>
            <AvatarStack users={[senderUser, ...recipientsUsers].filter(Boolean) as TGUser[]} size={18} />
          </div>
        )}

        {/* Тип деления, если нужно подсветить */}
        {isExpense && tx.split_type && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--tg-secondary-bg-color,#f2f2f2)] text-[11px]">
            <span className="opacity-80"><Layers size={14} /></span>
            <span className="font-medium text-[var(--tg-text-color)]">{tx.split_type}</span>
          </div>
        )}
      </div>
    </div>
  );
}
