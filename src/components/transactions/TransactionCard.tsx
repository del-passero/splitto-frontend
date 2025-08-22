// src/components/transactions/TransactionCard.tsx
import { ArrowRightLeft, Layers } from "lucide-react";

/** Минимальный тип участника, который нам нужен для имени и аватара */
export type GroupMemberLike = {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string | null;
  photo_url?: string | null;
};

type MembersMap = Record<number, GroupMemberLike> | Map<number, GroupMemberLike>;

type Props = {
  /** Транзакция из API (TransactionOut) или локальная */
  tx: any;
  /** Участники группы по id — Object или Map */
  membersById?: MembersMap;
  /** Сколько всего участников в группе (для “+N”) */
  groupMembersCount?: number;
  /** i18n, если прокинут */
  t?: (k: string, vars?: Record<string, any>) => string;
};

/* ------------------------- helpers ------------------------- */

function getMember(membersById: MembersMap | undefined, id?: number | null): GroupMemberLike | undefined {
  if (!membersById || id == null) return undefined;
  if (membersById instanceof Map) return membersById.get(Number(id));
  return (membersById as Record<number, GroupMemberLike>)[Number(id)];
}

function onlyFirstName(m?: GroupMemberLike): string {
  if (!m) return "";
  const raw =
    (m.name ?? "").trim() ||
    `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() ||
    (m.username ? String(m.username) : "");
  const token = raw.split(/\s+/).filter(Boolean)[0];
  return token || (m.username ? String(m.username) : "");
}

function avatarUrl(m?: GroupMemberLike): string | undefined {
  return (m?.avatar_url || m?.photo_url || undefined) ?? undefined;
}

function fmtAmount(nLike: any, currency?: string, locale?: string) {
  const n = Number(nLike);
  const val = Number.isFinite(n) ? n : 0;
  try {
    const nf = new Intl.NumberFormat(locale || undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${nf.format(val)} ${currency ?? ""}`.trim();
  } catch {
    return `${val.toFixed(2)} ${currency ?? ""}`.trim();
  }
}

function fmtDateISO(dateLike?: string) {
  const d = dateLike ? new Date(dateLike) : new Date();
  // ДД.ММ.ГГГГ — универсально и коротко
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function takeFirst<T>(arr: T[] | undefined, n: number) {
  if (!arr || arr.length <= n) return { head: arr ?? [], rest: 0 };
  return { head: arr.slice(0, n), rest: arr.length - n };
}

/* ------------------------- UI bits ------------------------- */

function CircleAvatar({
  url,
  label,
  size = 18,
}: {
  url?: string;
  label?: string;
  size?: number;
}) {
  const fallback = (label || "•").charAt(0).toUpperCase();
  return url ? (
    <img
      src={url}
      alt=""
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="rounded-full text-[11px] flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        color: "var(--tg-theme-button-text-color)",
        background: "var(--tg-theme-button-color)",
      }}
      aria-hidden
    >
      {fallback}
    </span>
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
    typeof color === "string" && color.trim().length
      ? color!
      : "color-mix(in srgb, var(--tg-theme-link-color) 14%, transparent)";
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: bg, color: "var(--tg-theme-button-text-color)" }}
      aria-hidden
    >
      <span style={{ fontSize: 16 }}>{icon || ch}</span>
    </div>
  );
}

/* ------------------------- Card ------------------------- */

