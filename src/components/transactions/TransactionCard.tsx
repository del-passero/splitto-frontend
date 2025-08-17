// src/components/transactions/TransactionCard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightLeft, Layers } from "lucide-react";

type TGUser = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  name?: string | null;
};

type GroupMemberLike = { user: TGUser } | TGUser;

type TFunc = (k: string, vars?: Record<string, any>) => string;

type Props = {
  tx: any; // TransactionOut | LocalTx
  /** карта участников группы: id -> {user}|user. Если не передана — карточка сама подгрузит по group_id */
  membersById?: Map<number, GroupMemberLike> | Record<number, GroupMemberLike> | any[];
  /** общее кол-во участников группы (для "ВСЕ (N)") */
  groupMembersCount?: number;
  /** опционально — i18n */
  t?: TFunc;
  className?: string;
};

const safeStr = (x: any) => (typeof x === "string" ? x : "");
const upper = (s: string) => safeStr(s).toUpperCase();

const fullName = (u?: TGUser | null) => {
  if (!u) return "";
  if (u.name) return u.name;
  const fn = safeStr(u.first_name).trim();
  const ln = safeStr(u.last_name).trim();
  const name = [fn, ln].filter(Boolean).join(" ").trim();
  return name || (u.username ? `@${u.username}` : String(u.id ?? ""));
};

function UserAvatar({ user, size = 18 }: { user?: TGUser | null; size?: number }) {
  const name = fullName(user);
  const url = safeStr(user?.photo_url || user?.avatar_url).trim();
  const letter = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div
      className="rounded-full bg-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size }}
      title={name}
      aria-label={name}
    >
      {url ? (
        <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span className="text-[10px] opacity-80">{letter}</span>
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
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: bg }}>
      <span style={{ fontSize: 16 }} aria-hidden>
        {icon || ch}
      </span>
    </div>
  );
}

/** локальный кэш участников по group_id (чтобы не дергать список много раз) */
const groupMembersCache = new Map<number, Map<number, TGUser>>();

