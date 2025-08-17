// src/components/group/GroupTransactionsTab.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import FiltersRow from "../FiltersRow";
import GroupFAB from "./GroupFAB";
import EmptyTransactions from "../EmptyTransactions";
import CreateTransactionModal from "../transactions/CreateTransactionModal";
import TransactionCard from "../transactions/TransactionCard";

// стор групп — только для списка групп и их валют/иконки
import { useGroupsStore } from "../../store/groupsStore";

// API
import { getTransactions } from "../../api/transactionsApi";
import type { TransactionOut } from "../../types/transaction";

type Props = {
  loading: boolean;            // не используем — грузим сами
  transactions: any[];         // не используем — грузим сами
  onAddTransaction: () => void;// не используем
};

const PAGE_SIZE = 20;

const GroupTransactionsTab = ({ loading: _loadingProp, transactions: _txProp, onAddTransaction: _onAdd }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  // groupId из урла — фильтрация выборки
  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0) || undefined;

  // список групп (для модалки создания)
  const groups = useGroupsStore((s: { groups: any[] }) => s.groups ?? []);

  // локальный стейт списка
  const [items, setItems] = useState<TransactionOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // участники группы (для имён/аватаров на карточках)
  const [membersMap, setMembersMap] = useState<Map<number, any>>(new Map());
  const [membersCount, setMembersCount] = useState<number>(0);

  // для отмены запросов/IO
  const abortRef = useRef<AbortController | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const lockRef = useRef(false);

  // ключ пересборки при смене фильтров
  const filtersKey = useMemo(() => JSON.stringify({ groupId }), [groupId]);

  // --- Загрузка участников группы (для отображения имён/аватаров) ---
  useEffect(() => {
    setMembersMap(new Map());
    setMembersCount(0);
    if (!groupId) return;

    const controller = new AbortController();

    const loadMembers = async () => {
      try {
        // Берём побольше, чтобы захватить всех
        const resp = await fetch(`/api/group-members/group/${groupId}?offset=0&limit=200`, {
          method: "GET",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        });
        if (!resp.ok) {
          // не падаем интерфейсом — просто оставим без имён
          return;
        }
        const list = await resp.json(); // ожидаем массив { user: {...} }
        const map = new Map<number, any>();
        if (Array.isArray(list)) {
          for (const m of list) {
            const u = (m && m.user) ? m.user : m;
            const id = Number(u?.id);
            if (Number.isFinite(id)) {
              map.set(id, m); // храним memberLike (совместимо с TransactionCard)
            }
          }
          setMembersCount(list.length);
        }
        setMembersMap(map);
      } catch {
        // игнор: без участников просто покажем id-фоллбек внутри карточки (если он там есть)
      }
    };

    void loadMembers();
    return () => controller.abort();
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
      setTimeout(() => { lockRef.current = false; }, 120);
    }
  };

  // IntersectionObserver: сентинел для инфинити-скролла
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
        (tx as any).category?.name, // для expense
        (tx as any).from_name,      // для transfer (если есть на фронте)
        (tx as any).to_name,        // для transfer (если есть на фронте)
        tx.currency,
        tx.amount?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  const handleAddClick = () => {
    setOpenCreate(true);
  };

  // при успешном создании — сразу добавим в выдачу без полного рефетча
  const handleCreated = (tx: TransactionOut) => {
    setItems(prev => [tx, ...prev]);
  };

  return (
    <div className="relative w-full h-full min-h=[320px]">
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
                groupMembersCount={membersCount}
                t={t}
              />
              {idx !== visible.length - 1 && (
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
