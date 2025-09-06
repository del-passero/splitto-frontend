// src/components/group/GroupTransactionsTab.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import GroupFAB from "./GroupFAB";
import EmptyTransactions from "../EmptyTransactions";
import CreateTransactionModal from "../transactions/CreateTransactionModal";
import TransactionCard, { GroupMemberLike } from "../transactions/TransactionCard";
import TransactionList from "../transactions/TransactionList";
import CardSection from "../CardSection";

import { useGroupsStore } from "../../store/groupsStore";
import { getTransactions, removeTransaction } from "../../api/transactionsApi";
import { getGroupMembers } from "../../api/groupMembersApi";
import type { TransactionOut } from "../../types/transaction";

// === ТОЛЬКО ДОБАВЛЕНО: helper + тост ===
function mapDeleteErrorToKey(e: any): string {
  try {
    const parsed = JSON.parse(e?.message || "{}");
    const code = parsed?.detail?.code || parsed?.code || parsed?.detail;
    if (code === "tx_delete_forbidden_expense") return "errors.tx_delete_forbidden_expense";
    if (code === "tx_delete_forbidden_transfer") return "errors.tx_delete_forbidden_transfer";
  } catch {
    /* ignore */
  }
  return "delete_failed";
}
const Toast = ({ text, onClose }: { text: string; onClose: () => void }) => (
  <div
    className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[1200] px-3 py-2 rounded-xl text-[13px] font-semibold shadow-lg"
    style={{
      background: "var(--tg-card-bg)",
      color: "var(--tg-text-color)",
      border: "1px solid var(--tg-secondary-bg-color, #e7e7e7)",
    }}
    onClick={onClose}
    role="status"
  >
    {text}
  </div>
);
// === /ТОЛЬКО ДОБАВЛЕНО ===

type Props = {
  loading: boolean;
  transactions: any[];
  onAddTransaction: () => void;
};

