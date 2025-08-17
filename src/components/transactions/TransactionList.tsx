// src/components/transactions/TransactionList.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import CardSection from "../CardSection";
import EmptyTransactions from "../EmptyTransactions";
import TransactionCard from "./TransactionCard";
import { getTransactions } from "../../api/transactionsApi";
import type { TxType, TransactionOut } from "../../types/transaction";

type Props = {
  groupId?: number;
  userId?: number;
  type?: TxType;
  pageSize?: number;
  refreshKey?: string | number;
  className?: string;
};

const DEFAULT_PAGE_SIZE = 20;

export default function TransactionList({
  groupId,
  userId,
  type,
  pageSize = DEFAULT_PAGE_SIZE,
  refreshKey,
  className,
}: Props) {
  const [items, setItems] = useState<TransactionOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // локальный словарь участников группы (чтобы карточки сразу имели имена/аватары)
  const [membersById, setMembersById] = useState<Map<number, any> | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const lockRef = useRef(false);

  const filtersKey = useMemo(
    () => JSON.stringify({ groupId, userId, type, pageSize, refreshKey }),
    [groupId, userId, type, pageSize, refreshKey]
  );

  // грузим участников группы один раз на groupId
  useEffect(() => {
    if (!groupId) {
      setMembersById(null);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/group-members/group/${groupId}?offset=0&limit=200`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const map = new Map<number, any>();
        for (const it of items) {
          const u = it?.user ?? it;
          const id = Number(u?.id);
          if (!id) continue;
          map.set(id, { user: u });
        }
        setMembersById(map);
      } catch {
        setMembersById(null); // карточки сами подгрузят, если что
      }
    })();
    return () => controller.abort();
  }, [groupId]);

  // первичная загрузка / сброс при смене фильтров
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
          userId,
          type,
          offset: 0,
          limit: pageSize,
          signal: controller.signal,
        });
        setItems(items);
        setTotal(total);
        setHasMore(items.length < total);
      } catch (e: any) {
        if (controller.signal.aborted) return;
        setError(e?.message || "Failed to load transactions");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void run();
    return () => controller.abort();
  }, [filtersKey, groupId, userId, type, pageSize]);

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
        userId,
        type,
        offset,
        limit: pageSize,
        signal: controller.signal,
      });

      setTotal(newTotal);

      const byId = new Map<number | string, TransactionOut>();
      for (const it of items) byId.set(it.id ?? `${it.type}-${it.date}-${it.amount}-${it.comment ?? ""}`, it);
      for (const it of chunk) byId.set(it.id ?? `${it.type}-${it.date}-${it.amount}-${it.comment ?? ""}`, it);

      const merged = Array.from(byId.values());
      setItems(merged);
      setHasMore(merged.length < newTotal);
    } catch (e: any) {
      if (!controller.signal.aborted) setError(e?.message || "Failed to load more");
    } finally {
      setLoading(false);
      setTimeout(() => {
        lockRef.current = false;
      }, 120);
    }
  };

  // IntersectionObserver для бесконечной прокрутки
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    ioRef.current?.disconnect();
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e.isIntersecting) return;
        if (lockRef.current || loading || !hasMore) return;
        void loadMore();
      },
      { root: null, rootMargin: "320px 0px 0px 0px", threshold: 0 }
    );
    io.observe(el);
    ioRef.current = io;
    return () => {
      io.disconnect();
      if (ioRef.current === io) ioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, hasMore, loading, filtersKey]);

  if (error) {
    return (
      <CardSection>
        <div className="py-12 text-center text-red-500">{error}</div>
      </CardSection>
    );
  }

  if (loading && items.length === 0) {
    return (
      <CardSection>
        <div className="py-12 text-center text-[var(--tg-hint-color)]">Загрузка…</div>
      </CardSection>
    );
  }

  if (!loading && items.length === 0) {
    return <EmptyTransactions />;
  }

  const membersCount = membersById?.size ?? 0;

  return (
    <CardSection noPadding className={className}>
      {items.map((tx, idx) => (
        <div key={tx.id ?? `${tx.type}-${tx.date}-${tx.amount}-${tx.comment ?? ""}`} className="relative">
          <TransactionCard
            tx={tx}
            membersById={membersById ?? undefined}
            groupMembersCount={membersCount || undefined}
          />
          {idx !== items.length - 1 && (
            <div className="absolute left-14 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
          )}
        </div>
      ))}
      {/* сентинел */}
      <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
      {/* подгрузка внизу */}
      {loading && items.length > 0 && (
        <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка…</div>
      )}
    </CardSection>
  );
}
