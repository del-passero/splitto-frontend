// src/components/ContactsList.tsx

import UserCard from "./UserCard"
import EmptyContacts from "./EmptyContacts"
import CardSection from "./CardSection"
import type { Friend } from "../types/friend"

type Props = {
  friends: Friend[]
  loading?: boolean
  error?: string | null
}

const ContactsList = ({ friends, loading, error }: Props) => {
  if (loading) {
    return (
      <CardSection>
        <div className="py-12 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
      </CardSection>
    )
  }
  if (error) {
    return (
      <CardSection>
        <div className="py-12 text-center text-red-500">{error}</div>
      </CardSection>
    )
  }
  if (!friends.length) {
    return (
      <div className="w-full flex flex-col flex-1">
        <EmptyContacts />
      </div>
    )
  }
  return (
    <CardSection noPadding>
      {friends.map((friend, idx) => (
        <div key={friend.id} className="relative">
          <UserCard
            name={`${friend.user.first_name ?? ""} ${friend.user.last_name ?? ""}`.trim()}
            username={friend.user.username}
            photo_url={friend.user.photo_url}
          />
          {idx !== friends.length - 1 && (
            <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
          )}
        </div>
      ))}
    </CardSection>
  )
}

export default ContactsList
