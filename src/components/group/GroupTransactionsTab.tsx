// src/components/group/GroupTransactionsTab.tsx
// (без изменений по логике, уже в стиле списка: CardSection + вертикальные разделители, и передаём listMode)
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import GroupFAB from "./GroupFAB";
import EmptyTransactions from "../EmptyTransactions";
import CreateTransactionModal from "../transactions/CreateTransactionModal";
import TransactionCard, { GroupMemberLike } from "../transactions/TransactionCard";
import CardSection from "../CardSection";

import { useGroupsStore } from "../../store/groupsStore";
import { getTransactions, removeTransaction } from "../../api/transactionsApi";
import { getGroupMembers } from "../../api/groupMembersApi";
import type { TransactionOut } from "../../types/transaction";

type Props = {
  loading: boolean;
  transactions: any[];
  onAddTransaction: () => void;
};

const PAGE_SIZE = 20;

const GroupTransactionsTab = ({ loading: _loadingProp, transactions: _txProp, onAddTransaction: _onAdd }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [openCreate, setOpenCreate] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [txForActions, setTxForActions] = useState<TransactionOut | null>(null);

  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0) || undefined;

  const groups = useGroupsStore((s: { groups: any[] }) => s.groups ?? []);

  const [items, setItems] = useState<TransactionOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [membersMap, setMembersMap] = useState<Map<number, GroupMemberLike> | null>(null);
  const [membersCount, setMembersCount] = useState<number>(0);

  const abortRef = useRef<AbortController | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const lockRef = useRef(false);

  const filtersKey = useMemo(() => JSON.stringify({ groupId }), [groupId]);

  useEffect(() => {
    if (!groupId) {
      setMembersMap(null);
      setMembersCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
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
        setMembersMap(null);
        setMembersCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const reloadFirstPage = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = null;

    setItems([]);
    setTotal(0);
    setError(null);
    setHasMore(true);

    const controller = new AbortController();
    abortRef.current = controller;

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
  }, [groupId]);

  useEffect(() => {
    void reloadFirstPage();
  }, [filtersKey, reloadFirstPage]);

  const loadMore = useCallback(async () => {
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
      for (const it of items)
        map.set(it.id ?? `${it.type}-${it.date}-${it.amount}-${it.comment ?? ""}`, it);
      for (const it of chunk)
        map.set(it.id ?? `${it.type}-${it.date}-${it.amount}-${it.comment ?? ""}`, it);

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
  }, [groupId, items, hasMore, loading]);

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

  const handleCreated = (tx: TransactionOut) => setItems((prev) => [tx, ...prev]);

  const handleLongPress = (tx: TransactionOut) => {
    setTxForActions(tx);
    setActionsOpen(true);
  };

  const closeActions = () => {
    setActionsOpen(false);
    setTimeout(() => setTxForActions(null), 160);
  };

  const navigateToEdit = () => {
    if (!txForActions?.id) return;
    closeActions();
    navigate(`/transactions/${txForActions.id}`);
  };

  const handleDelete = async () => {
    if (!txForActions?.id) return;
    const ok = window.confirm(
      (t("tx_modal.delete_confirm") as string) ||
        "Удалить транзакцию? Это действие необратимо."
    );
    if (!ok) return;

    try {
      setLoading(true);
      await removeTransaction(txForActions.id);
      setItems((prev) => prev.filter((it) => it.id !== txForActions.id));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete tx", e);
    } finally {
      setLoading(false);
      closeActions();
    }
  };

  const visible = items;

  return (
    <div className="relative w-full h-full min-h-[320px]">
      {error ? (
        <div className="flex justify-center py-12 text-red-500">{error}</div>
      ) : loading && items.length === 0 ? (
        <div className="flex justify-center py-12 text-[var(--tg-hint-color)]">{t("loading")}</div>
      ) : visible.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <CardSection noPadding>
          {visible.map((tx: any, idx: number) => (
            <div key={tx.id || `${tx.type}-${tx.date}-${tx.amount}-${tx.comment ?? ""}`} className="relative">
              <TransactionCard
                tx={tx}
                membersById={membersMap ?? undefined}
                groupMembersCount={membersCount}
                t={t}
                onLongPress={handleLongPress}
                listMode
              />
              {idx !== visible.length - 1 && (
                <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
              )}
            </div>
          ))}
          {hasMore && !loading && <div ref={loaderRef} className="w-full h-2" />}
          {loading && items.length > 0 && (
            <div className="py-3 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
          )}
        </CardSection>
      )}

      <GroupFAB onClick={handleAddClick} />

      {actionsOpen && (
        <div
          className="fixed inset-0 z-[1100] flex items-end justify-center"
          onClick={closeActions}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full max-w-[520px] rounded-t-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.45)] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
              onClick={navigateToEdit}
            >
              {t("edit")}
            </button>
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold text-red-500 hover:bg-red-500/10 transition"
              onClick={handleDelete}
            >
              {t("delete")}
            </button>
            <div className="h-px bg-[var(--tg-hint-color)] opacity-10 my-1" />
            <button
              type="button"
              className="w-full text-center px-4 py-3 rounded-xl text-[14px] hover:bg-black/5 dark:hover:bg-white/5 transition"
              onClick={closeActions}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupTransactionsTab;
