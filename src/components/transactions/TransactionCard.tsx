// src/components/transactions/TransactionCard.tsx
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
  /** Справочник участников группы по ID (для имён/аватаров) */
  membersById?: MembersMap;
  /** Сколько всего участников в группе (чтобы понять «ВСЕ») */
  groupMembersCount?: number;
  /** i18n t() — используем существующие ключи, без добавлений */
  t?: (k: string, vars?: Record<string, any>) => string;
  /** Текущий пользователь (если не передали — попытаемся взять из Telegram WebApp) */
  currentUserId?: number;
};

/* ---------- utils ---------- */
const getFromMap = (m?: MembersMap, id?: number | null) => {
  if (!m || id == null) return undefined;
  if (m instanceof Map) return m.get(Number(id));
  return (m as Record<number, GroupMemberLike>)[Number(id)];
};

const firstName = (full?: string) => {
  const s = (full || "").trim();
  if (!s) return "";
  return s.split(/\s+/)[0] || s;
};

const ZERO_CCY_DEC = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (code?: string) => (code && ZERO_CCY_DEC.has(code) ? 0 : 2);

const fmtAmount = (n: number, code?: string) => {
  if (!isFinite(n)) n = 0;
  try {
    const decimals = decimalsByCode(code);
    const nf = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${nf.format(n)} ${code || ""}`.trim();
  } catch {
    return `${n.toFixed(decimalsByCode(code))} ${code || ""}`.trim();
  }
};

const fmtNumberOnly = (n: number, code?: string) => {
  // Число БЕЗ символа валюты — для строк локализации вида "Вы должны: {{sum}} ₽"
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

/* ---------- UI bits ---------- */

function CategoryAvatar({
  name,
  color,
  icon,
}: {
  name?: string;
  color?: string | null;
  icon?: string;
}) {
  const bg =
    typeof color === "string" && color.trim()
      ? color
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

/* ---------- main ---------- */

export default function TransactionCard({
  tx,
  membersById,
  groupMembersCount,
  t,
  currentUserId: currentUserIdProp,
}: Props) {
  const isExpense = tx.type === "expense";

  // тек. пользователь
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

  const dateStr = (() => {
    const d = new Date(tx.date || tx.created_at || Date.now());
    try {
      return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  })();

  const amountNum = Number(tx.amount ?? 0);
  const amount = fmtAmount(amountNum, tx.currency);

  /* --- resolve people --- */
  // payer (expense) or sender (transfer)
  const payerId: number | undefined = isExpense
    ? Number(tx.paid_by ?? tx.created_by ?? NaN)
    : Number(
        tx.transfer_from ??
          tx.from_user_id ??
          (Array.isArray(tx.transfer) ? tx.transfer[0] : NaN)
      );

  const payerMember = getFromMap(membersById, payerId);
  const payerName =
    firstName(tx.paid_by_name || tx.from_name) ||
    firstName(payerMember?.name) ||
    firstName(
      `${payerMember?.first_name ?? ""} ${payerMember?.last_name ?? ""}`.trim()
    ) ||
    payerMember?.username ||
    (payerId != null ? `#${payerId}` : "");

  const payerAvatar =
    tx.paid_by_avatar ||
    tx.from_avatar ||
    payerMember?.avatar_url ||
    payerMember?.photo_url;

  // recipient (transfer only)
  let toId: number | undefined = undefined;
  if (!isExpense) {
    const raw = tx.transfer_to ?? tx.to_user_id ?? tx.to;
    if (Array.isArray(raw) && raw.length > 0) {
      toId = Number(raw[0]);
    } else if (raw != null) {
      toId = Number(raw);
    }
  }
  const toMember = getFromMap(membersById, toId);
  const toName =
    firstName(tx.to_name) ||
    firstName(toMember?.name) ||
    firstName(
      `${toMember?.first_name ?? ""} ${toMember?.last_name ?? ""}`.trim()
    ) ||
    toMember?.username ||
    (toId != null ? `#${toId}` : "");

  const toAvatar =
    tx.to_avatar || toMember?.avatar_url || toMember?.photo_url;

  // participants summary (expense only — текст «ВСЕ» или количество; БЕЗ аватаров)
  let participantsText = "";
  if (isExpense) {
    const shareIds: number[] = Array.isArray(tx.shares)
      ? (tx.shares as any[])
          .map((s: any) => Number(s?.user_id))
          .filter((n: number) => Number.isFinite(n))
      : [];
    const uniq = Array.from(new Set(shareIds));
    if (uniq.length) {
      if (groupMembersCount && uniq.length === Number(groupMembersCount)) {
        participantsText = (t && t("tx_modal.all")) || "ВСЕ";
      } else {
        participantsText = `${uniq.length}`;
      }
    } else if (tx.split_type === "equal" && groupMembersCount) {
      participantsText = (t && t("tx_modal.all")) || "ВСЕ";
    }
  }

  /* --- заголовок --- */
  // Для расхода: если комментария нет — показываем имя категории.
  // Для перевода: не дублируем «кто → кому» в заголовке (оно ниже во второй строке).
  const title = isExpense
    ? (tx.comment && String(tx.comment).trim()) ||
      (tx.category?.name ? String(tx.category.name) : "—")
    : (tx.comment && String(tx.comment).trim()) || "";

  /* --- статус для текущего пользователя (you borrowed / you lent / not involved) --- */
  let statusText = "";
  if (typeof currentUserId === "number") {
    if (isExpense) {
      // Моя доля (если есть в shares)
      let myShare = 0;
      if (Array.isArray(tx.shares)) {
        for (const s of tx.shares as any[]) {
          if (Number(s?.user_id) === Number(currentUserId)) {
            const v = Number(s?.amount ?? 0);
            if (Number.isFinite(v)) myShare += v;
          }
        }
      }
      const iAmPayer = Number(payerId) === Number(currentUserId);
      if (iAmPayer) {
        const lent = Math.max(0, amountNum - myShare);
        if (lent > 0) {
          const sumStr = fmtNumberOnly(lent, tx.currency);
          // используем имеющиеся ключи
          statusText =
            (t && t("group_participant_owes_you", { sum: sumStr })) ||
            `Вам должны: ${sumStr}`;
        } else {
          statusText =
            (t && t("group_participant_no_debt")) || "Нет долга";
        }
      } else if (myShare > 0) {
        const sumStr = fmtNumberOnly(myShare, tx.currency);
        statusText =
          (t && t("group_participant_you_owe", { sum: sumStr })) ||
          `Вы должны: ${sumStr}`;
      } else {
        statusText =
          (t && t("group_participant_no_debt")) || "Нет долга";
      }
    } else {
      // transfer
      const meIsFrom = Number(payerId) === Number(currentUserId);
      const meIsTo = Number(toId) === Number(currentUserId);
      if (meIsFrom) {
        const sumStr = fmtNumberOnly(amountNum, tx.currency);
        statusText =
          (t && t("group_participant_owes_you", { sum: sumStr })) ||
          `Вам должны: ${sumStr}`;
      } else if (meIsTo) {
        const sumStr = fmtNumberOnly(amountNum, tx.currency);
        statusText =
          (t && t("group_participant_you_owe", { sum: sumStr })) ||
          `Вы должны: ${sumStr}`;
      } else {
        statusText =
          (t && t("group_participant_no_debt")) || "Нет долга";
      }
    }
  }

  return (
    <div
      className="relative px-3 py-2 rounded-xl border bg-[var(--tg-card-bg)]"
      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
    >
      <div className="flex items-center gap-3">
        {isExpense ? (
          <CategoryAvatar
            name={tx.category?.name}
            color={tx.category?.color}
            icon={tx.category?.icon}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
          >
            <ArrowRightLeft size={18} className="opacity-80" />
          </div>
        )}

        {/* center */}
        <div className="min-w-0 flex-1">
          {title ? (
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">
              {title}
            </div>
          ) : null}
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">
            {dateStr}
          </div>
        </div>

        {/* amount */}
        <div className="text-[14px] font-semibold shrink-0">
          {fmtAmount(Number(tx.amount ?? 0), tx.currency)}
        </div>
      </div>

      {/* second row: details */}
      <div className="mt-2 ml-12 min-w-0">
        {isExpense ? (
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="opacity-70 text-[var(--tg-hint-color)]">
              {(t && t("tx_modal.paid_by_label")) || "Заплатил"}
            </span>
            <RoundAvatar src={payerAvatar} alt={payerName} />
            <span className="text-[var(--tg-text-color)] font-medium truncate">
              {payerName}
            </span>
            {participantsText && (
              <>
                <span className="opacity-60 text-[var(--tg-hint-color)]">—</span>
                <span className="truncate text-[var(--tg-text-color)]">
                  {(t && t("tx_modal.participants")) || "Участники"}: {participantsText}
                </span>
              </>
            )}
            {statusText && (
              <>
                <span className="opacity-60 text-[var(--tg-hint-color)]">•</span>
                <span className="truncate text-[var(--tg-hint-color)]">
                  {statusText}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--tg-text-color)]">
            {/* Только здесь показываем кто → кому, чтобы не было дубля в заголовке */}
            <RoundAvatar src={payerAvatar} alt={payerName} />
            <span className="font-medium truncate">{payerName}</span>
            <span className="opacity-60">→</span>
            <RoundAvatar src={toAvatar} alt={toName} />
            <span className="font-medium truncate">{toName}</span>
            {statusText && (
              <>
                <span className="opacity-60 text-[var(--tg-hint-color)]">•</span>
                <span className="truncate text-[var(--tg-hint-color)]">
                  {statusText}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
