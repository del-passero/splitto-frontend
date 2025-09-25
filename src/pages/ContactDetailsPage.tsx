// src/pages/ContactDetailsPage.tsx

import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import CardSection from "../components/CardSection"
import UserCard from "../components/UserCard"
import { useFriendsStore } from "../store/friendsStore"
import ContactFriendsList from "../components/contacts/ContactFriendsList"
import type { UserShort } from "../types/friend"
import type { User } from "../types/user"

// Добавлено: для блока «Общие группы» как на GroupsPage
import { useUserStore } from "../store/userStore"
import { useGroupsStore } from "../store/groupsStore"
import TopInfoRow from "../components/TopInfoRow"
import FiltersRow from "../components/FiltersRow"
import GroupsList from "../components/GroupsList"
import GroupsFilterModal, { FiltersState as FiltersStateModal } from "../components/GroupsFilterModal"
import GroupsSortModal from "../components/GroupsSortModal"

type FiltersState = FiltersStateModal

const ContactDetailsPage = () => {
  const { t } = useTranslation()
  const { friendId: friendIdParam } = useParams()
  const friendId = Number(friendIdParam)

  const {
    contactFriend, contactFriendLoading, contactFriendError, fetchFriendById,
    contactCommonGroupNames, contactCommonGroupsLoading, contactCommonGroupsError, fetchCommonGroupNames,
    contactUserFallback, clearContactFriends,
  } = useFriendsStore()

  const [activeTab, setActiveTab] = useState<"info" | "friends">("info")

  // Смена профиля — очищаем и грузим заново
  useEffect(() => {
    clearContactFriends()
    if (Number.isFinite(friendId)) {
      fetchFriendById(friendId)
      fetchCommonGroupNames(friendId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId])

  // user из FriendOut (если это мой друг)
  const userFromFriendOut: UserShort | null = useMemo(() => {
    if (!contactFriend) return null
    const candidates = [contactFriend.user, contactFriend.friend].filter(Boolean) as UserShort[]
    return candidates.find(u => u.id === contactFriend.friend_id) || candidates[0] || null
  }, [contactFriend])

  // фоллбек-профиль (если НЕ друг)
  const userFromFallback: User | null = contactUserFallback

  const contactUserName =
    (userFromFriendOut?.name ||
      `${userFromFriendOut?.first_name || ""} ${userFromFriendOut?.last_name || ""}`.trim() ||
      (userFromFriendOut?.username ? `@${userFromFriendOut.username}` : "")) ||
    (userFromFallback?.name ||
      `${userFromFallback?.first_name || ""} ${userFromFallback?.last_name || ""}`.trim() ||
      (userFromFallback?.username ? `@${userFromFallback.username}` : "")) ||
    ""

  const contactUsername = userFromFriendOut?.username ?? userFromFallback?.username
  const contactPhoto = userFromFriendOut?.photo_url ?? userFromFallback?.photo_url

  const isFriend = !!contactFriend // наличие FriendOut => это мой друг
  const currentUserId = contactFriend?.friend?.id // точный id текущего юзера, когда выбранный контакт — мой друг

  const onOpenProfile = () => {
    if (!contactUsername) return
    window.open(`https://t.me/${contactUsername}`, "_blank")
  }

  /* ===== Общие группы — как на GroupsPage, но только пересечение ===== */
  const { user } = useUserStore()
  const {
    groups, groupsLoading, groupsError,
    groupsHasMore, fetchGroups, loadMoreGroups, clearGroups,

    includeHidden, includeArchived, includeDeleted,
    sortBy, sortDir, search,
    setFilters, setSort, setSearch,
  } = useGroupsStore()

  const q = useMemo(() => (search || "").trim(), [search])
  const commonNamesSet = useMemo(() => new Set(contactCommonGroupNames || []), [contactCommonGroupNames])

  // Фильтруем глобальный список групп по общим названиям
  const commonGroups = useMemo(() => {
    if (!Array.isArray(groups) || commonNamesSet.size === 0) return []
    return (groups as any[]).filter((g) => commonNamesSet.has(g?.name))
  }, [groups, commonNamesSet])

  // Перезагрузка групп при изменениях (аналогично GroupsPage), чтобы поиск/сорт работали
  useEffect(() => {
    if (!user?.id) return
    // подгружаем группы пользователя и уже здесь фильтруем до общих
    clearGroups()
    fetchGroups(user.id, {
      reset: true,
      q: q.length ? q : undefined,
      includeHidden,
      includeArchived,
      includeDeleted,
      sortBy,
      sortDir,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, q, includeHidden, includeArchived, includeDeleted, sortBy, sortDir])

  const isSearching = q.length > 0
  const nothingLoaded = !groupsLoading && !groupsError && commonGroups.length === 0
  const notFound = isSearching && nothingLoaded
  const noCommon = !isSearching && nothingLoaded

  // Модалки фильтров/сортировки (локальное "open")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  return (
    <div className="p-2">
      {/* Микротабы как в «Мой баланс / Все балансы» */}
      <div className="flex justify-center mt-1 mb-2">
        <div
          className="inline-flex rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`px-3 h-9 text-[13px] ${activeTab === "info" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)]"}`}
          >
            {t("contact.tab_info")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={`px-3 h-9 text-[13px] ${activeTab === "friends" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)]"}`}
          >
            {t("contact.tab_contact_friends")}
          </button>
        </div>
      </div>

      {activeTab === "info" && (
        <>
          <CardSection>
            {contactFriendLoading && (
              <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("loading")}</div>
            )}
            {!!contactFriendError && !userFromFallback && (
              <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("error")}</div>
            )}

            {(userFromFriendOut || userFromFallback) && (
              <div className="cursor-default">
                <UserCard
                  name={contactUserName}
                  username={contactUsername}
                  photo_url={contactPhoto}
                />

                {/* «В друзьях с …» показываем ТОЛЬКО если это мой друг */}
                {isFriend && contactFriend?.created_at && (
                  <div className="px-3 pb-3 text-xs text-[var(--tg-hint-color)]">
                    {t("contact.in_friends_since")}{" "}
                    <b>{new Date(contactFriend.created_at).toLocaleDateString()}</b>
                  </div>
                )}

                {contactUsername && (
                  <div className="px-3 pb-3">
                    <button
                      className="w-full py-2 rounded-lg bg-[var(--tg-button-color)] text-[var(--tg-button-text-color)]"
                      onClick={onOpenProfile}
                    >
                      {t("contact.open_in_telegram")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardSection>

          {/* === Общие группы — контент как на GroupsPage, но только пересечение === */}
          <FiltersRow
            search={search}
            setSearch={setSearch}
            placeholderKey="search_group_placeholder"
            onFilterClick={() => setFiltersOpen(true)}
            onSortClick={() => setSortOpen(true)}
          />

          {/* Пустые состояния/«не найдено» с учётом флага поиска */}
          {(noCommon || notFound) ? (
            <CardSection>
              <div className="text-center py-6 text-[var(--tg-hint-color)]">
                {notFound ? (t("groups_not_found") || "Группы не найдены") : (t("contact.no_common_groups") || "Общих групп нет")}
              </div>
            </CardSection>
          ) : (
            <CardSection noPadding>
              <TopInfoRow count={commonGroups.length} labelKey="groups_count" />
              <GroupsList
                groups={commonGroups as any}
                loading={groupsLoading}
                loadMore={
                  groupsHasMore && !groupsLoading && user?.id
                    ? () =>
                        loadMoreGroups(user!.id, {
                          q: q.length ? q : undefined,
                          includeHidden,
                          includeArchived,
                          includeDeleted,
                          sortBy,
                          sortDir,
                        })
                    : undefined
                }
              />
            </CardSection>
          )}

          {groupsLoading && (
            <CardSection>
              <div className="text-center py-6 text-[var(--tg-hint-color)]">{t("loading")}</div>
            </CardSection>
          )}
          {groupsError && (
            <CardSection>
              <div className="text-center py-6 text-red-500">{groupsError}</div>
            </CardSection>
          )}

          {/* Фильтры / Сортировка */}
          <GroupsFilterModal
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            initial={{ includeArchived, includeDeleted, includeHidden }}
            onApply={(f: FiltersState) => {
              setFilters({
                includeArchived: f.includeArchived,
                includeDeleted: f.includeDeleted,
                includeHidden: f.includeHidden,
              })
            }}
          />
          <GroupsSortModal
            open={sortOpen}
            onClose={() => setSortOpen(false)}
            initial={{ sortBy, sortDir }}
            onApply={({ sortBy: sb, sortDir: sd }) => {
              setSort({ sortBy: sb, sortDir: sd })
            }}
          />
        </>
      )}

      {activeTab === "friends" && Number.isFinite(friendId) && (
        <ContactFriendsList contactUserId={friendId} currentUserId={currentUserId} />
      )}
    </div>
  )
}

export default ContactDetailsPage
