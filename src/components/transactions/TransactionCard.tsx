import { ArrowRightLeft, Layers } from "lucide-react";

type UserCore = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
};

export type GroupMemberLike = {
  user: UserCore;
  name?: string | null;
  avatar_url?: string | null;
};

type Props = {
  tx: any; // TransactionOut
  /** user_id -> участник */
  membersById: Record<number, GroupMemberLike> | Map<number, GroupMemberLike>;
  /** всего участников в группе (для “все (N)”) */
  groupMembersCount: number;
  /** локализатор (опционально) */
  t?: (k: string, vars?: Record<string, any>) => string;
};

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

function CategoryAvatar({ name, color, icon }: { name?: string; color?: string | null; icon?: string }) {
  const bg = typeof color === "string" && color.trim() ? color : "var(--tg-link-color)";
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: bg }}>
      <span style={{ fontSize: 16 }} aria-hidden>{icon || ch}</span>
    </div>
  );
}

function PersonAvatar({ src, name }: { src?: string; name?: string }) {
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return src ? (
    <img src={src} alt="" className="w-4 h-4 rounded-full object-cover" />
  ) : (
    <div className="w-4 h-4 rounded-full bg-[var(--tg-link-color)] text-white text-[10px] flex items-center justify-center">
      {ch}
    </div>
  );
}

export default function TransactionCard({ tx, membersById, groupMembersCount, t }: Props) {
  const isExpense = tx.type === "expense";

  // --- кто платил / кто отправил ---
  const payer = isExpense
    ? pickMember(Number(tx.paid_by), membersById)
    : pickMember(Number(tx.transfer_from), membersById);

  const payerName = fullName(payer?.user, payer?.name || undefined);
  const payerAvatar = avatarUrl(payer);

  // --- получатели (transfer_to) ---
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

  // --- участники расхода (из shares) ---
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

  // --- заголовок ---
  const title = isExpense
    ? (tx.comment?.toString().trim() || tx.category?.name || "—")
    : (() => {
        const fromN = payerName || "—";
        if (recipients.length === 0) return `${fromN} → ?`;
        if (recipients.length === 1)
          return `${fromN} → ${fullName(recipients[0].user, recipients[0].name || undefined)}`;
        const first = fullName(recipients[0].user, recipients[0].name || undefined);
        return `${fromN} → ${first} +${recipients.length - 1}`;
      })();

  const dateText = fmtDate(tx.date || tx.created_at);
  const amount = moneyToString(tx.amount, tx.currency);

  const paidByLabel = t ? t("tx_modal.paid_by_label") : "Заплатил";
  const equalLabel = t ? t("tx_modal.split_equal") : "Поровну";

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

          {isExpense && (
            <div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--tg-hint-color)]">
              <span className="inline-flex items-center gap-1">
                {payer && <PersonAvatar src={payerAvatar} name={payerName} />}
                <span className="opacity-90">
                  {paidByLabel}: <strong className="text-[var(--tg-text-color)]">{payerName || "—"}</strong>
                </span>
              </span>

              <span className="opacity-60">·</span>

              <span className="inline-flex items-center gap-1 min-w-0">
                <span className="opacity-90">за</span>
                {isAll ? (
                  <strong className="truncate text-[var(--tg-text-color)]">все ({allCount})</strong>
                ) : participants.length ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      {participants.slice(0, 3).map((m) => (
                        <PersonAvatar
                          key={m.user.id}
                          src={avatarUrl(m)}
                          name={fullName(m.user, m.name || undefined)}
                        />
                      ))}
                    </span>
                    <span className="truncate">
                      {participants.slice(0, 3).map((m) => fullName(m.user, m.name || undefined)).join(", ")}
                      {participants.length > 3 ? ` +${participants.length - 3}` : ""}
                    </span>
                  </>
                ) : (
                  <span className="opacity-60">—</span>
                )}
              </span>

              {tx.split_type === "equal" && (
                <>
                  <span className="opacity-60">·</span>
                  <div className="inline-flex items-center gap-1 rounded-lg border px-2 py-[2px]">
                    <Layers size={12} className="opacity-70" />
                    <span className="text-[12px]">{equalLabel}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="text-[14px] font-semibold shrink-0">{amount}</div>
      </div>
    </div>
  );
}
