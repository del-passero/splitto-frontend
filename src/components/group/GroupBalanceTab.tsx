// src/components/group/GroupBalanceTab.tsx

import CardSection from "../../components/CardSection"
import UserCard from "../../components/UserCard"
import { useTranslation } from "react-i18next"
import type { Group, GroupMember } from "../../types/group"

// Пропсы: участники, ошибки, загрузка, сортировка
type Props = {
  group: Group
  members: GroupMember[]
  membersError: string | null
  membersLoading: boolean
  hasMore: boolean
  loaderRef: React.RefObject<HTMLDivElement>
  sortedMembers: GroupMember[]
  membersTotal: number | null
}

const GroupBalanceTab = ({
  group,
  members,
  membersError,
  membersLoading,
  hasMore,
  loaderRef,
  sortedMembers,
  membersTotal,
}: Props) => {
  const { t } = useTranslation()

  return (
    <CardSection noPadding>
      {membersError ? (
        <div className="py-12 text-center text-red-500">
          {t("group_error_loading_members")}
        </div>
      ) : sortedMembers.length > 0 ? (
        <>
          {sortedMembers.map((member, idx) => (
            <div key={member.user.id} className="relative">
              <UserCard
                name={
                  member.user.first_name || member.user.last_name
                    ? `${member.user.first_name || ""} ${member.user.last_name || ""}`.trim()
                    : member.user.username || t("not_specified")
                }
                username={member.user.username || t("not_specified")}
                photo_url={member.user.photo_url}
              />
              {idx !== sortedMembers.length - 1 && (
                <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
              )}
            </div>
          ))}
          {hasMore && (
            <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
          )}
          {membersLoading && sortedMembers.length > 0 && (
            <div className="py-3 text-center text-[var(--tg-hint-color)]">
              {t("group_loading")}
            </div>
          )}
          {typeof membersTotal === "number" && (
            <div className="text-xs text-center text-[var(--tg-hint-color)] pb-2">
              Показано: {members.length} из {membersTotal}
            </div>
          )}
        </>
      ) : (
        <div className="text-[var(--tg-hint-color)] text-center py-6">
          {t("group_no_members")}
        </div>
      )}
    </CardSection>
  )
}

export default GroupBalanceTab
