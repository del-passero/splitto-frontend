import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import GroupFAB from "./GroupFAB";
import EmptyTransactions from "../EmptyTransactions";
import CreateTransactionModal from "../transactions/CreateTransactionModal";
import TransactionCard, { GroupMemberLike } from "../transactions/TransactionCard";

// стор групп — только для списка групп и их валют/иконки
import { useGroupsStore } from "../../store/groupsStore";

// API
import { getTransactions, removeTransaction } from "../../api/transactionsApi";
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
  const navigate = useNavigate();

  const [openCreate, setOpenCreate] = useState(false);

  // Action sheet по long-press
  const [actionsOpen, setActionsOpen] = useState(false);
  const [txForActions, setTxForActions] = useState<TransactionOut | null>(null);

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
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  /* ---------- функция первичной загрузки (и перезагрузки после delete) ---------- */
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

  /* ---------- догрузка следующей страницы ---------- */
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

      // дедуп по id
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

  /* ---------- обработчики ---------- */
  const handleAddClick = () => setOpenCreate(true);

  // при успешном создании — сразу добавим в выдачу без полного рефетча
  const handleCreated = (tx: TransactionOut) => setItems((prev) => [tx, ...prev]);

  // long-press из карточки
  const handleLongPress = (tx: TransactionOut) => {
    setTxForActions(tx);
    setActionsOpen(true);
  };

  const closeActions = () => {
    setActionsOpen(false);
    setTimeout(() => setTxForActions(null), 160);
  };

  const handleEdit = () => {
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

  // Видимые элементы (строки поиска больше нет)
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
        <div className="flex flex-col gap-2 py-3">
          {visible.map((tx: any, idx: number) => (
            <div key={tx.id || `${tx.type}-${tx.date}-${tx.amount}-${tx.comment ?? ""}`} className="relative">
              <TransactionCard
                tx={tx}
                membersById={membersMap ?? undefined}
                groupMembersCount={membersCount}
                t={t}
                onLongPress={handleLongPress}
              />
              {idx !== visible.length - 1 && (
                <div className="absolute left-14 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
              )}
            </div>
          ))}
          {/* сентинел */}
          <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
          {loading && items.length > 0 && (
            <div className="py-3 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
          )}
        </div>
      )}

      <GroupFAB onClick={handleAddClick} />

      {/* Модалка создания */}
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

      {/* Action Sheet по long-press */}
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
              onClick={handleEdit}
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
