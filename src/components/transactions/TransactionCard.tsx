import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft } from "lucide-react";

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

/* ---------- utils ---------- */
const getFromMap = (m?: MembersMap, id?: number | null) => {
  if (!m || id == null) return undefined;
  if (m instanceof Map) return m.get(Number(id));
  return (m as Record<number, GroupMemberLike>)[Number(id)];
};
const s = (x: any) => (typeof x === "string" ? x : "");
const firstName = (full?: string) => {
  const v = s(full).trim();
  if (!v) return "";
  return v.split(/\s+/)[0] || v;
};
const ZERO_CCY_DEC = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (code?: string) => (code && ZERO_CCY_DEC.has(code) ? 0 : 2);
const fmtNumberOnly = (n: number, code?: string) => {
  if (!isFinite(n)) n = 0;
  try {
    const decimals = decimalsByCode(code);
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  } catch {
    return n.toFixed(decimalsByCode(code));
  }
};
const fmtAmountCode = (n: number, code?: string) => {
  const num = fmtNumberOnly(Number(n), code);
  const c = s(code).toUpperCase();
  return c ? `${num} ${c}` : num;
};

function CategoryAvatar({
  name,
  color,
  icon,
  size = 48,
}: {
  name?: string;
  color?: string | null;
  icon?: string;
  size?: number;
}) {
  const bg =
    typeof color === "string" && color.trim()
      ? color
      : "var(--tg-link-color)";
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div
      className="rounded-xl flex items-center justify-center text-white shrink-0"
      style={{ width: size, height: size, background: bg }}
      aria-label={name || undefined}
      title={name || undefined}
    >
      <span style={{ fontSize: 18 }} aria-hidden>
        {icon || ch}
      </span>
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
      style={{
        width: size,
        height: size,
        background: "var(--tg-link-color)",
      }}
      aria-hidden
    />
  );
}

// формат "20 мая" / "May 20" / "20 de mayo" через ключи локали
function formatMonthDay(d: Date, t?: Props["t"]) {
  const day = d.getDate();
  const monthIdx = d.getMonth() + 1; // 1..12
  const monthName =
    t?.(`date_short.months.${monthIdx}`) ||
    // запасной вариант на случай отсутствия ключей
    d.toLocaleString(undefined, { month: "long" });
  const pattern = t?.("date_short.md") || "{{day}} {{month}}";
  return pattern
    .replace("{{day}}", String(day))
    .replace("{{month}}", String(monthName));
}

// safest category name fallback
function resolveCategoryName(tx: any): string {
  return (
    s(tx?.category?.name) ||
    s(tx?.category_name) ||
    s(tx?.category?.title) ||
    ""
  );
}