const PAGE_SIZE = 20;

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api";
function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || "";
}
type ApiExpenseCategoryOut = {
  id: number;
  key: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  parent_id?: number | null;
  is_active: boolean;
  name_i18n?: Record<string, string> | null;
};
type ApiListResp = { items: ApiExpenseCategoryOut[]; total: number; restricted: boolean };
async function apiListGroupCategoriesPage(params: {
  groupId: number; offset: number; limit: number; locale: string;
}): Promise<ApiListResp> {
  const url = new URL(`${API_URL}/groups/${params.groupId}/categories`);
  url.searchParams.set("offset", String(params.offset));
  url.searchParams.set("limit", String(params.limit));
  url.searchParams.set("locale", params.locale);
  const res = await fetch(url.toString(), { headers: { "x-telegram-initdata": getTelegramInitData() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const GroupTransactionsTab = ({ loading: _loadingProp, transactions: _txProp, onAddTransaction: _onAdd }: Props) => {
  const { t, i18n } = useTranslation();
  const locale = useMemo(() => (i18n.language || "ru").split("-")[0], [i18n.language]);
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

  const [categoriesById, setCategoriesById] = useState<
    Map<number, { id: number; name?: string | null; icon?: string | null; color?: string | null }>
  >(new Map());

  const abortRef = useRef<AbortController | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const filtersKey = useMemo(() => JSON.stringify({ groupId }), [groupId]);

  // === ТОЛЬКО ДОБАВЛЕНО: состояние тоста ===
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);
  // === /ТОЛЬКО ДОБАВЛЕНО ===

  useEffect(() => {
    if (!groupId) { setMembersMap(null); setMembersCount(0); return; }
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
    return () => { cancelled = true; };
  }, [groupId]);

  useEffect(() => {
    if (!groupId) { setCategoriesById(new Map()); return; }
    let cancelled = false;
    (async () => {
      try {
        const m = new Map<number, { id: number; name?: string | null; icon?: string | null; color?: string | null }>();
        let offset = 0; const LIMIT = 200;
        while (true) {
          const page = await apiListGroupCategoriesPage({ groupId, offset, limit: LIMIT, locale });
          for (const it of page.items || []) {
            const prev = m.get(it.id);
            m.set(it.id, {
              id: it.id,
              name: it.name || prev?.name || null,
              icon: (it.icon ?? prev?.icon) ?? null,
              color: (it.color ?? prev?.color) ?? null,
            });
          }
          offset += (page.items?.length || 0);
          if ((page.items?.length || 0) < LIMIT) break;
        }
        if (!cancelled) setCategoriesById(m);
      } catch {
        if (!cancelled) setCategoriesById(new Map());
      }
    })();
    return () => { cancelled = true; };
  }, [groupId, locale]);

  const reloadFirstPage = useCallback(async () => {
    abortRef.current?.abort(); abortRef.current = null;
    setItems([]); setTotal(0); setError(null); setHasMore(true);
    const controller = new AbortController(); abortRef.current = controller;
    setLoading(true);
    try {
      const { total, items } = await getTransactions({ groupId, offset: 0, limit: PAGE_SIZE, signal: controller.signal });
      setItems(items); setTotal(total); setHasMore(items.length < total);
    } catch (e: any) {
      if (!controller.signal.aborted) setError(e?.message || "Failed to load transactions");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { void reloadFirstPage(); }, [filtersKey, reloadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const controller = new AbortController(); abortRef.current = controller;
    try {
      setLoading(true);
      const offset = items.length;
      const { total: newTotal, items: chunk } = await getTransactions({ groupId, offset, limit: PAGE_SIZE, signal: controller.signal });
      setTotal(newTotal);
      const map = new Map<number | string, TransactionOut>();
      for (const it of items) map.set(it.id ?? `${it.type}-${it.date}-${it.amount}-${it.comment ?? ""}`, it);
      for (const it of chunk) map.set(it.id ?? `${it.type}-${it.date}-${it.amount}-${it.comment ?? ""}`, it);
      const merged = Array.from(map.values());
      setItems(merged); setHasMore(merged.length < newTotal);
    } catch (e: any) {
      if (!controller.signal.aborted) setError(e?.message || "Failed to load more");
    } finally { setLoading(false); }
  }, [groupId, items, hasMore, loading]);

  useEffect(() => {
    const el = loaderRef.current; if (!el) return;
    ioRef.current?.disconnect();
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (!e.isIntersecting) return;
      if (loading || !hasMore) return;
      void loadMore();
    }, { root: null, rootMargin: "320px 0px 0px 0px", threshold: 0 });
    io.observe(el); ioRef.current = io;
    return () => { io.disconnect(); if (ioRef.current === io) ioRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, hasMore, loading, filtersKey]);

  const handleAddClick = () => setOpenCreate(true);
  const handleCreated = (tx: TransactionOut) => setItems(prev => [tx, ...prev]);
  const handleLongPress = (tx: TransactionOut) => { setTxForActions(tx); setActionsOpen(true); };
  const closeActions = () => { setActionsOpen(false); setTimeout(() => setTxForActions(null), 160); };
  const handleEdit = () => { if (!txForActions?.id) return; closeActions(); navigate(`/transactions/${txForActions.id}`); };
  const handleDelete = async () => {
    if (!txForActions?.id) return;
    const ok = window.confirm((t("tx_modal.delete_confirm") as string) || "Удалить транзакцию? Это действие необратимо.");
    if (!ok) return;
    try { setLoading(true); await removeTransaction(txForActions.id); setItems(prev => prev.filter(it => it.id !== txForActions.id)); }
    catch (e: any) {
      // === ТОЛЬКО ДОБАВЛЕНО: показать тост с ключом ===
      const key = mapDeleteErrorToKey(e);
      setToast(t(key) as string);
    }
    finally { setLoading(false); closeActions(); }
  };

  const visible = items;

  return (
    <CardSection noPadding className="relative w-full h-full min-h-[320px]">
      <div style={{ color: "var(--tg-text-color)" }}>
        {error ? (
          <div className="flex justify-center py-12 text-red-500">{error}</div>
        ) : loading && items.length === 0 ? (
          <div className="flex justify-center py-12 text-[var(--tg-hint-color)]">{t("loading")}</div>
        ) : visible.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <TransactionList
            items={visible}
            bleedPx={0}
            horizontalPaddingPx={16}
            leftInsetPx={52}
            renderItem={(tx: any) => (
              <TransactionCard
                tx={tx}
                membersById={membersMap ?? undefined}
                groupMembersCount={membersCount}
                t={t}
                onLongPress={handleLongPress}
                categoriesById={categoriesById}
              />
            )}
            keyExtractor={(tx: any) =>
              tx.id ?? `${tx.type}-${tx.date}-${tx.amount}-${tx.comment ?? ""}`
            }
          />
        )}

        <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
        {loading && items.length > 0 && (
          <div className="py-3 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
        )}

        <GroupFAB onClick={handleAddClick} />

        <CreateTransactionModal
          open={openCreate}
          onOpenChange={setOpenCreate}
          groups={groups.map((g: any) => ({
            id: g.id,
            name: g.name,
            icon: (g as any).icon,
            color: (g as any).color,
            default_currency_code: (g as any).default_currency_code,
            currency_code: (g as any).currency_code,
            currency: (g as any).currency,
          }))}
          defaultGroupId={groupId}
          onCreated={handleCreated}
        />

        {actionsOpen && (
          <div className="fixed inset-0 z-[1100] flex items	end justify-center" onClick={closeActions}>
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="relative w-full max-w-[520px] rounded-t-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7е7)] shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.45)] p-2"
              style={{ color: "var(--tg-text-color)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition" onClick={handleEdit}>
                {t("edit")}
              </button>
              <button type="button" className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold text-red-500 hover:bg-red-500/10 transition" onClick={handleDelete}>
                {t("delete")}
              </button>
              <div className="h-px bg-[var(--tg-hint-color)] opacity-10 my-1" />
              <button type="button" className="w-full text-center px-4 py-3 rounded-xl text-[14px] hover:bg-black/5 dark:hover:bg-white/5 transition" onClick={closeActions}>
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        {/* === ТОЛЬКО ДОБАВЛЕНО: тост === */}
        {toast && <Toast text={toast} onClose={() => setToast(null)} />}
        {/* === /ТОЛЬКО ДОБАВЛЕНО === */}
      </div>
    </CardSection>
  );
};

export default GroupTransactionsTab;
