// src/components/transactions/TransactionCard.tsx
import { ArrowRightLeft, Layers } from "lucide-react";

/** Базовые типы участника (достаточно этих полей) */
type UserCore = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
};

export type GroupMemberLike = {
  user: UserCore;
  name?: string | null;        // кастомное имя, если есть
  avatar_url?: string | null;  // кастомный аватар, если есть
};

type Props = {
  tx: any; // TransactionOut
  /** соответствие user_id -> участник группы */
  membersById: Record<number, GroupMemberLike> | Map<number, GroupMemberLike>;
  /** всего участников в группе (для кейса "все") */
  groupMembersCount: number;
  /** опциональный локализатор */
  t?: (k: string, vars?: Record<string, any>) => string;
};

/* -------------------- helpers -------------------- */

function pickMember(
  id?: number | null,
  map?: Record<number, GroupMemberLike> | Map<number, GroupMemberLike>
): GroupMemberLike | undefined {
  if (!id || !map) return undefined;
  if (map instanceof Map) return map.get(id);
  return (map as Record<number, GroupMemberLike>)[id];
}

function fullName(u?: UserCore | null, fallback?: string | null) {
  if (!u) return (fallback || "").trim();
  const first = (u.first_name || "").trim();
  const last = (u.last_name || "").trim();
  const composed = `${first} ${last}`.trim();
  if (composed) return composed;
  if (u.username) return u.username;
  return (fallback || "").trim();
}

/** Только имя (первое слово) */
function firstNameFrom(full: string) {
  const tok = (full || "").trim().split(/\s+/).filter(Boolean);
  return tok[0] || full || "";
}

function avatarUrl(m?: GroupMemberLike) {
  return m?.avatar_url || m?.user?.photo_url || undefined;
}

function fmtDate(input?: string | number | Date) {
  const d = input ? new Date(input) : new Date();
  try {
    return d.toLocaleDateString();
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
}

function moneyToString(amount: unknown, currency?: string | null) {
  const n = Number(amount ?? 0);
  const v = Number.isFinite(n) ? n : 0;
  try {
    const s = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    return currency ? `${s} ${currency}` : s;
  } catch {
    return currency ? `${v.toFixed(2)} ${currency}` : v.toFixed(2);
  }
}

/* -------------------- UI atoms -------------------- */

function CategoryAvatar({ name, color, icon }: { name?: string; color?: string | null; icon?: string }) {
  const bg = typeof color === "string" && color.trim() ? color : "var(--tg-link-color)";
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: bg }}>
      <span style={{ fontSize: 16 }} aria-hidden>{icon || ch}</span>
    </div>
  );
}

function PersonAvatar({ src, name, size = 16 }: { src?: string; name?: string; size?: number }) {
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  const cls = size <= 16 ? "text-[10px]" : "text-[12px]";
  return src ? (
    <img src={src} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div
      className={`rounded-full bg-[var(--tg-link-color)] text-white flex items-center justify-center ${cls}`}
      style={{ width: size, height: size }}
    >
      {ch}
    </div>
  );
}

function SplitChip({ type, t }: { type?: string | null; t?: Props["t"] }) {
  if (!type) return null;
  const text =
    type === "equal"
      ? (t?.("tx_modal.split_equal") || "Поровну")
      : type === "shares"
      ? (t?.("tx_modal.split_shares") || "По долям")
      : (t?.("tx_modal.split_custom") || "Вручную");

  return (
    <span className="inline-flex items-center gap-1 px-2 h-6 rounded-lg text-[12px]"
      style={{
        background: "color-mix(in srgb, var(--tg-link-color) 12%, transparent)",
        border: "1px solid color-mix(in srgb, var(--tg-link-color) 35%, transparent)"
      }}>
      <Layers size={14} />
      {text}
    </span>
  );
}

/* -------------------- Card -------------------- */

