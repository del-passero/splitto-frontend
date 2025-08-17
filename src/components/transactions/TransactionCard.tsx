// src/components/transactions/TransactionCard.tsx
import { ArrowRightLeft, Layers } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

/** Типы участника (минимально достаточные) */
type UserLike = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;     // у нас часто так
  avatar_url?: string | null;    // иногда так
  name?: string | null;          // иногда склеенное имя
};

type GroupMemberLike = { user?: UserLike } | UserLike;

type MembersMap = Map<number, GroupMemberLike> | Record<number, GroupMemberLike>;

type Props = {
  tx: any; // TransactionOut | LocalTx
  /** Карта участников: id -> member/user. Можно не передавать — карточка сама подтянет */
  membersById?: MembersMap;
  /** Кол-во участников в группе (для "Все (N)"). Можно не передавать. */
  groupMembersCount?: number;
  /** Локализация (опционально), используем tx_modal.all при наличии */
  t?: (k: string, vars?: Record<string, any>) => string;
};

/** Локальный cache: groupId -> Map<userId, member> */
const groupMembersCache = new Map<number, Map<number, GroupMemberLike>>();

function pickUser(entity?: GroupMemberLike | null): UserLike | null {
  if (!entity) return null;
  if ((entity as any).user) return (entity as any).user as UserLike;
  return entity as UserLike;
}

function getDisplayName(u?: UserLike | null): string {
  if (!u) return "";
  const parts = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  if (u.name && u.name.trim()) return u.name.trim();
  if (u.username && u.username.trim()) return u.username.trim();
  return `#${u.id}`;
}

function getAvatar(u?: UserLike | null): string | undefined {
  return (u?.avatar_url || u?.photo_url || undefined) || undefined;
}

function initialsFromName(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "•";
  if (tokens.length === 1) return tokens[0].charAt(0).toUpperCase();
  return (tokens[0].charAt(0) + tokens[1].charAt(0)).toUpperCase();
}

