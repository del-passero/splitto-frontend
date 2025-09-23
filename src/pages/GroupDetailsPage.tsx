// src/pages/GroupDetailsPage.tsx

import { useEffect, useState, useRef, useCallback, useMemo, Component, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getGroupDetails } from "../api/groupsApi";
import { getGroupMembers } from "../api/groupMembersApi";
import { useUserStore } from "../store/userStore";

import type { Group } from "../types/group";
import type { GroupMember } from "../types/group_member";

import GroupHeader from "../components/group/GroupHeader";
import ParticipantsScroller from "../components/group/ParticipantsScroller";
import GroupTabs from "../components/group/GroupTabs";
import GroupTransactionsTab from "../components/group/GroupTransactionsTab";
import GroupBalanceTab from "../components/group/GroupBalanceTab";
import GroupAnalyticsTab from "../components/group/GroupAnalyticsTab";
import AddGroupMembersModal from "../components/group/AddGroupMembersModal";
import InviteGroupModal from "../components/group/InviteGroupModal";
import ContactQuickModal from "../components/contacts/ContactQuickModal";

// ====== ErrorBoundary, чтобы не было «чёрного экрана» при любой ошибке ниже ======
class LocalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; msg?: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(err: any) {
    return { hasError: true, msg: err?.message || String(err || "") };
  }
  componentDidCatch(err: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("GroupDetailsPage error:", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-red-500">
          {this.state.msg || "Unexpected error in Group page"}
        </div>
      );
    }
    return this.props.children;
  }
}

const PAGE_SIZE = 24;

// Локальный хелпер: аккуратно мержим без дублей по user.id, сохраняя порядок
const mergeUniqueMembers = (prev: GroupMember[], chunk: GroupMember[]): GroupMember[] => {
  const out = [...prev];
  const seen = new Set<number>();
  for (const m of prev) {
    const uid = Number((m as any)?.user?.id);
    if (Number.isFinite(uid)) seen.add(uid);
  }
  for (const m of chunk) {
    const uid = Number((m as any)?.user?.id);
    if (!Number.isFinite(uid)) continue;
    if (seen.has(uid)) continue;
    seen.add(uid);
    out.push(m);
  }
  return out;
};

const GroupDetailsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groupId } = useParams();
  const id = Number(groupId);

  // Группа
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Участники
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Табы
  const [selectedTab, setSelectedTab] =
    useState<"transactions" | "balance" | "analytics">("transactions");

  // Текущий пользователь
  const user = useUserStore(state => state.user);
  const currentUserId = user?.id ?? 0;

  // Модалки
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // лёгкая модалка контакта
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickUserId, setQuickUserId] = useState<number | null>(null);

  // Центрированный тост (для прочих сообщений)
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast({ open: true, message: msg });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast({ open: false, message: "" }), 2400);
  }, []);
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Классическая модалка для locked
  const [blockedOpen, setBlockedOpen] = useState(false);
  const openBlocked = useCallback(() => setBlockedOpen(true), []);
  const closeBlocked = useCallback(() => setBlockedOpen(false), []);
  const lockMsg = useMemo(() => {
    return (group && (group as any)?.deleted_at)
      ? (t("group_modals.edit_blocked_deleted") as string)
      : (t("group_modals.edit_blocked_archived") as string);
  }, [group, t]);

  // Детали группы
  useEffect(() => {
    let alive = true;
    const fetchGroup = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getGroupDetails(id);
        if (!alive) return;

        const safe: Group = {
          ...data,
          members: Array.isArray((data as any)?.members) ? (data as any).members : [],
        } as any;

        setGroup(safe as Group);

        // Для archived/soft-deleted: берём участников из detail, ДЕДУБЛИМ и НЕ докачиваем
        const isDeleted_ = Boolean((safe as any)?.deleted_at);
        const isArchived_ = (safe as any)?.status === "archived";
        const initialMembers = (safe as any)?.members;
        if ((isDeleted_ || isArchived_) && Array.isArray(initialMembers) && initialMembers.length > 0) {
          setMembers(prev => mergeUniqueMembers(prev, initialMembers as GroupMember[]));
          setHasMore(false);
        }
      } catch (err: any) {
        setError(err?.message || (t("group_not_found") as string));
      } finally {
        if (alive) setLoading(false);
      }
    };
    if (id) fetchGroup();
    return () => { alive = false; };
  }, [id, t]);

  // Подгрузка участников (для активных групп)
  const loadMembers = useCallback(async () => {
    if (!id || membersLoading || !hasMore) return;
    try {
      setMembersLoading(true);
      const res = await getGroupMembers(id, page * PAGE_SIZE, PAGE_SIZE);
      const newItems = res.items || [];
      setMembers(prev => mergeUniqueMembers(prev, newItems as GroupMember[]));

      const currentCount = (page * PAGE_SIZE) + newItems.length;
      setHasMore(currentCount < (res.total || 0));
      setPage(p => p + 1);
    } catch {
      // ignore
    } finally {
      setMembersLoading(false);
    }
  }, [id, membersLoading, hasMore, page]);

  // Сброс пэйджера при смене id
  useEffect(() => {
    setMembers([]);
    setPage(0);
    setHasMore(true);
    setSelectedTab("transactions"); // стартуем всегда со списка транзакций
    setBlockedOpen(false);
  }, [id]);

  // Признаки состояния группы
  const isDeleted = Boolean((group as any)?.deleted_at);
  const isArchived = (group as any)?.status === "archived";
  const locked = isDeleted || isArchived;

  // Инфинити-подгрузка только для АКТИВНОЙ группы
  const canLoadMembers = Boolean(group) && !locked;

  // Первичная загрузка участников только когда подгрузка разрешена
  useEffect(() => {
    if (canLoadMembers && hasMore) {
      void loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canLoadMembers]);

  // Инфинити-скролл для участников (ранний префетч)
  useEffect(() => {
    if (!canLoadMembers || membersLoading || !hasMore || !loaderRef.current) return;
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !membersLoading) {
        void loadMembers();
      }
    }, {
      root: null,
      rootMargin: "0px 0px 320px 0px",
      threshold: 0,
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [canLoadMembers, membersLoading, hasMore, loadMembers]);

  // Всегда передаём функцию в ParticipantsScroller, чтобы не падала типизация
  const effectiveLoadMore = useCallback(() => {
    if (!canLoadMembers) return;
    if (!hasMore || membersLoading) return;
    void loadMembers();
  }, [canLoadMembers, hasMore, membersLoading, loadMembers]);

  // Навигация (редактирование блокируем для архивных/удалённых) — показываем модалку
  const handleSettingsClick = () => {
    if (!group) return;
    if (locked) {
      openBlocked();
      return;
    }
    navigate(`/groups/${group.id}/settings`);
  };

  const handleBalanceClick = () => setSelectedTab("balance");

  // клик по мини-карточке участника => лёгкая модалка
  const handleParticipantClick = (userId: number) => {
    if (!userId) return;
    if (userId === currentUserId) {
      navigate("/profile");
      return;
    }
    setQuickUserId(Number(userId));
    setQuickOpen(true);
  };

  // Invite/Add — показываем модалку при locked
  const handleInviteClick = () => {
    if (locked) {
      openBlocked();
      return;
    }
    setInviteOpen(true);
  };

  const handleAddClick = () => {
    if (locked) {
      openBlocked();
      return;
    }
    setAddOpen(true);
  };

  // Ошибки/загрузка
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--tg-hint-color)]">
        {t("loading")}
      </div>
    );
  }
  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-red-500">
        {error || t("group_not_found")}
      </div>
    );
  }

  const existingMemberIds = (members || [])
    .map(m => Number((m as any)?.user?.id))
    .filter((v): v is number => Number.isFinite(v));

  return (
    <div className="relative w-full min-h-screen bg-[var(--tg-bg-color)] text-[var(--tg-text-color)] flex flex-col">
      {/* ErrorBoundary сбрасывается при смене группы */}
      <LocalErrorBoundary key={id}>
        {/* Шапка группы */}
        <GroupHeader
          group={group}
          onSettingsClick={handleSettingsClick}
          onBalanceClick={handleBalanceClick}
        />

        {/* Лента участников */}
        <ParticipantsScroller
          members={Array.isArray(members) ? members : []}
          currentUserId={currentUserId}
          onParticipantClick={handleParticipantClick}
          onInviteClick={handleInviteClick}
          onAddClick={handleAddClick}
          loadMore={effectiveLoadMore}
          hasMore={canLoadMembers ? hasMore : false}
          loading={canLoadMembers ? membersLoading : false}
          ownerId={group.owner_id}
        />

        {/* Вкладки */}
        <div className="w-full max-w-xl mx-auto px-0">
          <GroupTabs selected={selectedTab} onSelect={setSelectedTab} className="mb-0" />
        </div>

        {/* Контент вкладок */}
        <div className="w-full max-w-xl mx-auto flex-1 px-0 pb-12 mt-1">
          {selectedTab === "transactions" && (
            <GroupTransactionsTab
              loading={false}
              transactions={[]}
              onAddTransaction={() => {}}
              locked={locked}
              blockMsg={lockMsg}
              key={`tx-${id}-${locked ? "locked" : "active"}`}
            />
          )}

          {selectedTab === "balance" && <GroupBalanceTab />}

          {selectedTab === "analytics" && <GroupAnalyticsTab />}
        </div>

        {/* Сентинел для участников */}
        {hasMore && <div ref={loaderRef} style={{ height: 1 }} />}

        {/* Модалка добавления участников */}
        <AddGroupMembersModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          groupId={id}
          existingMemberIds={existingMemberIds}
          onAdded={() => {
            // При желании можно обновить список:
            // setMembers([]); setPage(0); setHasMore(true); if (!locked) void loadMembers();
          }}
        />

        {/* Модалка инвайта в группу */}
        <InviteGroupModal open={inviteOpen} onClose={() => setInviteOpen(false)} groupId={id} />

        {/* Лёгкая модалка контакта */}
        <ContactQuickModal open={quickOpen} onClose={() => setQuickOpen(false)} userId={quickUserId} />

        {/* Единый центрированный тост для страницы (для нефатальных сообщений) */}
        {toast.open && (
          <div className="fixed inset-0 z-[1400] pointer-events-none flex items-center justify-center">
            <div
              className="px-4 py-2.5 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] shadow-2xl text-[14px] font-medium"
              style={{ color: "var(--tg-text-color)" }}
            >
              {toast.message}
            </div>
          </div>
        )}

        {/* Классическая модалка для locked */}
        {blockedOpen && (
          <div className="fixed inset-0 z-[1450] flex items-center justify-center" onClick={closeBlocked}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative w-full max-w-md mx-4 rounded-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-2xl p-4"
              style={{ color: "var(--tg-text-color)" }}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[14px] leading-snug mb-3">{lockMsg}</div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition"
                  onClick={closeBlocked}
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </LocalErrorBoundary>
    </div>
  );
};

export default GroupDetailsPage;
