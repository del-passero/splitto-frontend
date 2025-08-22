// src/components/transactions/TransactionCard.tsx
import { useMemo } from "react";
import { ArrowRightLeft } from "lucide-react";

// ⚠️ НЕ удалял ваши типы/пропсы — только добавил извлечение текущего пользователя
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
};

// ——— utils ———
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
  const decimals = decimalsByCode(code);
  try {
    return `${new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)} ${code || ""}`.trim();
  } catch {
    return `${n.toFixed(decimals)} ${code || ""}`.trim();
  }
};
const fmtNumberOnly = (n: number, code?: string) => {
  if (!isFinite(n)) n = 0;
  const decimals = decimalsByCode(code);
  try {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
  } catch {
    return n.toFixed(decimals);
  }
};
const isFiniteNumber = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

// ——— UI bits ———
function CategoryAvatar({ name, color, icon }: { name?: string; color?: string | null; icon?: string }) {
  const bg = typeof color === "string" && color.trim() ? color : "var(--tg-link-color)";
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: bg }}>
      <span style={{ fontSize: 16 }} aria-hidden>{icon || ch}</span>
    </div>
  );
}
function RoundAvatar({ src, alt, size = 18 }: { src?: string; alt?: string; size?: number }) {
  return src ? (
    <img src={src} alt={alt || ""} className="rounded-full object-cover" style={{ width: size, height: size }} loading="lazy" />
  ) : (
    <span className="rounded-full inline-block" style={{ width: size, height: size, background: "var(--tg-link-color)" }} aria-hidden />
  );
}

