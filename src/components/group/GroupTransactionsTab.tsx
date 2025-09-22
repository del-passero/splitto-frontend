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

type Props = {
  loading: boolean;
  transactions: any[];
  onAddTransaction: () => void;

  /** ДОБАВЛЕНО: когда группа удалена/архивна — блокируем клики */
  locked?: boolean;
  /** Сообщение для алерта при клике в locked-режиме */
  blockMsg?: string;
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

// -------- helpers --------
function parseApiError(err: any): { code?: string; message?: string } {
  const codeAxios = err?.response?.data?.detail?.code || err?.response?.data?.code;
  if (codeAxios) return { code: codeAxios, message: err?.response?.data?.detail?.message || err?.message };
  if (err && typeof err === "object" && "detail" in err && (err as any).detail) {
    const det = (err as any).detail;
    if (typeof det === "object" && det.code) return { code: det.code, message: det.message };
    if (typeof det === "string") return { message: det };
  }
  if (typeof err?.message === "string") {
    try {
      const j = JSON.parse(err.message);
      const det = j?.detail;
      if (det?.code) return { code: det.code, message: det.message };
      if (typeof det === "string") return { message: det };
    } catch {}
  }
  if (typeof err === "string") {
    try {
      const j = JSON.parse(err);
      const det = j?.detail;
      if (det?.code) return { code: det.code, message: det.message };
      if (typeof det === "string") return { message: det };
    } catch {}
  }
  return { message: err?.message || String(err ?? "") };
}

function collectInvolvedUserIds(tx: TransactionOut): number[] {
  const ids = new Set<number>();
  if (tx.type === "expense") {
    if (tx.paid_by != null) ids.add(Number(tx.paid_by));
    for (const s of (tx.shares || [])) if (s?.user_id != null) ids.add(Number(s.user_id));
  } else if (tx.type === "transfer") {
    if (tx.transfer_from != null) ids.add(Number(tx.transfer_from));
    for (const uid of (tx.transfer_to || [])) if (uid != null) ids.add(Number(uid));
  }
  return Array.from(ids);
}

// ==== related_users → собрать fallback-карточки пользователей ====
type RelatedUser = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  name?: string | null;
};
function composeName(u?: RelatedUser | null): string {
  if (!u) return "";
  const n = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return n || (u.name ?? "") || (u.username ?? "") || (u.id ? `#${u.id}` : "");
}

// -------------------------

