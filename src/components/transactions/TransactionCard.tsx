// src/components/transactions/TransactionCard.tsx
import { ArrowRightLeft, CalendarClock, Layers, User, Users } from "lucide-react";
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
  t?: (k: string, vars?: Record<string, any>) => string; // на случай, если пробросите t из верхнего уровня
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

function AvatarStack({ users, max = 5 }: { users: TGUser[]; max?: number }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((u, i) => (
          <div key={u.id ?? i} className="relative z-0">
            <Avatar user={u} size={22} />
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

function Row({ icon, label, value }: { icon?: React.ReactNode; label?: string; value: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--tg-secondary-bg-color,#f2f2f2)] text-[11px]">
      {icon ? <span className="opacity-80">{icon}</span> : null}
      {label ? <span className="opacity-70">{label}:</span> : null}
      <span className="font-medium text-[var(--tg-text-color)]">{value}</span>
    </div>
  );
}

export default function TransactionCard({ tx, membersById = {}, groupMembersCount, t }: Props) {
  const _t = (k: string, vars?: any) => (typeof t === "function" ? t(k, vars) : k);

  const isExpense = tx.type === "expense";

  // ===== Заголовок =====
  const senderUser =
    (typeof tx.transfer_from === "number" && membersById[tx.transfer_from]?.user) || null;
  const recipientsUsers =
    (Array.isArray(tx.transfer_to) ? tx.transfer_to : tx.transfer_to ? [tx.transfer_to] : [])
      .map((id: any) => (typeof id === "number" ? membersById[id]?.user : null))
      .filter(Boolean) as TGUser[];

  const payerUser =
    (typeof tx.paid_by === "number" && membersById[tx.paid_by]?.user) || null;

  const catName = tx.category?.name?.trim() || "";
  const title = isExpense
    ? (catName || "Expense")
    : `${displayName(senderUser) || tx.from_name || "From"} → ${
        recipientsUsers.length
          ? recipientsUsers.map(displayName).join(", ")
          : (Array.isArray(tx.to_name) && tx.to_name.length ? tx.to_name.join(", ") : (tx.to_name || "To"))
      }`;

  // ===== Дата =====
  const dateRaw = tx.date || tx.created_at || Date.now();
  const dateLocal = new Date(dateRaw);
  const dateLabel = `${dateLocal.toLocaleDateString()} ${dateLocal.toLocaleTimeString().slice(0,5)}`;

  // ===== Сумма/валюта =====
  const amountNum = Number(tx.amount ?? 0);
  const currency = tx.currency || "";
  const amount = `${amountNum.toFixed(2)} ${currency}`;

  // ===== Участники =====
  const shareUserIds: number[] = Array.isArray(tx.shares)
    ? Array.from(new Set(tx.shares.map((s: any) => Number(s.user_id)).filter((x: any) => Number.isFinite(x))))
    : [];

  const participantUsersExpense: TGUser[] = useMemo(() => {
    // если переданы shares — участники из shares
    if (shareUserIds.length) {
      return shareUserIds
        .map((uid) => membersById[uid]?.user)
        .filter(Boolean) as TGUser[];
    }
    // если split_type = equal — считаем, что участвовали все члены группы
    if (tx.split_type === "equal" && typeof groupMembersCount === "number") {
      // вернём до 8, чтобы отрисовать стаки; текст покажем ВСЕ (N)
      const list: TGUser[] = Object.values(membersById)
        .map((gm) => gm?.user)
        .filter(Boolean) as TGUser[];
      return list;
    }
    return [];
  }, [shareUserIds.join(","), tx.split_type, membersById, groupMembersCount]);

  const isAll = tx.split_type === "equal" && groupMembersCount && groupMembersCount > 0;

  const participantsValueNode = isAll ? (
    <span>
      {_t("tx_modal.all")} ({groupMembersCount})
    </span>
  ) : participantUsersExpense.length ? (
    <span>
      {participantUsersExpense.slice(0, 3).map(displayName).join(", ")}
      {participantUsersExpense.length > 3 ? `, +${participantUsersExpense.length - 3}` : ""} ({participantUsersExpense.length})
    </span>
  ) : (
    // Для перевода — участники это отправитель + получатели
    (tx.type === "transfer" && (senderUser || recipientsUsers.length)) ? (
      <span>
        {[senderUser, ...recipientsUsers].filter(Boolean).slice(0, 3).map(displayName).join(", ")}
        {[senderUser, ...recipientsUsers].filter(Boolean).length > 3
          ? `, +${[senderUser, ...recipientsUsers].filter(Boolean).length - 3}`
          : ""} ({[senderUser, ...recipientsUsers].filter(Boolean).length})
      </span>
    ) : (
      <span>—</span>
    )
  );

  // ====== UI ======
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
          {/* Дата под заголовком (компактно) */}
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{dateLabel}</div>
        </div>

        <div className="text-[14px] font-semibold shrink-0">{amount}</div>
      </div>

      {/* Метаданные: платил, участники */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* Кто платил / отправитель */}
        {isExpense ? (
          <Row
            icon={<User size={14} />}
            label={_t("tx_modal.paid_by_label")}
            value={
              <span className="inline-flex items-center gap-1">
                <Avatar user={payerUser ?? undefined} />
                <span>{displayName(payerUser) || tx.paid_by_name || String(tx.paid_by ?? "—")}</span>
              </span>
            }
          />
        ) : senderUser ? (
          <Row
            icon={<User size={14} />}
            label={_t("tx_modal.paid_by_label")}
            value={
              <span className="inline-flex items-center gap-1">
                <Avatar user={senderUser} />
                <span>{displayName(senderUser)}</span>
              </span>
            }
          />
        ) : null}

        {/* Участники */}
        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--tg-secondary-bg-color,#f2f2f2)]">
          <span className="opacity-80"><Users size={14} /></span>
          <span className="opacity-70 text-[11px]">{_t("tx_modal.participants")}:</span>
          {/* аватар-стек */}
          {isAll ? (
            <AvatarStack users={Object.values(membersById).map((m) => m?.user).filter(Boolean) as TGUser[]} />
          ) : participantUsersExpense.length ? (
            <AvatarStack users={participantUsersExpense} />
          ) : (
            <AvatarStack users={[senderUser, ...recipientsUsers].filter(Boolean) as TGUser[]} />
          )}
          {/* подпись */}
          <span className="font-medium text-[11px] text-[var(--tg-text-color)]">{participantsValueNode}</span>
        </div>

        {/* Тип деления — если хотим компактно подсветить */}
        {isExpense && tx.split_type && (
          <Row icon={<Layers size={14} />} value={tx.split_type} />
        )}
      </div>
    </div>
  );
}
