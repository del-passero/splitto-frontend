// src/components/transactions/TransactionCard.tsx
import { ArrowRightLeft, Layers, User, Users } from "lucide-react";

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
  /** карта участников группы по id; опционально, но очень желательно */
  membersById?: MembersMap;
  /** количество участников в группе (для split_type='equal') */
  groupMembersCount?: number;
  /** i18n-функция (опционально). Если не дадите — будут разумные русские фоллбэки */
  t?: (k: string, vars?: Record<string, any>) => string;
};

function displayNameFromUser(u?: TGUser | null): string {
  if (!u) return "";
  const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return name || u.username || String(u.id);
}

function displayNameFromId(id: any, membersById?: MembersMap): string {
  const uid = Number(id);
  if (Number.isFinite(uid) && membersById?.[uid]?.user) {
    return displayNameFromUser(membersById[uid]!.user);
  }
  return Number.isFinite(uid) ? String(uid) : "";
}

function Avatar({ user, size = 22 }: { user?: TGUser; size?: number }) {
  const name = displayNameFromUser(user);
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

function AvatarStack({ users, size = 20, max = 5 }: { users: TGUser[]; size?: number; max?: number }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((u) => (
          <div key={u.id} className="relative z-0">
            <Avatar user={u} size={size} />
          </div>
        ))}
      </div>
      {rest > 0 && <div className="ml-1 text-[11px] text-[var(--tg-hint-color)]">+{rest}</div>}
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
  const T = (k: string) => {
    if (typeof t === "function") return t(k);
    // фоллбэки без добавления новых ключей
    const ru: Record<string, string> = {
      "tx_modal.paid_by_label": "Заплатил",
      "tx_modal.all": "ВСЕ",
      "tx_modal.split_equal": "Поровну",
      "tx_modal.split_shares": "По долям",
      "tx_modal.split_custom": "Вручную",
    };
    return ru[k] ?? k;
  };

  const isExpense = tx.type === "expense";

  // ==== Пользователи (по id) ====
  const payerUser = Number.isFinite(Number(tx.paid_by)) ? membersById[Number(tx.paid_by)]?.user : undefined;

  const senderUser = Number.isFinite(Number(tx.transfer_from))
    ? membersById[Number(tx.transfer_from)]?.user
    : undefined;

  const recipientsUsers: TGUser[] = Array.isArray(tx.transfer_to)
    ? tx.transfer_to
        .map((id: any) => (Number.isFinite(Number(id)) ? membersById[Number(id)]?.user : undefined))
        .filter(Boolean) as TGUser[]
    : [];

  // ==== Заголовок ====
  // Расход — строго comment; Перевод — "From КТО → To КТО" (имена/ID)
  const expenseTitle: string = (tx.comment || "").toString().trim() || tx.category?.name || "—";
  const fromLabel = displayNameFromUser(senderUser) || displayNameFromId(tx.transfer_from, membersById) || "From";
  const toLabel =
    recipientsUsers.length > 0
      ? recipientsUsers.map(displayNameFromUser).join(", ")
      : Array.isArray(tx.transfer_to)
        ? tx.transfer_to.map((id: any) => displayNameFromId(id, membersById)).join(", ")
        : "To";
  const transferTitle = `${fromLabel} → ${toLabel}`;
  const title = isExpense ? expenseTitle : transferTitle;

  // ==== Дата ====
  const dateRaw = tx.date || tx.created_at || Date.now();
  const dt = new Date(dateRaw);
  const dateStr = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString().slice(0, 5)}`;

  // ==== Сумма/валюта ====
  const amountNum = Number(tx.amount ?? 0);
  const currency = tx.currency || "";
  const amount = `${amountNum.toFixed(2)} ${currency}`;

  // ==== Участники расхода ====
  const shareUserIds: number[] = Array.isArray(tx.shares)
    ? Array.from(new Set(tx.shares.map((s: any) => Number(s.user_id)).filter((x: any) => Number.isFinite(x))))
    : [];

  const participantsUsers: TGUser[] =
    shareUserIds.length > 0
      ? shareUserIds
          .map((uid) => membersById[uid]?.user)
          .filter(Boolean) as TGUser[]
      : [];

  const isAll =
    isExpense &&
    tx.split_type === "equal" &&
    typeof groupMembersCount === "number" &&
    groupMembersCount > 0 &&
    Object.keys(membersById).length === groupMembersCount;

  const participantsLabel = isAll
    ? `${T("tx_modal.all")} (${groupMembersCount})`
    : participantsUsers.length
      ? `${participantsUsers.slice(0, 3).map(displayNameFromUser).join(", ")}${
          participantsUsers.length > 3 ? `, +${participantsUsers.length - 3}` : ""
        } (${participantsUsers.length})`
      : "—";

  // ==== Читаемое название split_type ====
  const splitReadable =
    tx.split_type === "equal"
      ? T("tx_modal.split_equal")
      : tx.split_type === "shares"
        ? T("tx_modal.split_shares")
        : tx.split_type === "custom"
          ? T("tx_modal.split_custom")
          : "";

  return (
    <div className="relative px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)]">
      {/* Верх */}
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
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{dateStr}</div>
        </div>

        <div className="text-[14px] font-semibold shrink-0">{amount}</div>
      </div>

      {/* Низ */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {isExpense ? (
          // "Заплатил {payer} за {участники}"
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--tg-secondary-bg-color,#f2f2f2)]">
            <span className="opacity-80"><User size={14} /></span>
            <span className="text-[11px] opacity-70">{T("tx_modal.paid_by_label")}:</span>
            <span className="inline-flex items-center gap-1">
              {payerUser && <Avatar user={payerUser} />}
              <span className="text-[11px] font-medium text-[var(--tg-text-color)]">
                {displayNameFromUser(payerUser) || displayNameFromId(tx.paid_by, membersById) || "—"}
              </span>
            </span>
            <span className="text-[11px] opacity-70">&nbsp;за&nbsp;</span>
            {isAll ? (
              <>
                <AvatarStack
                  users={Object.values(membersById).map((gm) => gm?.user).filter(Boolean) as TGUser[]}
                  size={18}
                />
                <span className="text-[11px] font-medium text-[var(--tg-text-color)]">{participantsLabel}</span>
              </>
            ) : participantsUsers.length ? (
              <>
                <AvatarStack users={participantsUsers} size={18} />
                <span className="text-[11px] font-medium text-[var(--tg-text-color)]">{participantsLabel}</span>
              </>
            ) : (
              <span className="text-[11px] font-medium text-[var(--tg-text-color)]">—</span>
            )}
          </div>
        ) : (
          // Для переводов: отобразим участников с аватарками
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--tg-secondary-bg-color,#f2f2f2)]">
            <span className="opacity-80"><Users size={14} /></span>
            <AvatarStack users={[senderUser, ...recipientsUsers].filter(Boolean) as TGUser[]} size={18} />
          </div>
        )}

        {/* Split badge (читаемо) */}
        {isExpense && splitReadable && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--tg-secondary-bg-color,#f2f2f2)] text-[11px]">
            <span className="opacity-80"><Layers size={14} /></span>
            <span className="font-medium text-[var(--tg-text-color)]">{splitReadable}</span>
          </div>
        )}
      </div>
    </div>
  );
}
