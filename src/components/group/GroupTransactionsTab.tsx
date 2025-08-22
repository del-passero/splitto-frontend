import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import FiltersRow from "../FiltersRow";
import GroupFAB from "./GroupFAB";
import EmptyTransactions from "../EmptyTransactions";
import CreateTransactionModal from "../transactions/CreateTransactionModal";
import TransactionCard, { GroupMemberLike } from "../transactions/TransactionCard";

import { useGroupsStore } from "../../store/groupsStore";

// API
import { getTransactions } from "../../api/transactionsApi";
import { getGroupMembers } from "../../api/groupMembersApi";
import type { TransactionOut } from "../../types/transaction";
import type { GroupMember } from "../../types/group_member";

type Props = {
  loading: boolean;            // не используем — грузим сами
  transactions: any[];         // не используем — грузим сами
  onAddTransaction: () => void;// не используем
};

const PAGE_SIZE = 20;

const GroupTransactionsTab = (_props: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0) || undefined;

  const groups = useGroupsStore((s: { groups: any[] }) => s.groups ?? []);

  const [items, setItems] = useState<TransactionOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // --- участники группы ---
  const [members, setMembers] = useState<GroupMember[]>([]);
  const membersMap = useMemo(() => {
    const m = new Map<number, GroupMemberLike>();
    for (const gm of members || []) {
      const uid = Number((gm as any)?.user?.id);
      if (!Number.isFinite(uid)) continue;
      const user = (gm as any).user || {};
      const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.username || undefined;
      m.set(uid, {
        user: {
          id: uid,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url,
        },
        name,
        avatar_url: (gm as any).avatar_url ?? user.photo_url ?? undefined,
      });
    }
    return m;
  }, [members]);

  const abortRef = useRef<AbortController | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const lockRef = useRef(false);

  const filtersKey = useMemo(() => JSON.stringify({ groupId }), [groupId]);

  // грузим ВСЕХ участников группы (пагинация твоего API)
  useEffect(() => {
    if (!groupId) return;
    let mounted = true;
    (async () => {
      try {
        const LIMIT = 200;
        let offset = 0;
        let all: GroupMember[] = [];
        // первая страница
        // твой API: getGroupMembers(groupId, offset?, limit?)
        // возвращает { total, items }
        // крутим до total
        // (перестраховка на случай, если total отсутствует — выйдем по пустому items)
        while (true) {
          const { total, items } = await getGroupMembers(groupId, offset, LIMIT);
          all = all.concat(items || []);
          offset += (items?.length || 0);
          if (!items?.length) break;
          if (typeof total === "number" && all.length >= total) break;
        }
        if (mounted) setMembers(all);
      } catch {
        if (mounted) setMembers([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [groupId]);

  // первичная загрузка / ресет при смене groupId
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    setItems([]);
    setTotal(0);
    setError(null);
    setHasMore(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      setLoading(true);
      try {
        const { total, items } = await getTransactions({
          groupId,
          offset: 0,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });
        setItems(items);
        setTotal(total);
        setHasMore(items.length < total);
      } catch (e: any) {
        if (!controller.signal.aborted) {
          setError(e?.message || "Failed to load transactions");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void run();

    return () => controller.abort();
  }, [filtersKey, groupId]);

  // догрузка следующей страницы
  const loadMore = async () => {
    if (loading || !hasMore) return;
    lockRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const offset = items.length;
      const { total: newTotal, items: chunk } = await getTransactions({
        groupId,
        offset,
        limit: PAGE_SIZE,
        signal: controller.signal,
      });

      setTotal(newTotal);

      const map = new Map<number | string, TransactionOut>();
      for (const it of items) map.set(it.id ?? `${it.type}-${it.date}-${it.amount}-${it.comment ?? ""}`, it);
      for (const it of chunk) map.set(it.id ?? `${it.type}-${it.date}-${it.amount}-${it.comment ?? ""}`, it);

      const merged = Array.from(map.values());
      setItems(merged);
      setHasMore(merged.length < newTotal);
    } catch (e: any) {
      if (!controller.signal.aborted) {
        setError(e?.message || "Failed to load more");
      }
    } finally {
      setLoading(false);
      setTimeout(() => { lockRef.current = false; }, 120);
    }
  };

  // IO: сентинел
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    ioRef.current?.disconnect();
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (!e.isIntersecting) return;
      if (lockRef.current || loading || !hasMore) return;
      void loadMore();
    }, { root: null, rootMargin: "320px 0px 0px 0px", threshold: 0 });

    io.observe(el);
    ioRef.current = io;

    return () => {
      io.disconnect();
      if (ioRef.current === io) ioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, hasMore, loading, filtersKey]);

  const visible = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((tx) => {
      const hay = [
        tx.comment,
        (tx as any).category?.name,
        (tx as any).from_name,
        (tx as any).to_name,
        tx.currency,
        tx.amount?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  const handleCreated = (tx: TransactionOut) => {
    setItems(prev => [tx, ...prev]);
  };

  return (
    <div className="relative w-full h-full min-h:[320px]">
      <FiltersRow search={search} setSearch={setSearch} />

      {error ? (
        <div className="flex justify-center py-12 text-red-500">{error}</div>
      ) : loading && items.length === 0 ? (
        <div className="flex justify-center py-12 text-[var(--tg-hint-color)]">
          {t("loading")}
        </div>
      ) : visible.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <div className="flex flex-col gap-2 py-3">
          {visible.map((tx: any, idx: number) => (
            <div key={tx.id || `${tx.type}-${tx.date}-${tx.amount}-${tx.comment ?? ""}`} className="relative">
              <TransactionCard
                tx={tx}
                membersById={membersMap}
                groupMembersCount={members.length}
                t={t}
              />
              {idx !== visible.length - 1 && (
                <div className="absolute left-14 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
              )}
            </div>
          ))}
          <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
          {loading && items.length > 0 && (
            <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка…</div>
          )}
        </div>
      )}

      <GroupFAB onClick={() => setOpenCreate(true)} />

      <CreateTransactionModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        groups={groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          color: g.color,
          default_currency_code: (g as any).default_currency_code,
          currency_code: (g as any).currency_code,
          currency: (g as any).currency,
        }))}
        defaultGroupId={groupId}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default GroupTransactionsTab;
