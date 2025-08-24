// src/components/group/GroupTransactionsTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import GroupFAB from "./GroupFAB";
import EmptyTransactions from "../EmptyTransactions";
import CreateTransactionModal from "../transactions/CreateTransactionModal";
import TransactionCard, { GroupMemberLike } from "../transactions/TransactionCard";

// стор групп — только для списка групп и их валют/иконки
import { useGroupsStore } from "../../store/groupsStore";

// API
import { getTransactions } from "../../api/transactionsApi";
import { getGroupMembers } from "../../api/groupMembersApi";
import type { TransactionOut } from "../../types/transaction";

type Props = {
  loading: boolean;            // не используем — грузим сами
  transactions: any[];         // не используем — грузим сами
  onAddTransaction: () => void;// не используем
};

const PAGE_SIZE = 20;

const GroupTransactionsTab = ({ loading: _loadingProp, transactions: _txProp, onAddTransaction: _onAdd }: Props) => {
  const { t } = useTranslation();
  const [openCreate, setOpenCreate] = useState(false);

  // groupId из урла — фильтрация выборки
  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0) || undefined;

  // список групп (для модалки создания)
  const groups = useGroupsStore((s: { groups: any[] }) => s.groups ?? []);

  // локальный стейт списка транзакций
  const [items, setItems] = useState<TransactionOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // участники группы -> Map<userId, GroupMemberLike>
  const [membersMap, setMembersMap] = useState<Map<number, GroupMemberLike> | null>(null);
  const [membersCount, setMembersCount] = useState<number>(0);

  // для отмены запросов/IO
  const abortRef = useRef<AbortController | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const lockRef = useRef(false);

  // ключ пересборки при смене фильтров
  const filtersKey = useMemo(() => JSON.stringify({ groupId }), [groupId]);

  /* ---------- загрузка участников группы (для имён/аватаров) ---------- */
  useEffect(() => {
    if (!groupId) {
      setMembersMap(null);
      setMembersCount(0);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        // возьмём с запасом
        const { total, items } = await getGroupMembers(groupId, 0, 200);
        if (cancelled) return;

        const map = new Map<number, GroupMemberLike>();
        for (const m of items) {
          const u = (m as any).user || {};
          const id = Number(u.id);
          if (!Number.isFinite(id)) continue;

          const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
          map.set(id, {
            id,
            name: fullName || (u.username ?? ""),
            first_name: u.first_name,
            last_name: u.last_name,
            username: u.username,
            avatar_url: u.photo_url ?? undefined,
            photo_url: u.photo_url ?? undefined,
          });
        }
        setMembersMap(map);
        setMembersCount(total || items.length);
      } catch {
        // тихо игнорим — карточки просто покажут без имён
        setMembersMap(null);
        setMembersCount(0);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  /* ---------- первичная загрузка / ресет при смене groupId ---------- */
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

  /* ---------- догрузка следующей страницы ---------- */
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

      // дедуп по id
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
      setTimeout(() => {
        lockRef.current = false;
      }, 120);
    }
  };

  /* ---------- IntersectionObserver: сентинел для инфинити-скролла ---------- */
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

  const handleAddClick = () => setOpenCreate(true);

  // при успешном создании — сразу добавим в выдачу без полного рефетча
  const handleCreated = (tx: TransactionOut) => setItems((prev) => [tx, ...prev]);

  return (
    <div className="relative w-full h-full min-h[320px]">
      {/* Строку поиска (FiltersRow) убрали по запросу */}

      {error ? (
        <div className="flex justify-center py-12 text-red-500">{error}</div>
      ) : loading && items.length === 0 ? (
        <div className="flex justify-center py-12 text-[var(--tg-hint-color)]">{t("loading")}</div>
      ) : items.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <div className="flex flex-col gap-2 py-3">
          {items.map((tx: any, idx: number) => (
            <div key={tx.id || `${tx.type}-${tx.date}-${tx.amount}-${tx.comment ?? ""}`} className="relative">
              <TransactionCard
                tx={tx}
                membersById={membersMap ?? undefined}
                groupMembersCount={membersCount}
                t={t}
                // пример: хук для «долгого тапа» — см. добавку в TransactionCard ниже
                // onLongPress={(txPressed) => setActionTx(txPressed)}
              />
              {idx !== items.length - 1 && (
                <div className="absolute left-14 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
              )}
            </div>
          ))}
          {/* сентинел */}
          <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
          {loading && items.length > 0 && (
            <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка…</div>
          )}
        </div>
      )}

      <GroupFAB onClick={handleAddClick} />

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