// ——— надёжное извлечение текущего пользователя ———
function useCurrentUserId(propId?: number): number | undefined {
  // 1) проп
  if (Number.isFinite(propId)) return propId as number;

  // 2) Zustand store (если есть). Импорт ленивый через window, чтобы не ломать сборку.
  try {
    // @ts-ignore
    const useUserStore = (window as any).__useUserStore__ || undefined;
    if (typeof useUserStore === "function") {
      const user = useUserStore.getState?.().user || useUserStore((s: any) => s.user);
      const id = Number(user?.id);
      if (Number.isFinite(id)) return id;
    }
  } catch {}

  // 3) Telegram WebApp
  try {
    const id = Number((window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id);
    if (Number.isFinite(id)) return id;
  } catch {}

  // 4) local/session storage
  try {
    const id = Number(localStorage.getItem("tg_user_id") || sessionStorage.getItem("tg_user_id"));
    if (Number.isFinite(id)) return id;
  } catch {}

  // 5) query string fallbacks
  try {
    const qs = new URLSearchParams(location.search);
    const id = Number(qs.get("user_id") || qs.get("uid") || qs.get("tg_user_id"));
    if (Number.isFinite(id)) return id;
  } catch {}

  // 6) глобалы
  try {
    const id = Number((window as any).__CURRENT_USER_ID__ || (window as any).__USER_ID__);
    if (Number.isFinite(id)) return id;
  } catch {}

  return undefined;
}

// ——— main ———
export default function TransactionCard({ tx, membersById, groupMembersCount, t, currentUserId: currentUserIdProp }: Props) {
  const isExpense = tx.type === "expense";
  const currentUserId = useCurrentUserId(currentUserIdProp);
  const amountNum = Number(tx.amount ?? 0);

  const dateStr = useMemo(() => {
    const d = new Date(tx.date || tx.created_at || Date.now());
    try {
      return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  }, [tx.date, tx.created_at]);

  // payer/sender
  const payerId: number | undefined = isExpense
    ? Number(tx.paid_by ?? tx.created_by ?? NaN)
    : Number(tx.transfer_from ?? tx.from_user_id ?? (Array.isArray(tx.transfer) ? tx.transfer[0] : NaN));

  const payerMember = getFromMap(membersById, payerId);
  const payerName =
    firstName(tx.paid_by_name || tx.from_name) ||
    firstName(payerMember?.name) ||
    firstName(`${payerMember?.first_name ?? ""} ${payerMember?.last_name ?? ""}`.trim()) ||
    payerMember?.username ||
    (payerId != null ? `#${payerId}` : "");
  const payerAvatar = tx.paid_by_avatar || tx.from_avatar || payerMember?.avatar_url || payerMember?.photo_url;

  // recipient (transfer)
  let toId: number | undefined = undefined;
  if (!isExpense) {
    const raw = tx.transfer_to ?? tx.to_user_id ?? tx.to;
    if (Array.isArray(raw) && raw.length > 0) toId = Number(raw[0]);
    else if (raw != null) toId = Number(raw);
  }
  const toMember = getFromMap(membersById, toId);
  const toName =
    firstName(tx.to_name) ||
    firstName(toMember?.name) ||
    firstName(`${toMember?.first_name ?? ""} ${toMember?.last_name ?? ""}`.trim()) ||
    toMember?.username ||
    (toId != null ? `#${toId}` : "");
  const toAvatar = tx.to_avatar || toMember?.avatar_url || toMember?.photo_url;

  // participants (count only for expense)
  let participantsText = "";
  if (isExpense) {
    const shareIds: number[] = Array.isArray(tx.shares)
      ? (tx.shares as any[]).map((s: any) => Number(s?.user_id)).filter((n: number) => Number.isFinite(n))
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

  // title
  const title = isExpense
    ? (tx.comment && String(tx.comment).trim()) || (tx.category?.name ? String(tx.category.name) : "—")
    : (tx.comment && String(tx.comment).trim()) || "";

  // —— долговая строка (ТОЛЬКО для расходов, и ТОЛЬКО если знаем currentUserId) ——
  let statusText = "";
  if (isExpense && Number.isFinite(Number(currentUserId))) {
    const me = Number(currentUserId);
    const payer = Number(payerId);

    if (Array.isArray(tx.shares) && tx.shares.length > 0) {
      // суммируем устойчиво: «моя доля» и «все кроме плательщика»
      let myShare = 0;
      let sumOthersToPayer = 0;

      for (const s of tx.shares as any[]) {
        const uid = Number(s?.user_id);
        const raw = s?.amount;
        const val = Number(typeof raw === "string" ? raw : raw ?? 0);
        if (!Number.isFinite(val)) continue;

        if (uid === me) myShare += val;
        if (uid !== payer) sumOthersToPayer += val;
      }

      if (me === payer) {
        if (sumOthersToPayer > 0) {
          const sumStr = fmtNumberOnly(sumOthersToPayer, tx.currency);
          statusText = (t && t("group_participant_owes_you", { sum: sumStr })) || `Вам должны: ${sumStr}`;
        } else {
          statusText = (t && t("group_participant_no_debt")) || "Нет долга";
        }
      } else {
        if (myShare > 0) {
          const sumStr = fmtNumberOnly(myShare, tx.currency);
          statusText = (t && t("group_participant_you_owe", { sum: sumStr })) || `Вы должны: ${sumStr}`;
        } else {
          statusText = (t && t("group_participant_no_debt")) || "Нет долга";
        }
      }
    } else {
      // нет shares: только плательщику «Вам должны amount», остальным не показываем долг
      if (me === Number(payerId)) {
        const sumStr = fmtNumberOnly(amountNum, tx.currency);
        statusText = (t && t("group_participant_owes_you", { sum: sumStr })) || `Вам должны: ${sumStr}`;
      } else {
        statusText = (t && t("group_participant_no_debt")) || "Нет долга";
      }
    }
  }

  return (
    <div className="relative px-3 py-2 rounded-xl border bg-[var(--tg-card-bg)]" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
      <div className="flex items-center gap-3">
        {isExpense ? (
          <CategoryAvatar name={tx.category?.name} color={tx.category?.color} icon={tx.category?.icon} />
        ) : (
          <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
            <ArrowRightLeft size={18} className="opacity-80" />
          </div>
        )}

        {/* center */}
        <div className="min-w-0 flex-1">
          {title ? <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">{title}</div> : null}
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{dateStr}</div>
        </div>

        {/* amount */}
        <div className="text-[14px] font-semibold shrink-0">{fmtAmount(amountNum, tx.currency)}</div>
      </div>

      {/* second row */}
      <div className="mt-2 ml-12 min-w-0">
        {isExpense ? (
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="opacity-70 text-[var(--tg-hint-color)]">{(t && t("tx_modal.paid_by_label")) || "Заплатил"}</span>
            <RoundAvatar src={payerAvatar} alt={payerName} />
            <span className="text-[var(--tg-text-color)] font-medium truncate">{payerName}</span>
            {participantsText && (
              <>
                <span className="opacity-60 text-[var(--tg-hint-color)]">—</span>
                <span className="truncate text-[var(--tg-text-color)]">
                  {(t && t("tx_modal.participants")) || "Участники"}: {participantsText}
                </span>
              </>
            )}
          </div>
        ) : (
          // для переводов долги не показываем
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--tg-text-color)]">
            <RoundAvatar src={payerAvatar} alt={payerName} />
            <span className="font-medium truncate">{payerName}</span>
            <span className="opacity-60">→</span>
            <RoundAvatar src={toAvatar} alt={toName} />
            <span className="font-medium truncate">{toName}</span>
          </div>
        )}

        {/* статус долгов — С НОВОЙ СТРОКИ, только для расходов, только если знаем currentUserId */}
        {isExpense && statusText && (
          <div className="mt-1 text-[12px] text-[var(--tg-hint-color)]">
            {statusText}
          </div>
        )}
      </div>
    </div>
  );
}
