// src/components/group/GroupMembersTab.tsx

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Share2, UserPlus, Trash2 } from "lucide-react";
import CardSection from "../CardSection";
import { useUserStore } from "../../store/userStore";
import UserCard from "../UserCard";
import type { GroupMember } from "../../types/group_member";

type Props = {
  members: GroupMember[];
  isOwner: boolean;
  onRemove: (userId: number) => void;
  onInvite: () => void;
  onAdd: () => void;
  onSaveAndExit: () => void;
  loading?: boolean;
  fetchMore?: () => void;
  hasMore?: boolean;
  ownerId?: number;
};

const PAGE_SIZE = 20;

const GroupMembersTab = ({
  members,
  isOwner,
  onRemove,
  onInvite,
  onAdd,
  onSaveAndExit,
  loading = false,
  fetchMore,
  hasMore,
  ownerId,
}: Props) => {
  const { t } = useTranslation();
  const currentUserId = useUserStore((s) => s.user?.id) ?? 0;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // бесконечная прокрутка как в ContactFriendsList
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !fetchMore) return;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore && !loading) {
        fetchMore();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchMore, hasMore, loading]);

  return (
    <div className="flex flex-col gap-3 p-4 min-h-[280px]">
      {/* Invite / Add — одинаковые, базируемся на Invite */}
      <div className="flex gap-2 mb-3 mt-0">
        <button
          type="button"
          onClick={onInvite}
          aria-label={t("group_members_invite")}
          className="flex-1 h-11 rounded-xl font-semibold
                     text-white
                     bg-[var(--tg-accent-color,#40A7E3)]
                     hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                     active:scale-95 transition
                     shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                     border border-[var(--tg-hint-color)]/20
                     flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          {t("group_members_invite")}
        </button>

        <button
          type="button"
          onClick={onAdd}
          aria-label={t("group_members_add")}
          className="flex-1 h-11 rounded-xl font-semibold
                     text-white
                     bg-[var(--tg-accent-color,#40A7E3)]
                     hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                     active:scale-95 transition
                     shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                     border border-[var(--tg-hint-color)]/20
                     flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          {t("group_members_add")}
        </button>
      </div>

      {/* Список участников — стиль 1:1 с ContactFriendsList */}
      <CardSection noPadding>
        {members.map((gm, idx) => {
          const u = gm.user;
          const displayName =
            u?.name ||
            `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
            (u?.username ? `@${u.username}` : "");
          const toHref = u?.id === currentUserId ? "/profile" : `/contacts/${u?.id}`;
          const canRemoveThis = Boolean(isOwner && u?.id && u.id !== ownerId);

          return (
            <div key={`${u?.id}-${idx}`} className="relative">
              {/* строка с карточкой */}
              <Link to={toHref} className="block active:opacity-70">
                <UserCard name={displayName} username={u?.username} photo_url={u?.photo_url} />
              </Link>

              {/* кнопка удаления — по правому краю прямо на карточке */}
              {canRemoveThis && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (u?.id) onRemove(u.id);
                  }}
                  aria-label={t("delete")}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             p-2 rounded-full
                             hover:bg-red-500/10
                             active:scale-95 transition
                             text-red-500"
                  title={t("delete")}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              {/* разделитель как в ContactFriendsList: с отступом под аватар */}
              {idx !== members.length - 1 && (
                <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
              )}
            </div>
          );
        })}

        {/* компактный якорь для дозагрузки */}
        <div ref={sentinelRef} className="h-px" />
        {loading && (
          <div className="px-3 py-2 text-sm text-[var(--tg-hint-color)]">{t("loading")}</div>
        )}
      </CardSection>

      <div className="flex-1" />

      {/* Save & exit — primary */}
      <button
        type="button"
        onClick={onSaveAndExit}
        aria-label={t("group_settings_save_and_exit")}
        className="mt-8 w-full h-12 rounded-xl font-semibold
                   text-white
                   bg-[var(--tg-accent-color,#40A7E3)]
                   hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                   active:scale-95 transition
                   shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                   border border-[var(--tg-hint-color)]/20"
      >
        {t("group_settings_save_and_exit")}
      </button>
    </div>
  );
};

export default GroupMembersTab;