export default function TransactionCard({ tx, membersById, groupMembersCount, t }: Props) {
  const isExpense = tx.type === "expense";

  // payer / sender
  const payer = isExpense
    ? pickMember(Number(tx.paid_by), membersById)
    : pickMember(Number(tx.transfer_from), membersById);
  const payerFull = fullName(payer?.user, payer?.name || undefined);
  const payerName = firstNameFrom(payerFull);
  const payerAvatar = avatarUrl(payer);

  // recipients (transfer)
  const toRaw = tx.transfer_to ?? [];
  const toIds: number[] = Array.isArray(toRaw)
    ? toRaw.map((x: unknown) => Number(x)).filter((n: number) => Number.isFinite(n))
    : String(toRaw)
        .split(/[,\s]+/)
        .map((x: string) => Number(x))
        .filter((n: number) => Number.isFinite(n));

  const recipients = toIds
    .map((id) => pickMember(id, membersById))
    .filter((m): m is GroupMemberLike => Boolean(m));

  // expense participants from shares
  const shareUserIds: number[] = Array.isArray(tx.shares)
    ? Array.from(
        new Set(
          (tx.shares as any[])
            .map((s) => Number(s?.user_id))
            .filter((n: number) => Number.isFinite(n))
        )
      )
    : [];

  const participants = shareUserIds
    .map((id) => pickMember(id, membersById))
    .filter((m): m is GroupMemberLike => Boolean(m));

  const allCount = groupMembersCount || 0;
  const isAll =
    tx.split_type === "equal" &&
    allCount > 0 &&
    participants.length > 0 &&
    participants.length >= allCount;

  // title
  const title = isExpense
    ? (tx.comment?.toString().trim() || tx.category?.name || "—")
    : (() => {
        const fromN = payerName || "—";
        if (recipients.length === 0) return `${fromN} → ?`;
        if (recipients.length === 1) {
          const rFull = fullName(recipients[0].user, recipients[0].name || undefined);
          return `${fromN} → ${firstNameFrom(rFull)}`;
        }
        const first = firstNameFrom(fullName(recipients[0].user, recipients[0].name || undefined));
        return `${fromN} → ${first} +${recipients.length - 1}`;
      })();

  const dateText = fmtDate(tx.date || tx.created_at);
  const amount = moneyToString(tx.amount, tx.currency);

  // participants text (имена только первые слова)
  const participantsText = isAll
    ? `${t?.("tx_modal.all") || "все"}, ${allCount}`
    : participants
        .slice(0, 2)
        .map((m) => firstNameFrom(fullName(m.user, m.name || undefined)))
        .join(", ") + (participants.length > 2 ? ` +${participants.length - 2}` : "");

  const paidByLabel = t?.("tx_modal.paid_by_label") || "Заплатил";

  return (
    <div className="relative px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)]">
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
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{dateText}</div>

          {/* Детали для расхода: Заплатил + участники + чип сплита */}
          {isExpense && (
            <div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--tg-text-color)]">
              <span className="opacity-70">{paidByLabel}:</span>

              {/* payer */}
              {payer && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <PersonAvatar src={payerAvatar} name={payerName} size={18} />
                  <span className="truncate font-medium">{payerName}</span>
                </span>
              )}

              {/* разделитель */}
              {participants.length > 0 && <span className="opacity-40">·</span>}

              {/* участники: маленькие аватарки + только имена */}
              {participants.length > 0 && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <span className="inline-flex items-center gap-[2px]">
                    {participants.slice(0, 3).map((m) => (
                      <PersonAvatar
                        key={m.user.id}
                        src={avatarUrl(m)}
                        name={firstNameFrom(fullName(m.user, m.name || undefined))}
                        size={16}
                      />
                    ))}
                  </span>
                  <span className="truncate opacity-80">за {participantsText}</span>
                </span>
              )}

              {/* чип типа деления справа */}
              <span className="ml-auto">
                <SplitChip type={tx.split_type} t={t} />
              </span>
            </div>
          )}
        </div>

        <div className="text-[14px] font-semibold shrink-0">{amount}</div>
      </div>
    </div>
  );
}