export default function TransactionCard({ tx, membersById, groupMembersCount, t }: Props) {
  const isExpense = tx?.type === "expense";

  // ----- title -----
  const fromId: number | undefined =
    Number(tx?.transfer_from ?? tx?.from_user_id ?? NaN) || undefined;
  const toListRaw: any[] =
    (Array.isArray(tx?.transfer_to) && tx.transfer_to) ||
    (typeof tx?.to_user_id === "number" ? [tx.to_user_id] : []) ||
    [];
  const toIds: number[] = toListRaw.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n));

  const fromMember = getMember(membersById, fromId);
  const toMembers = toIds.map((id) => getMember(membersById, id)).filter(Boolean) as GroupMemberLike[];

  const paidByMember = getMember(membersById, Number(tx?.paid_by));
  const paidByName = onlyFirstName(paidByMember);

  let title = "";
  if (isExpense) {
    title = (tx?.comment ?? "").trim() || (tx?.category?.name ?? "");
    if (!title) title = ""; // оставляем пустым — чтобы не плодить “Expense”
  } else {
    const fromName = onlyFirstName(fromMember) || "—";
    if (toMembers.length === 1) {
      title = `${fromName} → ${onlyFirstName(toMembers[0]) || "—"}`;
    } else if (toMembers.length > 1) {
      const first = onlyFirstName(toMembers[0]) || "—";
      title = `${fromName} → ${first} +${toMembers.length - 1}`;
    } else {
      title = `${fromName} → —`;
    }
  }

  // ----- money / date -----
  const amount = fmtAmount(tx?.amount, tx?.currency);
  const dateStr = fmtDateISO(tx?.date || tx?.created_at);

  // ----- participants (только аватарки) -----
  // Для расхода: из shares; Для перевода: получатели
  const shareUserIds: number[] = Array.isArray(tx?.shares)
    ? (tx.shares as any[])
        .map((s) => Number((s as any)?.user_id))
        .filter((n) => Number.isFinite(n))
    : [];

  const participantIds = isExpense ? shareUserIds : toIds;
  const participantMembers = participantIds
    .map((id) => getMember(membersById, id))
    .filter(Boolean) as GroupMemberLike[];

  // показываем до 6 аватаров
  const { head: show, rest: restCount } = takeFirst(participantMembers, 6);

  // “Paid by” лейбл
  const paidByLabel =
    (t && t("tx_modal.paid_by_label")) ||
    (t && t("tx_modal.paid_by")) ||
    "Paid by";

  return (
    <div
      className="relative px-3 py-2 rounded-2xl border bg-[var(--tg-theme-bg-color)]"
      style={{ borderColor: "var(--tg-theme-secondary-bg-color)" }}
    >
      <div className="flex items-center gap-3">
        {isExpense ? (
          <CategoryAvatar
            name={tx?.category?.name}
            color={tx?.category?.color}
            icon={tx?.category?.icon}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
            style={{ borderColor: "var(--tg-theme-secondary-bg-color)" }}
          >
            <ArrowRightLeft size={18} className="opacity-80" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* title */}
          <div className="text-[14px] font-semibold truncate" style={{ color: "var(--tg-theme-text-color)" }}>
            {title || "\u00A0"}
          </div>

          {/* date */}
          <div className="text-[12px] truncate" style={{ color: "var(--tg-theme-hint-color)" }}>
            {dateStr}
          </div>

          {/* paid by + participants */}
          <div className="mt-1.5 flex items-center gap-2 min-w-0">
            {/* Paid by */}
            {isExpense ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[12px]" style={{ color: "var(--tg-theme-hint-color)" }}>
                  {paidByLabel}:
                </span>
                <CircleAvatar url={avatarUrl(paidByMember)} label={paidByName} size={16} />
                <span className="text-[12px] truncate" style={{ color: "var(--tg-theme-text-color)" }}>
                  {paidByName || "—"}
                </span>
              </div>
            ) : (
              // Для перевода — кратко покажем участников-получателей аватарками (имена и так в заголовке)
              <div className="flex items-center gap-1.5 min-w-0">
                <CircleAvatar url={avatarUrl(fromMember)} label={onlyFirstName(fromMember)} size={16} />
                <span className="opacity-60">→</span>
              </div>
            )}

            {/* participants avatars (только аватарки) */}
            {show.length > 0 && (
              <div className="flex items-center gap-[-4px] ml-1">
                {show.map((m) => (
                  <div
                    key={m.id}
                    className="ring-1 rounded-full"
                    style={{
                      marginLeft: "-4px",
                      ringColor: "var(--tg-theme-bg-color)",
                    } as React.CSSProperties}
                    title={onlyFirstName(m)}
                  >
                    <CircleAvatar url={avatarUrl(m)} label={onlyFirstName(m)} size={16} />
                  </div>
                ))}
                {restCount > 0 && (
                  <span
                    className="ml-1 rounded-full px-1 text-[10px]"
                    style={{
                      color: "var(--tg-theme-link-color)",
                      border: "1px solid var(--tg-theme-secondary-bg-color)",
                      background:
                        "color-mix(in srgb, var(--tg-theme-link-color) 12%, transparent)",
                    }}
                  >
                    +{restCount}
                  </span>
                )}
              </div>
            )}
            {/* Если хотим “все X” — считаем по groupMembersCount, но текстов не просили */}
          </div>
        </div>

        {/* amount */}
        <div className="shrink-0 text-[14px] font-semibold" style={{ color: "var(--tg-theme-text-color)" }}>
          {fmtAmount(tx?.amount, tx?.currency)}
        </div>
      </div>
    </div>
  );
}