const GroupTransactionsTab = ({
  loading: _loadingProp,
  transactions: _txProp,
  onAddTransaction: _onAdd,
  locked,
  blockMsg,
}: Props) => {
  const { t, i18n } = useTranslation();
  const locale = useMemo(() => (i18n.language || "ru").split("-")[0], [i18n.language]);
  const navigate = useNavigate();

  const [openCreate, setOpenCreate] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [txForActions, setTxForActions] = useState<TransactionOut | null>(null);

  // center toast
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const showToast = useCallback((msg: string) => {
    setToast({ open: true, message: msg });
    window.setTimeout(() => setToast({ open: false, message: "" }), 2400);
  }, []);

  // modal: cannot edit/delete because inactive participants
  const [inactiveBlockOpen, setInactiveBlockOpen] = useState(false);
  const inactiveMsg = useMemo(() => {
    const key = "cannot_edit_or_delete_inactive";
    const raw = (t(key) as string) || "";
    if (!raw || raw === key) {
      if (locale === "en") {
        return "You can’t edit or delete this transaction because one of its participants has left the group.";
      }
      if (locale === "es") {
        return "No puedes editar ni eliminar esta transacción porque uno de sus participantes salió del grupo.";
      }
      return "Вы не можете редактировать или удалять эту транзакцию, потому что один из её участников уже вышел из группы.";
    }
    return raw;
  }, [t, locale]);

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

  // 🔧 Аугментация participants: добиваем из related_users (важно для удалённых/архивных)
  const membersMapAugmented = useMemo(() => {
    const base = new Map<number, GroupMemberLike>(membersMap ?? undefined);
    for (const tx of items) {
      const rel = (tx as any)?.related_users as RelatedUser[] | undefined;
      if (!Array.isArray(rel)) continue;
      for (const u of rel) {
        const uid = Number(u?.id);
        if (!Number.isFinite(uid)) continue;
        if (base.has(uid)) continue;
        base.set(uid, {
          id: uid,
          name: composeName(u),
          first_name: u.first_name || undefined,
          last_name: u.last_name || undefined,
          username: u.username || undefined,
          avatar_url: u.photo_url || u.avatar_url || undefined,
          photo_url: u.photo_url || u.avatar_url || undefined,
        } as any);
      }
    }
    return base;
  }, [membersMap, items]);

  const [categoriesById, setCategoriesById] = useState<
    Map<number, { id: number; name?: string | null; icon?: string | null; color?: string | null }>
  >(new Map());

  const abortRef = useRef<AbortController | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const filtersKey = useMemo(() => JSON.stringify({ groupId }), [groupId]);

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

  // локальная проверка «можно ли удалять»
  const hasInactiveParticipantsLocal = useCallback((tx: TransactionOut | null) => {
    if (!tx || !membersMapAugmented) return false;
    const activeIds = new Set(Array.from(membersMapAugmented.keys()));
    const involved = collectInvolvedUserIds(tx);
    return involved.some((uid) => !activeIds.has(uid));
  }, [membersMapAugmented]);

  const handleDelete = async () => {
    if (!txForActions?.id) return;

    if (hasInactiveParticipantsLocal(txForActions)) {
      setInactiveBlockOpen(true);
      closeActions();
      return;
    }

    const ok = window.confirm((t("tx_modal.delete_confirm") as string) || "Удалить транзакцию? Это действие необратимо.");
    if (!ok) return;

    try {
      setLoading(true);
      await removeTransaction(txForActions.id);
      setItems(prev => prev.filter(it => it.id !== txForActions.id));
    } catch (e: any) {
      const { code } = parseApiError(e);
      if (code === "tx_has_inactive_participants") {
        setInactiveBlockOpen(true);
      } else {
        const msg = (t("delete_failed") as string) || "Failed to delete";
        showToast(msg);
      }
    } finally {
      setLoading(false);
      closeActions();
    }
  };

  // === Блокировка кликов по карточкам, когда locked ===
  const onLockedCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.alert(blockMsg || (t("group_modals.edit_blocked_archived") as string));
  }, [blockMsg, t]);

  const visible = items;

  // уменьшили боковые отступы в 3 раза: было 16 → 6; leftInsetPx было 52 → 18
  const H_PADDING = 6;
  const LEFT_INSET = 18;

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
            horizontalPaddingPx={H_PADDING}
            leftInsetPx={LEFT_INSET}
            renderItem={(tx: any) => (
              <div
                data-tx-card
                onClick={locked ? onLockedCardClick : undefined}
              >
                <TransactionCard
                  tx={tx}
                  membersById={membersMapAugmented ?? undefined}
                  groupMembersCount={membersCount}
                  t={t}
                  onLongPress={handleLongPress}
                  categoriesById={categoriesById}
                />
              </div>
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

        <GroupFAB onClick={locked ? () => window.alert(blockMsg || (t("group_modals.edit_blocked_archived") as string)) : handleAddClick} />

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

        {/* === Центрированная модалка действий === */}
        {actionsOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center" onClick={closeActions}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative w-full max-w-md mx-4 rounded-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-2xl p-2"
              style={{ color: "var(--tg-text-color)" }}
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

        {/* === Модалка-блокировка (участник вышел/удалён) === */}
        {inactiveBlockOpen && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center" onClick={() => setInactiveBlockOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative w-full max-w-md mx-4 rounded-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-2xl p-4"
              style={{ color: "var(--tg-text-color)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[14px] leading-snug mb-3">{inactiveMsg}</div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition"
                  onClick={() => setInactiveBlockOpen(false)}
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === Центрированный тост === */}
        {toast.open && (
          <div className="fixed inset-0 z-[1200] pointer-events-none flex items-center justify-center">
            <div
              className="px-4 py-2.5 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] shadow-2xl text-[14px] font-medium"
              style={{ color: "var(--tg-text-color)" }}
            >
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </CardSection>
  );
};

export default GroupTransactionsTab;