/* ---------- main ---------- */
export default function TransactionCard({
  tx,
  membersById,
  t,
  currentUserId: currentUserIdProp,
  className,
}: Props) {
  const isExpense = tx?.type === "expense";
  const hasId = Number.isFinite(Number(tx?.id));
  const txId = hasId ? Number(tx.id) : undefined;

  // текущий пользователь
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

  // payer / transfer members
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
    firstName(payerMember?.name) ||
    firstName(
      `${payerMember?.first_name ?? ""} ${payerMember?.last_name ?? ""}`.trim()
    ) ||
    payerMember?.username ||
    (payerId != null ? `#${payerId}` : "");
  const payerAvatar =
    tx?.paid_by_avatar ||
    tx?.from_avatar ||
    payerMember?.avatar_url ||
    payerMember?.photo_url;

  // transfer recipient (для Fallback заголовка)
  let toId: number | undefined = undefined;
  if (!isExpense) {
    const raw = tx?.transfer_to ?? tx?.to_user_id ?? tx?.to;
    if (Array.isArray(raw) && raw.length > 0) toId = Number(raw[0]);
    else if (raw != null) toId = Number(raw);
  }
  const toMember = getFromMap(membersById, toId);
  const toName =
    firstName(tx?.to_name) ||
    firstName(toMember?.name) ||
    firstName(
      `${toMember?.first_name ?? ""} ${toMember?.last_name ?? ""}`.trim()
    ) ||
    toMember?.username ||
    (toId != null ? `#${toId}` : "");

  const dateObj = new Date(tx?.date || tx?.created_at || Date.now());
  const dateStr = formatMonthDay(dateObj, t);

  const amountStr = fmtAmountCode(Number(tx?.amount ?? 0), tx?.currency);

  // ---- Заголовок: Comment || Category name (для расходов) || "A → B" (для переводов)
  const title = useMemo(() => {
    const comment = s(tx?.comment).trim();
    if (comment) return comment;
    if (isExpense) {
      const cat = resolveCategoryName(tx);
      if (cat) return cat;
      return "";
    }
    // transfer fallback
    if (payerName || toName) return `${payerName} → ${toName}`.trim();
    return "";
  }, [isExpense, tx, payerName, toName]);

  // ---- Статус долга (ТОЛЬКО ДЛЯ РАСХОДОВ). Показываем ТОЛЬКО если пользователь участвовал или он плательщик.
  const statusText = useMemo(() => {
    if (!isExpense || typeof currentUserId !== "number") return "";

    const shares = Array.isArray(tx?.shares) ? (tx.shares as any[]) : [];
    const iAmPayer = Number(payerId) === Number(currentUserId);
    const myEntry = shares.find(
      (s) => Number(s?.user_id) === Number(currentUserId)
    );

    // Если я не плательщик и меня нет в shares — не выводим строку статуса вовсе.
    if (!iAmPayer && !myEntry) return "";

    let myShare = 0;
    let payerShare = 0;
    for (const s of shares) {
      const uid = Number(s?.user_id);
      const val = Number(s?.amount ?? 0);
      if (!Number.isFinite(val)) continue;
      if (uid === Number(currentUserId)) myShare += val;
      if (uid === Number(payerId)) payerShare += val;
    }

    if (iAmPayer) {
      const lent = Math.max(0, Number(tx?.amount ?? 0) - payerShare);
      if (lent > 0) {
        // оставляем как раньше, ключи уже есть (сумма без кода/символа — как и было)
        const sumStr = fmtNumberOnly(lent, tx?.currency);
        return (t && t("group_participant_owes_you", { sum: sumStr })) || `Вам должны: ${sumStr}`;
      }
      return (t && t("group_participant_no_debt")) || "Нет долга";
    } else {
      if (myShare > 0) {
        const sumStr = fmtNumberOnly(myShare, tx?.currency);
        return (t && t("group_participant_you_owe", { sum: sumStr })) || `Вы должны: ${sumStr}`;
      }
      return (t && t("group_participant_no_debt")) || "Нет долга";
    }
  }, [isExpense, currentUserId, tx, payerId, t]);

  // ---- UI в стиле UserCard
  const Body = (
    <div className={"flex items-center px-3 py-3 gap-4 " + (className || "")}>
      {/* Левая колонка: аватар категории/перевода + дата ПОД аватаром */}
      <div className="flex flex-col items-center w-12 shrink-0">
        {isExpense ? (
          <CategoryAvatar
            name={tx?.category?.name}
            color={tx?.category?.color}
            icon={tx?.category?.icon}
            size={48}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-xl border flex items-center justify-center"
            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
            title="Transfer"
            aria-label="Transfer"
          >
            <ArrowRightLeft size={20} className="opacity-80" />
          </div>
        )}
        <div className="mt-1 text-[10px] text-[var(--tg-hint-color)] leading-none text-center truncate w-full">
          {dateStr}
        </div>
      </div>

      {/* Центр: заголовок (comment|category) и статус долга ниже мелким */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-semibold text-base truncate text-[var(--tg-text-color)]">
            {title || "—"}
          </div>
          <div className="font-semibold text-base tabular-nums shrink-0 text-[var(--tg-text-color)]">
            {amountStr}
          </div>
        </div>

        {/* Доп.строка — для переводов покажем от кого к кому, для расходов — статус долга */}
        {isExpense ? (
          statusText ? (
            <div className="text-xs text-[var(--tg-hint-color)] mt-0.5 truncate">
              {statusText}
            </div>
          ) : null
        ) : (
          <div className="text-xs text-[var(--tg-text-color)] mt-0.5 flex items-center gap-1 min-w-0">
            <RoundAvatar src={payerMember?.avatar_url || payerMember?.photo_url} alt={payerName} />
            <span className="truncate">{payerName}</span>
            <span className="opacity-60">→</span>
            <RoundAvatar src={toMember?.avatar_url || toMember?.photo_url} alt={toName} />
            <span className="truncate">{toName}</span>
          </div>
        )}
      </div>
    </div>
  );

  return hasId ? (
    <Link
      to={`/transactions/${txId}`}
      className="block focus:outline-none focus:ring-2 focus:ring-[var(--tg-accent-color,#40A7E3)] rounded-xl"
    >
      {Body}
    </Link>
  ) : (
    Body
  );
}