export default function TransactionCard({
  tx,
  membersById,
  groupMembersCount,
  t,
  className,
}: Props) {
  const tKey = (k: string, fb: string) => {
    try {
      const v = t?.(k);
      return v && v !== k ? v : fb;
    } catch {
      return fb;
    }
  };

  // если карту не дали — подгрузим сами по group_id
  const [localMap, setLocalMap] = useState<Map<number, TGUser> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (membersById) return;
    const gid = Number(tx?.group_id);
    if (!gid) return;

    const cached = groupMembersCache.get(gid);
    if (cached) {
      setLocalMap(cached);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    (async () => {
      try {
        const res = await fetch(`/api/group-members/group/${gid}?offset=0&limit=200`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const map = new Map<number, TGUser>();
        for (const it of items) {
          const u = it?.user ?? it;
          const id = Number(u?.id);
          if (!id) continue;
          map.set(id, {
            id,
            first_name: u?.first_name,
            last_name: u?.last_name,
            username: u?.username,
            photo_url: u?.photo_url,
            avatar_url: u?.avatar_url,
            name: u?.name,
          });
        }
        groupMembersCache.set(gid, map);
        setLocalMap(map);
      } catch {
        // молча — покажем #id
      }
    })();

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [tx?.group_id, membersById]);

  // нормализуем карту участников в Map<number, TGUser>
  const normalizedMap = useMemo(() => {
    if (membersById instanceof Map) {
      const m = new Map<number, TGUser>();
      for (const [k, v] of membersById.entries()) {
        const u = (v as any)?.user ?? (v as any);
        if (!u?.id) continue;
        m.set(Number(u.id), u as TGUser);
      }
      return m;
    }
    if (membersById && typeof membersById === "object" && !Array.isArray(membersById)) {
      const m = new Map<number, TGUser>();
      for (const k of Object.keys(membersById)) {
        const v = (membersById as any)[k];
        const u = v?.user ?? v;
        if (!u?.id) continue;
        m.set(Number(u.id), u as TGUser);
      }
      return m;
    }
    if (Array.isArray(membersById)) {
      const m = new Map<number, TGUser>();
      for (const it of membersById) {
        const u = it?.user ?? it;
        if (!u?.id) continue;
        m.set(Number(u.id), u as TGUser);
      }
      return m;
    }
    return localMap ?? new Map<number, TGUser>();
  }, [membersById, localMap]);

  const getUser = (id?: number | null): TGUser | undefined => {
    if (id == null) return undefined;
    return normalizedMap.get(Number(id));
  };

  const totalMembers =
    typeof groupMembersCount === "number" && groupMembersCount > 0
      ? groupMembersCount
      : normalizedMap.size;

  const isExpense = tx?.type === "expense";

  // payer
  const paidById: number | undefined = tx?.paid_by ?? tx?.payer_id ?? tx?.payer ?? undefined;
  const payer: TGUser | undefined = getUser(paidById) || (tx?.paid_by_user as TGUser | undefined) || (tx?.payer_user as TGUser | undefined);

  // transfer from/to
  const fromId: number | undefined = tx?.transfer_from ?? tx?.from_user_id ?? tx?.from_id ?? undefined;
  const toListRaw =
    (Array.isArray(tx?.transfer_to) ? tx.transfer_to : undefined) ||
    (typeof tx?.to_user_id === "number" ? [tx.to_user_id] : undefined) ||
    (Array.isArray(tx?.to_user_ids) ? tx.to_user_ids : undefined) ||
    [];
  // >>> FIX: тип в фильтре
  const toIds: number[] = toListRaw.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n));

  const fromUser = getUser(fromId) || (tx?.transfer_from_user as TGUser | undefined);
  const toUsers = toIds.map((id) => getUser(id)).filter(Boolean) as TGUser[];

  // участники по долям (user_id или user.id)
  const participantsFromShares: TGUser[] = Array.isArray(tx?.shares)
    ? (tx.shares as any[])
        .map((s) => {
          const uid = s?.user_id ?? s?.user?.id;
          return getUser(Number(uid));
        })
        .filter(Boolean) as TGUser[]
    : [];

  const looksLikeAll =
    isExpense &&
    (tx?.split_type === "equal" || (!tx?.split_type && (!tx?.shares || tx?.shares?.length === 0)));

  // --------- заголовок ----------
  let title = "";
  if (isExpense) {
    title = safeStr(tx?.comment).trim() || safeStr(tx?.category?.name).trim() || "—";
  } else {
    const fromTitle =
      fullName(fromUser) ||
      safeStr(tx?.from_name).trim() ||
      (fromId != null ? `#${fromId}` : "—");

    const toTitle =
      toUsers.length > 0
        ? `${fullName(toUsers[0])}${toUsers.length > 1 ? ` +${toUsers.length - 1}` : ""}`
        : safeStr(tx?.to_name).trim() ||
          (toIds.length > 0 ? `#${toIds[0]}${toIds.length > 1 ? ` +${toIds.length - 1}` : ""}` : "—");

    title = `From ${fromTitle} → To ${toTitle}`;
  }

  const date = new Date(tx?.date || tx?.created_at || Date.now());
  const dateStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  const amountNum = Number(tx?.amount ?? 0);
  const amountStr = `${amountNum.toFixed(2)} ${upper(tx?.currency || "")}`;

  const splitLabel =
    tx?.split_type === "equal"
      ? tKey("tx_modal.split_equal", "Поровну")
      : tx?.split_type === "shares"
      ? tKey("tx_modal.split_shares", "По долям")
      : tx?.split_type === "custom"
      ? tKey("tx_modal.split_custom", "Вручную")
      : null;

  const participantsTitle = looksLikeAll
    ? `${tKey("tx_modal.all", "ВСЕ")}${totalMembers ? ` (${totalMembers})` : ""}`
    : participantsFromShares.length
    ? participantsFromShares.map(fullName).join(", ")
    : "—";

  const paidByLabel = tKey("tx_modal.paid_by_label", "Заплатил");

  const payerDisplay =
    fullName(payer) ||
    safeStr(tx?.paid_by_name).trim() ||
    (paidById != null ? `#${paidById}` : "—");

  return (
    <div
      className={
        "relative px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] " +
        (className || "")
      }
    >
      {/* верхняя строка */}
      <div className="flex items-center gap-3">
        {isExpense ? (
          <CategoryAvatar name={tx?.category?.name} color={tx?.category?.color} icon={tx?.category?.icon} />
        ) : (
          <div className="w-10 h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center shrink-0">
            <ArrowRightLeft size={18} className="opacity-80" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">{title}</div>
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{dateStr}</div>
        </div>

        <div className="text-[14px] font-semibold shrink-0">{amountStr}</div>
      </div>

      {/* нижняя строка для расхода */}
      {isExpense && (
        <div className="mt-2 pl-12 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0">{paidByLabel}:</span>

            {/* payer */}
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar user={payer} />
              <span className="text-[12px] text-[var(--tg-text-color)] truncate">
                {payerDisplay}
              </span>
            </div>

            <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0 mx-1">за</span>

            {/* участники */}
            {looksLikeAll ? (
              <span className="text-[12px] text-[var(--tg-text-color)] whitespace-nowrap">
                {participantsTitle}
              </span>
            ) : (
              <div className="flex items-center gap-1 min-w-0">
                <div className="flex items-center gap-1">
                  {participantsFromShares.slice(0, 3).map((u) => (
                    <UserAvatar key={u.id} user={u} />
                  ))}
                </div>
                <span className="text-[12px] text-[var(--tg-text-color)] truncate max-w-[60vw]">
                  {participantsTitle}
                </span>
              </div>
            )}
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
