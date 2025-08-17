// src/components/transactions/TransactionCard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightLeft, Layers } from "lucide-react";

/** Мини-тип юзера телеги */
type TGUser = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
};

type GroupMemberLike = { user: TGUser };

type TFunc = (k: string, vars?: Record<string, any>) => string;

type Props = {
  tx: any; // TransactionOut | LocalTx
  /** Можно передать мапу участников; если не передали — карточка подгрузит сама */
  membersById?: Record<number, GroupMemberLike> | Map<number, GroupMemberLike> | any[];
  /** Кол-во участников группы (для "ВСЕ (N)"); если не передали — оценим сами */
  groupMembersCount?: number;
  t?: TFunc;
  className?: string;
};

const safeStr = (x: unknown) => (typeof x === "string" ? x : "");
const uc = (s: string) => safeStr(s).toUpperCase();

const fullName = (u?: TGUser | null) => {
  if (!u) return "";
  const fn = safeStr(u.first_name).trim();
  const ln = safeStr(u.last_name).trim();
  const name = [fn, ln].filter(Boolean).join(" ").trim();
  return name || (u.username ? `@${u.username}` : String(u.id ?? ""));
};

function UserAvatar({ user, size = 18 }: { user?: TGUser | null; size?: number }) {
  const name = fullName(user);
  const letter = (name || "").trim().charAt(0).toUpperCase() || "•";
  const url = safeStr(user?.photo_url).trim();
  return (
    <div
      className="rounded-full bg-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={name}
      title={name}
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

/** Глобальный кэш участников по group_id (чтобы не бомбить API) */
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

  /** Локальная мапа, если внешней нет */
  const [localMap, setLocalMap] = useState<Map<number, TGUser> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Если наружу не передали словарь участников — подгружаем сами (1 раз на группу)
  useEffect(() => {
    const gid = Number(tx?.group_id);
    if (!gid || membersById) return;

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
          const u = it?.user ?? it; // на всякий
          const id = Number(u?.id);
          if (!id) continue;
          map.set(id, {
            id,
            first_name: u?.first_name,
            last_name: u?.last_name,
            username: u?.username,
            photo_url: u?.photo_url,
          });
        }
        groupMembersCache.set(gid, map);
        setLocalMap(map);
      } catch {
        // оставим фолбэки по ID/строкам
      }
    })();

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [tx?.group_id, membersById]);

  /** Достаём участника по ID из любого формата словаря */
  const getMember = (id?: number | null): GroupMemberLike | undefined => {
    if (id == null) return undefined;
    const numId = Number(id);

    const src: any = membersById;

    // Map
    if (src instanceof Map) {
      const v = src.get(numId);
      if (v) return v;
    }
    // объект с get()
    if (src && typeof src.get === "function") {
      const v = src.get(numId);
      if (v) return v;
    }
    // Record<number, ...>
    if (src && typeof src === "object" && !Array.isArray(src) && numId in src) {
      return src[numId] as GroupMemberLike;
    }
    // массив
    if (Array.isArray(src)) {
      const v = src.find((m: any) => Number(m?.user?.id) === numId || Number(m?.id) === numId);
      if (v) return v;
    }
    // локальный кэш
    if (localMap && localMap.size) {
      const u = localMap.get(numId);
      if (u) return { user: u };
    }

    return undefined;
  };

  const getUser = (id?: number | null): TGUser | undefined => getMember(id)?.user;

  /** Сколько всего участников (для "ВСЕ (N)") */
  const countMembers = useMemo(() => {
    if (typeof groupMembersCount === "number" && groupMembersCount > 0) return groupMembersCount;

    const src: any = membersById;
    if (src instanceof Map) return src.size;
    if (typeof src?.size === "number") return src.size;
    if (Array.isArray(src)) return src.length;
    if (src && typeof src === "object") {
      if (src.byId && typeof src.byId === "object") return Object.keys(src.byId).length;
      return Object.keys(src).length;
    }
    if (localMap) return localMap.size;
    return 0;
  }, [membersById, groupMembersCount, localMap]);

  const isExpense = tx.type === "expense";

  /** Заголовок */
  let title = "";
  if (isExpense) {
    // (1) Всегда берём комментарий как название (твое требование)
    title = safeStr(tx.comment).trim();
    if (!title) {
      // если комментарий пуст — хотя бы категория/плейсхолдер
      title = safeStr(tx.category?.name).trim() || "—";
    }
  } else {
    // Перевод: "From КТО → To КТО" + маленькие аватарки рядом с именами
    const fromU: TGUser | undefined =
      getUser(tx.transfer_from) ||
      (tx.transfer_from_user as TGUser | undefined);

    const toIds: number[] = Array.isArray(tx.transfer_to)
      ? (tx.transfer_to as any[]).map(Number)
      : typeof tx.transfer_to === "number"
      ? [Number(tx.transfer_to)]
      : [];

    const toUsers: TGUser[] =
      (toIds
        .map((id) => getUser(id) || null)
        .filter(Boolean) as TGUser[]) ||
      [];

    const fromTitle =
      fullName(fromU) ||
      safeStr(tx.from_name).trim() ||
      (tx.transfer_from != null ? String(tx.transfer_from) : "—");

    let toTitle = "";
    if (toUsers.length > 0) {
      toTitle = `${fullName(toUsers[0])}${toUsers.length > 1 ? ` +${toUsers.length - 1}` : ""}`;
    } else if (safeStr(tx.to_name).trim()) {
      toTitle = safeStr(tx.to_name).trim();
    } else if (toIds.length > 0) {
      toTitle = `${toIds[0]}${toIds.length > 1 ? ` +${toIds.length - 1}` : ""}`;
    } else {
      toTitle = "—";
    }

    title = `From ${fromTitle} → To ${toTitle}`;
  }

  /** Дата */
  const d = new Date(tx.date || tx.created_at || Date.now());
  const dateStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  /** Сумма и валюта */
  const amountNum = Number(tx.amount ?? 0);
  const amount = `${amountNum.toFixed(2)} ${uc(tx.currency || "")}`;

  /** Плательщик (для расхода) */
  const payer: TGUser | undefined = isExpense ? getUser(tx.paid_by) : undefined;
  const payerTitle =
    fullName(payer) ||
    safeStr(tx.paid_by_name).trim() ||
    (tx.paid_by != null ? String(tx.paid_by) : "—");

  /** Участники */
  const { participantUsers, isAll } = useMemo(() => {
    const uniq = new Map<number, TGUser>();

    if (Array.isArray(tx.shares) && tx.shares.length > 0) {
      tx.shares.forEach((s: any) => {
        const uid = Number(s?.user_id);
        if (!uid) return;
        const u = getUser(uid);
        if (u) uniq.set(uid, u);
      });
      return { participantUsers: Array.from(uniq.values()), isAll: false };
    }

    if (isExpense && tx.split_type === "equal") {
      // equal без shares => все участники
      return { participantUsers: [], isAll: true };
    }

    return { participantUsers: [], isAll: false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx.shares, tx.split_type, isExpense, membersById, localMap]);

  const participantsTitle = isAll
    ? `${tKey("tx_modal.all", "ВСЕ")}${countMembers ? ` (${countMembers})` : ""}`
    : participantUsers.length
    ? participantUsers.map(fullName).join(", ")
    : "—";

  const splitLabel =
    tx.split_type === "equal"
      ? tKey("tx_modal.split_equal", "Поровну")
      : tx.split_type === "shares"
      ? tKey("tx_modal.split_shares", "По долям")
      : tx.split_type === "custom"
      ? tKey("tx_modal.split_custom", "Вручную")
      : null;

  return (
    <div
      className={
        "relative px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] " +
        (className || "")
      }
    >
      {/* header */}
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
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">{dateStr}</div>
        </div>

        <div className="text-[14px] font-semibold shrink-0">{amount}</div>
      </div>

      {/* footer для расхода: "Заплатил <payer> за <участники>" + режим деления */}
      {isExpense && (
        <div className="mt-2 pl-12 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0">
              {tKey("tx_modal.paid_by_label", "Заплатил")}:
            </span>

            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar user={payer} />
              <span className="text-[12px] text-[var(--tg-text-color)] truncate max-w-[42vw]">
                {payerTitle}
              </span>

              <span className="text-[12px] text-[var(--tg-hint-color)] shrink-0">за</span>

              <div className="flex items-center gap-1 shrink-0">
                {isAll ? (
                  <>
                    <div className="w-4 h-4 rounded-full bg-[var(--tg-secondary-bg-color,#e7e7e7)]" />
                    <div className="w-4 h-4 rounded-full bg-[var(--tg-secondary-bg-color,#e7e7e7)]" />
                    <div className="w-4 h-4 rounded-full bg-[var(--tg-secondary-bg-color,#e7e7e7)]" />
                  </>
                ) : (
                  participantUsers.slice(0, 3).map((u) => <UserAvatar key={u.id} user={u} />)
                )}
                {!isAll && participantUsers.length > 3 && (
                  <span className="text-[11px] text-[var(--tg-hint-color)]">+{participantUsers.length - 3}</span>
                )}
              </div>

              <span className="text-[12px] text-[var(--tg-hint-color)] truncate max-w-[30vw]">
                {participantsTitle}
              </span>
            </div>
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