function asMap(m?: MembersMap): Map<number, GroupMemberLike> | null {
  if (!m) return null;
  if (m instanceof Map) return m;
  const map = new Map<number, GroupMemberLike>();
  Object.keys(m).forEach((k) => {
    const id = Number(k);
    if (Number.isFinite(id)) map.set(id, (m as Record<number, GroupMemberLike>)[id]);
  });
  return map;
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

export default function TransactionCard({ tx, membersById, groupMembersCount, t }: Props) {
  // --- 1) Участники группы: берём из props или подтягиваем сами и кешируем ---
  const passedMap = asMap(membersById);
  const [localMap, setLocalMap] = useState<Map<number, GroupMemberLike> | null>(null);
  const groupId = Number(tx?.group_id) || undefined;
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (passedMap) {
      setLocalMap(null); // используем переданный
      return;
    }
    if (!groupId) return;

    // Если уже есть кеш — используем
    const cached = groupMembersCache.get(groupId);
    if (cached) {
      setLocalMap(new Map(cached));
      return;
    }
    // Защитимся от повторных fetch
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    const controller = new AbortController();
    (async () => {
      try {
        const resp = await fetch(`/api/group-members/group/${groupId}?offset=0&limit=200`, {
          method: "GET",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        });
        if (!resp.ok) return;
        const list = await resp.json();
        const map = new Map<number, GroupMemberLike>();
        if (Array.isArray(list)) {
          for (const m of list) {
            const u = (m && m.user) ? m.user : m;
            const uid = Number(u?.id);
            if (Number.isFinite(uid)) map.set(uid, m);
          }
        }
        groupMembersCache.set(groupId, map);
        setLocalMap(new Map(map));
      } catch {
        // игнор — будут фоллбеки по ID
      }
    })();

    return () => controller.abort();
  }, [passedMap, groupId]);

  const mapToUse = passedMap || localMap;

  const resolveUser = (id?: number | null): UserLike | null => {
    if (!id && id !== 0) return null;
    const fromMap = mapToUse?.get ? mapToUse.get(id as number) : undefined;
    const user = pickUser(fromMap);
    if (user) return user;
    // фоллбек: возможно бэкенд прислал инлайн-поля на tx (from_name/…)
    return { id: id as number } as UserLike;
  };

  // --- 2) Основные вычисления ---
  const isExpense = tx.type === "expense";
  const dt = new Date(tx.date || tx.created_at || Date.now());
  const dateStr = dt.toLocaleDateString();

  const amountNum = Number(tx.amount ?? 0);
  const amount = `${amountNum.toFixed(2)} ${tx.currency || ""}`;

  // Заголовок
  const fromId = Number(tx.transfer_from ?? tx.from_user_id ?? tx.from_id);
  const toListRaw: any[] =
    Array.isArray(tx.transfer_to) ? tx.transfer_to :
    typeof tx.transfer_to === "string" ? (tx.transfer_to.split(",").map((s: string) => s.trim())) :
    tx.to_user_id ? [tx.to_user_id] :
    [];

  const toIds: number[] = toListRaw.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n));

  const fromUser = resolveUser(Number.isFinite(fromId) ? fromId : undefined);
  const toUsers = toIds.map((id) => resolveUser(id));

  const title = isExpense
    ? (tx.comment || "—")
    : `${getDisplayName(fromUser)} → ${toUsers.length ? getDisplayName(toUsers[0]) : "—"}`;

  // Плательщик
  const payerId = Number(tx.paid_by ?? tx.payer_id ?? fromId);
  const payer = resolveUser(Number.isFinite(payerId) ? payerId : undefined);

  // Участники (для расхода — из shares; для transfer — получатели)
  const shareIds: number[] = Array.isArray(tx.shares)
    ? Array.from(new Set(tx.shares.map((s: any) => Number(s.user_id)).filter((x: number) => Number.isFinite(x))))
    : [];

  const participants: UserLike[] = isExpense
    ? (shareIds.length
        ? shareIds.map((id) => resolveUser(id)!).filter(Boolean) as UserLike[]
        : (tx.split_type === "equal" && Number(groupMembersCount) > 0
            ? [] // "Все (N)" — ниже отрендерим текстом
            : []))
    : (toUsers.filter(Boolean) as UserLike[]);

  const allLabel = t ? t("tx_modal.all") : "ВСЕ";
  const groupCount = Number(groupMembersCount || 0);
  const showAll = isExpense && !shareIds.length && tx.split_type === "equal" && groupCount > 0;

  // --- 3) UI ---
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
          {/* Заголовок */}
          <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">{title}</div>

          {/* Подзаголовок и детали */}
          <div className="text-[12px] text-[var(--tg-hint-color)] flex flex-col gap-0.5">
            {/* Для расхода: "Заплатил <payer> за <участники|Все(N)>" */}
            {isExpense ? (
              <div className="flex items-center gap-1 min-w-0">
                <span className="opacity-80">Заплатил</span>
                {/* payer chip */}
                <span className="inline-flex items-center gap-1 px-1 py-[2px] rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] max-w-[40%]">
                  {getAvatar(payer) ? (
                    <img src={getAvatar(payer)} alt="" className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-[var(--tg-link-color)] inline-flex items-center justify-center text-[9px] text-white">
                      {initialsFromName(getDisplayName(payer))}
                    </span>
                  )}
                  <span className="truncate">{getDisplayName(payer)}</span>
                </span>

                <span className="opacity-80">за</span>

                {showAll ? (
                  <span className="inline-flex items-center gap-1 px-1 py-[2px] rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)]">
                    {allLabel} ({groupCount})
                  </span>
                ) : participants.length ? (
                  <span className="inline-flex items-center gap-1 flex-wrap">
                    {/* аватарки участников (до 3) */}
                    <span className="inline-flex -space-x-2 mr-1">
                      {participants.slice(0, 3).map((u) =>
                        getAvatar(u) ? (
                          <img key={u.id} src={getAvatar(u)} alt="" className="w-4 h-4 rounded-full object-cover ring-2 ring-[var(--tg-card-bg)]" />
                        ) : (
                          <span key={u.id} className="w-4 h-4 rounded-full bg-[var(--tg-link-color)] inline-flex items-center justify-center text-[9px] text-white ring-2 ring-[var(--tg-card-bg)]">
                            {initialsFromName(getDisplayName(u))}
                          </span>
                        )
                      )}
                    </span>
                    <span className="truncate">
                      {participants.length <= 3
                        ? participants.map(getDisplayName).join(", ")
                        : `${participants.slice(0, 3).map(getDisplayName).join(", ")} и ещё ${participants.length - 3}`}
                      {groupCount > 0 ? ` (${participants.length})` : ""}
                    </span>
                  </span>
                ) : (
                  <span className="opacity-70">—</span>
                )}
              </div>
            ) : (
              // Для перевода: from → to (уже в title), здесь показываем дату
              <span className="opacity-70">{dateStr}</span>
            )}

            {/* Для расхода — дата отдельно */}
            {isExpense && <span className="opacity-70">{dateStr}</span>}
          </div>
        </div>

        {/* Сумма */}
        <div className="text-[14px] font-semibold shrink-0 text-right leading-5">
          {amount}
        </div>
      </div>
    </div>
  );
}
